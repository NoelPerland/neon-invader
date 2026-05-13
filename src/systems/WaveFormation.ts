import Phaser from 'phaser';

import { ENEMY_LAYOUT } from '../config/balance';
import { GAME_WIDTH } from '../config/app';
import { Enemy } from '../entities/Enemy';
import type { WaveConfig } from '../types/game';

export class WaveFormation {
  private readonly leftLimit = ENEMY_LAYOUT.sidePadding;

  private readonly rightLimit = GAME_WIDTH - ENEMY_LAYOUT.sidePadding;

  private readonly baseSpeed: number;

  private readonly stepDown: number;

  private direction = 1;

  private readonly enemies: Enemy[];

  private readonly totalEnemies: number;

  constructor(config: WaveConfig, enemies: Enemy[]) {
    this.baseSpeed = config.formationSpeed;
    this.stepDown = config.stepDown;
    this.enemies = enemies;
    this.totalEnemies = enemies.length;
  }

  update(delta: number): void {
    const living = this.getLivingEnemies();
    if (!living.length) {
      return;
    }

    const progress = 1 - living.length / this.totalEnemies;
    const speed = this.baseSpeed * (1 + progress * 0.85);
    const moveX = this.direction * speed * (delta / 1000);
    const bounds = this.getBounds(living);

    if (bounds.left + moveX <= this.leftLimit || bounds.right + moveX >= this.rightLimit) {
      this.direction *= -1;
      this.shiftAll(this.direction * Math.abs(moveX), this.stepDown);
      return;
    }

    this.shiftAll(moveX, 0);
  }

  countLiving(): number {
    return this.getLivingEnemies().length;
  }

  lowestY(): number {
    const living = this.getLivingEnemies();
    if (!living.length) {
      return 0;
    }

    return living.reduce((max, enemy) => Math.max(max, enemy.y + enemy.displayHeight * 0.5), 0);
  }

  getRandomShooter(): Enemy | null {
    const candidates = new Map<number, Enemy>();

    for (const enemy of this.getLivingEnemies()) {
      const existing = candidates.get(enemy.gridColumn);
      if (!existing || enemy.y > existing.y) {
        candidates.set(enemy.gridColumn, enemy);
      }
    }

    const shooters = Array.from(candidates.values());
    if (!shooters.length) {
      return null;
    }

    return Phaser.Utils.Array.GetRandom(shooters);
  }

  private shiftAll(deltaX: number, deltaY: number): void {
    for (const enemy of this.getLivingEnemies()) {
      enemy.syncPosition(enemy.x + deltaX, enemy.y + deltaY);
    }
  }

  private getBounds(enemies: Enemy[]): { left: number; right: number } {
    return enemies.reduce(
      (bounds, enemy) => ({
        left: Math.min(bounds.left, enemy.x - enemy.displayWidth * 0.5),
        right: Math.max(bounds.right, enemy.x + enemy.displayWidth * 0.5),
      }),
      { left: Number.POSITIVE_INFINITY, right: Number.NEGATIVE_INFINITY },
    );
  }

  private getLivingEnemies(): Enemy[] {
    return this.enemies.filter((enemy) => enemy.active);
  }
}
