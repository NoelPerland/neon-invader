import Phaser from 'phaser';

import { GAME_WIDTH } from '../config/app';
import { POWER_UP_SETTINGS } from '../config/balance';
import { HUD_FONT_FAMILY, PALETTE, POWER_UP_COLORS } from '../config/theme';
import { formatLives, formatPowerUpStatus, formatScore, formatWave } from '../utils/format';
import type { SessionState } from '../types/game';

export class Hud {
  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly livesText: Phaser.GameObjects.Text;

  private readonly waveText: Phaser.GameObjects.Text;

  private readonly audioText: Phaser.GameObjects.Text;

  private readonly powerText: Phaser.GameObjects.Text;

  private readonly powerPanel: Phaser.GameObjects.Rectangle;

  private readonly powerFill: Phaser.GameObjects.Rectangle;

  private readonly powerGlow: Phaser.GameObjects.Rectangle;

  private readonly hintText: Phaser.GameObjects.Text;

  private readonly bannerText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add
      .rectangle(GAME_WIDTH * 0.5, 38, 888, 64, 0xffffff, 0.08)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(PALETTE.cyan).color, 0.35)
      .setDepth(20);

    scene.add
      .rectangle(GAME_WIDTH * 0.5, 14, 888, 2, Phaser.Display.Color.HexStringToColor(PALETTE.cyan).color, 0.24)
      .setDepth(20);

    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: HUD_FONT_FAMILY,
      fontSize: '18px',
      color: PALETTE.white,
    };

    this.scoreText = scene.add.text(52, 14, '', labelStyle).setDepth(21);
    this.livesText = scene.add.text(254, 14, '', labelStyle).setDepth(21);
    this.waveText = scene.add.text(402, 14, '', labelStyle).setDepth(21);
    this.audioText = scene.add
      .text(814, 14, '', {
        ...labelStyle,
        fontSize: '16px',
      })
      .setOrigin(1, 0)
      .setDepth(21);

    this.powerPanel = scene.add
      .rectangle(166, 46, 246, 24, Phaser.Display.Color.HexStringToColor(PALETTE.panel).color, 0.88)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(PALETTE.grid).color, 0.8)
      .setDepth(20)
      .setOrigin(0, 0.5);

    this.powerFill = scene.add
      .rectangle(170, 46, 0, 14, Phaser.Display.Color.HexStringToColor(PALETTE.cyan).color, 0.95)
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setVisible(false);

    this.powerGlow = scene.add
      .rectangle(170, 46, 0, 18, Phaser.Display.Color.HexStringToColor(PALETTE.cyan).color, 0.24)
      .setOrigin(0, 0.5)
      .setDepth(19)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.add
      .text(54, 36, 'POWER', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '16px',
        color: PALETTE.slate,
      })
      .setDepth(21);

    this.powerText = scene.add
      .text(182, 36, '', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '16px',
        color: PALETTE.white,
        stroke: '#020711',
        strokeThickness: 3,
      })
      .setDepth(21);

    this.hintText = scene.add
      .text(GAME_WIDTH * 0.5, 620, 'ARROWS MOVE   //   SPACE FIRE   //   R RESTART', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '14px',
        color: PALETTE.white,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0.84);

    this.bannerText = scene.add
      .text(GAME_WIDTH * 0.5, 96, '', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '22px',
        color: PALETTE.cyan,
        stroke: '#020711',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(22);
  }

  update(state: SessionState, now: number, muted: boolean): void {
    this.scoreText.setText(`SCORE ${formatScore(state.score)}`);
    this.livesText.setText(`LIVES ${formatLives(state.lives)}`);
    this.waveText.setText(`WAVE ${formatWave(state.wave)}`);
    this.powerText.setText(formatPowerUpStatus(state.activePowerUp, state.powerUpExpiresAt, now));
    this.powerText.setColor(state.activePowerUp ? PALETTE.white : PALETTE.slate);
    this.powerPanel.setStrokeStyle(
      1,
      Phaser.Display.Color.HexStringToColor(
        state.activePowerUp ? POWER_UP_COLORS[state.activePowerUp] : PALETTE.grid,
      ).color,
      state.activePowerUp ? 0.95 : 0.8,
    );
    this.audioText.setText(muted ? 'M AUDIO OFF' : 'M AUDIO ON');
    this.audioText.setColor(muted ? PALETTE.red : PALETTE.slate);

    const powerActive = Boolean(state.activePowerUp);
    this.powerFill.setVisible(powerActive);
    this.powerGlow.setVisible(powerActive);

    if (!powerActive || !state.activePowerUp) {
      this.powerFill.setSize(0, 14);
      this.powerGlow.setSize(0, 18);
      this.hintText.setAlpha(0.84);
      return;
    }

    const maxWidth = 238;
    const fillRatio =
      state.activePowerUp === 'shield' || state.powerUpExpiresAt === null
        ? 1
        : Phaser.Math.Clamp((state.powerUpExpiresAt - now) / POWER_UP_SETTINGS.durationMs, 0, 1);
    const fillWidth = Math.max(8, Math.round(maxWidth * fillRatio));
    const fillColor = Phaser.Display.Color.HexStringToColor(POWER_UP_COLORS[state.activePowerUp]).color;
    this.powerFill.setSize(fillWidth, 14);
    this.powerGlow.setSize(fillWidth + 4, 18);
    this.powerFill.setFillStyle(fillColor, 0.72);
    this.powerGlow.setFillStyle(fillColor, 0.18);
    this.hintText.setAlpha(0.92);
  }

  showBanner(scene: Phaser.Scene, message: string, color: string): void {
    this.bannerText.setText(message);
    this.bannerText.setColor(color);
    this.bannerText.setAlpha(1);
    scene.tweens.killTweensOf(this.bannerText);
    scene.tweens.add({
      targets: this.bannerText,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      delay: 500,
    });
  }
}
