/**
 * Random number utilities for dice. Can be replaced with a mock in tests.
 */

import type { DieValue } from "./types";

const DIE_VALUES: DieValue[] = [1, 2, 3, 4, 5, 6];

/** Returns a random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random die value 1–6. */
export function randomDieValue(): DieValue {
  return DIE_VALUES[randomInt(0, 5)]!;
}

/** Roll multiple dice; returns array of DieValues. */
export function rollDice(count: number): DieValue[] {
  const result: DieValue[] = [];
  for (let i = 0; i < count; i++) {
    result.push(randomDieValue());
  }
  return result;
}
