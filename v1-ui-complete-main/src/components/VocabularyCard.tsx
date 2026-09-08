import { Star } from "lucide-react";
import type { VocabularyWord } from "@/data/vocabulary";
import { cn } from "@/lib/utils";
import { AudioButton } from "./AudioButton";

interface VocabularyCardProps {
  word: VocabularyWord;
  mastery?: number;
  isDifficult?: boolean;
  onToggleDifficult?: (id: number) => void;
  showExample?: boolean;
  className?: string;
}

export function VocabularyCard({
  word,
  mastery,
  isDifficult,
  onToggleDifficult,
  showExample = true,
  className,
}: VocabularyCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card p-6 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-thai text-5xl font-bold leading-tight text-foreground">
            {word.thai}
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            /{word.pronunciation}/
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <AudioButton text={word.thai} size="lg" />
          {onToggleDifficult && (
            <button
              type="button"
              onClick={() => onToggleDifficult(word.id)}
              aria-label="标记为难词"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors",
                isDifficult
                  ? "bg-streak text-streak-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Star
                className="h-5 w-5"
                fill={isDifficult ? "currentColor" : "none"}
              />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-secondary px-4 py-3">
        <p className="text-sm font-medium text-secondary-foreground">中文释义</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">
          {word.chinese}
        </p>
      </div>

      {showExample && (
        <div className="mt-4 space-y-1 rounded-2xl bg-muted px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-thai text-lg font-semibold text-foreground">
              {word.exampleThai}
            </p>
            <AudioButton text={word.exampleThai} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">{word.exampleChinese}</p>
        </div>
      )}

      {typeof mastery === "number" && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>掌握度</span>
            <span className="font-semibold">{mastery}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full gradient-primary transition-all"
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
