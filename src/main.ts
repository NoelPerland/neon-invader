import Phaser from 'phaser';

import './style.css';
import { getAudioManager } from './audio/AudioManager';
import { DOM_IDS, GAME_TITLE } from './config/app';
import { createGameConfig } from './config/phaser';
import { SCENE_KEYS } from './config/app';

document.querySelector<HTMLDivElement>(`#${DOM_IDS.APP}`)!.innerHTML = `
  <main class="shell">
    <div class="shell__header">
      <p class="shell__kicker">Browser Arcade</p>
      <h1>${GAME_TITLE}</h1>
      <p class="shell__copy">Neon-lit wave defense built with Phaser 3, TypeScript, and Vite.</p>
    </div>
    <section class="frame">
      <div id="${DOM_IDS.ROOT}" class="game-root" aria-label="${GAME_TITLE} game canvas"></div>
    </section>
    <div class="scene-actions" hidden aria-label="Game actions"></div>
    <div class="touch-controls" hidden aria-label="Touch game controls">
      <button type="button" data-input="left" aria-label="Move left">◀</button>
      <button type="button" data-input="right" aria-label="Move right">▶</button>
      <button type="button" data-input="fire" aria-label="Hold to fire">FIRE</button>
    </div>
    <p class="shell__footer">Arrow keys or buttons move. Hold Space or FIRE to shoot. Defeat five waves to win.</p>
  </main>
`;

const game = new Phaser.Game(createGameConfig(DOM_IDS.ROOT));

if (import.meta.env.DEV) {
  const debugWindow = window as Window & {
    __NEON_INVADER_DEBUG__?: {
      getActiveSceneKey: () => string | null;
      getSnapshot: () => Record<string, unknown>;
      clearCurrentWave: () => void;
      finishRun: (result: 'victory' | 'defeat') => void;
      applyPowerUp: (type: 'rapid-fire' | 'double-shot' | 'shield') => void;
      collectLowestPowerUp: () => boolean;
      spawnSidePickupHazard: (type?: 'rapid-fire' | 'double-shot' | 'shield') => boolean;
      triggerPlayerHit: () => void;
      toggleMute: () => boolean;
    };
  };

  debugWindow.__NEON_INVADER_DEBUG__ = {
    getActiveSceneKey: () => game.scene.getScenes(true)[0]?.scene.key ?? null,
    getSnapshot: () => {
      const activeScene = game.scene.getScenes(true)[0];
      const gameScene = game.scene.getScene(SCENE_KEYS.GAME) as Record<string, any> | undefined;
      const gameActive = Boolean(gameScene?.scene?.isActive?.());

      return {
        activeSceneKey: activeScene?.scene.key ?? null,
        sceneTexts:
          activeScene?.children?.list
            ?.filter?.((child: unknown) => child instanceof Phaser.GameObjects.Text)
            ?.map?.((child) => (child as Phaser.GameObjects.Text).text)
            ?.filter?.((value: string) => Boolean(value))
            ?.slice?.(0, 24) ?? [],
        sceneTextMetrics:
          activeScene?.children?.list
            ?.filter?.((child: unknown) => child instanceof Phaser.GameObjects.Text)
            ?.map?.((child) => {
              const text = child as Phaser.GameObjects.Text;
              return {
                text: text.text,
                x: text.x,
                y: text.y,
                width: text.width,
                height: text.height,
                originX: text.originX,
                originY: text.originY,
              };
            })
            ?.filter?.((item: { text: string }) => Boolean(item.text))
            ?.slice?.(0, 24) ?? [],
        muted: getAudioManager().isMuted(),
        game: gameActive
          ? (() => {
              const activePowerUps =
                gameScene?.powerUps
                  ?.getChildren?.()
                  ?.filter?.((child: { active?: boolean }) => child?.active) as Array<
                  { x?: number; y?: number; type?: string }
                >;
              const lowestPowerUp =
                activePowerUps?.reduce?.((lowest, current) => {
                  if (!lowest || (current.y ?? -Infinity) > (lowest.y ?? -Infinity)) {
                    return current;
                  }

                  return lowest;
                }, null as { x?: number; y?: number; type?: string } | null) ?? null;

              return {
              score: gameScene?.sessionState?.score ?? null,
              highScore: gameScene?.sessionState?.highScore ?? null,
              lives: gameScene?.sessionState?.lives ?? null,
              wave: gameScene?.sessionState?.wave ?? null,
              activePowerUp: gameScene?.sessionState?.activePowerUp ?? null,
              transitioning: gameScene?.transitioning ?? null,
              ending: gameScene?.ending ?? null,
              playerX: gameScene?.player?.x ?? null,
              playerY: gameScene?.player?.y ?? null,
              activeEnemyCount: gameScene?.formation?.countLiving?.() ?? 0,
              activePlayerBullets: gameScene?.playerBullets?.countActive?.(true) ?? 0,
              activeEnemyBullets: gameScene?.enemyBullets?.countActive?.(true) ?? 0,
              activePowerUps: activePowerUps?.length ?? 0,
              firstPowerUp: (() => {
                const activePowerUp = activePowerUps?.[0];

                return activePowerUp
                  ? {
                      x: activePowerUp.x ?? null,
                      y: activePowerUp.y ?? null,
                      type: activePowerUp.type ?? null,
                    }
                  : null;
              })(),
              lowestPowerUp: lowestPowerUp
                ? {
                    x: lowestPowerUp.x ?? null,
                    y: lowestPowerUp.y ?? null,
                    type: lowestPowerUp.type ?? null,
                  }
                : null,
            };
            })()
          : null,
        audio: getAudioManager().getDebugAudioState(),
      };
    },
    clearCurrentWave: () => {
      const gameScene = game.scene.getScene(SCENE_KEYS.GAME) as Record<string, any> | undefined;
      if (!gameScene?.scene?.isActive?.() || gameScene.transitioning || !gameScene.enemyGroup) {
        return;
      }

      gameScene.enemyGroup.children.each((child: unknown) => {
        const enemy = child as { active?: boolean; destroyEnemy?: () => void };
        if (enemy.active) {
          enemy.destroyEnemy?.();
        }
        return true;
      });
      gameScene.handleWaveCleared?.();
    },
    finishRun: (result) => {
      const gameScene = game.scene.getScene(SCENE_KEYS.GAME) as Record<string, any> | undefined;
      if (!gameScene?.scene?.isActive?.()) {
        return;
      }

      gameScene.finishRun?.(result);
    },
    applyPowerUp: (type) => {
      const gameScene = game.scene.getScene(SCENE_KEYS.GAME) as Record<string, any> | undefined;
      if (!gameScene?.scene?.isActive?.()) {
        return;
      }

      gameScene.applyPowerUp?.(type);
    },
    collectLowestPowerUp: () => {
      const gameScene = game.scene.getScene(SCENE_KEYS.GAME) as Record<string, any> | undefined;
      if (!gameScene?.scene?.isActive?.()) {
        return false;
      }

      const powerUps = gameScene.powerUps
        ?.getChildren?.()
        ?.filter?.((child: { active?: boolean }) => child?.active) as Array<Record<string, unknown>> | undefined;
      if (!powerUps?.length) {
        return false;
      }

      const target = powerUps.reduce((lowest, current) =>
        (current.y as number) > (lowest.y as number) ? current : lowest,
      );
      gameScene.handlePowerUpCollected?.(target, gameScene.player);
      return true;
    },
    spawnSidePickupHazard: (type = 'shield') => {
      const gameScene = game.scene.getScene(SCENE_KEYS.GAME) as Record<string, any> | undefined;
      if (!gameScene?.scene?.isActive?.()) {
        return false;
      }

      return gameScene.debugSpawnSidePickupHazard?.(type) ?? false;
    },
    triggerPlayerHit: () => {
      const gameScene = game.scene.getScene(SCENE_KEYS.GAME) as Record<string, any> | undefined;
      if (!gameScene?.scene?.isActive?.()) {
        return;
      }

      const enemyBullet = gameScene.enemyBullets?.get?.(gameScene.player?.x, gameScene.player?.y) as
        | { fire?: (...args: unknown[]) => void }
        | undefined;
      enemyBullet?.fire?.(gameScene.player?.x, gameScene.player?.y, 0, 0, 'enemy');
      gameScene.handleEnemyBulletHitsPlayer?.(enemyBullet, gameScene.player);
    },
    toggleMute: () => getAudioManager().toggleMute(),
  };
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
