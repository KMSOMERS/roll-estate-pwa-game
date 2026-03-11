/**
 * Mass Transit: 4 routes in sequence. A sequence of 4 dice (from your 5).
 * Route 1: Any run of 4 (1–4, 2–5, or 3–6)
 * Route 2: 1–4
 * Route 3: 2–5
 * Route 4: 3–6
 * Scoring: 1 = 50, 2 = 100, 3 = 175, 4 = 250.
 */

export const MASS_TRANSIT_ROUTE_IDS: string[] = [
  "route-1",
  "route-2",
  "route-3",
  "route-4",
];

export const MASS_TRANSIT_ROUTE_NAMES: Record<string, string> = {
  "route-1": "Any",
  "route-2": "1–4",
  "route-3": "2–5",
  "route-4": "3–6",
};
