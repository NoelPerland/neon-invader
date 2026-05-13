import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { TEXTURES } from '../assets/assetKeys';
import { GAME_TITLE, GAME_WIDTH, SCENE_KEYS } from '../config/app';
import { HUD_FONT_FAMILY, PALETTE } from '../config/theme';
import { BackgroundSystem } from '../systems/BackgroundSystem';

export class TitleScene extends Phaser.Scene {
  private readonly background = new BackgroundSystem(this);

  private starting = false;

  private audioStatusText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.TITLE);
  }

  create(): void {
    this.starting = false;
    this.background.create();
    getAudioManager().setMusicMode('title');

    this.add
      .text(GAME_WIDTH * 0.5, 126, GAME_TITLE, {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '54px',
        color: PALETTE.cyan,
        stroke: '#020711',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, PALETTE.cyan, 28, false, true);

    this.add
      .text(GAME_WIDTH * 0.5, 178, 'NEON ARCADE DEFENSE // 5-WAVE RUN', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '18px',
        color: PALETTE.slate,
      })
      .setOrigin(0.5);

    const ship = this.add.image(GAME_WIDTH * 0.5, 250, TEXTURES.player).setScale(2.2).setDepth(5);
    this.tweens.add({
      targets: ship,
      y: ship.y - 12,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    const enemyY = 328;
    const enemyTextures = [TEXTURES.enemyTop, TEXTURES.enemyMid, TEXTURES.enemyBottom];
    enemyTextures.forEach((texture, index) => {
      const sprite = this.add.image(360 + index * 120, enemyY, texture).setScale(1.85).setDepth(5);
      this.tweens.add({
        targets: sprite,
        angle: index % 2 === 0 ? 4 : -4,
        duration: 1000 + index * 110,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    });

    this.add
      .text(GAME_WIDTH * 0.5, 412, 'ARROWS TO MOVE  //  HOLD SPACE TO FIRE', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '22px',
        color: PALETTE.white,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH * 0.5, 450, 'ROUND POWER-UPS HELP  //  RED SHOTS HURT', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '16px',
        color: PALETTE.slate,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH * 0.5, 478, 'RAPID FIRE  //  DOUBLE SHOT  //  SHIELD', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '14px',
        color: PALETTE.white,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH * 0.5, 504, 'PRESS M TO TOGGLE AUDIO', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '14px',
        color: PALETTE.slate,
      })
      .setOrigin(0.5);

    this.audioStatusText = this.add
      .text(GAME_WIDTH * 0.5, 526, '', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '14px',
        color: PALETTE.slate,
      })
      .setOrigin(0.5);
    this.updateAudioStatus();

    const prompt = this.add
      .text(GAME_WIDTH * 0.5, 596, 'PRESS SPACE OR ENTER', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '22px',
        color: PALETTE.magenta,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, PALETTE.magenta, 18, false, true);

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.createActionButton(GAME_WIDTH * 0.5, 558, 260, 44, 'START RUN', PALETTE.magenta, () => {
      void this.startGame();
    });

    this.input.keyboard?.off('keydown-SPACE', this.startGame, this);
    this.input.keyboard?.off('keydown-ENTER', this.startGame, this);
    this.input.keyboard?.off('keydown-M', this.toggleMute, this);
    this.input.keyboard?.on('keydown-SPACE', this.startGame, this);
    this.input.keyboard?.on('keydown-ENTER', this.startGame, this);
    this.input.keyboard?.on('keydown-M', this.toggleMute, this);
  }

  update(time: number, delta: number): void {
    this.background.update(time, delta);
  }

  private async startGame(): Promise<void> {
    if (this.starting) {
      return;
    }

    this.starting = true;
    await getAudioManager().unlock();
    this.scene.start(SCENE_KEYS.GAME);
  }

  private toggleMute(): void {
    getAudioManager().toggleMute();
    this.updateAudioStatus();
  }

  private updateAudioStatus(): void {
    if (!this.audioStatusText) {
      return;
    }

    const audioManager = getAudioManager();
    const muted = audioManager.isMuted();
    const contextState = audioManager.getDebugAudioState().contextState;
    const waitingForInput = contextState !== 'running';
    this.audioStatusText.setText(
      muted ? 'AUDIO OFF' : waitingForInput ? 'AUDIO STARTS ON PLAY' : 'AUDIO ON',
    );
    this.audioStatusText.setColor(muted ? PALETTE.red : waitingForInput ? PALETTE.slate : PALETTE.cyan);
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
