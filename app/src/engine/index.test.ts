import { describe, it, expect } from "vitest";
import { simulate, evaluateSolution } from "./index";
import type { Clock } from "./index";
import { puzzles } from "../puzzles";

describe("Shabbat Clocks Simulation Engine", () => {
  // Utility to create a clock with specific ON hours
  function createTestClock(id: string, onHours: number[], initialPosition = 0): Clock {
    const teeth = Array(24).fill(false);
    onHours.forEach((h) => {
      teeth[h] = true;
    });
    return {
      id,
      name: `Clock ${id}`,
      color: "blue",
      teeth,
      initialPosition,
    };
  }

  it("should simulate a single always-powered clock correctly", () => {
    // Clock is ON from 10:00 to 14:00 (hours 10, 11, 12, 13)
    const clock = createTestClock("1", [10, 11, 12, 13]);
    const { timeline, steps } = simulate([clock], 24);

    // Verify timeline matches expected hours
    for (let h = 0; h < 24; h++) {
      if (h >= 10 && h < 14) {
        expect(timeline[h]).toBe(true);
      } else {
        expect(timeline[h]).toBe(false);
      }
    }

    // Verify positions advance sequentially
    expect(steps[0].clocks[0].position).toBe(0);
    expect(steps[1].clocks[0].position).toBe(1);
    expect(steps[23].clocks[0].position).toBe(23);
  });

  it("should freeze dial position and output false when input power is cut", () => {
    // Clock starts at position 5. Teeth at 5, 6, 7 are ON.
    // However, the main input power is false.
    const clock = createTestClock("1", [5, 6, 7], 5);
    const { timeline, steps } = simulate([clock], 10, false);

    // Timeline should be entirely false because there is no input power
    expect(timeline.every((val) => val === false)).toBe(true);

    // Clock should not advance at all
    steps.forEach((step) => {
      expect(step.clocks[0].position).toBe(5);
      expect(step.clocks[0].hasInputPower).toBe(false);
      expect(step.clocks[0].hasOutputPower).toBe(false);
    });
  });

  it("should wrap around position after completing a cycle (23 to 00)", () => {
    const clock = createTestClock("1", [0], 23);
    const { steps } = simulate([clock], 3);

    // Tick 0: starts at 23, advances to 0 for tick 1
    expect(steps[0].clocks[0].position).toBe(23);
    // Tick 1: starts at 0, advances to 1 for tick 2
    expect(steps[1].clocks[0].position).toBe(0);
    // Tick 2: starts at 1, advances to 2 for tick 3
    expect(steps[2].clocks[0].position).toBe(1);
  });

  it("should simulate a chain of two clocks correctly (power gating and pausing)", () => {
    // Clock 1 (always powered): ON at 10, 11, 12, 13
    const clock1 = createTestClock("1", [10, 11, 12, 13]);
    // Clock 2 (powered by Clock 1): ON at 0, 1 (positions 0 and 1)
    const clock2 = createTestClock("2", [0, 1]);

    const { timeline, steps } = simulate([clock1, clock2], 24);

    // Let's trace clock2 position and output:
    // Ticks 0..9: Clock 1 is OFF -> Clock 2 has no input power -> doesn't spin, stays at pos 0
    for (let h = 0; h < 10; h++) {
      expect(steps[h].clocks[1].position).toBe(0);
      expect(steps[h].clocks[1].hasInputPower).toBe(false);
      expect(timeline[h]).toBe(false);
    }

    // Tick 10: Clock 1 is ON -> Clock 2 has input power -> starts at pos 0.
    // Tooth 0 is ON -> Output is ON.
    // Clock 2 advances to pos 1.
    expect(steps[10].clocks[1].position).toBe(0);
    expect(steps[10].clocks[1].hasInputPower).toBe(true);
    expect(timeline[10]).toBe(true);

    // Tick 11: Clock 2 starts at pos 1.
    // Tooth 1 is ON -> Output is ON.
    // Clock 2 advances to pos 2.
    expect(steps[11].clocks[1].position).toBe(1);
    expect(steps[11].clocks[1].hasInputPower).toBe(true);
    expect(timeline[11]).toBe(true);

    // Tick 12: Clock 2 starts at pos 2.
    // Tooth 2 is OFF -> Output is OFF.
    // Clock 2 advances to pos 3.
    expect(steps[12].clocks[1].position).toBe(2);
    expect(steps[12].clocks[1].hasInputPower).toBe(true);
    expect(timeline[12]).toBe(false);

    // Tick 13: Clock 2 starts at pos 3.
    // Tooth 3 is OFF -> Output is OFF.
    // Clock 2 advances to pos 4.
    expect(steps[13].clocks[1].position).toBe(3);
    expect(steps[13].clocks[1].hasInputPower).toBe(true);
    expect(timeline[13]).toBe(false);

    // Ticks 14..23: Clock 1 is OFF -> Clock 2 has no input power -> doesn't spin, stays at pos 4
    for (let h = 14; h < 24; h++) {
      expect(steps[h].clocks[1].position).toBe(4);
      expect(steps[h].clocks[1].hasInputPower).toBe(false);
      expect(timeline[h]).toBe(false);
    }
  });

  it("should evaluate solution match correctly", () => {
    const actual = [true, false, true];
    const matching = [true, false, true];
    const nonMatching = [true, true, true];
    const diffLength = [true, false];

    expect(evaluateSolution(actual, matching)).toBe(true);
    expect(evaluateSolution(actual, nonMatching)).toBe(false);
    expect(evaluateSolution(actual, diffLength)).toBe(false);
  });

  describe("Edge cases: midnight, day boundaries and chains", () => {
    it("a frozen downstream clock keeps its tooth across midnight and resumes from it", () => {
      // Blue powers orange only at 22:00-23:59 each day -> orange advances 2 teeth per day.
      const blue = createTestClock("b", [22, 23]);
      const orange = createTestClock("o", [3]);
      const { steps, timeline } = simulate([blue, orange], 48);
      // Day 1 22:00, 23:00 -> orange teeth 0, 1; it then waits (frozen) on tooth 2 through midnight.
      expect(steps[22].clocks[1].position).toBe(0);
      expect(steps[23].clocks[1].position).toBe(1);
      expect(steps[24].clocks[1].position).toBe(2);
      expect(steps[45].clocks[1].position).toBe(2);
      expect(steps[45].clocks[1].hasInputPower).toBe(false);
      // Day 2 22:00 -> tooth 2, 23:00 -> tooth 3 (ON) -> output only at absolute hour 47.
      expect(steps[46].clocks[1].position).toBe(2);
      expect(steps[47].clocks[1].position).toBe(3);
      expect(timeline.map((v, h) => (v ? h : -1)).filter((h) => h >= 0)).toEqual([47]);
    });

    it("the main clock wraps 23 -> 0 at every midnight over 72 hours", () => {
      const { steps } = simulate([createTestClock("b", [])], 72);
      expect(steps[23].clocks[0].position).toBe(23);
      expect(steps[24].clocks[0].position).toBe(0);
      expect(steps[47].clocks[0].position).toBe(23);
      expect(steps[48].clocks[0].position).toBe(0);
    });

    it("power stops propagating at the first OFF clock in a 3-clock chain", () => {
      const blue = createTestClock("b", Array.from({ length: 24 }, (_, i) => i));
      const orange = createTestClock("o", []); // never passes power on
      const purple = createTestClock("p", Array.from({ length: 24 }, (_, i) => i));
      const { steps, timeline } = simulate([blue, orange, purple], 48);
      expect(timeline.every((v) => !v)).toBe(true);
      steps.forEach((s) => {
        expect(s.clocks[1].hasInputPower).toBe(true);
        expect(s.clocks[2].hasInputPower).toBe(false);
        expect(s.clocks[2].position).toBe(0); // purple never moves
      });
    });

    it("normalizes out-of-range and negative initial positions", () => {
      expect(simulate([createTestClock("a", [1], 25)], 1).steps[0].clocks[0].position).toBe(1);
      expect(simulate([createTestClock("a", [23], -1)], 1).steps[0].clocks[0].position).toBe(23);
      expect(simulate([createTestClock("a", [23], -1)], 1).timeline[0]).toBe(true);
    });

    it("does not mutate the input clocks", () => {
      const clock = createTestClock("a", [5], 7);
      const before = JSON.stringify(clock);
      simulate([clock], 48);
      expect(JSON.stringify(clock)).toBe(before);
    });
  });

  describe("Puzzle Solutions Validation", () => {
    it("should successfully solve Puzzle 1 (tutorial-single-clock)", () => {
      const puzzle = puzzles.find((p) => p.id === "tutorial-single-clock")!;
      expect(puzzle).toBeDefined();

      const clocks = JSON.parse(JSON.stringify(puzzle.initialClocks)) as Clock[];
      const blue = clocks.find((c) => c.id === "blue-clock")!;
      [10, 11, 12, 13].forEach((h) => {
        blue.teeth[h] = true;
      });

      const result = simulate(clocks, puzzle.simulationDuration);
      expect(evaluateSolution(result.timeline, puzzle.targetTimeline)).toBe(true);
    });

    it("should successfully solve Puzzle 2 (two-stage-timer)", () => {
      const puzzle = puzzles.find((p) => p.id === "two-stage-timer")!;
      expect(puzzle).toBeDefined();

      const clocks = JSON.parse(JSON.stringify(puzzle.initialClocks)) as Clock[];
      const blue = clocks.find((c) => c.id === "blue-clock")!;
      const orange = clocks.find((c) => c.id === "orange-clock")!;

      [10, 11, 12, 13, 18, 19, 20, 21].forEach((h) => {
        blue.teeth[h] = true;
      });
      [0, 1, 2, 3, 12, 13, 14, 15].forEach((h) => {
        orange.teeth[h] = true;
      });

      const result = simulate(clocks, puzzle.simulationDuration);
      expect(evaluateSolution(result.timeline, puzzle.targetTimeline)).toBe(true);
    });

    it("should successfully solve Puzzle 3 (progressive-shift)", () => {
      const puzzle = puzzles.find((p) => p.id === "progressive-shift")!;
      expect(puzzle).toBeDefined();

      const clocks = JSON.parse(JSON.stringify(puzzle.initialClocks)) as Clock[];
      const blue = clocks.find((c) => c.id === "blue-clock")!;
      const orange = clocks.find((c) => c.id === "orange-clock")!;

      [10, 11, 12].forEach((h) => {
        blue.teeth[h] = true;
      });
      [0, 4, 8].forEach((h) => {
        orange.teeth[h] = true;
      });

      const result = simulate(clocks, puzzle.simulationDuration);
      expect(evaluateSolution(result.timeline, puzzle.targetTimeline)).toBe(true);
    });

    it("should successfully solve Puzzle 4 (triple-gear-reduction)", () => {
      const puzzle = puzzles.find((p) => p.id === "triple-gear-reduction")!;
      expect(puzzle).toBeDefined();

      const clocks = JSON.parse(JSON.stringify(puzzle.initialClocks)) as Clock[];
      const blue = clocks.find((c) => c.id === "blue-clock")!;
      const orange = clocks.find((c) => c.id === "orange-clock")!;
      const purple = clocks.find((c) => c.id === "purple-clock")!;

      [12, 13, 14, 15].forEach((h) => {
        blue.teeth[h] = true;
      });
      for (let i = 0; i <= 11; i++) {
        orange.teeth[i] = true;
      }
      [8, 9, 10, 11].forEach((h) => {
        purple.teeth[h] = true;
      });

      const result = simulate(clocks, puzzle.simulationDuration);
      expect(evaluateSolution(result.timeline, puzzle.targetTimeline)).toBe(true);
    });
  });
});
