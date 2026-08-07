export interface StudentAverage {
  admissionNo: string;
  average: number;
}

export interface RankedStudent extends StudentAverage {
  rank: number;
}

// Standard "1224" competition ranking: students with the same average
// share the same rank, and the next distinct average skips ahead to the
// correct position (e.g. two students tied for 1st means the next student
// is ranked 3rd, not 2nd).
export function rankStudents(students: StudentAverage[]): RankedStudent[] {
  const sorted = [...students].sort((a, b) => b.average - a.average);
  const ranked: RankedStudent[] = [];
  let rank = 0;
  let previousAverage: number | null = null;

  sorted.forEach((s, index) => {
    if (s.average !== previousAverage) {
      rank = index + 1;
      previousAverage = s.average;
    }
    ranked.push({ ...s, rank });
  });

  return ranked;
}
