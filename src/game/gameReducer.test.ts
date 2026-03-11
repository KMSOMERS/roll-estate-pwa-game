/**
 * Unit tests for game state reducer: turn phases, rerolls, buy, endgame.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gameReducer } from './gameReducer';
import { createInitialState } from './initialState';
import * as random from './random';

describe('gameReducer', () => {
  const twoPlayers = [
    { name: 'Alice' },
    { name: 'Bob' },
  ];

  beforeEach(() => {
    vi.spyOn(random, 'randomDieValue').mockReturnValue(3);
  });

  it('ROLL_DICE only in rolling phase and decrements rerollsLeft', () => {
    const state = createInitialState(twoPlayers);
    expect(state.phase).toBe('rolling');
    expect(state.rerollsLeft).toBe(3);

    const next = gameReducer(state, { type: 'ROLL_DICE' });
    expect(next.rerollsLeft).toBe(2);
    expect(next.phase).toBe('rolling');
  });

  it('TOGGLE_DIE_LOCK only in rolling phase', () => {
    const state = createInitialState(twoPlayers);
    const next = gameReducer(state, { type: 'TOGGLE_DIE_LOCK', dieId: 'd1' });
    expect(next.dice[0]!.locked).toBe(true);
    const next2 = gameReducer(next, { type: 'TOGGLE_DIE_LOCK', dieId: 'd1' });
    expect(next2.dice[0]!.locked).toBe(false);
  });

  it('CONFIRM_ROLL_DONE switches to buying phase', () => {
    const state = createInitialState(twoPlayers);
    const next = gameReducer(state, { type: 'CONFIRM_ROLL_DONE' });
    expect(next.phase).toBe('buying');
  });

  it('CLAIM_RENTAL writes value and updates player rentals', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';
    state.dice = [
      { id: 'd1', value: 1, locked: true },
      { id: 'd2', value: 2, locked: true },
      { id: 'd3', value: 3, locked: true },
      { id: 'd4', value: 4, locked: true },
      { id: 'd5', value: 5, locked: true },
    ];

    const next = gameReducer(state, { type: 'CLAIM_RENTAL', rowId: 'row1', slotIndex: 0 });
    expect(next.players[0]!.rentals['row1']![0]).toBe(1);
    expect(next.players[0]!.rentalsCount).toBe(1);
  });

  it('END_TURN advances to next player and resets dice and rerolls', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';

    const next = gameReducer(state, { type: 'END_TURN' });
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.phase).toBe('rolling');
    expect(next.rerollsLeft).toBe(3);
    expect(next.dice).toHaveLength(5);
  });

  it('END_TURN wraps to player 0 after last player (2 players)', () => {
    const state = createInitialState(twoPlayers);
    state.currentPlayerIndex = 1;
    state.phase = 'buying';

    const next = gameReducer(state, { type: 'END_TURN' });
    expect(next.currentPlayerIndex).toBe(0);
  });

  it('LOSE_INTEREST adds row to lostInterestRows', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';

    const next = gameReducer(state, { type: 'LOSE_INTEREST', rowId: 'row1' });
    expect(next.players[next.currentPlayerIndex]!.lostInterestRows).toContain('row1');
  });

  it('no-op when game is ended', () => {
    const state = createInitialState(twoPlayers);
    state.isEnded = true;
    state.finalScores = [];

    const next = gameReducer(state, { type: 'ROLL_DICE' });
    expect(next).toBe(state);
  });

  it('RESET_TURN resets dice and phase to rolling', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';
    state.rerollsLeft = 0;

    const next = gameReducer(state, { type: 'RESET_TURN' });
    expect(next.phase).toBe('rolling');
    expect(next.rerollsLeft).toBe(3);
    expect(next.dice).toHaveLength(5);
  });

  it('CLAIM_ROUTE updates routesClaimed and player massTransitCount', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';
    state.dice = [
      { id: 'd1', value: 1, locked: true },
      { id: 'd2', value: 2, locked: true },
      { id: 'd3', value: 3, locked: true },
      { id: 'd4', value: 4, locked: true },
      { id: 'd5', value: 5, locked: true },
    ];
    const next = gameReducer(state, { type: 'CLAIM_ROUTE', routeId: 'route-1' });
    expect(next.routesClaimed['route-1']).toBe(state.players[0]!.playerId);
    expect(next.players[0]!.massTransitCount).toBe(1);
  });

  it('CLAIM_LIQUID sets player liquidAssets to dice sum', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';
    state.dice = [
      { id: 'd1', value: 1, locked: true },
      { id: 'd2', value: 2, locked: true },
      { id: 'd3', value: 3, locked: true },
      { id: 'd4', value: 4, locked: true },
      { id: 'd5', value: 5, locked: true },
    ];
    const next = gameReducer(state, { type: 'CLAIM_LIQUID' });
    expect(next.players[0]!.liquidAssets).toBe(15);
  });

  it('CLAIM_INDEX increments indexesClaimed when run of 5', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';
    state.dice = [
      { id: 'd1', value: 1, locked: true },
      { id: 'd2', value: 2, locked: true },
      { id: 'd3', value: 3, locked: true },
      { id: 'd4', value: 4, locked: true },
      { id: 'd5', value: 5, locked: true },
    ];
    const next = gameReducer(state, { type: 'CLAIM_INDEX' });
    expect(next.players[0]!.indexesClaimed).toBe(1);
  });

  it('CLAIM_LOTTO sets lottoClaimed true when five matching', () => {
    const state = createInitialState(twoPlayers);
    state.phase = 'buying';
    state.dice = [
      { id: 'd1', value: 4, locked: true },
      { id: 'd2', value: 4, locked: true },
      { id: 'd3', value: 4, locked: true },
      { id: 'd4', value: 4, locked: true },
      { id: 'd5', value: 4, locked: true },
    ];
    const next = gameReducer(state, { type: 'CLAIM_LOTTO' });
    expect(next.players[0]!.lottoClaimed).toBe(true);
  });
});
