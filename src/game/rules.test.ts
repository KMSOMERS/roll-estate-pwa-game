/**
 * Unit tests for game rules: rental value, claimable slots, endgame.
 */

import { describe, it, expect } from 'vitest';
import {
  getDiceValues,
  getRentalValueForRoll,
  canClaimRental,
  getClaimableRentalSlots,
  hasCompletedRow,
  countBusinessesClaimedBy,
  countRemainingRentalsForPlayer,
  checkEndgameTriggered,
  hasRunOf4,
  hasRunOf5,
  hasFiveMatching,
  getClaimableRouteIds,
} from './rules';
import type { Die, PlayerSheet } from './types';
import { ROW_IDS } from './board';
import { getRentalSlotCount } from './board';

function emptyRentals(): PlayerSheet['rentals'] {
  const r: Record<string, number[]> = {};
  for (const rowId of ROW_IDS) {
    r[rowId] = Array(getRentalSlotCount(rowId)).fill(0);
  }
  return r;
}

describe('rules', () => {
  describe('getDiceValues', () => {
    it('returns values from dice array', () => {
      const dice: Die[] = [
        { id: 'd1', value: 1, locked: false },
        { id: 'd2', value: 5, locked: true },
      ];
      expect(getDiceValues(dice)).toEqual([1, 5]);
    });
  });

  describe('getRentalValueForRoll', () => {
    it('row1 (Ones): sum of 1s', () => {
      expect(getRentalValueForRoll('row1', [1, 1, 2, 3, 4])).toBe(2);
      expect(getRentalValueForRoll('row1', [2, 3, 4, 5, 6])).toBe(0);
    });
    it('row5 (Fives): sum of 5s', () => {
      expect(getRentalValueForRoll('row5', [5, 5, 3, 6, 1])).toBe(10);
    });
    it('row7 (Triple): sum of 3+ matching', () => {
      expect(getRentalValueForRoll('row7', [3, 3, 3, 3, 6])).toBe(12);
      expect(getRentalValueForRoll('row7', [2, 2, 2, 4, 5])).toBe(6);
    });
    it('row8 (Quadruple): sum of 4 matching', () => {
      expect(getRentalValueForRoll('row8', [3, 3, 3, 3, 6])).toBe(12);
      expect(getRentalValueForRoll('row8', [2, 2, 2, 4, 5])).toBe(0);
    });
  });

  describe('canClaimRental and getClaimableRentalSlots', () => {
    it('can claim first slot in row1 with a 1', () => {
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals: emptyRentals(),
        purchasedAssets: [],
        lostInterestRows: [],
        rentalsCount: 0,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(canClaimRental(player, 'row1', 0, [1, 2, 3, 4, 5])).toBe(true);
      const slots = getClaimableRentalSlots(player, [1, 2, 3, 4, 5]);
      expect(slots.some((s) => s.rowId === 'row1' && s.slotIndex === 0)).toBe(true);
    });
    it('cannot claim if row lost interest', () => {
      const rentals = emptyRentals();
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals,
        purchasedAssets: [],
        lostInterestRows: ['row1'],
        rentalsCount: 0,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(canClaimRental(player, 'row1', 0, [1, 2, 3, 4, 5])).toBe(false);
    });
    it('value must fit left-to-right order', () => {
      const rentals = emptyRentals();
      rentals['row1'] = [2, 0];
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals,
        purchasedAssets: [],
        lostInterestRows: [],
        rentalsCount: 1,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(canClaimRental(player, 'row1', 1, [1, 1, 2, 3, 4])).toBe(false);
      expect(canClaimRental(player, 'row1', 1, [1, 1, 1, 2, 3])).toBe(true);
    });
  });

  describe('hasCompletedRow', () => {
    it('returns true when all slots in row filled', () => {
      const rentals = emptyRentals();
      rentals['row1'] = [1, 2];
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals,
        purchasedAssets: [],
        lostInterestRows: [],
        rentalsCount: 2,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(hasCompletedRow('row1', player)).toBe(true);
    });
    it('returns false when one slot empty', () => {
      const rentals = emptyRentals();
      rentals['row1'] = [1, 0];
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals,
        purchasedAssets: [],
        lostInterestRows: [],
        rentalsCount: 1,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(hasCompletedRow('row1', player)).toBe(false);
    });
  });

  describe('countBusinessesClaimedBy', () => {
    it('counts businesses claimed by player', () => {
      const claimed = { 'row1-b': 'P1', 'row2-b': 'P1', 'row3-b': 'P2' };
      expect(countBusinessesClaimedBy(claimed, 'P1')).toBe(2);
      expect(countBusinessesClaimedBy(claimed, 'P2')).toBe(1);
    });
  });

  describe('countRemainingRentalsForPlayer', () => {
    it('counts empty slots in non-lost rows', () => {
      const rentals = emptyRentals();
      rentals['row1'] = [1, 0];
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals,
        purchasedAssets: [],
        lostInterestRows: [],
        rentalsCount: 1,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(countRemainingRentalsForPlayer(player)).toBeGreaterThan(0);
    });
    it('excludes rows in lostInterestRows', () => {
      const rentals = emptyRentals();
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals,
        purchasedAssets: [],
        lostInterestRows: ['row1'],
        rentalsCount: 0,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      const total = ROW_IDS.reduce((acc, id) => acc + getRentalSlotCount(id), 0);
      expect(countRemainingRentalsForPlayer(player)).toBe(total - getRentalSlotCount('row1'));
    });
  });

  describe('checkEndgameTriggered', () => {
    it('returns true when a player has 4 businesses (2-player)', () => {
      const claimed = { 'row1-b': 'P1', 'row2-b': 'P1', 'row3-b': 'P1', 'row4-b': 'P1' };
      const players: PlayerSheet[] = [
        { playerId: 'P1', name: 'P1', rentals: emptyRentals(), purchasedAssets: [], lostInterestRows: [], rentalsCount: 0, massTransitCount: 0, liquidAssets: 0, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
      ];
      expect(checkEndgameTriggered(players, claimed)).toBe(true);
    });
    it('returns false when no end condition met', () => {
      const players: PlayerSheet[] = [
        { playerId: 'P1', name: 'P1', rentals: emptyRentals(), purchasedAssets: [], lostInterestRows: [], rentalsCount: 0, massTransitCount: 0, liquidAssets: 0, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
      ];
      expect(checkEndgameTriggered(players, {})).toBe(false);
    });
  });

  describe('hasRunOf4', () => {
    it('returns true for 1,2,3,4', () => {
      expect(hasRunOf4([1, 2, 3, 4, 5])).toBe(true);
    });
    it('returns false when no run of 4', () => {
      expect(hasRunOf4([1, 2, 4, 5, 6])).toBe(false);
    });
  });

  describe('hasRunOf5', () => {
    it('returns true for 1,2,3,4,5', () => {
      expect(hasRunOf5([1, 2, 3, 4, 5])).toBe(true);
    });
  });

  describe('hasFiveMatching', () => {
    it('returns true when all five match', () => {
      expect(hasFiveMatching([3, 3, 3, 3, 3])).toBe(true);
    });
  });

  describe('getClaimableRouteIds', () => {
    it('returns all routes whose requirement dice match (order does not matter)', () => {
      const dice: Die[] = [
        { id: 'd1', value: 1, locked: true },
        { id: 'd2', value: 2, locked: true },
        { id: 'd3', value: 3, locked: true },
        { id: 'd4', value: 4, locked: true },
        { id: 'd5', value: 5, locked: true },
      ];
      const claimable = getClaimableRouteIds(dice, {}, 'P1');
      expect(claimable).toContain('route-1');
      expect(claimable).toContain('route-2');
      expect(claimable).toContain('route-3');
      expect(claimable).not.toContain('route-4');
      expect(claimable).toHaveLength(3);
    });
    it('returns only unclaimed routes that match', () => {
      const dice: Die[] = [
        { id: 'd1', value: 1, locked: true },
        { id: 'd2', value: 2, locked: true },
        { id: 'd3', value: 3, locked: true },
        { id: 'd4', value: 4, locked: true },
        { id: 'd5', value: 5, locked: true },
      ];
      const claimable = getClaimableRouteIds(dice, { 'route-1': 'P1' }, 'P1');
      expect(claimable).toEqual(['route-2', 'route-3']);
    });
    it('returns route-4 when dice have 3-6 and route-4 is unclaimed', () => {
      const dice: Die[] = [
        { id: 'd1', value: 3, locked: true },
        { id: 'd2', value: 4, locked: true },
        { id: 'd3', value: 5, locked: true },
        { id: 'd4', value: 6, locked: true },
        { id: 'd5', value: 6, locked: true },
      ];
      const routesClaimed = { 'route-1': 'P1', 'route-2': 'P1', 'route-3': 'P1' };
      const claimable = getClaimableRouteIds(dice, routesClaimed, 'P1');
      expect(claimable).toEqual(['route-4']);
    });
    it('returns route-3 when dice have 2-5 but not 1-4 or 3-6', () => {
      const dice: Die[] = [
        { id: 'd1', value: 2, locked: true },
        { id: 'd2', value: 3, locked: true },
        { id: 'd3', value: 4, locked: true },
        { id: 'd4', value: 5, locked: true },
        { id: 'd5', value: 5, locked: true },
      ];
      const claimable = getClaimableRouteIds(dice, { 'route-1': 'P1' }, 'P1');
      expect(claimable).toEqual(['route-3']);
    });
  });
});
