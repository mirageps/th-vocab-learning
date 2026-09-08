import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { categories as systemCategories, vocabulary } from "@/data/vocabulary";

// User-created vocabulary. Stored locally (localStorage) for the MVP.
// The shape is intentionally self-contained so it can be migrated to a
// remote database later without touching the UI.
export type InputMode = "manual" | "auto_mock" | "auto_local";

/**
 * Where the auto-fill content came from when `inputMode` is `auto_local`.
 * Left optional so words saved before this field existed keep working.
 */
export type AutoFillSource =
  | "system_vocabulary"
  | "user_vocabulary"
  | "local_dictionary"
  | "system_dictionary"
  | "not_found";

/** Ids of the official (system) categories. User words can never join these. */
export const SYSTEM_CATEGORY_IDS: ReadonlySet<string> = new Set(
  systemCategories.map((c) => c.id),
);

/** The virtual bucket every user word belongs to. Not a real category. */
export const MINE_BUCKET = "mine";

export function isSystemCategoryId(id: string | null | undefined): boolean {
  return !!id && SYSTEM_CATEGORY_IDS.has(id);
}

export interface CustomWord {
  id: string;
  thaiWord: string;
  pronunciation: string;
  chineseMeaning: string;
  thaiExample: string;
  chineseExample: string;
  /** legacy field — always "mine" for user words (never a system category) */
  category: string;
  /** user-created folders this word belongs to (never system categories) */
  userCategoryIds: string[];
  /** id of the matching system word, when the user copied one into 我的单词 */
  linkedSystemWordId: number | null;
  difficulty: number; // 1 (easy) .. 3 (hard)
  source: "user_created";
  inputMode?: InputMode;
  autoFillSource?: AutoFillSource;
  createdAt: number;
  masteryLevel: number; // 0..100
  favorite?: boolean;
  /** how many times the user tried to add this same word again */
  duplicateAddCount: number;
  /** last time (ms epoch) the user tried to re-add this word */
  lastDuplicateAttemptAt: number | null;
}

/**
 * Normalize a Thai word for duplicate comparison. Does not change spelling:
 * Unicode NFC + trim + collapse inner whitespace only.
 */
export function normalizeThaiWord(input: string): string {
  return (input ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

/** Backwards-compatible alias. */
export const normalizeThai = normalizeThaiWord;

/** Look up a system vocabulary word by Thai spelling (normalized). */
export function findSystemWordByThai(thaiWord: string) {
  const key = normalizeThaiWord(thaiWord);
  if (!key) return undefined;
  return vocabulary.find((w) => normalizeThaiWord(w.thai) === key);
}

export interface CustomCategory {
  id: string;
  chinese: string;
  emoji: string;
  /** always "user" — kept explicit so system/user folders never mix */
  source: "user";
}

interface CustomVocabData {
  words: CustomWord[];
  categories: CustomCategory[];
  migratedAt?: number;
}

export type NewWordInput = Omit<
  CustomWord,
  | "id"
  | "source"
  | "createdAt"
  | "masteryLevel"
  | "duplicateAddCount"
  | "lastDuplicateAttemptAt"
  | "category"
  | "userCategoryIds"
  | "linkedSystemWordId"
> & {
  /** optional user folder(s); system category ids are rejected */
  userCategoryIds?: string[];
  linkedSystemWordId?: number | null;
};

export type UpdateWordInput = Partial<
  Omit<CustomWord, "id" | "source" | "createdAt">
>;

export type AddWordResult =
  | { status: "created"; word: CustomWord }
  | { status: "duplicate"; existing: CustomWord };

const STORAGE_KEY = "thaiwords.customvocab.v1";

const defaultData: CustomVocabData = { words: [], categories: [] };

function genId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const uniq = (ids: string[]) => Array.from(new Set(ids));

/** Strip system categories; only user folder ids survive. */
function sanitizeUserCategoryIds(
  ids: (string | null | undefined)[],
  userCategoryIds: Set<string>,
): string[] {
  return uniq(
    ids.filter(
      (id): id is string =>
        !!id &&
        id !== MINE_BUCKET &&
        !isSystemCategoryId(id) &&
        userCategoryIds.has(id),
    ),
  );
}

/**
 * One-time repair of legacy data:
 * - user words stored under a system category are moved back to 我的单词
 * - legacy user-folder ids move into `userCategoryIds`
 * - words matching a system word get `linkedSystemWordId`
 * - duplicate user words (same normalized Thai) are merged, keeping the best
 *   progress, union of folders, and all personal content
 */
function migrateData(raw: Partial<CustomVocabData>): CustomVocabData {
  const categories: CustomCategory[] = (
    Array.isArray(raw.categories) ? raw.categories : []
  ).map((c) => ({ ...c, source: "user" as const }));
  const knownFolders = new Set(categories.map((c) => c.id));

  const normalized: CustomWord[] = (
    Array.isArray(raw.words) ? raw.words : []
  ).map((w) => {
    const legacy = (w as CustomWord & { category?: string }).category;
    const folders = sanitizeUserCategoryIds(
      [...(w.userCategoryIds ?? []), legacy],
      knownFolders,
    );
    const sys = findSystemWordByThai(w.thaiWord);
    return {
      ...w,
      thaiWord: normalizeThaiWord(w.thaiWord) || w.thaiWord,
      category: MINE_BUCKET,
      userCategoryIds: folders,
      linkedSystemWordId: w.linkedSystemWordId ?? (sys ? sys.id : null),
      favorite: w.favorite ?? false,
      masteryLevel: w.masteryLevel ?? 0,
      duplicateAddCount: w.duplicateAddCount ?? 0,
      lastDuplicateAttemptAt: w.lastDuplicateAttemptAt ?? null,
      source: "user_created" as const,
    };
  });

  // Merge duplicates within source: "user".
  const byKey = new Map<string, CustomWord>();
  for (const w of normalized) {
    const key = normalizeThaiWord(w.thaiWord);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, w);
      continue;
    }
    // keep the oldest record as the primary so references stay stable
    const primary = prev.createdAt <= w.createdAt ? prev : w;
    const other = primary === prev ? w : prev;
    byKey.set(key, {
      ...primary,
      pronunciation: primary.pronunciation || other.pronunciation,
      chineseMeaning: primary.chineseMeaning || other.chineseMeaning,
      thaiExample: primary.thaiExample || other.thaiExample,
      chineseExample: primary.chineseExample || other.chineseExample,
      userCategoryIds: uniq([
        ...primary.userCategoryIds,
        ...other.userCategoryIds,
      ]),
      linkedSystemWordId:
        primary.linkedSystemWordId ?? other.linkedSystemWordId ?? null,
      masteryLevel: Math.max(primary.masteryLevel, other.masteryLevel),
      difficulty: Math.max(primary.difficulty, other.difficulty),
      favorite: Boolean(primary.favorite || other.favorite),
      duplicateAddCount:
        (primary.duplicateAddCount ?? 0) + (other.duplicateAddCount ?? 0),
      lastDuplicateAttemptAt: Math.max(
        primary.lastDuplicateAttemptAt ?? 0,
        other.lastDuplicateAttemptAt ?? 0,
      ) || null,
    });
  }

  return {
    words: Array.from(byKey.values()).sort((a, b) => b.createdAt - a.createdAt),
    categories,
    migratedAt: raw.migratedAt ?? Date.now(),
  };
}

interface CustomVocabContextValue {
  words: CustomWord[];
  categories: CustomCategory[];
  addWord: (input: NewWordInput) => AddWordResult;
  updateWord: (id: string, patch: UpdateWordInput) => void;
  findByThaiWord: (thaiWord: string) => CustomWord | undefined;
  addCategory: (input: { chinese: string; emoji?: string }) => CustomCategory;
  updateCategory: (
    id: string,
    patch: { chinese?: string; emoji?: string },
  ) => void;
  deleteCategory: (id: string) => void;
}

const CustomVocabContext = createContext<CustomVocabContextValue | null>(null);

export function CustomVocabProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CustomVocabData>(defaultData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(migrateData(JSON.parse(raw) as Partial<CustomVocabData>));
      }
    } catch {
      setData(defaultData);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
  }, [data, hydrated]);

  const value = useMemo<CustomVocabContextValue>(() => {
    const knownFolders = new Set(data.categories.map((c) => c.id));
    const clean = (ids: (string | null | undefined)[]) =>
      sanitizeUserCategoryIds(ids, knownFolders);

    return {
      words: data.words,
      categories: data.categories,
      findByThaiWord: (thaiWord) => {
        const key = normalizeThaiWord(thaiWord);
        return data.words.find((w) => normalizeThaiWord(w.thaiWord) === key);
      },
      addWord: (input) => {
        const key = normalizeThaiWord(input.thaiWord);
        // Data-layer guard: never trust a category id coming from the UI.
        const folders = clean(input.userCategoryIds ?? []);
        const existing = data.words.find(
          (w) => normalizeThaiWord(w.thaiWord) === key,
        );
        if (existing) {
          setData((prev) => ({
            ...prev,
            words: prev.words.map((w) =>
              w.id === existing.id
                ? {
                    ...w,
                    // adding folders never resets learning data
                    userCategoryIds: uniq([...w.userCategoryIds, ...folders]),
                    duplicateAddCount: (w.duplicateAddCount ?? 0) + 1,
                    lastDuplicateAttemptAt: Date.now(),
                  }
                : w,
            ),
          }));
          return { status: "duplicate", existing };
        }
        const sys = findSystemWordByThai(input.thaiWord);
        const word: CustomWord = {
          ...input,
          thaiWord: key || input.thaiWord,
          id: genId(),
          category: MINE_BUCKET,
          userCategoryIds: folders,
          linkedSystemWordId:
            input.linkedSystemWordId ?? (sys ? sys.id : null),
          source: "user_created",
          createdAt: Date.now(),
          masteryLevel: 0,
          favorite: false,
          duplicateAddCount: 0,
          lastDuplicateAttemptAt: null,
        };
        setData((prev) => ({ ...prev, words: [word, ...prev.words] }));
        return { status: "created", word };
      },
      updateWord: (id, patch) => {
        setData((prev) => ({
          ...prev,
          words: prev.words.map((w) =>
            w.id === id
              ? {
                  ...w,
                  ...patch,
                  // guards: user words stay in 我的单词
                  category: MINE_BUCKET,
                  userCategoryIds: patch.userCategoryIds
                    ? clean(patch.userCategoryIds)
                    : w.userCategoryIds,
                }
              : w,
          ),
        }));
      },
      addCategory: ({ chinese, emoji }) => {
        const category: CustomCategory = {
          id: genId(),
          chinese: chinese.trim(),
          emoji: emoji?.trim() || "📚",
          source: "user",
        };
        setData((prev) => ({
          ...prev,
          categories: [...prev.categories, category],
        }));
        return category;
      },
      updateCategory: (id, patch) => {
        setData((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === id
              ? {
                  ...c,
                  chinese: patch.chinese?.trim() || c.chinese,
                  emoji: patch.emoji?.trim() || c.emoji,
                }
              : c,
          ),
        }));
      },
      deleteCategory: (id) => {
        // Removing a folder never deletes the words inside it.
        setData((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== id),
          words: prev.words.map((w) => ({
            ...w,
            userCategoryIds: w.userCategoryIds.filter((c) => c !== id),
          })),
        }));
      },
    };
  }, [data]);

  return (
    <CustomVocabContext.Provider value={value}>
      {children}
    </CustomVocabContext.Provider>
  );
}

export function useCustomVocab() {
  const ctx = useContext(CustomVocabContext);
  if (!ctx)
    throw new Error("useCustomVocab must be used within a CustomVocabProvider");
  return ctx;
}
