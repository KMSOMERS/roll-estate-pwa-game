/**
 * Game state reducer: turn phases and state transitions.
 */

import type { GameAction, GameState } from "./types";
import { cloneDice, createInitialDice, rollUnlockedDice, MAX_REROLLS } from "./dice";
import {
  getDiceValues,
  getRentalValueForRoll,
  canClaimRental,
  hasCompletedRow,
  getNextBusinessForRow,
  checkEndgameTriggered,
  getClaimableRouteIds,
  hasRunOf5,
  hasFiveMatching,
  currentPlayerHasNoClaimOptions,
} from "./rules";
import { getRentalSlotCount } from "./board";
import { computeFinalScores } from "./scoring";
import { createInitialState } from "./initialState";

function getCurrentPlayer(state: GameState) {
  return state.players[state.currentPlayerIndex]!;
}

function immutableUpdatePlayer(
  players: GameState["players"],
  playerIndex: number,
  update: (p: GameState["players"][number]) => GameState["players"][number]
) {
  return players.map((p, i) => (i === playerIndex ? update(p) : p));
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.isEnded && action.type !== "RESET_GAME") return state;

  switch (action.type) {
    case "ROLL_DICE": {
      if (state.phase !== "rolling") return state;
      if (state.rerollsLeft === 0) return state;
      const dice = cloneDice(state.dice);
      rollUnlockedDice(dice);
      const rerollsLeft = Math.max(0, state.rerollsLeft - 1);
      return { ...state, dice, rerollsLeft, hasRolledThisTurn: true };
    }

    case "TOGGLE_DIE_LOCK": {
      if (state.phase !== "rolling") return state;
      const dice = cloneDice(state.dice).map((d) =>
        d.id === action.dieId ? { ...d, locked: !d.locked } : d
      );
      return { ...state, dice };
    }

    case "CONFIRM_ROLL_DONE": {
      if (state.phase !== "rolling") return state;
      if (currentPlayerHasNoClaimOptions(state)) {
        const finalScores = computeFinalScores(state.players);
        return { ...state, phase: "buying", isEnded: true, finalScores };
      }
      return { ...state, phase: "buying" };
    }

    case "CLAIM_RENTAL": {
      const player = getCurrentPlayer(state);
      const diceValues = getDiceValues(state.dice);
      if (!canClaimRental(player, action.rowId, action.slotIndex, diceValues)) {
        return state;
      }
      const value = getRentalValueForRoll(action.rowId, diceValues);
      const slots = player.rentals[action.rowId] ?? Array(getRentalSlotCount(action.rowId)).fill(0);
      const newSlots = [...slots];
      newSlots[action.slotIndex] = value;
      const newRentals = { ...player.rentals, [action.rowId]: newSlots };
      const rentalsCount = player.rentalsCount + 1;

      let players = immutableUpdatePlayer(state.players, state.currentPlayerIndex, (p) => ({
        ...p,
        rentals: newRentals,
        rentalsCount,
      }));

      let businessesClaimed = { ...state.businessesClaimed };
      const updatedPlayer = players[state.currentPlayerIndex]!;
      if (hasCompletedRow(action.rowId, updatedPlayer)) {
        const nextBiz = getNextBusinessForRow(action.rowId, businessesClaimed);
        if (nextBiz) {
          businessesClaimed = { ...businessesClaimed, [nextBiz.id]: updatedPlayer.playerId };
          players = immutableUpdatePlayer(players, state.currentPlayerIndex, (p) => ({
            ...p,
            purchasedAssets: [...p.purchasedAssets, nextBiz.id],
          }));
        }
      }

      const isEnded = checkEndgameTriggered(players, businessesClaimed);
      const finalScores = isEnded ? computeFinalScores(players) : undefined;
      return {
        ...state,
        players,
        businessesClaimed,
        isEnded,
        finalScores,
      };
    }

    case "CLAIM_ROUTE": {
      const player = getCurrentPlayer(state);
      const claimable = getClaimableRouteIds(state.dice, state.routesClaimed, player.playerId);
      if (!claimable.includes(action.routeId)) return state;
      const routesClaimed = { ...state.routesClaimed, [action.routeId]: player.playerId };
      const players = immutableUpdatePlayer(state.players, state.currentPlayerIndex, (p) => ({
        ...p,
        massTransitCount: p.massTransitCount + 1,
      }));
      const isEnded = checkEndgameTriggered(players, state.businessesClaimed);
      const finalScores = isEnded ? computeFinalScores(players) : undefined;
      return {
        ...state,
        routesClaimed,
        players,
        isEnded,
        finalScores,
      };
    }

    case "CLAIM_LIQUID": {
      const player = getCurrentPlayer(state);
      if (player.liquidAssets > 0) return state;
      const sum = getDiceValues(state.dice).reduce((a, b) => a + b, 0);
      const players = immutableUpdatePlayer(state.players, state.currentPlayerIndex, (p) => ({
        ...p,
        liquidAssets: sum,
      }));
      const isEnded = checkEndgameTriggered(players, state.businessesClaimed);
      const finalScores = isEnded ? computeFinalScores(players) : undefined;
      return { ...state, players, isEnded, finalScores };
    }

    case "CLAIM_INDEX": {
      const player = getCurrentPlayer(state);
      if (player.indexesClaimed >= 2) return state;
      if (!hasRunOf5(getDiceValues(state.dice))) return state;
      const players = immutableUpdatePlayer(state.players, state.currentPlayerIndex, (p) => ({
        ...p,
        indexesClaimed: p.indexesClaimed + 1,
      }));
      const isEnded = checkEndgameTriggered(players, state.businessesClaimed);
      const finalScores = isEnded ? computeFinalScores(players) : undefined;
      return { ...state, players, isEnded, finalScores };
    }

    case "CLAIM_LOTTO": {
      const player = getCurrentPlayer(state);
      if (player.lottoClaimed) return state;
      if (!hasFiveMatching(getDiceValues(state.dice))) return state;
      const players = immutableUpdatePlayer(state.players, state.currentPlayerIndex, (p) => ({
        ...p,
        lottoClaimed: true,
      }));
      const isEnded = checkEndgameTriggered(players, state.businessesClaimed);
      const finalScores = isEnded ? computeFinalScores(players) : undefined;
      return { ...state, players, isEnded, finalScores };
    }

    case "LOSE_INTEREST": {
      const player = getCurrentPlayer(state);
      if (player.lostInterestRows.includes(action.rowId)) return state;
      const players = immutableUpdatePlayer(state.players, state.currentPlayerIndex, (p) => ({
        ...p,
        lostInterestRows: [...p.lostInterestRows, action.rowId],
      }));
      const isEnded = checkEndgameTriggered(players, state.businessesClaimed);
      const finalScores = isEnded ? computeFinalScores(players) : undefined;
      return {
        ...state,
        players,
        isEnded,
        finalScores,
      };
    }

    case "END_TURN": {
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      const dice = createInitialDice();
      return {
        ...state,
        currentPlayerIndex: nextIndex,
        dice,
        rerollsLeft: MAX_REROLLS,
        hasRolledThisTurn: false,
        phase: "rolling",
      };
    }

    case "RESET_TURN": {
      return {
        ...state,
        dice: createInitialDice(),
        rerollsLeft: MAX_REROLLS,
        hasRolledThisTurn: false,
        phase: "rolling",
      };
    }

    case "RESET_GAME": {
      return createInitialState(action.playerConfigs);
    }

    default:
      return state;
  }
}
