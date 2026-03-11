import React, { useState, useCallback } from 'react';
import type { PlayerConfig } from '../game/types';
import { SetupScreen } from './SetupScreen';
import { GameScreen } from './GameScreen';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'setup' | 'game'>('setup');
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[] | null>(null);

  const handleStartGame = useCallback((configs: PlayerConfig[]) => {
    setPlayerConfigs(configs);
    setScreen('game');
  }, []);

  const handleBackToSetup = useCallback(() => {
    setScreen('setup');
    setPlayerConfigs(null);
  }, []);

  return (
    <div className="app-root">
      <main className="app-main">
        {screen === 'setup' && (
          <SetupScreen onStartGame={handleStartGame} />
        )}
        {screen === 'game' && playerConfigs && (
          <GameScreen
            playerConfigs={playerConfigs}
            onBackToSetup={handleBackToSetup}
          />
        )}
      </main>
    </div>
  );
};

