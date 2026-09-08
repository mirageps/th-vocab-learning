import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, RotateCcw, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AudioButton } from "@/components/AudioButton";
import { useProgress } from "@/store/progress-context";
import { useCustomVocab } from "@/store/custom-vocab-context";
import { vocabulary, categories } from "@/data/vocabulary";
import {
  fromCustom,
  fromVocab,
  type StudyWord,
} from "@/lib/study-word";
import { isDue, type ReviewGrade } from "@/lib/spaced-repetition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
});

const GRADES: {
  grade: ReviewGrade;
  label: string;
  emoji: string;
  className: string;
}[] = [
  { grade: "forgot", label: "忘记", emoji: "😵", className: "bg-destructive/10 text-destructive border-destructive/30" },
  { grade: "hard", label: "困难", emoji: "😅", className: "bg-streak/15 text-streak-foreground border-streak/40" },
  { grade: "know", label: "认识", emoji: "🙂", className: "bg-secondary text-secondary-foreground border-accent/30" },
  { grade: "easy", label: "熟悉", emoji: "😎", className: "bg-success/10 text-success border-success/30" },
];

type RangeId =
  | "today"
  | "all"
  | "system"
  | "mine"
  | "difficult"
  | `cat:${string}`;

interface RangeOption {
  id: RangeId;
  label: string;
  hint?: string;
  emoji?: string;
}

function ReviewPage() {
  const { state, gradeReview } = useProgress();
  const { words: customWords, categories: customCategories } = useCustomVocab();

  const [range, setRange] = useState<RangeId>("today");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0); // remount to rebuild queue

  const rangeOptions = useMemo<RangeOption[]>(() => {
    const base: RangeOption[] = [
      { id: "today", label: "今日复习", hint: "推荐 · 到期单词", emoji: "⏰" },
      { id: "all", label: "全部单词", emoji: "📚" },
      { id: "system", label: "系统单词", emoji: "🏛️" },
      { id: "mine", label: "我的单词", emoji: "⭐" },
      { id: "difficult", label: "难词", emoji: "🔥" },
    ];
    const cats: RangeOption[] = categories.map((c) => ({
      id: `cat:${c.id}` as RangeId,
      label: c.chinese,
      emoji: c.emoji,
      hint: "按分类",
    }));
    const customCats: RangeOption[] = customCategories.map((c) => ({
      id: `cat:${c.id}` as RangeId,
      label: c.chinese,
      emoji: c.emoji,
      hint: "自定义分类",
    }));
    if (customWords.length) {
      cats.push({
        id: "cat:mine" as RangeId,
        label: "我的单词",
        emoji: "⭐",
        hint: "按分类",
      });
    }
    return [...base, ...cats, ...customCats];
  }, [customWords.length, customCategories]);

  // Snapshot queue when session starts/range changes.
  const queue = useMemo<StudyWord[]>(() => {
    const system = vocabulary.map(fromVocab);
    const mine = customWords.map(fromCustom);
    const all = [...system, ...mine];

    const findAll = (ids: (string | number)[]) =>
      ids
        .map((id) => all.find((w) => w.id === id))
        .filter((w): w is StudyWord => !!w);

    if (range === "today") {
      const dueIds = Object.values(state.reviews)
        .filter(isDue)
        .map((r) => r.wordId);
      if (dueIds.length) return findAll(dueIds);
      // fallback: learned-but-not-mastered
      return all.filter((w) => {
        const m = state.mastery[String(w.id)] ?? -1;
        return m >= 0 && m < 100;
      });
    }
    if (range === "all") return all;
    if (range === "system") return system;
    if (range === "mine") return mine;
    if (range === "difficult")
      return all.filter((w) => state.difficult.includes(w.id));
    if (range.startsWith("cat:")) {
      const cat = range.slice(4);
      if (cat === "mine") return mine;
      // system categories hold system words only; user folders hold user words
      return all.filter((w) =>
        w.source === "system"
          ? w.category === cat
          : (w.userCategoryIds ?? []).includes(cat),
      );
    }

    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, sessionKey]);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const word = queue[index];

  const grade = (g: ReviewGrade) => {
    if (!word) return;
    gradeReview(word.id, g);
    setReviewed((n) => n + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setRevealed(false);
    setReviewed(0);
    setSessionKey((k) => k + 1);
  };

  const currentRangeLabel =
    rangeOptions.find((o) => o.id === range)?.label ?? "复习";

  if (!queue.length) {
    return (
      <AppShell>
        <RangePicker
          open={pickerOpen}
          value={range}
          options={rangeOptions}
          onClose={() => setPickerOpen(false)}
          onSelect={(id) => {
            setRange(id);
            setPickerOpen(false);
            restart();
          }}
        />
        <EmptyState
          title={range === "today" ? "太棒了，全部复习完成！" : "该范围暂无单词"}
          desc={
            range === "today"
              ? "现在没有需要复习的单词。先去学习新词吧！"
              : "换一个复习范围试试。"
          }
          onOpenPicker={() => setPickerOpen(true)}
          rangeLabel={currentRangeLabel}
        />
      </AppShell>
    );
  }

  if (!word) {
    return (
      <AppShell>
        <RangePicker
          open={pickerOpen}
          value={range}
          options={rangeOptions}
          onClose={() => setPickerOpen(false)}
          onSelect={(id) => {
            setRange(id);
            setPickerOpen(false);
            restart();
          }}
        />
        <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 pt-10 text-center">
          <div className="text-7xl">🎯</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">复习完成！</h1>
            <p className="mt-2 text-muted-foreground">
              本次复习了 {reviewed} 个单词
            </p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="tap-scale flex items-center justify-center gap-2 rounded-2xl gradient-primary py-4 font-bold text-primary-foreground shadow-glow"
            >
              选择其他范围
            </button>
            <Link
              to="/"
              className="tap-scale flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 font-bold text-foreground"
            >
              <Home className="h-5 w-5" /> 返回首页
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RangePicker
        open={pickerOpen}
        value={range}
        options={rangeOptions}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          setRange(id);
          setPickerOpen(false);
          restart();
        }}
      />
      <div className="flex min-h-full flex-col px-4 pb-6 pt-6">
        <header className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">智能复习</h1>
            <p className="text-sm text-muted-foreground">间隔重复记忆</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
            剩余 {queue.length - index}
          </span>
        </header>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="tap-scale mt-2 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
        >
          <span className="text-muted-foreground">复习范围</span>
          <span className="font-semibold">{currentRangeLabel} ›</span>
        </button>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full gradient-primary transition-all"
            style={{ width: `${(index / queue.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-6 flex min-h-[18rem] flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-card"
        >
          <p className="text-thai text-6xl font-bold text-foreground">
            {word.thai}
          </p>
          <div onClick={(e) => e.stopPropagation()}>
            <AudioButton text={word.thai} size="md" />
          </div>
          {revealed ? (
            <div className="animate-in fade-in mt-2 space-y-2">
              {word.pronunciation && (
                <p className="text-lg text-muted-foreground">
                  /{word.pronunciation}/
                </p>
              )}
              <p className="text-3xl font-bold text-primary">{word.chinese}</p>
              {(word.exampleThai || word.exampleChinese) && (
                <div className="rounded-2xl bg-muted px-4 py-2">
                  {word.exampleThai && (
                    <p className="text-thai text-base font-semibold text-foreground">
                      {word.exampleThai}
                    </p>
                  )}
                  {word.exampleChinese && (
                    <p className="text-sm text-muted-foreground">
                      {word.exampleChinese}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              点击卡片查看释义
            </p>
          )}
        </button>

        {/* Grade buttons */}
        <div
          className={cn(
            "mt-5 grid grid-cols-4 gap-2 transition-opacity",
            revealed ? "opacity-100" : "pointer-events-none opacity-40",
          )}
        >
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              className={cn(
                "tap-scale flex flex-col items-center gap-1 rounded-2xl border py-3 text-sm font-bold",
                g.className,
              )}
            >
              <span className="text-xl">{g.emoji}</span>
              {g.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          根据你的选择，系统会自动调整复习频率
        </p>
      </div>
    </AppShell>
  );
}

function RangePicker({
  open,
  value,
  options,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: RangeId;
  options: RangeOption[];
  onClose: () => void;
  onSelect: (id: RangeId) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 shadow-glow sm:rounded-3xl sm:border">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">选择复习范围</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
          >
            关闭
          </button>
        </div>
        <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
          {options.map((o) => {
            const active = o.id === value;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onSelect(o.id)}
                  className={cn(
                    "tap-scale flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background",
                  )}
                >
                  <span className="text-xl">{o.emoji ?? "📖"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {o.label}
                    </p>
                    {o.hint && (
                      <p className="text-xs text-muted-foreground">{o.hint}</p>
                    )}
                  </div>
                  {active && <Check className="h-5 w-5 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  desc,
  onOpenPicker,
  rangeLabel,
}: {
  title: string;
  desc: string;
  onOpenPicker: () => void;
  rangeLabel: string;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 px-8 pt-16 text-center">
      <div className="text-7xl">🌟</div>
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          当前范围：{rangeLabel}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onOpenPicker}
          className="tap-scale flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 font-bold text-primary-foreground shadow-glow"
        >
          <RotateCcw className="h-5 w-5" /> 选择范围
        </button>
        <Link
          to="/learn"
          className="tap-scale flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 font-bold text-foreground"
        >
          去学习
        </Link>
        <Link
          to="/"
          className="tap-scale flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 font-bold text-foreground"
        >
          <Home className="h-5 w-5" /> 首页
        </Link>
      </div>
    </div>
  );
}
