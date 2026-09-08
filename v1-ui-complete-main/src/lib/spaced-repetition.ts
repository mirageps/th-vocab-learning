// Lightweight SM-2 inspired spaced repetition scheduler.

export type ReviewGrade = "forgot" | "hard" | "know" | "easy";

export type WordId = number | string;

export interface ReviewItem {
  wordId: WordId;
  interval: number; // days until next review
  ease: number; // ease factor
  due: number; // timestamp (ms) when due
  reps: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function createReviewItem(wordId: WordId): ReviewItem {
  return { wordId, interval: 0, ease: 2.5, due: Date.now(), reps: 0 };
}


export function scheduleNext(item: ReviewItem, grade: ReviewGrade): ReviewItem {
  let { interval, ease, reps } = item;

  const quality = { forgot: 0, hard: 3, know: 4, easy: 5 }[grade];

  if (quality < 3) {
    reps = 0;
    interval = 0; // review again soon (same session / next day)
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
  }

  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return {
    ...item,
    interval,
    ease,
    reps,
    due: Date.now() + interval * DAY,
  };
}

export function isDue(item: ReviewItem): boolean {
  return item.due <= Date.now();
}

/** mastery delta applied to a word after a review grade */
export function masteryDelta(grade: ReviewGrade): number {
  return { forgot: -15, hard: 5, know: 15, easy: 25 }[grade];
}
