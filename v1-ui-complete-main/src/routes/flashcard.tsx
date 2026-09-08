import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Star, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Flashcard } from "@/components/Flashcard";
import { useProgress } from "@/store/progress-context";
import { useCustomVocab } from "@/store/custom-vocab-context";
import { vocabulary } from "@/data/vocabulary";
import { fromCustom, fromVocab, type StudyWord } from "@/lib/study-word";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flashcard")({
  component: FlashcardPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type FilterId = "all" | "system" | "mine" | "difficult";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "全部单词" },
  { id: "system", label: "系统单词" },
  { id: "mine", label: "我的单词" },
  { id: "difficult", label: "难词" },
];

function FlashcardPage() {
  const { state, toggleDifficult } = useProgress();
  const { words: customWords } = useCustomVocab();
  const [filter, setFilter] = useState<FilterId>("all");

  const deck = useMemo<StudyWord[]>(() => {
    const system = vocabulary.filter((w) => !w.premium).map(fromVocab);
    const mine = customWords.map(fromCustom);
    let base: StudyWord[];
    if (filter === "system") base = system;
    else if (filter === "mine") base = mine;
    else if (filter === "difficult") {
      const combined = [...system, ...mine];
      base = combined.filter((w) => state.difficult.includes(w.id));
    } else {
      base = [...system, ...mine];
    }
    return shuffle(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customWords.length]);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const touchStartX = useRef<number | null>(null);

  const word = deck[index];

  const go = (dir: "left" | "right") => {
    if (!deck.length) return;
    setDirection(dir);
    setTimeout(() => {
      setIndex((i) => {
        if (dir === "right") return (i + 1) % deck.length;
        return (i - 1 + deck.length) % deck.length;
      });
      setDirection(null);
    }, 150);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? "right" : "left");
    touchStartX.current = null;
  };

  const emptyCopy =
    filter === "difficult"
      ? {
          emoji: "⭐",
          title: "还没有标记难词",
          desc: "在卡片上点击星标，收藏需要多复习的单词",
        }
      : filter === "mine"
        ? {
            emoji: "✍️",
            title: "还没有自建单词",
            desc: "去「我的词库」添加你的第一个单词",
          }
        : {
            emoji: "📭",
            title: "暂无单词",
            desc: "换一个筛选试试",
          };

  return (
    <AppShell>
      <div className="flex min-h-full flex-col px-4 pb-6 pt-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">单词卡</h1>
          <p className="text-sm text-muted-foreground">左右滑动，点击翻面</p>
        </header>

        <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => {
            const isDifficult = f.id === "difficult";
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id);
                  setIndex(0);
                }}
                className={cn(
                  "tap-scale flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold",
                  isActive
                    ? isDifficult
                      ? "border-streak bg-streak/15 text-streak-foreground"
                      : "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {isDifficult && (
                  <Star
                    className="h-4 w-4"
                    fill={isActive ? "currentColor" : "none"}
                  />
                )}
                {f.label}
              </button>
            );
          })}
        </div>

        {!deck.length ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center">
            <span className="text-6xl">{emptyCopy.emoji}</span>
            <p className="font-semibold text-foreground">{emptyCopy.title}</p>
            <p className="text-sm text-muted-foreground">{emptyCopy.desc}</p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {index + 1} / {deck.length}
              </span>
              <span>{FILTERS.find((f) => f.id === filter)?.label}</span>
            </div>

            <div
              className={cn(
                "mt-3 transition-all duration-150",
                direction === "right" && "-translate-x-8 opacity-0",
                direction === "left" && "translate-x-8 opacity-0",
              )}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {word && (
                <Flashcard
                  key={String(word.id)}
                  word={word}
                  isDifficult={state.difficult.includes(word.id)}
                  onToggleDifficult={toggleDifficult}
                />
              )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => go("left")}
                aria-label="上一张"
                className="tap-scale flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={() => {
                  setIndex(0);
                }}
                aria-label="重新开始"
                className="tap-scale flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => go("right")}
                aria-label="下一张"
                className="tap-scale flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-glow"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
