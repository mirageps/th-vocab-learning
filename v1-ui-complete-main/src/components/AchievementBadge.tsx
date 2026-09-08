import type { Achievement } from "@/data/achievements";
import type { ProgressState } from "@/store/progress-context";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: Achievement;
  state: ProgressState;
}

export function AchievementBadge({ achievement, state }: AchievementBadgeProps) {
  const progress = achievement.progress(state);
  const unlocked = progress >= 1;

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border p-4 text-center transition-colors",
        unlocked
          ? "border-streak/40 bg-streak/10"
          : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl text-3xl",
          unlocked ? "bg-streak/20" : "bg-muted grayscale",
        )}
      >
        {achievement.emoji}
      </span>
      <p className="mt-2 text-sm font-bold text-foreground">
        {achievement.title}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
        {achievement.description}
      </p>
      {!unlocked && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-streak"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {unlocked && (
        <span className="mt-2 rounded-full bg-streak px-2 py-0.5 text-[11px] font-bold text-streak-foreground">
          已解锁
        </span>
      )}
    </div>
  );
}
