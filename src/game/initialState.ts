/**
 * Create initial game state for a new game.
 */

import type { GameState, PlayerConfig } from "./types";
import { ROW_IDS, getRentalSlotCount } from "./board";
import { createInitialDice, MAX_REROLLS } from "./dice";

let playerIdCounter = 0;
function nextPlayerId(): string {
  return `player-${++playerIdCounter}`;
}

function createInitialRentals(): GameState["players"][0]["rentals"] {
  const rentals: Record<string, number[]> = {};
  for (const rowId of ROW_IDS) {
    rentals[rowId] = Array(getRentalSlotCount(rowId)).fill(0);
  }
  return rentals;
}

function cloneRentals(
  rentals: GameState["players"][0]["rentals"],
): GameState["players"][0]["rentals"] {
  const out: Record<string, number[]> = {};
  for (const [rowId, arr] of Object.entries(rentals)) {
    out[rowId] = [...arr];
  }
  return out;
}

export function createInitialState(playerConfigs: PlayerConfig[]): GameState {
  const templateRentals = createInitialRentals();
  const players = playerConfigs.map((config) => ({
    playerId: nextPlayerId(),
    name: config.name,
    rentals: cloneRentals(templateRentals),
    purchasedAssets: [],
    lostInterestRows: [],
    rentalsCount: 0,
    massTransitCount: 0,
    liquidAssets: 0,
    indexesClaimed: 0,
    stockValue: 0,
    lottoClaimed: false,
  }));

  return {
    players,
    currentPlayerIndex: 0,
    dice: createInitialDice(),
    rerollsLeft: MAX_REROLLS,
    hasRolledThisTurn: false,
    phase: "rolling",
    businessesClaimed: {},
    routesClaimed: {},
    isEnded: false,
  };
}
