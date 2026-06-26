/**
 * Deterministic, offline answer checking for Kwento Mode (pure).
 *
 * This is an INTERIM grader: real grading (and the "why is it wrong" diagnosis)
 * belongs to Misconception Detection (spec 5.9), which is an AI call. Until that
 * lands, checkKwentoAnswer gives a fast, dependency-free verdict good enough to
 * drive the adaptive-difficulty loop:
 *   - numeric problems: compare the student's number(s) against the final number
 *     in the worked solution (most embedded problems resolve to a number)
 *   - textual answers: normalized exact match, or the solution clearly contains
 *     the student's (multi-character) answer
 *
 * It is intentionally conservative: when unsure it returns false so the student
 * is routed to a hint / explanation rather than being told a wrong answer passed.
 */

/** Lowercase, strip punctuation (keeping number-relevant chars), collapse spaces. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.\-/\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract signed decimals from a string, e.g. "8 prutas, ₱30.50" -> [8, 30.5]. */
export function extractNumbers(value: string): number[] {
  const matches = value.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) {
    return [];
  }
  return matches.map(Number).filter((n) => Number.isFinite(n));
}

/** Relative+absolute tolerance so 0.333 ≈ 1/3 and large values still match. */
function approxEqual(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff <= 1e-6 || diff <= 0.01 * Math.max(Math.abs(a), Math.abs(b));
}

/**
 * Decide whether a student's answer matches the expected solution.
 *
 * @param studentAnswer    what the student typed
 * @param expectedSolution the suliranin_sagot (worked solution text)
 */
export function checkKwentoAnswer(studentAnswer: string, expectedSolution: string): boolean {
  const student = normalizeAnswer(studentAnswer);
  const expected = normalizeAnswer(expectedSolution);

  if (student.length === 0) {
    return false;
  }
  if (expected.length > 0 && student === expected) {
    return true;
  }

  const expectedNums = extractNumbers(expectedSolution);
  const studentNums = extractNumbers(studentAnswer);

  if (expectedNums.length > 0 && studentNums.length > 0) {
    // The worked solution's final number is the canonical answer.
    const target = expectedNums[expectedNums.length - 1];
    return studentNums.some((n) => approxEqual(n, target));
  }

  // Non-numeric: accept when the solution clearly contains the student's answer
  // (guard against trivially short fragments matching).
  if (student.length >= 2 && expected.includes(student)) {
    return true;
  }

  return false;
}
