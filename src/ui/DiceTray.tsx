import React from "react";
import type { Die } from "../game/types";

interface DiceTrayProps {
  dice: Die[];
  phase: "rolling" | "buying";
  /** When false, die values are hidden until the player has pressed Roll. */
  showValues?: boolean;
  onToggleLock: (dieId: string) => void;
}

export const DiceTray: React.FC<DiceTrayProps> = ({
  dice,
  phase,
  showValues = true,
  onToggleLock,
}) => {
  const canToggle = phase === "rolling";

  return (
    <section className="dice-tray" aria-label="Dice">
      <div className="dice-tray__top">
        <div
          className="dice-tray__dice"
          role="group"
          aria-label={showValues ? "Dice values" : "Dice (roll to reveal)"}
        >
          {dice.map((die) => (
            <button
              key={die.id}
              type="button"
              className={`dice-tray__die ${die.locked ? "dice-tray__die--locked" : ""} ${!showValues ? "dice-tray__die--hidden" : ""}`}
              aria-pressed={die.locked}
              aria-label={
                showValues
                  ? `Die ${die.value}, ${die.locked ? "locked" : "unlocked"}`
                  : "Die hidden, roll to reveal"
              }
              disabled={!canToggle}
              onClick={() => canToggle && onToggleLock(die.id)}
            >
              <span className="dice-tray__die-value" aria-hidden={!showValues}>
                {showValues ? die.value : "?"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
