/**
 * Unit tests for dice rolling and reroll limits.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createDie,
  createInitialDice,
  rollUnlockedDice,
  cloneDice,
  MAX_REROLLS,
} from './dice';
import type { Die } from './types';

describe('dice', () => {
  describe('createDie', () => {
    it('creates a die with given id and random value when value omitted', () => {
      const d = createDie('d1');
      expect(d.id).toBe('d1');
      expect(d.value).toBeGreaterThanOrEqual(1);
      expect(d.value).toBeLessThanOrEqual(6);
      expect(d.locked).toBe(false);
    });

    it('creates a die with given value when provided', () => {
      const d = createDie('d1', 4);
      expect(d.value).toBe(4);
      expect(d.locked).toBe(false);
    });
  });

  describe('createInitialDice', () => {
    it('returns exactly 5 dice with ids d1..d5', () => {
      const dice = createInitialDice();
      expect(dice).toHaveLength(5);
      expect(dice.map((d) => d.id)).toEqual(['d1', 'd2', 'd3', 'd4', 'd5']);
    });
  });

  describe('rollUnlockedDice', () => {
    it('re-rolls only unlocked dice using provided roll function', () => {
      const rollFn = vi.fn().mockReturnValue(3);
      const dice: Die[] = [
        { id: 'd1', value: 1, locked: false },
        { id: 'd2', value: 2, locked: true },
      ];
      rollUnlockedDice(dice, rollFn);
      expect(dice[0]!.value).toBe(3);
      expect(dice[1]!.value).toBe(2);
      expect(rollFn).toHaveBeenCalledTimes(1);
    });

    it('does not change locked dice', () => {
      const dice: Die[] = [
        { id: 'd1', value: 5, locked: true },
        { id: 'd2', value: 1, locked: false },
      ];
      const rollFn = vi.fn().mockReturnValue(6);
      rollUnlockedDice(dice, rollFn);
      expect(dice[0]!.value).toBe(5);
      expect(dice[1]!.value).toBe(6);
    });
  });

  describe('cloneDice', () => {
    it('returns a new array with copied die objects', () => {
      const dice: Die[] = [
        { id: 'd1', value: 1, locked: true },
        { id: 'd2', value: 2, locked: false },
      ];
      const cloned = cloneDice(dice);
      expect(cloned).not.toBe(dice);
      expect(cloned).toHaveLength(2);
      expect(cloned[0]).toEqual(dice[0]);
      expect(cloned[1]).toEqual(dice[1]);
    });
  });

  describe('MAX_REROLLS', () => {
    it('is 3', () => {
      expect(MAX_REROLLS).toBe(3);
    });
  });
});
