import React, { useEffect, useRef, useState } from "react";
import type { Die, DieValue } from "../game/types";

const DIE_VALUES: DieValue[] = [1, 2, 3, 4, 5, 6];
const ROLL_CYCLE_MS = 55;

function randomDieValue(): DieValue {
  return DIE_VALUES[Math.floor(Math.random() * DIE_VALUES.length)]!;
}

interface DiceTrayProps {
  dice: Die[];
  phase: "rolling" | "buying";
  /** When false, die values are hidden until the player has pressed Roll. */
  showValues?: boolean;
  /** When true, dice show the roll animation (e.g. after Roll is clicked). */
  isDiceRolling?: boolean;
  onToggleLock: (dieId: string) => void;
}

export const DiceTray: React.FC<DiceTrayProps> = ({
  dice,
  phase,
  showValues = true,
  isDiceRolling = false,
  onToggleLock,
}) => {
  const canToggle = phase === "rolling" && !isDiceRolling;
  const [rollingDisplay, setRollingDisplay] = useState<DieValue[] | null>(null);
  const diceRef = useRef(dice);
  diceRef.current = dice;

  useEffect(() => {
    if (!isDiceRolling) {
      setRollingDisplay(null);
      return;
    }
    const current = diceRef.current;
    const initial = current.map((d) => (d.locked ? d.value : randomDieValue()));
    setRollingDisplay(initial);
    const id = setInterval(() => {
      setRollingDisplay((prev) => {
        const d = diceRef.current;
        if (!prev || prev.length !== d.length) return prev;
        return d.map((die, i) => (die.locked ? d[i]!.value : randomDieValue()));
      });
    }, ROLL_CYCLE_MS);
    return () => clearInterval(id);
  }, [isDiceRolling, dice.length]);

  const displayValues =
    isDiceRolling && rollingDisplay != null && rollingDisplay.length === dice.length
      ? rollingDisplay
      : null;

  return (
    <section className="dice-tray" aria-label="Dice">
      <div className="dice-tray__top">
        <div
          className="dice-tray__dice"
          role="group"
          aria-label={showValues ? "Dice values" : "Dice (roll to reveal)"}
        >
          {dice.map((die, i) => {
            const value =
              displayValues != null ? displayValues[i]! : die.value;
            const showRolling = isDiceRolling && !die.locked;
            return (
              <button
                key={die.id}
                type="button"
                className={`dice-tray__die ${die.locked ? "dice-tray__die--locked" : ""} ${!showValues ? "dice-tray__die--hidden" : ""} ${showRolling ? "dice-tray__die--rolling" : ""}`}
                aria-pressed={die.locked}
                aria-label={
                  showValues
                    ? `Die ${value}, ${die.locked ? "locked" : "unlocked"}`
                    : "Die hidden, roll to reveal"
                }
                disabled={!canToggle}
                onClick={() => canToggle && onToggleLock(die.id)}
              >
                <span className="dice-tray__die-value" aria-hidden={!showValues}>
                  {showValues ? value : "?"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
