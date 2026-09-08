// Central dictionary repository service.
//
// Merges every *internal* data source into one normalized, searchable
// repository. No network, no external dictionary/AI/OCR API — everything is
// bundled with the app so it works in Mainland China without a VPN.
//
// Sources (in priority order when the same Thai spelling appears twice):
//   1. src/data/vocabulary.ts        (system study vocabulary)
//   2. src/data/dictionary-entries.ts (curated multi-sense entries)
//   3. src/data/local-dictionary.ts  (tier-3 extra entries)
//
// UI code must only use the exported functions below; the storage shape can
// then be swapped for a backend/database later without touching components.

import { vocabulary } from "@/data/vocabulary";
import { localDictionary } from "@/data/local-dictionary";
import {
  dictionaryEntries,
  type DictionarySense,
  type RawDictionaryEntry,
} from "@/data/dictionary-entries";

export type { DictionarySense };

export interface DictionaryEntry {
  id: string;
  thaiWord: string;
  /** search key only — Thai spelling, tones and vowels are never altered */
  normalizedThaiWord: string;
  pronunciation: string;
  chineseMeanings: string[];
  partOfSpeech: string;
  thaiExamples: string[];
  chineseExamples: string[];
  senses: DictionarySense[];
  category: string;
  tags: string[];
  difficulty: number;
  source: "system_dictionary";
  createdAt: number;
  updatedAt: number;
}

/**
 * Normalize Thai text for *lookup only*.
 * Unicode NFC + trim + collapse inner whitespace. Consonants, leading/
 * trailing/upper/lower vowels, tone marks and thanthakhat are preserved
 * exactly; spelling is never auto-corrected.
 */
export function normalizeThaiText(input: string): string {
  return (input ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

/** Case/space-insensitive key used for latin (pronunciation / 中文) matching. */
function looseKey(input: string): string {
  return (input ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, "");
}

const EPOCH = Date.UTC(2024, 0, 1);

/** Turn any raw row (file, JSON or future CSV import) into a full entry. */
export function normalizeDictionaryEntry(
  raw: RawDictionaryEntry,
  fallbackId?: string,
): DictionaryEntry {
  const thaiWord = normalizeThaiText(raw.thaiWord);
  const senses = (raw.senses ?? [])
    .filter((s) => s && s.chinese && s.chinese.trim())
    .map((s) => ({
      chinese: s.chinese.trim(),
      partOfSpeech: s.partOfSpeech?.trim() || "",
      thaiExample: s.thaiExample?.trim() || "",
      chineseExample: s.chineseExample?.trim() || "",
    }));
  const now = raw.updatedAt ?? raw.createdAt ?? EPOCH;
  return {
    id: raw.id ?? fallbackId ?? `dict-${thaiWord}`,
    thaiWord,
    normalizedThaiWord: thaiWord,
    pronunciation: raw.pronunciation?.trim() ?? "",
    chineseMeanings: senses.map((s) => s.chinese),
    partOfSpeech: senses.find((s) => s.partOfSpeech)?.partOfSpeech ?? "",
    thaiExamples: senses.map((s) => s.thaiExample).filter(Boolean),
    chineseExamples: senses.map((s) => s.chineseExample).filter(Boolean),
    senses,
    category: raw.category ?? "",
    tags: raw.tags ?? [],
    difficulty: raw.difficulty ?? 2,
    source: "system_dictionary",
    createdAt: raw.createdAt ?? EPOCH,
    updatedAt: now,
  };
}

/** Raw rows from every bundled source, in priority order. */
function rawRows(): { raw: RawDictionaryEntry; id: string }[] {
  const fromVocabulary = vocabulary.map((w) => ({
    id: `sys-${w.id}`,
    raw: {
      thaiWord: w.thai,
      pronunciation: w.pronunciation,
      category: w.category,
      difficulty: w.difficulty,
      tags: [w.level],
      senses: [
        {
          chinese: w.chinese,
          thaiExample: w.exampleThai,
          chineseExample: w.exampleChinese,
        },
      ],
    } satisfies RawDictionaryEntry,
  }));

  const curated = dictionaryEntries.map((raw, i) => ({
    id: raw.id ?? `dict-${i}`,
    raw,
  }));

  const fromLocal = localDictionary.map((w, i) => ({
    id: `local-${i}`,
    raw: {
      thaiWord: w.thaiWord,
      pronunciation: w.pronunciation,
      category: w.category,
      difficulty: w.difficulty,
      senses: [
        {
          chinese: w.chineseMeaning,
          thaiExample: w.thaiExample,
          chineseExample: w.chineseExample,
        },
      ],
    } satisfies RawDictionaryEntry,
  }));

  return [...fromVocabulary, ...curated, ...fromLocal];
}

let cache: DictionaryEntry[] | null = null;

/**
 * Load (and memoize) the whole repository. Async on purpose so a future
 * backend/JSON/CSV loader can drop in without changing call sites.
 */
export function loadDictionaryEntries(): DictionaryEntry[] {
  if (cache) return cache;
  const byKey = new Map<string, DictionaryEntry>();
  for (const { raw, id } of rawRows()) {
    const entry = normalizeDictionaryEntry(raw, id);
    if (!entry.thaiWord || entry.senses.length === 0) continue;
    const existing = byKey.get(entry.normalizedThaiWord);
    if (!existing) {
      byKey.set(entry.normalizedThaiWord, entry);
      continue;
    }
    // Same spelling from a lower-priority source: merge extra senses in.
    const known = new Set(existing.chineseMeanings);
    const merged = [
      ...existing.senses,
      ...entry.senses.filter((s) => !known.has(s.chinese)),
    ];
    byKey.set(
      existing.normalizedThaiWord,
      normalizeDictionaryEntry(
        {
          id: existing.id,
          thaiWord: existing.thaiWord,
          pronunciation: existing.pronunciation || entry.pronunciation,
          category: existing.category || entry.category,
          tags: Array.from(new Set([...existing.tags, ...entry.tags])),
          difficulty: existing.difficulty,
          senses: merged,
          createdAt: existing.createdAt,
          updatedAt: Date.now(),
        },
        existing.id,
      ),
    );
  }
  cache = Array.from(byKey.values());
  return cache;
}

export function getDictionaryEntryById(id: string): DictionaryEntry | null {
  return loadDictionaryEntries().find((e) => e.id === id) ?? null;
}

export function getDictionaryEntryByThai(
  thaiWord: string,
): DictionaryEntry | null {
  const key = normalizeThaiText(thaiWord);
  if (!key) return null;
  return (
    loadDictionaryEntries().find((e) => e.normalizedThaiWord === key) ?? null
  );
}

export interface DictionarySearchOptions {
  /** max results returned (default 8) */
  limit?: number;
}

export interface DictionarySearchResult {
  entry: DictionaryEntry;
  /** why it matched — used only for ordering, not shown as raw text */
  matchedOn: "thai" | "pronunciation" | "chinese";
}

/**
 * Search Thai word / pronunciation / Chinese meaning.
 * Thai is the primary key: exact matches first, then prefix, then contains.
 */
export function searchDictionary(
  query: string,
  options: DictionarySearchOptions = {},
): DictionarySearchResult[] {
  const limit = options.limit ?? 8;
  const thaiKey = normalizeThaiText(query);
  if (!thaiKey) return [];
  const loose = looseKey(query);

  const scored: { r: DictionarySearchResult; score: number }[] = [];
  for (const entry of loadDictionaryEntries()) {
    const t = entry.normalizedThaiWord;
    let score = -1;
    let matchedOn: DictionarySearchResult["matchedOn"] = "thai";

    if (t === thaiKey) score = 100;
    else if (t.startsWith(thaiKey)) score = 80;
    else if (t.includes(thaiKey)) score = 60;

    if (score < 0 && loose) {
      const p = looseKey(entry.pronunciation);
      if (p && p.includes(loose)) {
        score = p.startsWith(loose) ? 50 : 40;
        matchedOn = "pronunciation";
      }
    }
    if (score < 0 && loose) {
      const hit = entry.chineseMeanings.some((m) => looseKey(m).includes(loose));
      if (hit) {
        score = 30;
        matchedOn = "chinese";
      }
    }
    if (score >= 0) scored.push({ r: { entry, matchedOn }, score });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.r.entry.thaiWord.length - b.r.entry.thaiWord.length,
    )
    .slice(0, limit)
    .map((s) => s.r);
}
