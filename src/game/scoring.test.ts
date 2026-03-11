/**
 * Unit tests for final scoring and tie-breakers.
 */

import { describe, it, expect } from 'vitest';
import { massTransitDollars, stockDollars, computePlayerTotal, computeFinalScores } from './scoring';
import type { PlayerSheet } from './types';
import { ROW_IDS, getRentalSlotCount } from './board';

function emptyRentals(): PlayerSheet['rentals'] {
  const r: Record<string, number[]> = {};
  for (const rowId of ROW_IDS) {
    r[rowId] = Array(getRentalSlotCount(rowId)).fill(0);
  }
  return r;
}

describe('scoring', () => {
  describe('massTransitDollars', () => {
    it('returns 50, 100, 175, 250 for 1–4 routes', () => {
      expect(massTransitDollars(1)).toBe(50);
      expect(massTransitDollars(2)).toBe(100);
      expect(massTransitDollars(3)).toBe(175);
      expect(massTransitDollars(4)).toBe(250);
    });
    it('returns 0 for 0 routes', () => {
      expect(massTransitDollars(0)).toBe(0);
    });
  });

  describe('stockDollars', () => {
    it('multiplies liquid by 1, 5, or 10 for 0, 1, 2 indexes', () => {
      expect(stockDollars(10, 0)).toBe(10);
      expect(stockDollars(10, 1)).toBe(50);
      expect(stockDollars(10, 2)).toBe(100);
    });
  });

  describe('computePlayerTotal', () => {
    it('sums rental income (fixed points per slot), mass transit, stock dollars, and lotto', () => {
      const rentals = emptyRentals();
      rentals['row1'] = [2, 3]; // both slots filled -> 10 + 10 = 20 points
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals,
        purchasedAssets: [],
        lostInterestRows: [],
        rentalsCount: 2,
        massTransitCount: 0,
        liquidAssets: 5,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(computePlayerTotal(player)).toBe(20 + 5);
    });

    it('adds 150 when lottoClaimed', () => {
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
        lottoClaimed: true,
      };
      expect(computePlayerTotal(player)).toBe(150);
    });

    it('includes business income from purchasedAssets', () => {
      const player: PlayerSheet = {
        playerId: 'P1',
        name: 'P1',
        rentals: emptyRentals(),
        purchasedAssets: ['row1-b'],
        lostInterestRows: [],
        rentalsCount: 0,
        massTransitCount: 0,
        liquidAssets: 0,
        indexesClaimed: 0,
        stockValue: 0,
        lottoClaimed: false,
      };
      expect(computePlayerTotal(player)).toBe(60);
    });
  });

  describe('computeFinalScores', () => {
    it('orders players by total descending', () => {
      const r1 = emptyRentals();
      r1['row1'] = [10, 10]; // both slots -> 20
      const r2 = emptyRentals();
      r2['row1'] = [5, 0]; // one slot -> 10
      const players: PlayerSheet[] = [
        { playerId: 'P1', name: 'Alice', rentals: r2, purchasedAssets: [], lostInterestRows: [], rentalsCount: 1, massTransitCount: 0, liquidAssets: 0, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
        { playerId: 'P2', name: 'Bob', rentals: r1, purchasedAssets: [], lostInterestRows: [], rentalsCount: 2, massTransitCount: 0, liquidAssets: 0, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
      ];
      const scores = computeFinalScores(players);
      expect(scores[0]!.rank).toBe(1);
      expect(scores[0]!.name).toBe('Bob');
      expect(scores[0]!.total).toBe(20);
      expect(scores[1]!.name).toBe('Alice');
      expect(scores[1]!.total).toBe(10);
    });

    it('breaks ties by rentalsCount (higher first)', () => {
      const r1 = emptyRentals();
      r1['row1'] = [1, 1]; // both slots -> 20 points, count 2
      const r2 = emptyRentals();
      r2['row2'] = [2, 0]; // one slot -> 20 points, count 1
      const players: PlayerSheet[] = [
        { playerId: 'P1', name: 'HighRentals', rentals: r1, purchasedAssets: [], lostInterestRows: [], rentalsCount: 2, massTransitCount: 0, liquidAssets: 0, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
        { playerId: 'P2', name: 'LowRentals', rentals: r2, purchasedAssets: [], lostInterestRows: [], rentalsCount: 1, massTransitCount: 0, liquidAssets: 0, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
      ];
      const scores = computeFinalScores(players);
      expect(scores[0]!.name).toBe('HighRentals');
      expect(scores[0]!.rentalsCount).toBe(2);
    });

    it('breaks ties by massTransitCount then stockValue when total and rentals equal', () => {
      const r1 = emptyRentals();
      r1['row1'] = [10, 0]; // 10 points
      const r2 = emptyRentals();
      r2['row1'] = [10, 0]; // 10 points
      const players: PlayerSheet[] = [
        { playerId: 'P1', name: 'HighTransit', rentals: r1, purchasedAssets: [], lostInterestRows: [], rentalsCount: 1, massTransitCount: 2, liquidAssets: 0, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
        { playerId: 'P2', name: 'HighStock', rentals: r2, purchasedAssets: [], lostInterestRows: [], rentalsCount: 1, massTransitCount: 1, liquidAssets: 50, indexesClaimed: 0, stockValue: 0, lottoClaimed: false },
      ];
      const scores = computeFinalScores(players);
      expect(scores[0]!.massTransitCount).toBe(2);
      expect(scores[1]!.massTransitCount).toBe(1);
    });
  });
});
