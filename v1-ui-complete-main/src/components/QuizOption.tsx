import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuizOptionState = "idle" | "correct" | "wrong" | "revealed";

interface QuizOptionProps {
  label: string; // e.g. "A"
  text: string;
  state: QuizOptionState;
  disabled?: boolean;
  onClick: () => void;
}

export function QuizOption({
  label,
  text,
  state,
  disabled,
  onClick,
}: QuizOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tap-scale flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors",
        state === "idle" &&
          "border-border bg-card hover:border-primary/50 hover:bg-primary/5",
        state === "correct" && "border-success bg-success/10",
        state === "wrong" && "border-destructive bg-destructive/10",
        state === "revealed" && "border-success bg-success/10",
        disabled && state === "idle" && "opacity-50",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          state === "idle" && "bg-muted text-muted-foreground",
          (state === "correct" || state === "revealed") &&
            "bg-success text-success-foreground",
          state === "wrong" && "bg-destructive text-destructive-foreground",
        )}
      >
        {state === "correct" || state === "revealed" ? (
          <Check className="h-5 w-5" />
        ) : state === "wrong" ? (
          <X className="h-5 w-5" />
        ) : (
          label
        )}
      </span>
      <span className="text-lg font-semibold text-foreground">{text}</span>
    </button>
  );
}
