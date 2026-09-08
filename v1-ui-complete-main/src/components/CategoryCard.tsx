import { Lock } from "lucide-react";
import type { Category } from "@/data/vocabulary";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: Category;
  total: number;
  mastered: number;
  locked?: boolean;
  onClick?: () => void;
}

export function CategoryCard({
  category,
  total,
  mastered,
  locked,
  onClick,
}: CategoryCardProps) {
  const pct = total ? Math.round((mastered / total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-scale relative flex flex-col rounded-3xl border border-border bg-card p-4 text-left shadow-soft"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-2xl">
          {category.emoji}
        </span>
        {locked && (
          <span className="flex items-center gap-1 rounded-full bg-streak/20 px-2 py-0.5 text-[11px] font-semibold text-streak-foreground">
            <Lock className="h-3 w-3" /> 会员
          </span>
        )}
      </div>
      <p className="text-thai mt-3 text-base font-bold text-foreground">
        {category.thai}
      </p>
      <p className="text-sm text-muted-foreground">{category.chinese}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {mastered}/{total} 掌握
        </span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full gradient-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
