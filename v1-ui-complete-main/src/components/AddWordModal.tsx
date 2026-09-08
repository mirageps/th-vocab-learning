import { useEffect, useState } from "react";
import {
  Plus,
  Sparkles,
  X,
  Loader2,
  AlertTriangle,
  Info,
  Search,
  Check,
  Send,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { VocabularyWord } from "@/data/vocabulary";
import {
  useCustomVocab,
  findSystemWordByThai,
  isSystemCategoryId,
  type CustomWord,
} from "@/store/custom-vocab-context";
import { useProgress } from "@/store/progress-context";
import {
  lookupVocabulary,
  normalizeThaiInput,
  type AutoFillSource,
} from "@/lib/lookup-vocabulary";
import {
  searchDictionary,
  getDictionaryEntryByThai,
  type DictionaryEntry,
  type DictionarySense,
} from "@/lib/dictionary";
import { recordUsage, submitWordSuggestion } from "@/lib/dictionary-usage";
import { cn } from "@/lib/utils";


interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
  /** preselect a user folder (system categories are ignored) */
  defaultCategory?: string;
}

const DIFFICULTIES = [
  { value: 1, label: "简单" },
  { value: 2, label: "普通" },
  { value: 3, label: "困难" },
] as const;

type Mode = "manual" | "auto";


export function AddWordModal({
  open,
  onClose,
  defaultCategory,
}: AddWordModalProps) {
  const {
    categories: customCategories,
    words: customWords,
    addWord,
    updateWord,
    addCategory,
    findByThaiWord,
  } = useCustomVocab();

  const { state: progressState, toggleDifficult } = useProgress();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<CustomWord | null>(null);

  const [mode, setMode] = useState<Mode>("manual");

  const [thaiWord, setThaiWord] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [chineseMeaning, setChineseMeaning] = useState("");
  const [thaiExample, setThaiExample] = useState("");
  const [chineseExample, setChineseExample] = useState("");
  // Save location: user words always go to 我的单词; a user folder is optional.
  const initialFolder =
    defaultCategory && !isSystemCategoryId(defaultCategory) &&
    defaultCategory !== "mine"
      ? defaultCategory
      : null;
  const [folder, setFolder] = useState<string | null>(initialFolder);
  const [difficulty, setDifficulty] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);

  // Auto-mode-only inputs / state
  const [generating, setGenerating] = useState(false);
  const [autoFillSource, setAutoFillSource] = useState<AutoFillSource | null>(
    null,
  );
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  /** system word with the same spelling — asks for confirmation before saving */
  const [systemMatch, setSystemMatch] = useState<VocabularyWord | null>(null);

  // Central dictionary search state (auto mode only)
  const [suggestions, setSuggestions] = useState<DictionaryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  /** entry whose meanings the user is picking from */
  const [senseEntry, setSenseEntry] = useState<DictionaryEntry | null>(null);
  const [senseSelection, setSenseSelection] = useState<number[]>([]);
  const [extraSense, setExtraSense] = useState("");
  const [suggestionSaved, setSuggestionSaved] = useState(false);

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("");

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (open) {
      setMode("manual");
      setThaiWord("");
      setPronunciation("");
      setChineseMeaning("");
      setThaiExample("");
      setChineseExample("");
      setFolder(
        defaultCategory &&
          !isSystemCategoryId(defaultCategory) &&
          defaultCategory !== "mine"
          ? defaultCategory
          : null,
      );
      setDifficulty(2);
      setError(null);
      setGenerating(false);
      setAutoFillSource(null);
      setPendingMode(null);
      setSystemMatch(null);
      setSuggestions([]);
      setSearching(false);
      setSearched(false);
      setSenseEntry(null);
      setSenseSelection([]);
      setExtraSense("");
      setSuggestionSaved(false);
      setCreatingCategory(false);
      setNewCategoryName("");
      setNewCategoryEmoji("");
      setEditingId(null);
      setDuplicate(null);
    }
  }, [open, defaultCategory]);

  // Live suggestions from the central dictionary while typing (auto mode).
  useEffect(() => {
    if (!open || mode !== "auto") return;
    const q = normalizeThaiInput(thaiWord);
    if (!q) {
      setSuggestions([]);
      setSearching(false);
      setSearched(false);
      return;
    }
    setSearching(true);
    setSuggestionSaved(false);
    const t = setTimeout(() => {
      const hits = searchDictionary(q, { limit: 8 }).map((r) => r.entry);
      setSuggestions(hits);
      setSearching(false);
      setSearched(true);
      if (hits[0]) {
        recordUsage("search", {
          wordId: hits[0].id,
          thaiWord: hits[0].thaiWord,
        });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [open, mode, thaiWord]);




  if (!open) return null;

  const hasFormData = Boolean(
    pronunciation.trim() ||
      chineseMeaning.trim() ||
      thaiExample.trim() ||
      chineseExample.trim(),
  );

  const matched =
    autoFillSource !== null && autoFillSource !== "not_found";
  const notFound = autoFillSource === "not_found";

  const requestModeSwitch = (next: Mode) => {
    if (next === mode) return;
    // Only confirm when leaving auto mode with populated content — mode
    // switch never mutates form values, we just warn the user.
    if (hasFormData && next === "manual" && matched) {
      setPendingMode(next);
      return;
    }
    setMode(next);
    if (next === "manual") setAutoFillSource(null);
  };

  const confirmModeSwitch = () => {
    if (pendingMode) {
      setMode(pendingMode);
      setPendingMode(null);
      if (pendingMode === "manual") setAutoFillSource(null);
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const created = addCategory({
      chinese: newCategoryName,
      emoji: newCategoryEmoji,
    });
    setFolder(created.id);
    setCreatingCategory(false);
    setNewCategoryName("");
    setNewCategoryEmoji("");
  };

  /** Fill the form from the chosen meanings. Never saves automatically. */
  const applyEntry = (entry: DictionaryEntry, senseIndexes: number[]) => {
    const picked: DictionarySense[] = senseIndexes.length
      ? senseIndexes.map((i) => entry.senses[i]).filter(Boolean)
      : entry.senses.slice(0, 1);
    const extra = extraSense.trim();
    const meanings = [...picked.map((s) => s.chinese), extra].filter(Boolean);
    const withExample = picked.find((s) => s.thaiExample) ?? picked[0];

    setPronunciation(entry.pronunciation || "");
    setChineseMeaning(meanings.join("；"));
    setThaiExample(withExample?.thaiExample || "");
    setChineseExample(withExample?.chineseExample || "");
    if (entry.difficulty >= 1 && entry.difficulty <= 3) {
      setDifficulty(entry.difficulty);
    }
    setAutoFillSource("system_dictionary");
    setSenseEntry(null);
    setSenseSelection([]);
    setExtraSense("");
    setSuggestions([]);
    setError(null);
    recordUsage("select", { wordId: entry.id, thaiWord: entry.thaiWord });
  };

  /** Pick an entry from the suggestion list. */
  const handlePickEntry = (entry: DictionaryEntry) => {
    setThaiWord(entry.thaiWord);
    if (entry.senses.length > 1) {
      // Multiple meanings must always be confirmed by the user.
      setSenseEntry(entry);
      setSenseSelection([0]);
      setExtraSense("");
      return;
    }
    applyEntry(entry, [0]);
  };

  const handleAutoGenerate = async () => {
    const normalized = normalizeThaiInput(thaiWord);
    if (!normalized) {
      setError("请先输入泰语单词");
      return;
    }
    setError(null);
    setGenerating(true);
    // Short delay for visible feedback; lookup itself is synchronous.
    await new Promise((r) => setTimeout(r, 400));

    // 1) exact hit in the central dictionary repository
    const entry = getDictionaryEntryByThai(normalized);
    if (entry) {
      setGenerating(false);
      handlePickEntry(entry);
      return;
    }
    // 2) fall back to the existing local lookup service (incl. 我的词库)
    const result = lookupVocabulary(normalized, { userWords: customWords });
    if (result.source === "not_found" || !result.data) {
      setAutoFillSource("not_found");
      setGenerating(false);
      return;
    }
    const d = result.data;
    setPronunciation(d.pronunciation);
    setChineseMeaning(d.chineseMeaning);
    setThaiExample(d.thaiExample);
    setChineseExample(d.chineseExample);
    // Never adopt the matched system category — user words stay in 我的单词.
    if (d.difficulty >= 1 && d.difficulty <= 3) {
      setDifficulty(d.difficulty);
    }
    setAutoFillSource(result.source);
    setGenerating(false);
  };

  const handleSubmitSuggestion = () => {
    const word = normalizeThaiInput(thaiWord);
    if (!word) return;
    submitWordSuggestion({
      thaiWord: word,
      knownChineseMeaning: chineseMeaning,
      usageContext: thaiExample,
    });
    setSuggestionSaved(true);
  };

  const switchToManualKeepThai = () => {
    setAutoFillSource(null);
    setMode("manual");
  };


  const buildPayload = (linkedSystemWordId: number | null = null) => ({
    thaiWord: thaiWord.trim(),
    pronunciation: pronunciation.trim(),
    chineseMeaning: chineseMeaning.trim(),
    thaiExample: thaiExample.trim(),
    chineseExample: chineseExample.trim(),
    difficulty,
    userCategoryIds: folder ? [folder] : [],
    linkedSystemWordId,
    inputMode: (mode === "auto" ? "auto_local" : "manual") as
      | "auto_local"
      | "manual",
    autoFillSource:
      mode === "auto" && autoFillSource ? autoFillSource : undefined,
  });

  const commitAdd = (linkedSystemWordId: number | null) => {
    const usageId = normalizeThaiInput(thaiWord);
    recordUsage("addAttempt", { wordId: usageId, thaiWord: usageId });
    const result = addWord(buildPayload(linkedSystemWordId));
    if (result.status === "duplicate") {
      recordUsage("duplicateAttempt", { wordId: usageId, thaiWord: usageId });
      setDuplicate(result.existing);
      return;
    }
    onClose();
  };

  /** the meaning currently in the form is not yet part of the saved word */
  const duplicateHasNewMeaning = Boolean(
    duplicate &&
      chineseMeaning.trim() &&
      !duplicate.chineseMeaning
        .split(/[；;，,]/)
        .map((s) => s.trim())
        .includes(chineseMeaning.trim()),
  );

  /** Append the new meaning to the existing word instead of creating a copy. */
  const handleDuplicateAddMeaning = () => {
    if (!duplicate) return;
    const merged = [duplicate.chineseMeaning.trim(), chineseMeaning.trim()]
      .filter(Boolean)
      .join("；");
    updateWord(duplicate.id, {
      chineseMeaning: merged,
      pronunciation: duplicate.pronunciation || pronunciation.trim(),
      thaiExample: duplicate.thaiExample || thaiExample.trim(),
      chineseExample: duplicate.chineseExample || chineseExample.trim(),
    });
    setDuplicate(null);
    onClose();
  };


  const handleSave = () => {
    if (!thaiWord.trim() || !chineseMeaning.trim()) {
      setError("请填写泰语单词和中文释义");
      return;
    }
    if (editingId) {
      updateWord(editingId, buildPayload());
      onClose();
      return;
    }
    // Already in 我的单词? existing duplicate flow handles it.
    const alreadyMine = findByThaiWord(thaiWord);
    if (!alreadyMine) {
      const sys = findSystemWordByThai(thaiWord);
      if (sys) {
        setSystemMatch(sys);
        return;
      }
    }
    commitAdd(null);
  };

  const loadExistingIntoForm = (w: CustomWord) => {
    setEditingId(w.id);
    setMode("manual");
    setThaiWord(w.thaiWord);
    setPronunciation(w.pronunciation);
    setChineseMeaning(w.chineseMeaning);
    setThaiExample(w.thaiExample);
    setChineseExample(w.chineseExample);
    setFolder(w.userCategoryIds?.[0] ?? null);
    setDifficulty(w.difficulty);
    setAutoFillSource(null);
    setError(null);
  };


  const handleDuplicateView = () => {
    onClose();
    navigate({ to: "/library" });
  };
  const handleDuplicateUpdate = () => {
    if (!duplicate) return;
    loadExistingIntoForm(duplicate);
    setDuplicate(null);
  };
  const handleDuplicateMarkHard = () => {
    if (!duplicate) return;
    if (!progressState.difficult.includes(duplicate.id)) {
      toggleDifficult(duplicate.id);
    }
    setDuplicate(null);
    onClose();
  };



  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <button
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-card sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">
            {editingId ? "更新单词" : "添加新单词"}
          </h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Mode segmented control */}
          <div className="flex rounded-2xl border border-border bg-muted p-1">
            {([
              { id: "manual", label: "手动填写" },
              { id: "auto", label: "自动生成" },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => requestModeSwitch(m.id)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  mode === m.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {m.id === "auto" && (
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                )}
                {m.label}
              </button>
            ))}
          </div>

          <Field label="泰语单词" required>
            <input
              value={thaiWord}
              onChange={(e) => setThaiWord(e.target.value)}
              placeholder="เช่น หมูกระทะ"
              maxLength={80}
              className="text-thai w-full rounded-2xl border border-border bg-card px-4 py-3 text-lg text-foreground outline-none focus:border-primary"
            />
          </Field>

          {mode === "auto" && (
            <>
              <Field label="已知中文意思（可选）">
                <input
                  value={chineseMeaning}
                  onChange={(e) => setChineseMeaning(e.target.value)}
                  placeholder="如果知道大概意思，可先填写"
                  maxLength={120}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary"
                />
              </Field>

              {/* Live suggestions from the central dictionary */}
              {searching && (
                <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  正在搜索...
                </p>
              )}

              {!searching && suggestions.length > 0 && (
                <div>
                  <p className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">
                    找到相关词条（{suggestions.length}）
                  </p>
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {suggestions.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => handlePickEntry(entry)}
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary"
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="text-thai text-lg font-bold text-foreground">
                              {entry.thaiWord}
                            </span>
                            {entry.pronunciation && (
                              <span className="truncate text-xs text-muted-foreground">
                                /{entry.pronunciation}/
                              </span>
                            )}
                            {entry.senses.length > 1 && (
                              <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                {entry.senses.length} 个释义
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-foreground">
                            {entry.chineseMeanings.join("、")}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!searching &&
                searched &&
                suggestions.length === 0 &&
                !matched && (
                  <p className="px-1 text-xs text-muted-foreground">
                    没有匹配结果，可继续输入或点击下方按钮查询。
                  </p>
                )}

              <button
                type="button"
                onClick={handleAutoGenerate}
                disabled={generating}
                className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在搜索...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    {matched ? "重新查询" : "自动生成内容"}
                  </>
                )}
              </button>

              {matched && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Info className="h-3.5 w-3.5" />
                    已从本地词库匹配到内容
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {autoFillSource === "system_vocabulary"
                      ? "来源：系统词库"
                      : autoFillSource === "user_vocabulary"
                        ? "来源：我的词库"
                        : autoFillSource === "system_dictionary"
                          ? "来源：系统词典"
                          : "来源：本地词典"}
                    ，请检查后保存。
                  </p>
                </div>
              )}

              {notFound && (
                <div className="rounded-2xl border border-border bg-muted/60 px-4 py-3 text-xs leading-relaxed text-foreground">
                  <p className="font-semibold">暂时没有找到这个单词</p>
                  <p className="mt-1 text-muted-foreground">
                    请手动填写内容，系统不会自动生成不确定的信息。
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={switchToManualKeepThai}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
                    >
                      手动添加
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitSuggestion}
                      disabled={suggestionSaved}
                      className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
                    >
                      <Send className="h-3 w-3" />
                      {suggestionSaved ? "已记录建议" : "提交新词建议"}
                    </button>
                  </div>
                  {suggestionSaved && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      建议已保存在本机，等待后续加入系统词库。
                    </p>
                  )}
                </div>
              )}

              <div className="h-px w-full bg-border" />
            </>
          )}



          {(mode === "manual" || matched) && (

          <>
          <Field label="发音">
            <input
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              placeholder="mǔu grà tà"
              maxLength={120}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="中文释义" required>
            <input
              value={chineseMeaning}
              onChange={(e) => setChineseMeaning(e.target.value)}
              placeholder="泰式烤肉火锅"
              maxLength={120}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="泰语例句">
            <textarea
              value={thaiExample}
              onChange={(e) => setThaiExample(e.target.value)}
              placeholder="ฉันชอบกินหมูกระทะ"
              rows={2}
              maxLength={200}
              className="text-thai w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="中文翻译">
            <textarea
              value={chineseExample}
              onChange={(e) => setChineseExample(e.target.value)}
              placeholder="我喜欢吃泰式烤肉火锅"
              rows={2}
              maxLength={200}
              className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="保存位置">
            <div className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-sm text-foreground">
                默认保存至：<span className="font-semibold">⭐ 我的单词</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                自建单词不会写入系统词库分类。
              </p>
            </div>

            <p className="mb-2 mt-3 text-sm font-medium text-foreground">
              我的分类（可选）
            </p>

            {customCategories.length === 0 && !creatingCategory ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-4 text-center">
                <p className="text-sm font-semibold text-foreground">
                  暂无自建分类
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  可创建分类整理自己的单词
                </p>
                <button
                  type="button"
                  onClick={() => setCreatingCategory(true)}
                  className="mt-3 inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1.5 text-sm text-muted-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> 创建新分类
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setFolder((prev) => (prev === c.id ? null : c.id))
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      folder === c.id
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    <span>{c.emoji}</span>
                    {c.chinese}
                  </button>
                ))}
                {!creatingCategory && (
                  <button
                    type="button"
                    onClick={() => setCreatingCategory(true)}
                    className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> 创建新分类
                  </button>
                )}
              </div>
            )}

            {creatingCategory && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={newCategoryEmoji}
                  onChange={(e) => setNewCategoryEmoji(e.target.value)}
                  placeholder="📚"
                  maxLength={2}
                  className="w-12 rounded-2xl border border-border bg-card px-2 py-2 text-center text-base text-foreground outline-none focus:border-primary"
                />
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="分类名称"
                  maxLength={20}
                  className="flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  添加
                </button>
              </div>
            )}
          </Field>


          <Field label="难度">
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    "flex-1 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                    difficulty === d.value
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>
          </>
          )}



          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <footer className="space-y-2 border-t border-border px-5 py-4">
          {mode === "auto" && matched && (
            <p className="text-center text-[11px] text-muted-foreground">
              内容来自本地词库，请核对后再保存。
            </p>
          )}

          <button
            onClick={handleSave}
            className="tap-scale w-full rounded-2xl gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-glow"
          >
            {editingId ? "更新单词内容" : "保存到我的词库"}
          </button>
        </footer>

        {senseEntry && (
          <div className="absolute inset-0 z-10 flex items-end justify-center bg-foreground/50 p-3 sm:items-center sm:p-5">
            <div className="flex max-h-[85%] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-card">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-base font-bold text-foreground">
                  选择适合的释义
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="text-thai font-semibold text-foreground">
                    {senseEntry.thaiWord}
                  </span>
                  {senseEntry.pronunciation && (
                    <> · /{senseEntry.pronunciation}/</>
                  )}
                  · 可多选，保存前仍可修改
                </p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {senseEntry.senses.map((s, i) => {
                  const selected = senseSelection.includes(i);
                  return (
                    <button
                      key={`${s.chinese}-${i}`}
                      type="button"
                      onClick={() =>
                        setSenseSelection((prev) =>
                          prev.includes(i)
                            ? prev.filter((x) => x !== i)
                            : [...prev, i],
                        )
                      }
                      className={cn(
                        "w-full rounded-2xl border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {s.chinese}
                        </span>
                        {s.partOfSpeech && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {s.partOfSpeech}
                          </span>
                        )}
                        {selected && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </div>
                      {s.thaiExample && (
                        <p className="text-thai mt-1 text-sm text-foreground">
                          {s.thaiExample}
                        </p>
                      )}
                      {s.chineseExample && (
                        <p className="text-xs text-muted-foreground">
                          {s.chineseExample}
                        </p>
                      )}
                    </button>
                  );
                })}

                <div>
                  <p className="mb-1.5 text-xs font-medium text-foreground">
                    添加自己的释义（可选）
                  </p>
                  <input
                    value={extraSense}
                    onChange={(e) => setExtraSense(e.target.value)}
                    placeholder="输入你理解的意思"
                    maxLength={60}
                    className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setSenseEntry(null);
                    setSenseSelection([]);
                    setExtraSense("");
                  }}
                  className="flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!senseSelection.length && !extraSense.trim()}
                  onClick={() => applyEntry(senseEntry, senseSelection)}
                  className="flex-1 rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  使用所选释义
                </button>
              </div>
            </div>
          </div>
        )}

        {systemMatch && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/50 p-5">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-card">
              <h3 className="text-base font-bold text-foreground">
                系统词库中已有该单词
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                系统词库中已有「
                <span className="text-thai font-semibold text-foreground">
                  {systemMatch.thai}
                </span>
                」。是否仍添加到「我的单词」进行个人复习？
              </p>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSystemMatch(null);
                    onClose();
                    navigate({ to: "/library" });
                  }}
                  className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
                >
                  查看系统单词
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = systemMatch.id;
                    setSystemMatch(null);
                    commitAdd(id);
                  }}
                  className="w-full rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  仍然添加
                </button>
                <button
                  type="button"
                  onClick={() => setSystemMatch(null)}
                  className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingMode && (

          <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/40 p-6">
            <div className="w-full max-w-xs rounded-2xl border border-border bg-background p-5 shadow-card">
              <h3 className="text-base font-bold text-foreground">
                切换到手动填写？
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                当前已生成的内容会保留在表单中，你可以继续编辑。
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingMode(null)}
                  className="flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmModeSwitch}
                  className="flex-1 rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  继续切换
                </button>
              </div>
            </div>
          </div>
        )}

        {duplicate && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/50 p-5">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">
                    这个单词你已经添加过了
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="text-thai font-semibold text-foreground">
                      {duplicate.thaiWord}
                    </span>
                    {duplicate.chineseMeaning && (
                      <> · {duplicate.chineseMeaning}</>
                    )}
                  </p>
                  {duplicate.duplicateAddCount > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      你已尝试重复添加 {duplicate.duplicateAddCount} 次
                    </p>
                  )}
                </div>
              </div>

              {duplicateHasNewMeaning && (
                <button
                  type="button"
                  onClick={handleDuplicateAddMeaning}
                  className="mt-4 w-full rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                >
                  添加新释义「{chineseMeaning.trim()}」到原单词
                </button>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={handleDuplicateView}
                  className="rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
                >
                  查看单词
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateUpdate}
                  className="rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
                >
                  更新内容
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateMarkHard}
                  disabled={progressState.difficult.includes(duplicate.id)}
                  className="rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {progressState.difficult.includes(duplicate.id)
                    ? "已标记为难词"
                    : "标记为难词"}
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicate(null)}
                  className="rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}
