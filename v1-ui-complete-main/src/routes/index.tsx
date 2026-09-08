import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Trophy, ChevronRight, Sparkles, Crown, Palette } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProgressCard } from "@/components/ProgressCard";
import { AchievementBadge } from "@/components/AchievementBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddWordFab } from "@/components/AddWordFab";
import { AddWordModal } from "@/components/AddWordModal";
import { useProgress, levelTitle } from "@/store/progress-context";
import { achievements } from "@/data/achievements";
import { vocabulary } from "@/data/vocabulary";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { state, level, levelProgress, masteredCount } = useProgress();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <AppShell>
      <div className="space-y-5 px-4 pb-6 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">สวัสดี 👋 欢迎回来</p>
            <h1 className="truncate text-2xl font-bold text-foreground">
              泰语单词{" "}
              <span className="text-base font-medium text-primary">
                ThaiWords
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-streak/15 px-3 py-1.5">
            <Flame className="h-4 w-4 text-streak" />
            <span className="text-sm font-bold text-streak-foreground">
              {state.streak} 天
            </span>
          </div>
        </header>

        {/* Daily goal */}
        <ProgressCard
          learnedToday={state.learnedToday}
          dailyGoal={state.dailyGoal}
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-lg">
                🎓
              </span>
              <span className="text-xs text-muted-foreground">当前等级</span>
            </div>
            <p className="mt-2 text-lg font-bold text-foreground">
              Level {level}
            </p>
            <p className="text-xs text-muted-foreground">{levelTitle(level)}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full gradient-primary"
                style={{ width: `${Math.round(levelProgress * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 text-lg">
                ⚡
              </span>
              <span className="text-xs text-muted-foreground">经验值</span>
            </div>
            <p className="mt-2 text-lg font-bold text-foreground">
              {state.xp} XP
            </p>
            <p className="text-xs text-muted-foreground">
              已掌握 {masteredCount} 词
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              共 {vocabulary.length} 个单词
            </div>
          </div>
        </div>

        {/* Start learning */}
        <Link
          to="/learn"
          className="tap-scale flex items-center justify-between rounded-3xl gradient-primary px-6 py-5 text-primary-foreground shadow-glow"
        >
          <div>
            <p className="text-lg font-bold">开始学习</p>
            <p className="text-sm opacity-90">今日新词 + 测验</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <ChevronRight className="h-6 w-6" />
          </span>
        </Link>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/flashcard"
            className="tap-scale flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
          >
            <span className="text-2xl">🃏</span>
            <div>
              <p className="text-sm font-bold text-foreground">单词卡</p>
              <p className="text-xs text-muted-foreground">翻卡记忆</p>
            </div>
          </Link>
          <Link
            to="/review"
            className="tap-scale flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
          >
            <span className="text-2xl">🔁</span>
            <div>
              <p className="text-sm font-bold text-foreground">智能复习</p>
              <p className="text-xs text-muted-foreground">间隔重复</p>
            </div>
          </Link>
        </div>

        {/* Achievements */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Trophy className="h-5 w-5 text-streak" /> 成就徽章
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {achievements.slice(0, 6).map((a) => (
              <AchievementBadge key={a.id} achievement={a} state={state} />
            ))}
          </div>
        </section>

        {/* Appearance / settings */}
        <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10">
              <Palette className="h-5 w-5 text-accent" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">外观主题</p>
              <p className="text-xs text-muted-foreground">选择浅色、深色或跟随系统</p>
            </div>
          </div>
          <ThemeToggle />
        </section>

        {/* Premium teaser */}
        <div className="flex items-center gap-3 rounded-3xl border border-streak/30 bg-streak/10 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-streak/20">
            <Crown className="h-5 w-5 text-streak" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">升级会员</p>
            <p className="text-xs text-muted-foreground">
              解锁全部词库、口语与 AI 对话导师
            </p>
          </div>
          <span className="rounded-full bg-streak px-3 py-1 text-xs font-bold text-streak-foreground">
            即将推出
          </span>
        </div>
      </div>

      <AddWordFab onClick={() => setAddOpen(true)} />
      <AddWordModal open={addOpen} onClose={() => setAddOpen(false)} />
    </AppShell>
  );
}
