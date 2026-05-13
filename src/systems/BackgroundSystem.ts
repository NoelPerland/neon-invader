import Phaser from 'phaser';

import { TEXTURES } from '../assets/assetKeys';
import { ENEMY_LAYOUT } from '../config/balance';
import { PALETTE } from '../config/theme';

export class BackgroundSystem {
  private readonly scene: Phaser.Scene;

  private starfield?: Phaser.GameObjects.TileSprite;

  private scanlines?: Phaser.GameObjects.TileSprite;

  private accentLine?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const { width, height } = this.scene.scale;
    const graphics = this.scene.add.graphics().setDepth(-20);

    graphics.fillGradientStyle(
      Phaser.Display.Color.HexStringToColor(PALETTE.ink).color,
      Phaser.Display.Color.HexStringToColor(PALETTE.inkAlt).color,
      Phaser.Display.Color.HexStringToColor('#05050d').color,
      Phaser.Display.Color.HexStringToColor(PALETTE.ink).color,
      1,
    );
    graphics.fillRect(0, 0, width, height);

    this.starfield = this.scene.add
      .tileSprite(width * 0.5, height * 0.5, width, height, TEXTURES.starfield)
      .setDepth(-18)
      .setAlpha(0.82);

    this.scanlines = this.scene.add
      .tileSprite(width * 0.5, height * 0.5, width, height, TEXTURES.scanlines)
      .setDepth(40)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0.18);

    const grid = this.scene.add.graphics().setDepth(-16).setAlpha(0.28);
    grid.lineStyle(1, Phaser.Display.Color.HexStringToColor(PALETTE.grid).color, 0.8);

    for (let y = 96; y < height; y += 46) {
      grid.lineBetween(64, y, width - 64, y);
    }

    for (let x = 96; x < width; x += 64) {
      grid.lineBetween(x, 92, x, height - 76);
    }

    const accentGlow = this.scene.add.graphics().setDepth(-17);
    accentGlow.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.cyan).color, 0.07);
    accentGlow.fillCircle(width * 0.5, 86, 150);
    accentGlow.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.magenta).color, 0.06);
    accentGlow.fillCircle(width * 0.18, 138, 90);
    accentGlow.fillStyle(Phaser.Display.Color.HexStringToColor(PALETTE.lime).color, 0.05);
    accentGlow.fillCircle(width * 0.82, 182, 90);

    this.accentLine = this.scene.add
      .rectangle(
        width * 0.5,
        ENEMY_LAYOUT.loseLineY,
        width - 160,
        2,
        Phaser.Display.Color.HexStringToColor(PALETTE.red).color,
        0.2,
      )
      .setDepth(4)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  update(time: number, delta: number): void {
    if (this.starfield) {
      this.starfield.tilePositionY -= delta * 0.014;
      this.starfield.tilePositionX += delta * 0.003;
    }

    if (this.scanlines) {
      this.scanlines.tilePositionY += delta * 0.02;
    }

    if (this.accentLine) {
      this.accentLine.alpha = 0.12 + ((Math.sin(time * 0.0024) + 1) * 0.04);
    }
  }
}
