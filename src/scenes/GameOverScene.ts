import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { GAME_HEIGHT, GAME_TITLE, GAME_WIDTH, SCENE_KEYS } from '../config/app';
import { HUD_FONT_FAMILY, PALETTE } from '../config/theme';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { formatScore, formatWave } from '../utils/format';
import type { GameOverData } from '../types/game';
import { showSceneActions } from '../ui/sceneActions';

export class GameOverScene extends Phaser.Scene {
  private readonly background = new BackgroundSystem(this);

  private restartQueued = false;

  private audioStatusText?: Phaser.GameObjects.Text;

  private result: GameOverData = {
    score: 0,
    highScore: 0,
    wave: 1,
    result: 'defeat',
  };

  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  init(data: Partial<GameOverData>): void {
    this.result = {
      score: data.score ?? 0,
      highScore: data.highScore ?? 0,
      wave: data.wave ?? 1,
      result: data.result ?? 'defeat',
      isNewHighScore: data.isNewHighScore ?? false,
    };
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, showSceneActions([
      ['Play again', () => this.restartGame()],
      ['Main menu', () => this.returnToTitle()],
    ]));
    this.restartQueued = false;
    this.background.create();
    getAudioManager().setMusicMode('game-over');

    const victory = this.result.result === 'victory';
    const accent = victory ? PALETTE.lime : PALETTE.red;
    const title = victory ? 'ALL WAVES CLEARED' : 'GAME OVER!';
    const subtitle = victory ? `${GAME_TITLE} COMPLETE` : 'DEFENSE GRID LOST';

    this.add
      .text(GAME_WIDTH * 0.5, 172, title, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '48px',
        color: accent,
        stroke: '#020711',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, accent, 20, false, true);

    this.add
      .text(GAME_WIDTH * 0.5, 228, subtitle, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '18px',
        color: PALETTE.slate,
      })
      .setOrigin(0.5);

    this.add
      .rectangle(GAME_WIDTH * 0.5, 338, 420, 198, 0xffffff, 0.06)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(accent).color, 0.4);

    this.add
      .text(GAME_WIDTH * 0.5, 286, `SCORE ${formatScore(this.result.score)}`, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '28px',
        color: PALETTE.white,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH * 0.5, 334, `HIGH SCORE ${formatScore(this.result.highScore)}`, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '22px',
        color: this.result.highScore > 0 ? PALETTE.amber : PALETTE.white,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH * 0.5, 374, `LAST WAVE ${formatWave(this.result.wave)}`, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '22px',
        color: PALETTE.white,
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH * 0.5,
        414,
        'PRESS R TO RESTART',
        {
          fontFamily: HUD_FONT_FAMILY,
          fontSize: '20px',
          color: PALETTE.magenta,
        },
      )
      .setOrigin(0.5)
      .setShadow(0, 0, PALETTE.magenta, 14, false, true);

    if (this.result.isNewHighScore) {
      this.add
        .text(GAME_WIDTH * 0.5, 442, 'NEW HIGH SCORE', {
          fontFamily: HUD_FONT_FAMILY,
          fontSize: '18px',
          color: PALETTE.amber,
        })
        .setOrigin(0.5)
        .setShadow(0, 0, PALETTE.amber, 12, false, true);
    }

    this.createActionButton(GAME_WIDTH * 0.5 - 116, 478, 180, 42, 'RESTART', PALETTE.magenta, () => {
      void this.restartGame();
    });
    this.createActionButton(GAME_WIDTH * 0.5 + 116, 478, 180, 42, 'TITLE', accent, () => {
      this.returnToTitle();
    });

    this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT - 104, 'PRESS R TO RESTART   //   ESC TITLE', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '16px',
        color: PALETTE.slate,
      })
      .setOrigin(0.5);

    this.audioStatusText = this.add
      .text(GAME_WIDTH * 0.5, GAME_HEIGHT - 74, '', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '16px',
        color: PALETTE.slate,
      })
      .setOrigin(0.5);
    this.updateAudioStatus();

    this.input.keyboard?.off('keydown-ENTER', this.restartGame, this);
    this.input.keyboard?.off('keydown-SPACE', this.restartGame, this);
    this.input.keyboard?.off('keydown-R', this.restartGame, this);
    this.input.keyboard?.off('keydown-ESC', this.returnToTitle, this);
    this.input.keyboard?.off('keydown-M', this.toggleMute, this);
    this.input.keyboard?.on('keydown-ENTER', this.restartGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.restartGame, this);
    this.input.keyboard?.on('keydown-R', this.restartGame, this);
    this.input.keyboard?.on('keydown-ESC', this.returnToTitle, this);
    this.input.keyboard?.on('keydown-M', this.toggleMute, this);
  }

  update(time: number, delta: number): void {
    this.background.update(time, delta);
  }

  private restartGame(): void {
    if (this.restartQueued) {
      return;
    }

    this.restartQueued = true;
    void getAudioManager().unlock();
    this.scene.start(SCENE_KEYS.GAME);
  }

  private returnToTitle(): void {
    if (this.restartQueued) {
      return;
    }

    this.restartQueued = true;
    this.scene.start(SCENE_KEYS.TITLE);
  }

  private toggleMute(): void {
    getAudioManager().toggleMute();
    this.updateAudioStatus();
  }

  private updateAudioStatus(): void {
    if (!this.audioStatusText) {
      return;
    }

    const muted = getAudioManager().isMuted();
    this.audioStatusText.setText(muted ? 'M AUDIO OFF' : 'M AUDIO ON');
    this.audioStatusText.setColor(muted ? PALETTE.red : PALETTE.cyan);
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    onClick: () => void,
  ): void {
    const fill = this.add
      .rectangle(x, y, width, height, Phaser.Display.Color.HexStringToColor(PALETTE.panel).color, 0.9)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.72)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '20px',
        color,
      })
      .setOrigin(0.5);

    const setAlpha = (alpha: number) => {
      fill.setAlpha(alpha);
      text.setAlpha(alpha);
    };

    fill.on('pointerover', () => setAlpha(1));
    fill.on('pointerout', () => setAlpha(0.92));
    fill.on('pointerdown', onClick);
    setAlpha(0.92);
  }
}
