// Central vocabulary lookup service.
//
// Search order (per product spec):
//   1. Built-in system vocabulary  (src/data/vocabulary.ts)
//   2. User-created vocabulary     (我的词库 in localStorage)
//   3. Local extra dictionary      (src/data/local-dictionary.ts)
//
// This module never fabricates data. If no match is found it returns
// { source: "not_found", data: null } and the caller shows the manual-entry
// prompt. Kept as its own service so a future backend / dictionary API / AI
// generator can be plugged in without touching the modal UI.

import { vocabulary } from "@/data/vocabulary";
import { localDictionary } from "@/data/local-dictionary";
import type { CustomWord } from "@/store/custom-vocab-context";

export type AutoFillSource =
  | "system_vocabulary"
  | "user_vocabulary"
  | "local_dictionary"
  | "system_dictionary"
  | "not_found";

export interface AutoFillData {
  pronunciation: string;
  chineseMeaning: string;
  thaiExample: string;
  chineseExample: string;
  category: string;
  difficulty: number;
}

export interface VocabularyLookupResult {
  source: AutoFillSource;
  data: AutoFillData | null;
}

/**
 * Normalize a Thai input string for lookup only.
 * - Trim leading/trailing whitespace
 * - Collapse runs of whitespace to a single space
 * - Preserve original Thai spelling, tone marks, and vowels — never mutate.
 */
export function normalizeThaiInput(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function emptyFill(): AutoFillData {
  return {
    pronunciation: "",
    chineseMeaning: "",
    thaiExample: "",
    chineseExample: "",
    category: "",
    difficulty: 0,
  };
}

export function lookupVocabulary(
  thaiWord: string,
  opts: { userWords?: CustomWord[] } = {},
): VocabularyLookupResult {
  const key = normalizeThaiInput(thaiWord);
  if (!key) return { source: "not_found", data: null };

  // 1) System vocabulary — authoritative match on Thai spelling.
  const sysHit = vocabulary.find((w) => normalizeThaiInput(w.thai) === key);
  if (sysHit) {
    return {
      source: "system_vocabulary",
      data: {
        pronunciation: sysHit.pronunciation ?? "",
        chineseMeaning: sysHit.chinese ?? "",
        thaiExample: sysHit.exampleThai ?? "",
        chineseExample: sysHit.exampleChinese ?? "",
        category: sysHit.category,
        difficulty: sysHit.difficulty ?? 2,
      },
    };
  }

  // 2) User-created words.
  const userWords = opts.userWords ?? [];
  const userHit = userWords.find(
    (w) => normalizeThaiInput(w.thaiWord) === key,
  );
  if (userHit) {
    const base = emptyFill();
    return {
      source: "user_vocabulary",
      data: {
        ...base,
        pronunciation: userHit.pronunciation ?? "",
        chineseMeaning: userHit.chineseMeaning ?? "",
        thaiExample: userHit.thaiExample ?? "",
        chineseExample: userHit.chineseExample ?? "",
        category: userHit.category ?? "",
        difficulty: userHit.difficulty ?? 2,
      },
    };
  }

  // 3) Local extra dictionary.
  const localHit = localDictionary.find(
    (w) => normalizeThaiInput(w.thaiWord) === key,
  );
  if (localHit) {
    return {
      source: "local_dictionary",
      data: {
        pronunciation: localHit.pronunciation ?? "",
        chineseMeaning: localHit.chineseMeaning ?? "",
        thaiExample: localHit.thaiExample ?? "",
        chineseExample: localHit.chineseExample ?? "",
        category: localHit.category ?? "",
        difficulty: localHit.difficulty ?? 2,
      },
    };
  }

  return { source: "not_found", data: null };
}
