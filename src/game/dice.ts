/**
 * Dice rolling and dice state helpers.
 */

import type { Die, DieValue } from "./types";
import { randomDieValue } from "./random";

const INITIAL_REROLLS = 3;

export const MAX_REROLLS = INITIAL_REROLLS;

/** Create a single die with optional initial value. */
export function createDie(id: string, value?: DieValue): Die {
  return {
    id,
    value: value ?? randomDieValue(),
    locked: false,
  };
}

/** Create five dice with random initial values. */
export function createInitialDice(): Die[] {
  return [
    createDie("d1"),
    createDie("d2"),
    createDie("d3"),
    createDie("d4"),
    createDie("d5"),
  ];
}

/** Roll all unlocked dice (mutates dice array). */
export function rollUnlockedDice(dice: Die[], rollFn: () => DieValue = randomDieValue): void {
  for (const d of dice) {
    if (!d.locked) {
      d.value = rollFn();
    }
  }
}

/** Clone dice array (e.g. for reducer immutability). */
export function cloneDice(dice: Die[]): Die[] {
  return dice.map((d) => ({ ...d }));
}
