import type { ProgressState } from "@/store/progress-context";

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  /** returns 0..1 completion ratio */
  progress: (s: ProgressState) => number;
}

export const achievements: Achievement[] = [
  {
    id: "first-word",
    emoji: "🌱",
    title: "初学者",
    description: "学习第一个单词",
    progress: (s) => (Object.keys(s.mastery).length >= 1 ? 1 : 0),
  },
  {
    id: "streak-3",
    emoji: "🔥",
    title: "坚持不懈",
    description: "连续学习 3 天",
    progress: (s) => Math.min(s.streak / 3, 1),
  },
  {
    id: "streak-7",
    emoji: "🏅",
    title: "一周达人",
    description: "连续学习 7 天",
    progress: (s) => Math.min(s.streak / 7, 1),
  },
  {
    id: "words-20",
    emoji: "📚",
    title: "词汇积累",
    description: "学习 20 个单词",
    progress: (s) => Math.min(Object.keys(s.mastery).length / 20, 1),
  },
  {
    id: "words-100",
    emoji: "🏆",
    title: "单词大师",
    description: "掌握 100 个单词",
    progress: (s) => {
      const mastered = Object.values(s.mastery).filter((m) => m >= 80).length;
      return Math.min(mastered / 100, 1);
    },
  },
  {
    id: "xp-500",
    emoji: "⚡",
    title: "经验丰富",
    description: "累计获得 500 XP",
    progress: (s) => Math.min(s.xp / 500, 1),
  },
];
