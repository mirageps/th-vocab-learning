import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, Lock, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryCard } from "@/components/CategoryCard";
import { AudioButton } from "@/components/AudioButton";
import { AddWordModal } from "@/components/AddWordModal";
import { useProgress } from "@/store/progress-context";
import { useCustomVocab } from "@/store/custom-vocab-context";
import {
  categories,
  vocabulary,
  categoryMap,
  type Category,
  type VocabularyWord,
} from "@/data/vocabulary";
import type { CustomWord } from "@/store/custom-vocab-context";
import { searchDictionary, type DictionaryEntry } from "@/lib/dictionary";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

const MINE_CATEGORY: Category = {
  id: "mine" as Category["id"],
  thai: "คำของฉัน",
  chinese: "我的单词",
  emoji: "⭐",
};

interface DisplayWord {
  key: string;
  thai: string;
  pronunciation: string;
  chinese: string;
  mastery: number;
  isCustom?: boolean;
}

const fromBuiltin = (w: VocabularyWord, mastery: number): DisplayWord => ({
  key: `v-${w.id}`,
  thai: w.thai,
  pronunciation: w.pronunciation,
  chinese: w.chinese,
  mastery,
});

const fromCustom = (w: CustomWord, mastery: number): DisplayWord => ({
  key: `c-${w.id}`,
  thai: w.thaiWord,
  pronunciation: w.pronunciation,
  chinese: w.chineseMeaning,
  mastery,
  isCustom: true,
});



function LibraryPage() {
  const { state } = useProgress();
  const { words: customWords, categories: customCategories } = useCustomVocab();
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  /** 搜索范围 — defaults to the user's own library */
  const [scope, setScope] = useState<"mine" | "dictionary">("mine");
  const [addOpen, setAddOpen] = useState(false);

  // Full category list: built-in themes + "我的单词" + user-created ones.
  const allCategories = useMemo<Category[]>(
    () => [
      ...categories,
      MINE_CATEGORY,
      ...customCategories.map((c) => ({
        id: c.id as Category["id"],
        thai: c.chinese,
        chinese: "自定义分类",
        emoji: c.emoji,
      })),
    ],
    [customCategories],
  );

  // Linked words share the learning state of the system word they mirror.
  const customMastery = (w: CustomWord) =>
    state.mastery[String(w.linkedSystemWordId ?? w.id)] ?? 0;


  /** user words shown in a given bucket: "mine" = all, folder id = members */
  const userWordsIn = (bucket: string) =>
    bucket === "mine"
      ? customWords
      : customWords.filter((w) => (w.userCategoryIds ?? []).includes(bucket));

  const stats = useMemo(() => {
    const map: Record<string, { total: number; mastered: number }> = {};
    for (const c of allCategories) map[c.id] = { total: 0, mastered: 0 };
    // System categories only ever count system words.
    for (const w of vocabulary) {
      map[w.category].total += 1;
      if ((state.mastery[String(w.id)] ?? 0) >= 80)
        map[w.category].mastered += 1;
    }
    // User words live in 我的单词 and, optionally, in their own folders.
    for (const w of customWords) {
      const buckets = ["mine", ...(w.userCategoryIds ?? [])];
      for (const b of buckets) {
        if (!map[b]) continue;
        map[b].total += 1;
        if (customMastery(w) >= 80) map[b].mastered += 1;
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCategories, customWords, state.mastery]);

  const totalCount = vocabulary.length + customWords.length;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || scope !== "mine") return [];
    const builtin = vocabulary
      .filter(
        (w) =>
          w.thai.includes(q) ||
          w.pronunciation.toLowerCase().includes(q) ||
          w.chinese.includes(q),
      )
      .map((w) => fromBuiltin(w, state.mastery[String(w.id)] ?? 0));
    const custom = customWords
      .filter(
        (w) =>
          w.thaiWord.includes(q) ||
          w.pronunciation.toLowerCase().includes(q) ||
          w.chineseMeaning.includes(q),
      )
      .map((w) => fromCustom(w, customMastery(w)));
    return [...custom, ...builtin];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, scope, customWords, state.mastery]);

  // 系统词库: read-only search over the central dictionary repository.
  const dictionaryResults = useMemo(() => {
    if (!query.trim() || scope !== "dictionary") return [];
    return searchDictionary(query, { limit: 20 }).map((r) => r.entry);
  }, [query, scope]);


  const activeCategory = active
    ? (categoryMap[active as VocabularyWord["category"]] ??
      allCategories.find((c) => c.id === active) ??
      null)
    : null;
  const locked = !!activeCategory?.premium && !state.isPremium;

  const isSystemView = active
    ? Boolean(categoryMap[active as VocabularyWord["category"]])
    : false;

  const activeWords = useMemo<DisplayWord[]>(() => {
    if (!active) return [];
    // System categories show system words only — never user words.
    if (isSystemView) {
      return vocabulary
        .filter((w) => w.category === active)
        .map((w) => fromBuiltin(w, state.mastery[String(w.id)] ?? 0));
    }
    return userWordsIn(active).map((w) => fromCustom(w, customMastery(w)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isSystemView, customWords, state.mastery]);



  return (
    <AppShell>
      <div className="min-h-full px-4 pb-6 pt-6">
        {!active ? (
          <>
            <header className="mb-4">
              <h1 className="text-2xl font-bold text-foreground">我的词库</h1>
              <p className="text-sm text-muted-foreground">
                共 {totalCount} 个单词 · 按主题分类
              </p>
            </header>

            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索单词 / 拼音 / 中文"
                  className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                aria-label="添加单词"
                className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* 搜索范围 — 我的词库 by default; 系统词库 is read-only */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">搜索范围</span>
              <div className="flex rounded-full border border-border bg-muted p-0.5">
                {(
                  [
                    { id: "mine", label: "我的词库" },
                    { id: "dictionary", label: "系统词库" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScope(s.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      scope === s.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {query.trim() ? (
              scope === "dictionary" ? (
                <DictionaryList entries={dictionaryResults} />
              ) : (
                <WordList words={searchResults} />
              )
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {allCategories.map((c) => (
                  <CategoryCard
                    key={c.id}
                    category={c}
                    total={stats[c.id]?.total ?? 0}
                    mastered={stats[c.id]?.mastered ?? 0}
                    locked={c.premium && !state.isPremium}
                    onClick={() => setActive(c.id)}
                  />
                ))}
              </div>
            )}

          </>
        ) : (
          <>
            <header className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setActive(null)}
                aria-label="返回分类"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-thai text-xl font-bold text-foreground">
                  {activeCategory?.emoji} {activeCategory?.thai}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeCategory?.chinese} · {activeWords.length} 词
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                aria-label="添加单词"
                className="tap-scale flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-glow"
              >
                <Plus className="h-5 w-5" />
              </button>
            </header>

            {locked ? (
              <div className="mt-16 flex flex-col items-center gap-3 rounded-3xl border border-streak/30 bg-streak/10 p-8 text-center">
                <Lock className="h-10 w-10 text-streak" />
                <p className="font-bold text-foreground">会员专属词库</p>
                <p className="text-sm text-muted-foreground">
                  升级会员即可解锁「{activeCategory?.chinese}」等高级主题
                </p>
                <span className="rounded-full bg-streak px-4 py-1.5 text-sm font-bold text-streak-foreground">
                  即将推出
                </span>
              </div>
            ) : (
              <WordList words={activeWords} />
            )}
          </>
        )}
      </div>

      <AddWordModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultCategory={active ?? "mine"}
      />
    </AppShell>
  );
}

function WordList({ words }: { words: DisplayWord[] }) {
  if (!words.length) {
    return (
      <p className="mt-16 text-center text-sm text-muted-foreground">
        没有找到相关单词
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {words.map((w) => (
        <li
          key={w.key}
          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-thai text-2xl font-bold text-foreground">
                {w.thai}
              </span>
              {w.pronunciation && (
                <span className="truncate text-sm text-muted-foreground">
                  /{w.pronunciation}/
                </span>
              )}
              {w.isCustom ? (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  自建
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  系统
                </span>
              )}

            </div>
            <p className="text-base text-foreground">{w.chinese}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full gradient-primary")}
                  style={{ width: `${w.mastery}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {w.mastery}% 掌握
              </span>
            </div>
          </div>
          <AudioButton text={w.thai} size="sm" />
        </li>
      ))}
    </ul>
  );
}

/** Read-only results from the central dictionary (系统词库). */
function DictionaryList({ entries }: { entries: DictionaryEntry[] }) {
  if (!entries.length) {
    return (
      <div className="mt-16 text-center">
        <p className="text-sm font-semibold text-foreground">
          暂时没有找到这个单词
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          可在「添加新单词 · 自动生成」中查询或手动添加
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-thai text-2xl font-bold text-foreground">
                {e.thaiWord}
              </span>
              {e.pronunciation && (
                <span className="truncate text-sm text-muted-foreground">
                  /{e.pronunciation}/
                </span>
              )}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                词典
              </span>
            </div>
            <p className="text-base text-foreground">
              {e.chineseMeanings.join("、")}
            </p>
            {e.senses[0]?.thaiExample && (
              <p className="text-thai mt-1 text-sm text-muted-foreground">
                {e.senses[0].thaiExample}
              </p>
            )}
          </div>
          <AudioButton text={e.thaiWord} size="sm" />
        </li>
      ))}
    </ul>
  );
}
