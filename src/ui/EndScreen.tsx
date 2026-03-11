import React from "react";
import type { FinalScore, PlayerSheet } from "../game/types";
import { getPlayerColor } from "./ScoreSheet";

interface EndScreenProps {
  finalScores: FinalScore[];
  players: PlayerSheet[];
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  finalScores,
  players,
  onPlayAgain,
  onBackToSetup,
}) => {
  const winner = finalScores[0];
  const isTie =
    finalScores.length >= 2 && winner && finalScores[1] && winner.total === finalScores[1].total;

  const getColorForScore = (playerId: string) => {
    const index = players.findIndex((p) => p.playerId === playerId);
    return getPlayerColor(index >= 0 ? index : 0);
  };

  return (
    <div className="end-screen" role="dialog" aria-modal="true" aria-label="Game over">
      <div className="end-screen__backdrop" aria-hidden="true" />
      <div className="end-screen__card card">
        <h2 className="end-screen__title">Game over</h2>
        <p className="end-screen__subtitle">
          {isTie
            ? "It's a tie! Same total — tie-breakers: rentals, then routes, then stock."
            : winner
              ? `${winner.name} wins!`
              : "Most money wins."}
        </p>

        <div className="end-screen__scores">
          {finalScores.map((score) => (
            <div
              key={score.playerId}
              className={`end-screen__score-row ${score.rank === 1 && !isTie ? "end-screen__score-row--winner" : ""}`}
              style={{ "--player-color": getColorForScore(score.playerId) } as React.CSSProperties}
            >
              <span className="end-screen__score-rank">#{score.rank}</span>
              <span className="end-screen__score-name">{score.name}</span>
              <span className="end-screen__score-total">${score.total}</span>
              <span className="end-screen__score-detail">
                Rentals: {score.rentalsCount} · Routes: {score.massTransitCount} · Stock: $
                {score.stockValue}
              </span>
            </div>
          ))}
        </div>

        <div className="end-screen__actions">
          <button
            type="button"
            className="end-screen__btn end-screen__btn--primary button-primary"
            onClick={onPlayAgain}
          >
            Play again
          </button>
          <button
            type="button"
            className="end-screen__btn end-screen__btn--secondary"
            onClick={onBackToSetup}
          >
            Back to setup
          </button>
        </div>
      </div>
    </div>
  );
};
