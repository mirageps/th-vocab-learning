import { cn } from "@/lib/utils";

interface ProgressCardProps {
  learnedToday: number;
  dailyGoal: number;
  className?: string;
}

export function ProgressCard({
  learnedToday,
  dailyGoal,
  className,
}: ProgressCardProps) {
  const pct = Math.min(100, Math.round((learnedToday / dailyGoal) * 100));
  const done = learnedToday >= dailyGoal;

  return (
    <div
      className={cn(
        "gradient-primary rounded-3xl p-6 text-primary-foreground shadow-glow",
        className,
      )}
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">今日学习</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            {learnedToday}
            <span className="text-2xl opacity-80"> / {dailyGoal}</span>
          </p>
          <p className="mt-1 text-sm opacity-90">个单词</p>
        </div>
        <div className="relative flex h-20 w-20 items-center justify-center">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <span className="absolute text-lg font-bold">{pct}%</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium opacity-95">
        {done ? "🎉 今日目标已完成，太棒了！" : "继续加油，完成今日目标！"}
      </p>
    </div>
  );
}
