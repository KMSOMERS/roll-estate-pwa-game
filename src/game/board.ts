/**
 * Board layout: 8 neighborhoods. Rows 1–2: 2 rentals, 1 business. Rows 3–8: 3 rentals, 1 business.
 * Rows 1–6: die-face (Ones, Twos, … Sixes). Rows 7–8: Triple, Quadruple.
 * 2-player: first to complete a row gets the single business.
 */

import type { DieValue } from "./types";

export const ROW_IDS: string[] = [
  "row1",
  "row2",
  "row3",
  "row4",
  "row5",
  "row6",
  "row7",
  "row8",
];

export const ROW_DISPLAY_NAMES: Record<string, string> = {
  row1: "1",
  row2: "2",
  row3: "3",
  row4: "4",
  row5: "5",
  row6: "6",
  row7: "3x",
  row8: "4x",
};

/** Qualifier for rows 1–6: die face 1–6. Rows 7–8: 'triple' | 'quadruple'. */
export type RowQualifier = DieValue | "triple" | "quadruple";

export const ROW_QUALIFIER: Record<string, RowQualifier> = {
  row1: 1,
  row2: 2,
  row3: 3,
  row4: 4,
  row5: 5,
  row6: 6,
  row7: "triple",
  row8: "quadruple",
};

/** Number of rental slots: 2 for rows 1–2, 3 for rows 3–8. */
export function getRentalSlotCount(rowId: string): number {
  const i = ROW_IDS.indexOf(rowId);
  if (i < 0) return 0;
  return i < 2 ? 2 : 3;
}

/** Points per rental slot when filled (by row, then slot index). */
export const ROW_RENTAL_VALUES: Record<string, number[]> = {
  row1: [10, 10],
  row2: [20, 20],
  row3: [20, 20, 20],
  row4: [25, 25, 25],
  row5: [30, 30, 30],
  row6: [35, 35, 35],
  row7: [40, 40, 40],
  row8: [45, 45, 45],
};

export interface BusinessDef {
  id: string;
  rowId: string;
  income: number;
  order: 1;
}

/** One business per row (2-player: first to complete gets it). */
export const BUSINESS_DEFS: BusinessDef[] = [
  { id: "row1-b", rowId: "row1", income: 60, order: 1 },
  { id: "row2-b", rowId: "row2", income: 80, order: 1 },
  { id: "row3-b", rowId: "row3", income: 100, order: 1 },
  { id: "row4-b", rowId: "row4", income: 65, order: 1 },
  { id: "row5-b", rowId: "row5", income: 75, order: 1 },
  { id: "row6-b", rowId: "row6", income: 90, order: 1 },
  { id: "row7-b", rowId: "row7", income: 100, order: 1 },
  { id: "row8-b", rowId: "row8", income: 100, order: 1 },
];

export function getBusinessesForRow(rowId: string): BusinessDef[] {
  return BUSINESS_DEFS.filter((b) => b.rowId === rowId);
}
