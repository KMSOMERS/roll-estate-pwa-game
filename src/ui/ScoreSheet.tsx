import React from "react";
import type { GameState, SelectedOption } from "../game/types";
import {
  ROW_DISPLAY_NAMES,
  ROW_RENTAL_VALUES,
  getRentalSlotCount,
  getBusinessesForRow,
} from "../game/board";
import {
  MASS_TRANSIT_ROUTE_IDS,
  MASS_TRANSIT_ROUTE_NAMES,
} from "../game/assets";
import {
  getClaimableRentalSlots,
  getClaimableRouteIds,
  getDiceValues,
  getRentalValueForRoll,
  hasRunOf5,
  hasFiveMatching,
} from "../game/rules";
import { computePlayerTotal, stockDollars } from "../game/scoring";
import { DiceTray } from "./DiceTray";
import { ActionBar } from "./ActionBar";

function optionMatches(a: SelectedOption | null, b: SelectedOption): boolean {
  if (!a) return false;
  if (a.type !== b.type) return false;
  if (a.type === "rental" && b.type === "rental")
    return a.rowId === b.rowId && a.slotIndex === b.slotIndex;
  if (a.type === "route" && b.type === "route") return a.routeId === b.routeId;
  if (a.type === "lose_interest" && b.type === "lose_interest")
    return a.rowId === b.rowId;
  if (a.type === "liquid" && b.type === "liquid") return true;
  if (a.type === "index" && b.type === "index") return true;
  if (a.type === "lotto" && b.type === "lotto") return true;
  return false;
}

interface ScoreSheetProps {
  state: GameState;
  selectedOption: SelectedOption | null;
  onSelectOption: (option: SelectedOption) => void;
  onRollDice: () => void;
  onPlay: () => void;
  onToggleLock: (dieId: string) => void;
  isDiceRolling?: boolean;
}

export const PLAYER_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b"];

export function getPlayerColor(playerIndex: number): string {
  return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length] ?? "#64748b";
}

export const ScoreSheet: React.FC<ScoreSheetProps> = ({
  state,
  selectedOption,
  onSelectOption,
  onRollDice,
  onPlay,
  onToggleLock,
  isDiceRolling = false,
}) => {
  const currentPlayer = state.players[state.currentPlayerIndex]!;
  /* Options stay hidden until dice animation completes */
  const hasRolledOnce =
    (state.hasRolledThisTurn ?? false) && !isDiceRolling;
  const diceValues = getDiceValues(state.dice);
  const claimableSlots = getClaimableRentalSlots(currentPlayer, diceValues);
  const claimableKey = (rowId: string, slotIndex: number) =>
    claimableSlots.some((s) => s.rowId === rowId && s.slotIndex === slotIndex);
  const claimableRouteIds = getClaimableRouteIds(
    state.dice,
    state.routesClaimed,
    currentPlayer.playerId,
  );
  const liquidSum = diceValues.reduce((a, b) => a + b, 0);
  const hasRunOf5Now = hasRunOf5(diceValues);
  const hasFiveMatchingNow = hasFiveMatching(diceValues);
  const availableLiquid = currentPlayer.liquidAssets === 0;
  const availableIndex = hasRunOf5Now && currentPlayer.indexesClaimed < 2;
  const availableLotto = hasFiveMatchingNow && !currentPlayer.lottoClaimed;

  return (
    <section className="score-sheet" aria-label="Score sheet">
      <div className="score-sheet__paper">
        <div
          className="score-sheet__player-strip"
          aria-label="Players and scores"
        >
          {state.players.map((player, index) => {
            const isCurrentTurn = index === state.currentPlayerIndex;
            const score = computePlayerTotal(player);
            return (
              <React.Fragment key={player.playerId}>
                {index > 0 && (
                  <span
                    className="score-sheet__player-separator"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                )}
                <div
                  className={`score-sheet__player ${isCurrentTurn ? "score-sheet__player--active" : ""}`}
                  style={
                    {
                      "--player-color": getPlayerColor(index),
                    } as React.CSSProperties
                  }
                  aria-current={isCurrentTurn ? "true" : undefined}
                >
                  <span className="score-sheet__player-name">
                    {player.name}
                  </span>
                  <span className="score-sheet__player-score">${score}</span>
                  {isCurrentTurn && (
                    <span
                      className="score-sheet__player-turn-dot"
                      aria-label="Current turn"
                      title="Current turn"
                    >
                      •
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="score-sheet__rows">
          {[
            ["row1", "row2"],
            ["row3", "row4"],
            ["row5", "row6"],
            ["row7", "row8"],
          ].map((pair, pairIndex) => (
            <div key={pairIndex} className="score-sheet__row-combined">
              {pair.map((rowId) => (
                <div
                  key={rowId}
                  className={`score-sheet__neighborhood ${currentPlayer.lostInterestRows.includes(rowId) ? "score-sheet__row--lost" : ""}`}
                >
                  {(() => {
                    const lostInterest =
                      currentPlayer.lostInterestRows.includes(rowId);
                    const rowName = ROW_DISPLAY_NAMES[rowId] ?? rowId;
                    const slotCount = getRentalSlotCount(rowId);
                    const slots =
                      currentPlayer.rentals[rowId] ?? Array(slotCount).fill(0);
                    const businesses = getBusinessesForRow(rowId);
                    const canLoseInterest = hasRolledOnce && !lostInterest;
                    const isLoseInterestSelected =
                      selectedOption?.type === "lose_interest" &&
                      selectedOption.rowId === rowId;
                    return (
                      <>
                        <div className="score-sheet__row-head">
                          <span className="score-sheet__row-label">
                            {rowName}
                          </span>
                          {businesses[0] != null && (
                            <span
                              className={`score-sheet__row-business ${state.businessesClaimed[businesses[0].id] != null ? "score-sheet__row-business--claimed" : ""}`}
                              style={
                                state.businessesClaimed[businesses[0].id] !=
                                null
                                  ? ({
                                      "--player-color": getPlayerColor(
                                        state.players.findIndex(
                                          (p) =>
                                            p.playerId ===
                                            state.businessesClaimed[
                                              businesses[0].id
                                            ],
                                        ),
                                      ),
                                    } as React.CSSProperties)
                                  : undefined
                              }
                              title={
                                state.businessesClaimed[businesses[0].id] !=
                                null
                                  ? `Claimed · $${businesses[0].income}`
                                  : `$${businesses[0].income} (complete row to claim)`
                              }
                            >
                              ${businesses[0].income}
                              {state.businessesClaimed[businesses[0].id] !=
                                null && (
                                <span
                                  className="score-sheet__row-business-check"
                                  aria-label="Claimed"
                                >
                                  {" "}
                                  ✓
                                </span>
                              )}
                            </span>
                          )}
                          <button
                            type="button"
                            className={`score-sheet__lose-interest ${!canLoseInterest ? "score-sheet__lose-interest--placeholder" : ""} ${isLoseInterestSelected ? "score-sheet__lose-interest--selected" : ""}`}
                            onClick={() =>
                              canLoseInterest &&
                              onSelectOption({ type: "lose_interest", rowId })
                            }
                            aria-label={
                              canLoseInterest
                                ? `Lose interest in ${rowName}`
                                : undefined
                            }
                            aria-hidden={!canLoseInterest}
                            tabIndex={canLoseInterest ? undefined : -1}
                            disabled={!canLoseInterest}
                          >
                            <span className="score-sheet__lose-interest-text">
                              Lose
                            </span>
                          </button>
                        </div>
                        <div className="score-sheet__row-strip">
                          <div className="score-sheet__row-properties">
                            {Array.from(
                              { length: slotCount },
                              (_, slotIndex) => {
                                const value = slots[slotIndex] ?? 0;
                                const pointValue =
                                  ROW_RENTAL_VALUES[rowId]?.[slotIndex];
                                const isAvailable =
                                  hasRolledOnce &&
                                  claimableKey(rowId, slotIndex);
                                const writeValue = getRentalValueForRoll(
                                  rowId,
                                  diceValues,
                                );
                                const option: SelectedOption = {
                                  type: "rental",
                                  rowId,
                                  slotIndex,
                                };
                                const isSelected = optionMatches(
                                  selectedOption,
                                  option,
                                );
                                const slotContent =
                                  value > 0 ? (
                                    <>
                                      <span
                                        className="score-sheet__rental-value"
                                        aria-label={`Value ${value}`}
                                      >
                                        {value}
                                      </span>
                                      {pointValue != null && (
                                        <span className="score-sheet__rental-point-value">
                                          ${pointValue}
                                        </span>
                                      )}
                                    </>
                                  ) : isAvailable ? (
                                    <>
                                      <span className="score-sheet__rental-value">
                                        {writeValue}
                                      </span>
                                      {pointValue != null && (
                                        <span className="score-sheet__rental-point-value">
                                          ${pointValue}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="score-sheet__rental-empty">
                                        —
                                      </span>
                                      {pointValue != null && (
                                        <span className="score-sheet__rental-point-value">
                                          ${pointValue}
                                        </span>
                                      )}
                                    </>
                                  );
                                const slotClassName = `score-sheet__rental-slot ${
                                  value > 0
                                    ? "score-sheet__rental-slot--filled"
                                    : ""
                                } ${isAvailable ? "score-sheet__rental-slot--available" : ""} ${
                                  isSelected
                                    ? "score-sheet__rental-slot--selected"
                                    : ""
                                }`;
                                if (isAvailable) {
                                  return (
                                    <button
                                      key={slotIndex}
                                      type="button"
                                      className={slotClassName}
                                      onClick={() => onSelectOption(option)}
                                      aria-label={`Select rental, write ${writeValue}`}
                                    >
                                      {slotContent}
                                    </button>
                                  );
                                }
                                return (
                                  <div
                                    key={slotIndex}
                                    className={slotClassName}
                                  >
                                    {slotContent}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="score-sheet__mass-transit">
          <div className="score-sheet__mass-transit-header">
            <span className="score-sheet__mass-transit-label">
              Mass Transit
            </span>
            <span className="score-sheet__scoring-hint">
              Score: 1 = $50, 2 = $100, 3 = $175, 4 = $250
            </span>
          </div>
          <div className="score-sheet__mass-transit-routes">
            {MASS_TRANSIT_ROUTE_IDS.map((routeId) => {
              const claimedBy = state.routesClaimed[routeId];
              const isAvailable =
                hasRolledOnce && claimableRouteIds.includes(routeId);
              const option: SelectedOption = { type: "route", routeId };
              const isSelected = optionMatches(selectedOption, option);
              const playerIndex =
                claimedBy != null
                  ? state.players.findIndex((p) => p.playerId === claimedBy)
                  : -1;
              const playerColor =
                playerIndex >= 0 ? getPlayerColor(playerIndex) : undefined;
              const name = MASS_TRANSIT_ROUTE_NAMES[routeId] ?? routeId;
              return (
                <div
                  key={routeId}
                  className={`score-sheet__route ${
                    claimedBy != null ? "score-sheet__route--claimed" : ""
                  } ${isAvailable ? "score-sheet__route--available" : ""} ${
                    isSelected ? "score-sheet__route--selected" : ""
                  }`}
                  style={
                    playerColor
                      ? ({
                          "--player-color": playerColor,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {claimedBy != null ? (
                    <span
                      className="score-sheet__route-claimed"
                      aria-label={`${name} claimed`}
                    >
                      {name}
                    </span>
                  ) : isAvailable ? (
                    <button
                      type="button"
                      className="score-sheet__route-claim score-sheet__route-claim--cell"
                      onClick={() => onSelectOption(option)}
                      aria-label={`Select ${name}`}
                    >
                      {name}
                    </button>
                  ) : (
                    <span className="score-sheet__route-empty">{name}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="score-sheet__investments">
          <div className="score-sheet__stock">
            <div className="score-sheet__stock-header">
              <span className="score-sheet__invest-label">Stock Portfolio</span>
              <span className="score-sheet__scoring-hint">
                Score = Liquid × 1 / ×5 / ×10 per index
              </span>
            </div>
            <div className="score-sheet__stock-row">
              <span className="score-sheet__stock-total" aria-live="polite">
                $
                {stockDollars(
                  currentPlayer.liquidAssets,
                  currentPlayer.indexesClaimed,
                )}
              </span>
              <button
                type="button"
                className={`score-sheet__stock-cell score-sheet__stock-cell--liquid ${
                  currentPlayer.liquidAssets > 0
                    ? "score-sheet__stock-cell--filled"
                    : ""
                } ${
                  hasRolledOnce && availableLiquid
                    ? "score-sheet__stock-cell--available"
                    : ""
                } ${optionMatches(selectedOption, { type: "liquid" }) ? "score-sheet__stock-cell--selected" : ""}`}
                onClick={() =>
                  hasRolledOnce &&
                  availableLiquid &&
                  onSelectOption({ type: "liquid" })
                }
                disabled={
                  currentPlayer.liquidAssets > 0 ||
                  !hasRolledOnce ||
                  !availableLiquid
                }
                aria-label={
                  currentPlayer.liquidAssets > 0
                    ? `Liquid Chance: ${currentPlayer.liquidAssets}`
                    : hasRolledOnce && availableLiquid
                      ? `Select Liquid Chance (sum ${liquidSum})`
                      : "Liquid Chance (roll dice to claim)"
                }
              >
                {currentPlayer.liquidAssets > 0
                  ? `Liquid Chance: ${currentPlayer.liquidAssets}`
                  : hasRolledOnce && availableLiquid
                    ? liquidSum
                    : "Liquid Chance"}
              </button>
              <div className="score-sheet__stock-indexes">
                {[0, 1].map((i) =>
                  currentPlayer.indexesClaimed > i ? (
                    <div key={i} className="score-sheet__index-cell">
                      <span
                        className="score-sheet__index-claimed"
                        aria-label={`Index ${i + 1} claimed`}
                      >
                        ✓
                      </span>
                    </div>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      className={`score-sheet__index-cell ${
                        hasRolledOnce && availableIndex
                          ? "score-sheet__index-cell--available"
                          : ""
                      } ${optionMatches(selectedOption, { type: "index" }) ? "score-sheet__index-cell--selected" : ""}`}
                      onClick={() =>
                        hasRolledOnce &&
                        availableIndex &&
                        onSelectOption({ type: "index" })
                      }
                      disabled={!hasRolledOnce || !availableIndex}
                      aria-label={
                        hasRolledOnce && availableIndex
                          ? "Select Index (run of 5)"
                          : `Index ${i + 1} (run of 5 to claim)`
                      }
                    >
                      Index {i + 1}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
          <div
            className="score-sheet__lotto"
            style={
              optionMatches(selectedOption, { type: "lotto" })
                ? ({
                    "--player-color": getPlayerColor(state.currentPlayerIndex),
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span className="score-sheet__invest-label">Pick 5 Lotto</span>
            <button
              type="button"
              className={`score-sheet__claim-btn ${
                currentPlayer.lottoClaimed
                  ? "score-sheet__claim-btn--claimed"
                  : ""
              } ${
                hasRolledOnce && availableLotto
                  ? "score-sheet__claim-btn--available"
                  : ""
              } ${optionMatches(selectedOption, { type: "lotto" }) ? "score-sheet__claim-btn--selected" : ""}`}
              onClick={() =>
                hasRolledOnce &&
                availableLotto &&
                onSelectOption({ type: "lotto" })
              }
              disabled={
                currentPlayer.lottoClaimed || !hasRolledOnce || !availableLotto
              }
              aria-label={
                currentPlayer.lottoClaimed
                  ? "Pick 5 Lotto claimed"
                  : hasRolledOnce && availableLotto
                    ? "Select Pick 5 Lotto $150"
                    : "Pick 5 Lotto — 5 matching dice to claim $150"
              }
            >
              {currentPlayer.lottoClaimed ? "Claimed $150" : "Claim $150"}
            </button>
          </div>
        </div>

        {!state.isEnded && (
          <div
            className="score-sheet__dice-actions"
            aria-label="Dice and actions"
          >
            <DiceTray
              dice={state.dice}
              phase={state.phase}
              showValues={state.hasRolledThisTurn ?? false}
              isDiceRolling={isDiceRolling}
              onToggleLock={onToggleLock}
            />
            <ActionBar
              rerollsLeft={state.rerollsLeft}
              canRoll={state.phase === "rolling"}
              selectedOption={selectedOption}
              onRollDice={onRollDice}
              onPlay={onPlay}
            />
          </div>
        )}
      </div>
    </section>
  );
};
