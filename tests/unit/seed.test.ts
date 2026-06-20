import { describe, expect, it } from "vitest";
import { shuffleAndDealWithSeed } from "../../src/gameEngine";
import { createSeededRandom, generateRandomSeed, parseSeed } from "../../src/seed";

describe("createSeededRandom", () => {
  it("is deterministic for the same seed", () => {
    const random = createSeededRandom(42);
    const values = [random(), random(), random()];
    expect(createSeededRandom(42)()).toBe(values[0]);
    expect(createSeededRandom(42)()).toBe(values[0]);
  });

  it("differs across seeds", () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });
});

describe("parseSeed", () => {
  it("accepts valid integer strings", () => {
    expect(parseSeed("123456789")).toBe(123456789);
    expect(parseSeed(" 42 ")).toBe(42);
  });

  it("rejects invalid values", () => {
    expect(parseSeed("")).toBeNull();
    expect(parseSeed("abc")).toBeNull();
    expect(parseSeed("0")).toBeNull();
    expect(parseSeed("-5")).toBeNull();
    expect(parseSeed("1.5")).toBeNull();
  });
});

describe("generateRandomSeed", () => {
  it("returns a valid seed", () => {
    expect(parseSeed(String(generateRandomSeed()))).not.toBeNull();
  });
});

describe("shuffleAndDealWithSeed", () => {
  it("deals the same board for the same seed", () => {
    expect(shuffleAndDealWithSeed(8675309)).toEqual(shuffleAndDealWithSeed(8675309));
  });

  it("deals different boards for different seeds", () => {
    expect(shuffleAndDealWithSeed(1)).not.toEqual(shuffleAndDealWithSeed(2));
  });
});
