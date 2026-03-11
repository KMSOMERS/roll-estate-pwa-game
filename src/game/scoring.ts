/**
 * Final scoring and tie-breaker logic.
 */

import type { FinalScore, PlayerSheet } from "./types";
import { ROW_IDS, ROW_RENTAL_VALUES, BUSINESS_DEFS } from "./board";

/** Mass Transit dollars by route count: 1=$50, 2=$100, 3=$175, 4=$250. */
export function massTransitDollars(routeCount: number): number {
  const table: Record<number, number> = { 1: 50, 2: 100, 3: 175, 4: 250 };
  return table[routeCount] ?? 0;
}

/** Stock portfolio dollars: liquid × multiplier (0 indexes → ×1, 1 → ×5, 2 → ×10). */
export function stockDollars(liquidAssets: number, indexesClaimed: number): number {
  const multiplier = indexesClaimed === 0 ? 1 : indexesClaimed === 1 ? 5 : 10;
  return liquidAssets * multiplier;
}

/** Sum of points from filled rental slots (fixed values per row/slot). */
function rentalIncome(player: PlayerSheet): number {
  let total = 0;
  const rentals = player.rentals ?? {};
  const values = ROW_RENTAL_VALUES ?? {};
  for (const rowId of ROW_IDS) {
    const slots = rentals[rowId];
    const points = values[rowId];
    if (!slots || !points) continue;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i]! > 0 && points[i] != null) total += points[i]!;
    }
  }
  return total;
}

/** Sum of business income from claimed business IDs. */
function businessIncome(player: PlayerSheet): number {
  let total = 0;
  for (const assetId of player.purchasedAssets) {
    const def = BUSINESS_DEFS.find((b) => b.id === assetId);
    if (def) total += def.income;
  }
  return total;
}

/** Compute total score: rentals + businesses + mass transit + stock + lotto. */
export function computePlayerTotal(playerSheet: PlayerSheet): number {
  let total = rentalIncome(playerSheet) + businessIncome(playerSheet);
  total += massTransitDollars(playerSheet.massTransitCount);
  total += stockDollars(playerSheet.liquidAssets, playerSheet.indexesClaimed);
  if (playerSheet.lottoClaimed) total += 150;
  return total;
}

/** Build final scores for all players. Tie-breakers: rentals count, mass transit, stock $ value. */
export function computeFinalScores(players: PlayerSheet[]): FinalScore[] {
  const withTotals = players.map((p) => {
    const stockVal = stockDollars(p.liquidAssets, p.indexesClaimed);
    return {
      player: p,
      total: computePlayerTotal(p),
      stockValue: stockVal,
    };
  });

  withTotals.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.player.rentalsCount !== a.player.rentalsCount)
      return b.player.rentalsCount - a.player.rentalsCount;
    if (b.player.massTransitCount !== a.player.massTransitCount)
      return b.player.massTransitCount - a.player.massTransitCount;
    return b.stockValue - a.stockValue;
  });

  return withTotals.map((item, index) => ({
    playerId: item.player.playerId,
    name: item.player.name,
    total: item.total,
    rentalsCount: item.player.rentalsCount,
    massTransitCount: item.player.massTransitCount,
    stockValue: item.stockValue,
    rank: index + 1,
  }));
}
