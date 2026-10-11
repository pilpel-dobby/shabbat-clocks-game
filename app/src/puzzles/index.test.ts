import { describe, it, expect } from "vitest";
import { simulate, evaluateSolution } from "../engine";
import type { Clock } from "../engine";
import { puzzles } from "./index";

/** Reference solutions: clock id -> teeth that should be ON. */
const solutions: Record<string, Record<string, number[]>> = {
  "tutorial-single-clock": { "blue-clock": [10, 11, 12, 13] },
  "two-windows": { "blue-clock": [6, 7, 18, 19, 20] },
  "skip-a-day": { "blue-clock": [19, 20, 21, 22], "orange-clock": [4, 5, 6, 7] },
  "two-stage-timer": {
    "blue-clock": [10, 11, 12, 13, 18, 19, 20, 21],
    "orange-clock": [0, 1, 2, 3, 12, 13, 14, 15],
  },
  "shabbat-meals": {
    "blue-clock": [12, 13, 18, 19, 20, 21, 22],
    "orange-clock": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  "gradual-dimming": { "blue-clock": [20, 21, 22, 23], "orange-clock": [0, 1, 2, 3, 4, 5, 8] },
  "progressive-shift": { "blue-clock": [10, 11, 12], "orange-clock": [0, 4, 8] },
  "wrap-around": {
    "blue-clock": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    "orange-clock": [8, 9, 10, 14, 15, 16],
  },
  "triple-gear-reduction": {
    "blue-clock": [12, 13, 14, 15],
    "orange-clock": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    "purple-clock": [8, 9, 10, 11],
  },
};

function applySolution(initial: Clock[], solution: Record<string, number[]>): Clock[] {
  return initial.map((clock) => {
    const teeth = Array(clock.teeth.length).fill(false);
    (solution[clock.id] ?? []).forEach((h) => (teeth[h] = true));
    return { ...clock, teeth };
  });
}

describe("Puzzle bank", () => {
  it("has unique puzzle ids", () => {
    const ids = puzzles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a reference solution for every puzzle", () => {
    expect(Object.keys(solutions).sort()).toEqual(puzzles.map((p) => p.id).sort());
  });

  describe.each(puzzles.map((p) => [p.id, p] as const))("%s", (_id, puzzle) => {
    it("is well formed", () => {
      expect(puzzle.targetTimeline).toHaveLength(puzzle.simulationDuration);
      expect(puzzle.simulationDuration % 24).toBe(0);
      expect(puzzle.targetTimeline.some(Boolean)).toBe(true);
      expect(puzzle.initialClocks.length).toBeGreaterThan(0);
      puzzle.initialClocks.forEach((c) => {
        expect(c.teeth).toHaveLength(24);
        expect(c.teeth.every((t) => t === false)).toBe(true);
      });
      expect(puzzle.title.length).toBeGreaterThan(0);
      expect(puzzle.shortTitle.length).toBeGreaterThan(0);
    });

    it("is not solved by the empty starting configuration", () => {
      const result = simulate(puzzle.initialClocks, puzzle.simulationDuration);
      expect(evaluateSolution(result.timeline, puzzle.targetTimeline)).toBe(false);
    });

    it("is solvable with the engine (reference solution)", () => {
      const clocks = applySolution(puzzle.initialClocks, solutions[puzzle.id]);
      const result = simulate(clocks, puzzle.simulationDuration);
      expect(evaluateSolution(result.timeline, puzzle.targetTimeline)).toBe(true);
    });
  });

  it("orders puzzles from easy to hard", () => {
    const rank = { "קל": 0, "בינוני": 1, "קשה": 2 } as const;
    const ranks = puzzles.map((p) => rank[p.difficulty]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
});
