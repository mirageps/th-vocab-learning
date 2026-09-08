import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { X, Heart, ArrowRight, RotateCcw, Home } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VocabularyCard } from "@/components/VocabularyCard";
import { QuizOption, type QuizOptionState } from "@/components/QuizOption";
import { useProgress } from "@/store/progress-context";
import { vocabulary, type VocabularyWord } from "@/data/vocabulary";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn")({
  component: LearnPage,
});

const SESSION_SIZE = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(word: VocabularyWord): string[] {
  const distractors = shuffle(
    vocabulary.filter((w) => w.id !== word.id).map((w) => w.chinese),
  )
    .filter((c, i, arr) => arr.indexOf(c) === i && c !== word.chinese)
    .slice(0, 3);
  return shuffle([word.chinese, ...distractors]);
}

type Phase = "learn" | "quiz";

function LearnPage() {
  const { state, recordLearned, loseHeart, resetHearts, toggleDifficult } =
    useProgress();
  const navigate = useNavigate();

  // Build a session: prioritise words not yet mastered.
  const session = useMemo(() => {
    const notMastered = vocabulary.filter(
      (w) => !w.premium && (state.mastery[w.id] ?? 0) < 80,
    );
    const pool = notMastered.length >= SESSION_SIZE ? notMastered : vocabulary;
    return shuffle(pool).slice(0, SESSION_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("learn");
  const [selected, setSelected] = useState<string | null>(null);
  const [hearts, setHearts] = useState(state.hearts > 0 ? state.hearts : 5);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const word = session[index];
  const options = useMemo(
    () => (word ? buildOptions(word) : []),
    // regenerate per word
    [word?.id],
  );

  const progress = ((index + (phase === "quiz" ? 0.5 : 0)) / session.length) * 100;

  const answer = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    const correct = choice === word.chinese;
    recordLearned(word.id, correct);
    if (correct) {
      setScore((s) => s + 10);
    } else {
      const nextHearts = hearts - 1;
      setHearts(nextHearts);
      loseHeart();
    }
  };

  const next = () => {
    if (hearts <= 0) {
      setFinished(true);
      return;
    }
    if (index + 1 >= session.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPhase("learn");
    setSelected(null);
  };

  const restart = () => {
    resetHearts();
    setHearts(5);
    setIndex(0);
    setPhase("learn");
    setSelected(null);
    setScore(0);
    setFinished(false);
    navigate({ to: "/learn" });
  };

  // ---------- Finished / result screen ----------
  if (finished || !word) {
    const failed = hearts <= 0 && index + 1 < session.length;
    return (
      <AppShell hideNav>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="text-7xl">{failed ? "😅" : "🎉"}</div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {failed ? "生命值用完啦" : "本课完成！"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {failed
                ? "休息一下，再来挑战吧"
                : `你学习了 ${index + 1} 个单词`}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-3xl border border-border bg-card px-6 py-4 shadow-soft">
              <p className="text-3xl font-bold text-primary">{score}</p>
              <p className="text-xs text-muted-foreground">得分</p>
            </div>
            <div className="rounded-3xl border border-border bg-card px-6 py-4 shadow-soft">
              <p className="text-3xl font-bold text-accent">+{score}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button
              onClick={restart}
              className="tap-scale flex items-center justify-center gap-2 rounded-2xl gradient-primary py-4 font-bold text-primary-foreground shadow-glow"
            >
              <RotateCcw className="h-5 w-5" /> 再来一课
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

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <AppShell hideNav>
      <div className="flex min-h-screen flex-col px-4 pb-6 pt-5">
        {/* Top bar: close, progress, hearts */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="退出学习"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-5 w-5 fill-destructive text-destructive" />
            <span className="text-sm font-bold text-foreground">{hearts}</span>
          </div>
        </div>

        {phase === "learn" ? (
          <div className="mt-6 flex flex-1 flex-col">
            <p className="text-sm font-medium text-muted-foreground">
              学习新单词 · {index + 1}/{session.length}
            </p>
            <div className="mt-4">
              <VocabularyCard
                word={word}
                isDifficult={state.difficult.includes(word.id)}
                onToggleDifficult={toggleDifficult}
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setPhase("quiz")}
              className="tap-scale mt-6 flex items-center justify-center gap-2 rounded-2xl gradient-primary py-4 font-bold text-primary-foreground shadow-glow"
            >
              我记住了，测验 <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-1 flex-col">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <p className="text-sm text-muted-foreground">这个单词是什么意思？</p>
              <p className="text-thai mt-2 text-5xl font-bold text-foreground">
                {word.thai}
              </p>
              <p className="mt-1 text-muted-foreground">/{word.pronunciation}/</p>
            </div>

            <div className="mt-5 space-y-3">
              {options.map((opt, i) => {
                let optState: QuizOptionState = "idle";
                if (selected) {
                  if (opt === word.chinese) optState = "correct";
                  else if (opt === selected) optState = "wrong";
                }
                return (
                  <QuizOption
                    key={opt}
                    label={optionLabels[i]}
                    text={opt}
                    state={optState}
                    disabled={!!selected}
                    onClick={() => answer(opt)}
                  />
                );
              })}
            </div>

            <div className="flex-1" />

            {selected && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-semibold",
                    selected === word.chinese
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {selected === word.chinese ? "✓ 正确！" : "✗ 错误"}
                  <span className="ml-2 text-foreground">
                    {word.thai} = {word.chinese}
                  </span>
                </div>
                <button
                  onClick={next}
                  className="tap-scale mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 font-bold text-primary-foreground shadow-glow"
                >
                  继续 <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
