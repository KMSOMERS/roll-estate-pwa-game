import React, { useReducer, useState, useCallback } from "react";
import { gameReducer } from "../game/gameReducer";
import { createInitialState } from "../game/initialState";
import type { PlayerConfig, SelectedOption } from "../game/types";
import { ScoreSheet } from "./ScoreSheet";
import { PlayerSwitcher } from "./PlayerSwitcher";

interface GameScreenProps {
  playerConfigs: PlayerConfig[];
  onBackToSetup: () => void;
}

function optionMatches(a: SelectedOption | null, b: SelectedOption): boolean {
  if (!a) return false;
  if (a.type !== b.type) return false;
  if (a.type === "rental" && b.type === "rental")
    return a.rowId === b.rowId && a.slotIndex === b.slotIndex;
  if (a.type === "route" && b.type === "route") return a.routeId === b.routeId;
  if (a.type === "lose_interest" && b.type === "lose_interest") return a.rowId === b.rowId;
  if (a.type === "liquid" && b.type === "liquid") return true;
  if (a.type === "index" && b.type === "index") return true;
  if (a.type === "lotto" && b.type === "lotto") return true;
  return false;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  playerConfigs,
  onBackToSetup,
}) => {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialState(playerConfigs)
  );
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(null);

  const handleRollDice = useCallback(() => {
    setSelectedOption(null);
    dispatch({ type: "ROLL_DICE" });
  }, []);

  const handlePlay = useCallback(() => {
    if (!selectedOption) return;
    switch (selectedOption.type) {
      case "rental":
        dispatch({ type: "CLAIM_RENTAL", rowId: selectedOption.rowId, slotIndex: selectedOption.slotIndex });
        break;
      case "route":
        dispatch({ type: "CLAIM_ROUTE", routeId: selectedOption.routeId });
        break;
      case "liquid":
        dispatch({ type: "CLAIM_LIQUID" });
        break;
      case "index":
        dispatch({ type: "CLAIM_INDEX" });
        break;
      case "lotto":
        dispatch({ type: "CLAIM_LOTTO" });
        break;
      case "lose_interest":
        dispatch({ type: "LOSE_INTEREST", rowId: selectedOption.rowId });
        break;
    }
    setSelectedOption(null);
    dispatch({ type: "END_TURN" });
  }, [selectedOption]);

  const handleSelectOption = useCallback((option: SelectedOption) => {
    setSelectedOption((prev) => (optionMatches(prev, option) ? null : option));
  }, []);

  return (
    <div className="game-screen">
      <PlayerSwitcher
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        showPassOverlay={false}
        onDismissPassOverlay={() => {}}
        showBanner={false}
      />

      <ScoreSheet
        state={state}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
        onRollDice={handleRollDice}
        onPlay={handlePlay}
        onToggleLock={(dieId) => dispatch({ type: "TOGGLE_DIE_LOCK", dieId })}
      />

      {state.isEnded && state.finalScores && (
        <section className="game-screen__summary card" aria-label="Game over">
          <h2 className="game-screen__summary-title">Game over</h2>
          <p className="game-screen__summary-desc">
            Most money wins. Ties: most rentals, then mass transit routes, then stock portfolio value.
          </p>
          <ol className="game-screen__summary-list">
            {state.finalScores.map((score) => (
              <li key={score.playerId} className="game-screen__summary-item">
                <span className="game-screen__summary-rank">#{score.rank}</span>
                <span className="game-screen__summary-name">{score.name}</span>
                <span className="game-screen__summary-total">${score.total}</span>
                <span className="game-screen__summary-tiebreakers">
                  Rentals: {score.rentalsCount} · Routes: {score.massTransitCount} · Stock: ${score.stockValue}
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="game-screen__summary-again button-primary"
            onClick={onBackToSetup}
          >
            Play again
          </button>
        </section>
      )}
    </div>
  );
};
