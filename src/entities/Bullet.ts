import Phaser from 'phaser';

import { TEXTURES } from '../assets/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/app';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private owner: 'player' | 'enemy' = 'player';

  constructor(scene: Phaser.Scene, x = 0, y = 0, texture = TEXTURES.bulletPlayer) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setActive(false);
    this.setVisible(false);
    this.setDepth(8);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(this.width * 0.75, this.height * 0.9, true);
  }

  fire(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    owner: 'player' | 'enemy',
  ): void {
    this.owner = owner;
    this.setTexture(owner === 'player' ? TEXTURES.bulletPlayer : TEXTURES.bulletEnemy);
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    this.setDepth(owner === 'player' ? 10 : 9);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(velocityX, velocityY);
    body.updateFromGameObject();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) {
      return;
    }

    if (this.y < -24 || this.y > GAME_HEIGHT + 24 || this.x < -24 || this.x > GAME_WIDTH + 24) {
      this.despawn();
    }
  }

  despawn(): void {
    this.disableBody(true, true);
    this.setActive(false);
    this.setVisible(false);
  }

  belongsToPlayer(): boolean {
    return this.owner === 'player';
  }
}
