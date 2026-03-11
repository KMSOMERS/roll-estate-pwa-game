/**
 * Core Roll Estate data structures (pure TypeScript, no UI).
 */

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface Die {
  value: DieValue;
  locked: boolean;
  id: string;
}

/** Per-player rentals: rowId -> array of written values (0 = empty slot). Length 2 for row1–2, 3 for row3–8. */
export type RentalsByRow = Record<string, number[]>;

export interface PlayerSheet {
  playerId: string;
  name: string;
  /** Written values in rental slots per row. Values must increase left to right. */
  rentals: RentalsByRow;
  /** Business IDs this player has claimed (for scoring). */
  purchasedAssets: string[];
  lostInterestRows: string[];
  /** Number of rental slots filled (for tie-breaker). */
  rentalsCount: number;
  massTransitCount: number;
  liquidAssets: number;
  indexesClaimed: number;
  stockValue: number;
  lottoClaimed: boolean;
}

export type GamePhase = "rolling" | "buying";

export interface GameState {
  players: PlayerSheet[];
  currentPlayerIndex: number;
  dice: Die[];
  rerollsLeft: number;
  /** True after the player has clicked Roll at least once this turn (used to show available options). */
  hasRolledThisTurn: boolean;
  phase: GamePhase;
  /** businessId -> playerId (businesses are unique per game). */
  businessesClaimed: Record<string, string>;
  routesClaimed: Record<string, string>;
  isEnded: boolean;
  finalScores?: FinalScore[];
}

export interface FinalScore {
  playerId: string;
  name: string;
  total: number;
  rentalsCount: number;
  massTransitCount: number;
  stockValue: number;
  rank: number;
}

/** Actions for the game state reducer. */
export type GameAction =
  | { type: "ROLL_DICE" }
  | { type: "TOGGLE_DIE_LOCK"; dieId: string }
  | { type: "CONFIRM_ROLL_DONE" }
  | { type: "CLAIM_RENTAL"; rowId: string; slotIndex: number }
  | { type: "CLAIM_ROUTE"; routeId: string }
  | { type: "CLAIM_LIQUID" }
  | { type: "CLAIM_INDEX" }
  | { type: "CLAIM_LOTTO" }
  | { type: "LOSE_INTEREST"; rowId: string }
  | { type: "END_TURN" }
  | { type: "RESET_TURN" }
  | { type: "RESET_GAME"; playerConfigs: PlayerConfig[] };

/** Player config for setup (name only; id generated). */
export interface PlayerConfig {
  name: string;
}

/** UI selection for "Play" (chosen option before committing). */
export type SelectedOption =
  | { type: "rental"; rowId: string; slotIndex: number }
  | { type: "route"; routeId: string }
  | { type: "liquid" }
  | { type: "index" }
  | { type: "lotto" }
  | { type: "lose_interest"; rowId: string };
