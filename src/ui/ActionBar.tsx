import React from "react";

export interface ActionBarProps {
  rerollsLeft: number;
  canRoll: boolean;
  selectedOption: unknown;
  onRollDice: () => void;
  onPlay: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  rerollsLeft,
  canRoll,
  selectedOption,
  onRollDice,
  onPlay,
}) => {
  const hasSelection = selectedOption != null;
  const rollsRemaining = rerollsLeft > 0;

  return (
    <div className="action-bar" aria-label="Actions">
      <button
        type="button"
        className="action-bar__btn action-bar__btn--primary"
        onClick={onRollDice}
        disabled={!canRoll || !rollsRemaining}
        aria-label={
          rollsRemaining ? `Roll dice (${rerollsLeft} left)` : "No rolls left"
        }
      >
        Roll {rerollsLeft}
      </button>
      <button
        type="button"
        className="action-bar__btn action-bar__btn--secondary"
        onClick={onPlay}
        disabled={!hasSelection}
        aria-label={
          hasSelection ? "Play selected option" : "Select an option first"
        }
      >
        Play
      </button>
    </div>
  );
};
