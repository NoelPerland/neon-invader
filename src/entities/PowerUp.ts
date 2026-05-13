import Phaser from 'phaser';

import { POWER_UP_TEXTURES } from '../assets/assetKeys';
import { POWER_UP_SETTINGS } from '../config/balance';
import type { PowerUpType } from '../types/game';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  type: PowerUpType = 'rapid-fire';

  private driftOriginX = 0;

  private driftSeed = 0;

  constructor(scene: Phaser.Scene, x = 0, y = 0, texture = POWER_UP_TEXTURES['rapid-fire']) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setActive(false);
    this.setVisible(false);
    this.setDepth(14);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(this.width * 0.9, this.height * 0.9, true);
  }

  spawn(type: PowerUpType, x: number, y: number): void {
    this.type = type;
    this.setTexture(POWER_UP_TEXTURES[type]);
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    this.setScale(1);
    this.setAlpha(1);
    this.driftOriginX = x;
    this.driftSeed = Math.random() * Math.PI * 2;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setSize(this.width * 0.84, this.height * 0.9, true);
    body.updateFromGameObject();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) {
      return;
    }

    this.rotation += delta * 0.00045;
    this.y += POWER_UP_SETTINGS.fallSpeed * (delta / 1000);
    this.x = this.driftOriginX + Math.sin(time * 0.004 + this.driftSeed) * 7;
    this.setScale(1.02 + Math.sin(time * 0.008 + this.driftSeed) * 0.08);
    this.setAlpha(0.92 + ((Math.sin(time * 0.012 + this.driftSeed) + 1) * 0.04));
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();

    if (this.y > this.scene.scale.height + 32) {
      this.collect();
    }
  }

  collect(): void {
    this.disableBody(true, true);
    this.setActive(false);
    this.setVisible(false);
    this.rotation = 0;
    this.setScale(1);
    this.setAlpha(1);
    this.driftOriginX = 0;
  }
}
