// Local-only behaviour telemetry for the dictionary + add-word flow.
//
// Everything stays on the device (localStorage). Nothing is sent anywhere —
// no server, no analytics SDK, no external service. The shape is ready to be
// synced to a real database later.
//
// IMPORTANT: these counters must never automatically mark a word as 难词.
// They are signals for future review only.

export interface DictionaryUsageStat {
  wordId: string;
  thaiWord: string;
  searchCount: number;
  selectCount: number;
  addAttemptCount: number;
  duplicateAddCount: number;
  lastSearchedAt: number | null;
  lastSelectedAt: number | null;
  lastDuplicateAttemptAt: number | null;
}

export interface WordSuggestion {
  id: string;
  thaiWord: string;
  knownChineseMeaning: string;
  usageContext: string;
  submittedAt: number;
  status: "pending_local_review";
}

const USAGE_KEY = "thaiwords.dictionary.usage.v1";
const SUGGESTION_KEY = "thaiwords.dictionary.suggestions.v1";

function genId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID)
      return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function readUsageStats(): Record<string, DictionaryUsageStat> {
  return readJson<Record<string, DictionaryUsageStat>>(USAGE_KEY, {});
}

type UsageEvent =
  | "search"
  | "select"
  | "addAttempt"
  | "duplicateAttempt";

/** Increment one counter for a word. Safe to call on every keystroke-commit. */
export function recordUsage(
  event: UsageEvent,
  word: { wordId: string; thaiWord: string },
) {
  const all = readUsageStats();
  const now = Date.now();
  const prev: DictionaryUsageStat = all[word.wordId] ?? {
    wordId: word.wordId,
    thaiWord: word.thaiWord,
    searchCount: 0,
    selectCount: 0,
    addAttemptCount: 0,
    duplicateAddCount: 0,
    lastSearchedAt: null,
    lastSelectedAt: null,
    lastDuplicateAttemptAt: null,
  };
  const next: DictionaryUsageStat = { ...prev, thaiWord: word.thaiWord };
  if (event === "search") {
    next.searchCount += 1;
    next.lastSearchedAt = now;
  } else if (event === "select") {
    next.selectCount += 1;
    next.lastSelectedAt = now;
  } else if (event === "addAttempt") {
    next.addAttemptCount += 1;
  } else {
    next.duplicateAddCount += 1;
    next.lastDuplicateAttemptAt = now;
  }
  writeJson(USAGE_KEY, { ...all, [word.wordId]: next });
}

export function readWordSuggestions(): WordSuggestion[] {
  return readJson<WordSuggestion[]>(SUGGESTION_KEY, []);
}

/** Store a "提交新词建议" locally. Never leaves the device in this version. */
export function submitWordSuggestion(input: {
  thaiWord: string;
  knownChineseMeaning?: string;
  usageContext?: string;
}): WordSuggestion {
  const suggestion: WordSuggestion = {
    id: genId(),
    thaiWord: input.thaiWord.trim(),
    knownChineseMeaning: (input.knownChineseMeaning ?? "").trim(),
    usageContext: (input.usageContext ?? "").trim(),
    submittedAt: Date.now(),
    status: "pending_local_review",
  };
  writeJson(SUGGESTION_KEY, [suggestion, ...readWordSuggestions()]);
  return suggestion;
}
