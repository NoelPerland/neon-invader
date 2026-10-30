import Phaser from 'phaser';

import { TEXTURES } from '../assets/assetKeys';
import { PLAYER_SETTINGS } from '../config/balance';
import { PALETTE, POWER_UP_COLORS } from '../config/theme';
import type { PowerUpType } from '../types/game';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private nextShotAt = 0;

  private invulnerableUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURES.player);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(12);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(this.width * 0.86, this.height * 0.78, true);
  }

  updateFromInput(cursors: Phaser.Types.Input.Keyboard.CursorKeys, touchDirection = 0): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let velocityX = 0;

    if (cursors.left?.isDown || touchDirection < 0) {
      velocityX = -PLAYER_SETTINGS.speed;
    } else if (cursors.right?.isDown || touchDirection > 0) {
      velocityX = PLAYER_SETTINGS.speed;
    }

    body.setVelocityX(velocityX);
  }

  canShoot(now: number): boolean {
    return this.active && now >= this.nextShotAt;
  }

  recordShot(now: number, cooldown: number): void {
    this.nextShotAt = now + cooldown;
  }

  setInvulnerableUntil(timestamp: number): void {
    this.invulnerableUntil = timestamp;
  }

  extendInvulnerability(timestamp: number): void {
    this.invulnerableUntil = Math.max(this.invulnerableUntil, timestamp);
  }

  isInvulnerable(now: number): boolean {
    return now < this.invulnerableUntil;
  }

  setPowerState(type: PowerUpType | null): void {
    if (!type) {
      this.setTint(Phaser.Display.Color.HexStringToColor(PALETTE.cyan).color);
      return;
    }

    this.setTint(Phaser.Display.Color.HexStringToColor(POWER_UP_COLORS[type]).color);
  }

  updateDamageFlash(now: number): void {
    if (this.isInvulnerable(now)) {
      this.setAlpha(0.48 + ((Math.sin(now * 0.04) + 1) * 0.16));
      return;
    }

    this.setAlpha(1);
  }

  resetState(): void {
    this.nextShotAt = 0;
    this.invulnerableUntil = 0;
    this.setAlpha(1);
    this.setPowerState(null);
  }
}
