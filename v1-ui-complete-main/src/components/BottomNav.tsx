import { Link, useRouterState } from "@tanstack/react-router";
import { Home, GraduationCap, Layers, Library, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "首页", icon: Home },
  { to: "/learn", label: "学习", icon: GraduationCap },
  { to: "/flashcard", label: "单词卡", icon: Layers },
  { to: "/library", label: "词库", icon: Library },
  { to: "/review", label: "复习", icon: RefreshCw },
] as const;

export function BottomNav() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
                    active && "bg-primary/10",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
