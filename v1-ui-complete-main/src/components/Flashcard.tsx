import { useState } from "react";
import { RotateCw, Star } from "lucide-react";
import type { StudyWord } from "@/lib/study-word";
import type { WordId } from "@/lib/spaced-repetition";
import { cn } from "@/lib/utils";
import { AudioButton } from "./AudioButton";

interface FlashcardProps {
  word: StudyWord;
  isDifficult?: boolean;
  onToggleDifficult?: (id: WordId) => void;
}

export function Flashcard({
  word,
  isDifficult,
  onToggleDifficult,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);


  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="group relative block h-[26rem] w-full [perspective:1400px]"
      aria-label="点击翻转单词卡"
    >
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl gradient-primary p-8 text-primary-foreground shadow-glow [backface-visibility:hidden]">
          <p className="text-thai text-7xl font-bold">{word.thai}</p>
          <AudioButton
            text={word.thai}
            size="md"
            className="bg-white/20 text-primary-foreground"
          />
          <span className="absolute bottom-5 flex items-center gap-1.5 text-sm font-medium opacity-80">
            <RotateCw className="h-4 w-4" /> 点击查看释义
          </span>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col justify-center gap-4 rounded-3xl border border-border bg-card p-7 text-left shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex items-center justify-between">
            <p className="text-thai text-4xl font-bold text-foreground">
              {word.thai}
            </p>
            {onToggleDifficult && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDifficult(word.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onToggleDifficult(word.id);
                  }
                }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-border",
                  isDifficult
                    ? "bg-streak text-streak-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Star
                  className="h-5 w-5"
                  fill={isDifficult ? "currentColor" : "none"}
                />
              </span>
            )}
          </div>
          <p className="text-lg text-muted-foreground">/{word.pronunciation}/</p>
          <p className="text-3xl font-bold text-primary">{word.chinese}</p>
          {(word.exampleThai || word.exampleChinese) && (
            <div className="rounded-2xl bg-muted px-4 py-3">
              {word.exampleThai && (
                <p className="text-thai text-lg font-semibold text-foreground">
                  {word.exampleThai}
                </p>
              )}
              {word.exampleChinese && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {word.exampleChinese}
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </button>
  );
}
