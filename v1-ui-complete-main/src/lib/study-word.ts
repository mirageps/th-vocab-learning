// Unified "study word" shape used by flashcards and the review system.
// Bridges built-in vocabulary (numeric ids) and user-created words (string ids)
// so they can flow through the same UI and progress store.

import { vocabulary, type VocabularyWord } from "@/data/vocabulary";
import type { CustomWord } from "@/store/custom-vocab-context";
import type { WordId } from "@/lib/spaced-repetition";

export type WordSource = "system" | "user_created";

export interface StudyWord {
  /** progress key — shared with the linked system word when applicable */
  id: WordId;
  /** the underlying record id (custom word id for user words) */
  recordId: WordId;
  thai: string;
  pronunciation: string;
  chinese: string;
  exampleThai?: string;
  exampleChinese?: string;
  category: string;
  /** user folders (user words only) */
  userCategoryIds?: string[];
  source: WordSource;
  premium?: boolean;
}

export const fromVocab = (w: VocabularyWord): StudyWord => ({
  id: w.id,
  recordId: w.id,
  thai: w.thai,
  pronunciation: w.pronunciation,
  chinese: w.chinese,
  exampleThai: w.exampleThai || undefined,
  exampleChinese: w.exampleChinese || undefined,
  category: w.category,
  source: "system",
  premium: w.premium,
});

export const fromCustom = (w: CustomWord): StudyWord => ({
  // linked words share the system word's learning state (progress, mastery…)
  id: w.linkedSystemWordId ?? w.id,
  recordId: w.id,
  thai: w.thaiWord,
  pronunciation: w.pronunciation,
  chinese: w.chineseMeaning,
  exampleThai: w.thaiExample?.trim() || undefined,
  exampleChinese: w.chineseExample?.trim() || undefined,
  category: "mine",
  userCategoryIds: w.userCategoryIds ?? [],
  source: "user_created",
});


export function getStudyWordById(
  id: WordId,
  customWords: CustomWord[],
): StudyWord | undefined {
  if (typeof id === "number") {
    const v = vocabulary.find((w) => w.id === id);
    return v ? fromVocab(v) : undefined;
  }
  // numeric strings could refer to built-ins persisted as string keys
  const asNum = Number(id);
  if (!Number.isNaN(asNum) && String(asNum) === id) {
    const v = vocabulary.find((w) => w.id === asNum);
    if (v) return fromVocab(v);
  }
  const c = customWords.find((w) => w.id === id);
  return c ? fromCustom(c) : undefined;
}
