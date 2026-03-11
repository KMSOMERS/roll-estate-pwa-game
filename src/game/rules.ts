/**
 * Game rules: rental claiming (die-face and triple/quad), business completion, endgame.
 */

import type { Die, PlayerSheet, RentalsByRow } from "./types";
import type { DieValue } from "./types";
import {
  ROW_IDS,
  ROW_QUALIFIER,
  getRentalSlotCount,
  getBusinessesForRow,
} from "./board";
import { MASS_TRANSIT_ROUTE_IDS } from "./assets";

/** Get current die values from dice array. */
export function getDiceValues(dice: Die[]): DieValue[] {
  return dice.map((d) => d.value);
}

/** Sum of all dice matching this face (for rows 1–6). */
function sumDiceMatchingFace(diceValues: DieValue[], face: DieValue): number {
  return diceValues.filter((d) => d === face).reduce((a, b) => a + b, 0);
}

/** Best triple: sum of 3 or 4 matching dice (rule: "Total all the matched dice"). Max over all faces. */
function bestTripleSum(diceValues: DieValue[]): number {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const d of diceValues) counts[d]++;
  let best = 0;
  for (let face = 1; face <= 6; face++) {
    const c = counts[face]!;
    if (c >= 3) best = Math.max(best, face * c);
  }
  return best;
}

/** Best quadruple: sum of 4 matching dice. Returns 0 if none. */
function bestQuadrupleSum(diceValues: DieValue[]): number {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const d of diceValues) counts[d]++;
  for (let face = 1; face <= 6; face++) {
    if (counts[face]! >= 4) return face * 4;
  }
  return 0;
}

/**
 * Value the player would write when claiming a rental in this row with current dice.
 * Rows 1–6: sum of dice matching the row's face. Rows 7–8: triple/quad sum. Returns 0 if roll doesn't qualify.
 */
export function getRentalValueForRoll(rowId: string, diceValues: DieValue[]): number {
  const qual = ROW_QUALIFIER[rowId];
  if (qual === undefined) return 0;
  if (typeof qual === "number") {
    const sum = sumDiceMatchingFace(diceValues, qual as DieValue);
    return sum > 0 ? sum : 0;
  }
  if (qual === "triple") return bestTripleSum(diceValues);
  if (qual === "quadruple") return bestQuadrupleSum(diceValues);
  return 0;
}

/** Get rental slot values for a player (ensure array exists and correct length). */
function getRentalSlots(rentals: RentalsByRow, rowId: string): number[] {
  const len = getRentalSlotCount(rowId);
  const arr = rentals[rowId];
  if (!arr || arr.length !== len) return Array(len).fill(0);
  return [...arr];
}

/** Slot is empty (0 or unfilled). */
function isSlotEmpty(slots: number[], slotIndex: number): boolean {
  return slotIndex < slots.length && (slots[slotIndex] ?? 0) === 0;
}

/** Value satisfies left-to-right increase: must be > left and < right (if filled). */
function valueFitsOrder(slots: number[], slotIndex: number, value: number): boolean {
  if (value <= 0) return false;
  for (let i = 0; i < slotIndex; i++) {
    const left = slots[i] ?? 0;
    if (left > 0 && value <= left) return false;
  }
  for (let i = slotIndex + 1; i < slots.length; i++) {
    const right = slots[i] ?? 0;
    if (right > 0 && value >= right) return false;
  }
  return true;
}

/** Can this player claim this rental slot with current dice? */
export function canClaimRental(
  player: PlayerSheet,
  rowId: string,
  slotIndex: number,
  diceValues: DieValue[]
): boolean {
  if (player.lostInterestRows.includes(rowId)) return false;
  const slots = getRentalSlots(player.rentals, rowId);
  if (!isSlotEmpty(slots, slotIndex)) return false;
  const value = getRentalValueForRoll(rowId, diceValues);
  if (value <= 0) return false;
  return valueFitsOrder(slots, slotIndex, value);
}

/** All claimable rental slots for this player this turn: { rowId, slotIndex }[]. */
export function getClaimableRentalSlots(
  player: PlayerSheet,
  diceValues: DieValue[]
): { rowId: string; slotIndex: number }[] {
  const out: { rowId: string; slotIndex: number }[] = [];
  for (const rowId of ROW_IDS) {
    const len = getRentalSlotCount(rowId);
    for (let slotIndex = 0; slotIndex < len; slotIndex++) {
      if (canClaimRental(player, rowId, slotIndex, diceValues)) {
        out.push({ rowId, slotIndex });
      }
    }
  }
  return out;
}

/** Has this player filled all rental slots in this row? */
export function hasCompletedRow(rowId: string, player: PlayerSheet): boolean {
  const slots = getRentalSlots(player.rentals, rowId);
  return slots.every((v) => v > 0);
}

/** How many businesses in this row have been claimed (by anyone)? */
export function countBusinessesClaimedInRow(
  rowId: string,
  businessesClaimed: Record<string, string>
): number {
  return getBusinessesForRow(rowId).filter((b) => businessesClaimed[b.id]).length;
}

/** Next business to assign when a player completes this row (1st or 2nd completer). */
export function getNextBusinessForRow(
  rowId: string,
  businessesClaimed: Record<string, string>
): { id: string; income: number } | null {
  const defs = getBusinessesForRow(rowId);
  const claimed = defs.filter((b) => businessesClaimed[b.id]);
  if (claimed.length >= defs.length) return null;
  const next = defs[claimed.length];
  return next ? { id: next.id, income: next.income } : null;
}

/** Count how many businesses a player has claimed. */
export function countBusinessesClaimedBy(
  businessesClaimed: Record<string, string>,
  playerId: string
): number {
  return Object.values(businessesClaimed).filter((id) => id === playerId).length;
}

/** Count remaining rental slots (empty) for this player across non-lost rows. */
export function countRemainingRentalsForPlayer(player: PlayerSheet): number {
  let count = 0;
  for (const rowId of ROW_IDS) {
    if (player.lostInterestRows.includes(rowId)) continue;
    const slots = getRentalSlots(player.rentals, rowId);
    for (const v of slots) {
      if (v === 0) count++;
    }
  }
  return count;
}

/** 2-player variant: game ends when a player opens their 4th business. */
export const BUSINESSES_TO_END_GAME_2P = 4;

export function checkEndgameTriggered(
  players: PlayerSheet[],
  businessesClaimed: Record<string, string>
): boolean {
  for (const p of players) {
    if (countBusinessesClaimedBy(businessesClaimed, p.playerId) >= BUSINESSES_TO_END_GAME_2P)
      return true;
    if (countRemainingRentalsForPlayer(p) === 0) return true;
  }
  return false;
}

// --- Mass Transit: 4 routes in sequence (Any, 1-4, 2-5, 3-6) ---

/** True if dice contain a run of 4 (1-4, 2-5, or 3-6). */
export function hasRunOf4(diceValues: DieValue[]): boolean {
  return hasRun1to4(diceValues) || hasRun2to5(diceValues) || hasRun3to6(diceValues);
}

/** True if dice contain 1, 2, 3, 4 (at least one of each). */
export function hasRun1to4(diceValues: DieValue[]): boolean {
  if (diceValues.length < 4) return false;
  const s = new Set(diceValues);
  return s.has(1) && s.has(2) && s.has(3) && s.has(4);
}

/** True if dice contain 2, 3, 4, 5. */
export function hasRun2to5(diceValues: DieValue[]): boolean {
  if (diceValues.length < 4) return false;
  const s = new Set(diceValues);
  return s.has(2) && s.has(3) && s.has(4) && s.has(5);
}

/** True if dice contain 3, 4, 5, 6. */
export function hasRun3to6(diceValues: DieValue[]): boolean {
  if (diceValues.length < 4) return false;
  const s = new Set(diceValues);
  return s.has(3) && s.has(4) && s.has(5) && s.has(6);
}

/** Route requirements by index: 0 = any run of 4, 1 = 1-4, 2 = 2-5, 3 = 3-6. */
function diceMatchRouteRequirement(diceValues: DieValue[], routeIndex: number): boolean {
  if (routeIndex === 0) return hasRunOf4(diceValues);
  if (routeIndex === 1) return hasRun1to4(diceValues);
  if (routeIndex === 2) return hasRun2to5(diceValues);
  if (routeIndex === 3) return hasRun3to6(diceValues);
  return false;
}

/** All routes this player can claim with current dice (any order; must match dice and be unclaimed). */
export function getClaimableRouteIds(
  dice: Die[],
  routesClaimed: Record<string, string>,
  playerId: string
): string[] {
  const values = getDiceValues(dice);
  return MASS_TRANSIT_ROUTE_IDS.filter((routeId, index) => {
    if (routesClaimed[routeId]) return false;
    return diceMatchRouteRequirement(values, index);
  });
}

export function hasRunOf5(diceValues: DieValue[]): boolean {
  if (diceValues.length < 5) return false;
  const sorted = [...diceValues].sort((a, b) => a - b);
  return (
    (sorted[0] === 1 &&
      sorted[1] === 2 &&
      sorted[2] === 3 &&
      sorted[3] === 4 &&
      sorted[4] === 5) ||
    (sorted[0] === 2 &&
      sorted[1] === 3 &&
      sorted[2] === 4 &&
      sorted[3] === 5 &&
      sorted[4] === 6)
  );
}

export function hasFiveMatching(diceValues: DieValue[]): boolean {
  if (diceValues.length !== 5) return false;
  const v = diceValues[0];
  return diceValues.every((d) => d === v);
}
