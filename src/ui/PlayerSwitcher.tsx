import React from "react";
import type { PlayerSheet } from "../game/types";
import { computePlayerTotal } from "../game/scoring";

interface PlayerSwitcherProps {
  players: PlayerSheet[];
  currentPlayerIndex: number;
  showPassOverlay: boolean;
  onDismissPassOverlay: () => void;
  /** When false, only the pass overlay is rendered (banner is shown elsewhere, e.g. in score sheet). */
  showBanner?: boolean;
}

export const PlayerSwitcher: React.FC<PlayerSwitcherProps> = ({
  players,
  currentPlayerIndex,
  showPassOverlay,
  onDismissPassOverlay,
  showBanner = true,
}) => {
  const currentPlayer = players[currentPlayerIndex]!;

  return (
    <>
      {showBanner && (
        <section className="player-switcher" aria-label="Players and scores">
          <div className="player-switcher__banner">
            {players.map((player, index) => {
              const isCurrentTurn = index === currentPlayerIndex;
              const score = computePlayerTotal(player);
              return (
                <React.Fragment key={player.playerId}>
                  {index > 0 && <span className="player-switcher__separator" aria-hidden="true">·</span>}
                  <div
                    className={`player-switcher__player ${isCurrentTurn ? "player-switcher__player--active" : ""}`}
                    aria-current={isCurrentTurn ? "true" : undefined}
                  >
                    <span className="player-switcher__player-name">{player.name}</span>
                    <span className="player-switcher__player-score">${score}</span>
                    {isCurrentTurn && (
                      <span className="player-switcher__turn-dot" aria-label="Current turn" title="Current turn">
                        •
                      </span>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </section>
      )}

      {showPassOverlay && (
        <div
          className="player-switcher__overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pass-overlay-title"
        >
          <div className="player-switcher__overlay-content card">
            <h2 id="pass-overlay-title" className="player-switcher__overlay-title">
              Your turn, {currentPlayer.name}
            </h2>
            <p className="player-switcher__overlay-text">
              Pass the device to this player, then tap Continue when ready.
            </p>
            <button
              type="button"
              className="player-switcher__overlay-button"
              onClick={onDismissPassOverlay}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};
