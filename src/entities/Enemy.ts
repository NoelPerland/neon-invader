import Phaser from 'phaser';

import { ENEMY_TEXTURES } from '../assets/assetKeys';
import { SCORE_BY_RANK } from '../config/balance';
import { PALETTE } from '../config/theme';
import type { EnemyRank } from '../types/game';

const RANK_COLOR: Record<EnemyRank, string> = {
  top: PALETTE.magenta,
  mid: PALETTE.lime,
  bottom: PALETTE.amber,
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly rank: EnemyRank;

  readonly points: number;

  readonly gridColumn: number;

  readonly gridRow: number;

  readonly glowColor: string;

  constructor(scene: Phaser.Scene, x: number, y: number, rank: EnemyRank, row: number, col: number) {
    super(scene, x, y, ENEMY_TEXTURES[rank]);

    this.rank = rank;
    this.points = SCORE_BY_RANK[rank];
    this.gridRow = row;
    this.gridColumn = col;
    this.glowColor = RANK_COLOR[rank];

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(7);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(this.width * 0.8, this.height * 0.8, true);
  }

  syncPosition(x: number, y: number): void {
    this.setPosition(x, y);
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }

  destroyEnemy(): void {
    this.disableBody(true, true);
    this.setActive(false);
    this.setVisible(false);
  }
}
