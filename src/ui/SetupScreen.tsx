import React, { useState, useCallback } from "react";
import type { PlayerConfig } from "../game/types";

interface SetupScreenProps {
  onStartGame: (playerConfigs: PlayerConfig[]) => void;
}

const DEFAULT_NAME_1 = "Player 1";
const DEFAULT_NAME_2 = "Player 2";

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onStartGame([
        { name: name1.trim() || DEFAULT_NAME_1 },
        { name: name2.trim() || DEFAULT_NAME_2 },
      ]);
    },
    [name1, name2]
  );

  return (
    <div className="setup-screen">
      <form
        className="setup-screen__form card"
        onSubmit={handleSubmit}
        aria-label="Player setup"
      >
        <h2 className="setup-screen__title">2-Player Pass &amp; Play</h2>
        <p className="setup-screen__subtitle">
          Enter names, then pass the device between turns.
        </p>

        <div className="setup-screen__fields">
          <label className="setup-screen__label" htmlFor="player1-name">
            Player 1
          </label>
          <input
            id="player1-name"
            type="text"
            className="setup-screen__input"
            placeholder={DEFAULT_NAME_1}
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            autoComplete="off"
            maxLength={24}
            aria-describedby="player1-desc"
          />
          <span id="player1-desc" className="setup-screen__hint">
            Optional; defaults to &quot;Player 1&quot;
          </span>

          <label className="setup-screen__label" htmlFor="player2-name">
            Player 2
          </label>
          <input
            id="player2-name"
            type="text"
            className="setup-screen__input"
            placeholder={DEFAULT_NAME_2}
            value={name2}
            onChange={(e) => setName2(e.target.value)}
            autoComplete="off"
            maxLength={24}
            aria-describedby="player2-desc"
          />
          <span id="player2-desc" className="setup-screen__hint">
            Optional; defaults to &quot;Player 2&quot;
          </span>
        </div>

        <button type="submit" className="setup-screen__submit button-primary">
          Start game
        </button>
      </form>
    </div>
  );
};
