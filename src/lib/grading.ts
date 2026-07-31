import type { School } from '../types';

// Default to the common Nigerian/WAEC convention (40% CA, 60% Exam) when a
// school hasn't set its own weighting yet. Francophone schools following
// the devoirs/composition convention (composition often ~2x the devoirs
// average) should set their own weights in School Settings instead of
// relying on this default — the two conventions genuinely differ and we
// don't want to silently assume one for every school.
const DEFAULT_CA_WEIGHT = 40;
const DEFAULT_EXAM_WEIGHT = 60;

export function getWeights(school: School | null) {
  const caWeight = school?.caWeight ?? DEFAULT_CA_WEIGHT;
  const examWeight = school?.examWeight ?? DEFAULT_EXAM_WEIGHT;
  return { caWeight, examWeight };
}

export function computeAverage(ca: number, exam: number, school: School | null): number {
  const { caWeight, examWeight } = getWeights(school);
  const total = caWeight + examWeight;
  const weighted = (ca * caWeight + exam * examWeight) / (total || 100);
  return Math.round(weighted * 100) / 100;
}
