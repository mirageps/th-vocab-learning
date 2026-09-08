import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createReviewItem,
  scheduleNext,
  masteryDelta,
  type ReviewGrade,
  type ReviewItem,
  type WordId,
} from "@/lib/spaced-repetition";

export interface ProgressState {
  xp: number;
  streak: number;
  lastActiveDate: string | null; // yyyy-mm-dd
  dailyGoal: number;
  learnedToday: number;
  todayDate: string | null;
  hearts: number;
  isPremium: boolean;
  /** wordId -> mastery percentage 0..100 */
  mastery: Record<string, number>;
  /** difficult words marked by the user (wordId list) */
  difficult: WordId[];
  /** spaced repetition schedule */
  reviews: Record<string, ReviewItem>;
}


const STORAGE_KEY = "thaiwords.progress.v1";

const todayStr = () => new Date().toISOString().slice(0, 10);

const defaultState: ProgressState = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  dailyGoal: 20,
  learnedToday: 0,
  todayDate: null,
  hearts: 5,
  isPremium: false,
  mastery: {},
  difficult: [],
  reviews: {},
};

function levelFromXp(xp: number) {
  return Math.floor(xp / 200) + 1;
}

const LEVEL_TITLES = [
  "泰语萌新",
  "入门学员",
  "初级泰语",
  "进阶学员",
  "中级泰语",
  "熟练学员",
  "高级泰语",
  "泰语达人",
];

export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

interface ProgressContextValue {
  state: ProgressState;
  level: number;
  levelProgress: number; // 0..1 within current level
  masteredCount: number;
  recordLearned: (wordId: WordId, correct: boolean) => void;
  gradeReview: (wordId: WordId, grade: ReviewGrade) => void;
  toggleDifficult: (wordId: WordId) => void;

  loseHeart: () => void;
  resetHearts: () => void;
  setDailyGoal: (goal: number) => void;
  setPremium: (v: boolean) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function reconcileDay(s: ProgressState): ProgressState {
  const today = todayStr();
  if (s.todayDate === today) return s;

  // new day: reset daily counters + hearts, update streak
  let streak = s.streak;
  if (s.lastActiveDate) {
    const diff = Math.round(
      (Date.parse(today) - Date.parse(s.lastActiveDate)) / 86400000,
    );
    if (diff > 1) streak = 0; // missed a day
  }
  return { ...s, todayDate: today, learnedToday: 0, hearts: 5, streak };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on client only (SSR-safe).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...defaultState, ...JSON.parse(raw) } as ProgressState;
        setState(reconcileDay(parsed));
      } else {
        setState(reconcileDay(defaultState));
      }
    } catch {
      setState(defaultState);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state, hydrated]);

  const value = useMemo<ProgressContextValue>(() => {
    const level = levelFromXp(state.xp);
    const levelProgress = (state.xp % 200) / 200;
    const masteredCount = Object.values(state.mastery).filter(
      (m) => m >= 80,
    ).length;

    const markActive = (s: ProgressState): ProgressState => {
      const today = todayStr();
      let streak = s.streak;
      if (s.lastActiveDate !== today) {
        streak = s.streak + 1;
      }
      return { ...s, lastActiveDate: today, todayDate: today, streak };
    };

    return {
      state,
      level,
      levelProgress,
      masteredCount,
      recordLearned: (wordId, correct) =>
        setState((prev) => {
          const s = markActive(reconcileDay(prev));
          const already = prev.mastery[wordId] !== undefined;
          const gained = correct ? 15 : 5;
          const current = s.mastery[wordId] ?? 0;
          const next = Math.max(
            0,
            Math.min(100, current + (correct ? 20 : 5)),
          );
          const reviews = { ...s.reviews };
          if (!reviews[wordId]) reviews[wordId] = createReviewItem(wordId);
          return {
            ...s,
            xp: s.xp + gained,
            learnedToday: already ? s.learnedToday : s.learnedToday + 1,
            mastery: { ...s.mastery, [wordId]: next },
            reviews,
          };
        }),
      gradeReview: (wordId, grade) =>
        setState((prev) => {
          const s = markActive(reconcileDay(prev));
          const item = s.reviews[wordId] ?? createReviewItem(wordId);
          const nextItem = scheduleNext(item, grade);
          const current = s.mastery[wordId] ?? 0;
          const nextMastery = Math.max(
            0,
            Math.min(100, current + masteryDelta(grade)),
          );
          const xpGain = grade === "forgot" ? 2 : 8;
          return {
            ...s,
            xp: s.xp + xpGain,
            mastery: { ...s.mastery, [wordId]: nextMastery },
            reviews: { ...s.reviews, [wordId]: nextItem },
          };
        }),
      toggleDifficult: (wordId) =>
        setState((prev) => {
          const has = prev.difficult.includes(wordId);
          return {
            ...prev,
            difficult: has
              ? prev.difficult.filter((id) => id !== wordId)
              : [...prev.difficult, wordId],
          };
        }),
      loseHeart: () =>
        setState((prev) => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) })),
      resetHearts: () => setState((prev) => ({ ...prev, hearts: 5 })),
      setDailyGoal: (goal) =>
        setState((prev) => ({ ...prev, dailyGoal: goal })),
      setPremium: (v) => setState((prev) => ({ ...prev, isPremium: v })),
      resetProgress: () => setState({ ...defaultState, todayDate: todayStr() }),
    };
  }, [state]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx)
    throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
