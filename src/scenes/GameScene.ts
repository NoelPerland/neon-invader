import Phaser from 'phaser';

import { getAudioManager } from '../audio/AudioManager';
import { TEXTURES } from '../assets/assetKeys';
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from '../config/app';
import {
  ENEMY_LAYOUT,
  FX_SETTINGS,
  GAMEPLAY_TIMINGS,
  PLAYER_LIVES,
  PLAYER_SETTINGS,
  POWER_UP_SETTINGS,
  WAVE_SETTINGS,
} from '../config/balance';
import { PALETTE, POWER_UP_COLORS, POWER_UP_LABELS } from '../config/theme';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { PowerUp } from '../entities/PowerUp';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { WaveFormation } from '../systems/WaveFormation';
import { Hud } from '../ui/Hud';
import { getStoredHighScore, updateStoredHighScore } from '../utils/highScore';
import { chooseWeighted } from '../utils/random';
import type { EnemyRank, GameResult, PowerUpType, SessionState, WaveConfig } from '../types/game';

export class GameScene extends Phaser.Scene {
  private readonly background = new BackgroundSystem(this);

  private readonly audioManager = getAudioManager();

  private sessionState: SessionState = this.createInitialSession();

  private player!: Player;

  private shieldAura!: Phaser.GameObjects.Ellipse;

  private hud!: Hud;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private shootKey!: Phaser.Input.Keyboard.Key;

  private enemyGroup!: Phaser.Physics.Arcade.Group;

  private playerBullets!: Phaser.Physics.Arcade.Group;

  private enemyBullets!: Phaser.Physics.Arcade.Group;

  private powerUps!: Phaser.Physics.Arcade.Group;

  private formation: WaveFormation | null = null;

  private currentWaveConfig: WaveConfig = WAVE_SETTINGS[0];

  private nextEnemyShotAt = 0;

  private guaranteedDropUsed = false;

  private runHasSeenPowerUp = false;

  private killsThisWave = 0;

  private powerUpGuaranteeTimer: Phaser.Time.TimerEvent | null = null;

  private isNewHighScore = false;

  private dangerHintShown = false;

  private collectibleHintShown = false;

  private restartQueued = false;

  private transitioning = true;

  private ending = false;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  init(): void {
    this.sessionState = this.createInitialSession();
    this.currentWaveConfig = WAVE_SETTINGS[0];
    this.nextEnemyShotAt = 0;
    this.guaranteedDropUsed = false;
    this.runHasSeenPowerUp = false;
    this.killsThisWave = 0;
    this.powerUpGuaranteeTimer?.remove(false);
    this.powerUpGuaranteeTimer = null;
    this.isNewHighScore = false;
    this.dangerHintShown = false;
    this.collectibleHintShown = false;
    this.restartQueued = false;
    this.transitioning = true;
    this.ending = false;
  }

  create(): void {
    this.background.create();
    this.audioManager.setMusicMode('game');
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
    this.shootKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ) as Phaser.Input.Keyboard.Key;
    this.playerBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 32,
      runChildUpdate: true,
    });

    this.enemyBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 32,
      runChildUpdate: true,
    });

    this.powerUps = this.physics.add.group({
      classType: PowerUp,
      maxSize: 10,
      runChildUpdate: true,
    });

    this.enemyGroup = this.physics.add.group();

    this.player = new Player(this, GAME_WIDTH * 0.5, PLAYER_SETTINGS.spawnY);
    this.player.resetState();

    this.shieldAura = this.add
      .ellipse(this.player.x, this.player.y, 86, 48)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(PALETTE.lime).color, 0.9)
      .setDepth(11)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.input.keyboard?.off('keydown-M', this.toggleMute, this);
    this.input.keyboard?.off('keydown-R', this.restartRun, this);
    this.input.keyboard?.on('keydown-M', this.toggleMute, this);
    this.input.keyboard?.on('keydown-R', this.restartRun, this);

    this.hud = new Hud(this);

    this.physics.add.overlap(
      this.playerBullets,
      this.enemyGroup,
      this.handlePlayerBulletHitsEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.player,
      this.handleEnemyBulletHitsPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.powerUps,
      this.player,
      this.handlePowerUpCollected as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.startWave(1);
  }

  update(time: number, delta: number): void {
    this.background.update(time, delta);

    if (this.ending) {
      return;
    }

    this.player.updateFromInput(this.cursors);
    this.player.updateDamageFlash(time);
    this.updateShieldVisual(time);
    this.updatePowerUpTimers(time);
    this.updatePowerUpMagnetism();
    this.handlePlayerFire(time);

    if (!this.transitioning && this.formation) {
      this.formation.update(delta);
      this.handleEnemyFire(time);
      if (this.formation.lowestY() >= ENEMY_LAYOUT.loseLineY) {
        this.finishRun('defeat');
      }
    }

    this.hud.update(this.sessionState, time, this.audioManager.isMuted());
  }

  private createInitialSession(): SessionState {
    const highScore = getStoredHighScore();

    return {
      score: 0,
      highScore,
      lives: PLAYER_LIVES,
      wave: 1,
      activePowerUp: null,
      powerUpExpiresAt: null,
      result: null,
    };
  }

  private startWave(waveNumber: number): void {
    this.clearTransientObjects();
    this.enemyGroup.clear(true, true);

    this.sessionState.wave = waveNumber;
    this.currentWaveConfig = WAVE_SETTINGS[waveNumber - 1];
    this.formation = null;
    this.transitioning = true;
    this.killsThisWave = 0;

    const enemies: Enemy[] = [];
    const totalWidth = (this.currentWaveConfig.cols - 1) * ENEMY_LAYOUT.horizontalSpacing;
    const startX = GAME_WIDTH * 0.5 - totalWidth * 0.5;

    for (let row = 0; row < this.currentWaveConfig.rows; row += 1) {
      for (let col = 0; col < this.currentWaveConfig.cols; col += 1) {
        const rank = this.resolveEnemyRank(row, this.currentWaveConfig.rows);
        const x = startX + col * ENEMY_LAYOUT.horizontalSpacing;
        const y = ENEMY_LAYOUT.startY + row * ENEMY_LAYOUT.verticalSpacing;
        const enemy = new Enemy(this, x, y, rank, row, col);
        enemy.setAlpha(0);
        enemy.setY(y - 18);
        this.enemyGroup.add(enemy);
        enemies.push(enemy);
        this.tweens.add({
          targets: enemy,
          alpha: 1,
          y,
          duration: GAMEPLAY_TIMINGS.waveIntroTweenMs,
          delay: 40 + col * 20 + row * 35,
          ease: 'Quad.easeOut',
        });
      }
    }

    this.formation = new WaveFormation(this.currentWaveConfig, enemies);
    this.nextEnemyShotAt = this.time.now + this.currentWaveConfig.enemyFireInterval;

    this.hud.showBanner(this, `WAVE ${waveNumber}`, PALETTE.cyan);
    this.scheduleGuaranteedPowerUpDrop(waveNumber);
    this.time.delayedCall(GAMEPLAY_TIMINGS.startDelayMs, () => {
      this.transitioning = false;
    });
  }

  private resolveEnemyRank(row: number, totalRows: number): EnemyRank {
    const third = totalRows / 3;
    if (row < third) {
      return 'top';
    }

    if (row < third * 2) {
      return 'mid';
    }

    return 'bottom';
  }

  private handlePlayerFire(time: number): void {
    if (this.transitioning || !this.shootKey.isDown) {
      return;
    }

    const cooldown =
      this.sessionState.activePowerUp === 'rapid-fire'
        ? PLAYER_SETTINGS.rapidFireCooldown
        : PLAYER_SETTINGS.baseShotCooldown;

    if (!this.player.canShoot(time)) {
      return;
    }

    this.player.recordShot(time, cooldown);

    const muzzleY = this.player.y - PLAYER_SETTINGS.bulletOffsetY;
    if (this.sessionState.activePowerUp === 'double-shot') {
      this.spawnPlayerBullet(
        this.player.x - PLAYER_SETTINGS.doubleShotSpreadX,
        muzzleY,
        -PLAYER_SETTINGS.doubleShotVelocityX,
      );
      this.spawnPlayerBullet(
        this.player.x + PLAYER_SETTINGS.doubleShotSpreadX,
        muzzleY,
        PLAYER_SETTINGS.doubleShotVelocityX,
      );
    } else {
      this.spawnPlayerBullet(this.player.x, muzzleY, 0);
    }

    this.audioManager.play('playerShoot');
  }

  private spawnPlayerBullet(x: number, y: number, velocityX: number): void {
    const bullet = this.playerBullets.get(x, y, TEXTURES.bulletPlayer) as Bullet | null;
    if (!bullet) {
      return;
    }

    bullet.fire(x, y, velocityX, -PLAYER_SETTINGS.bulletSpeed, 'player');
  }

  private handleEnemyFire(time: number): void {
    if (time < this.nextEnemyShotAt || !this.formation) {
      return;
    }

    if (this.enemyBullets.countActive(true) >= this.currentWaveConfig.maxEnemyBullets) {
      this.nextEnemyShotAt = time + 110;
      return;
    }

    const shooter = this.formation.getRandomShooter();
    if (!shooter) {
      return;
    }

    this.telegraphEnemyShot(shooter);
    this.time.delayedCall(GAMEPLAY_TIMINGS.enemyShotTelegraphMs, () => {
      if (!shooter.active || this.transitioning || this.ending) {
        return;
      }

      const bullet = this.enemyBullets.get(shooter.x, shooter.y + 16, TEXTURES.bulletEnemy) as Bullet | null;
      if (!bullet) {
        return;
      }

      const horizontalVariance = Phaser.Math.Between(-18, 18);
      bullet.fire(
        shooter.x,
        shooter.y + 18,
        horizontalVariance,
        this.currentWaveConfig.enemyBulletSpeed,
        'enemy',
      );
      this.audioManager.play('enemyShoot');
      if (!this.dangerHintShown) {
        this.dangerHintShown = true;
        this.hud.showBanner(this, 'RED SHOTS HURT', PALETTE.red);
      }
    });

    this.nextEnemyShotAt =
      time + this.currentWaveConfig.enemyFireInterval + Phaser.Math.Between(-120, 120);
  }

  private handlePlayerBulletHitsEnemy(
    bulletObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): void {
    const bullet = bulletObj as Bullet;
    const enemy = enemyObj as Enemy;

    if (!this.isActiveBulletObject(bullet) || !enemy.active) {
      return;
    }

    this.despawnBulletObject(bullet);
    enemy.destroyEnemy();
    this.killsThisWave += 1;
    this.sessionState.score += enemy.points;
    this.updateHighScore();
    this.audioManager.play('enemyHit');
    this.spawnBurst(enemy.x, enemy.y, enemy.glowColor);
    this.cameras.main.shake(FX_SETTINGS.flashMs, FX_SETTINGS.enemyHitShake, false);

    const forcedEarlyDrop = this.shouldForceEarlyPowerUpDrop();
    if (
      this.powerUps.countActive(true) < 1 &&
      (forcedEarlyDrop || Math.random() < this.currentWaveConfig.dropChance)
    ) {
      if (forcedEarlyDrop) {
        this.guaranteedDropUsed = true;
        this.powerUpGuaranteeTimer?.remove(false);
        this.powerUpGuaranteeTimer = null;
      }

      this.spawnPowerUp(enemy.x, enemy.y);
    }

    if (this.formation?.countLiving() === 0) {
      this.handleWaveCleared();
    }
  }

  private handleEnemyBulletHitsPlayer(
    bulletObj: Phaser.GameObjects.GameObject,
    _playerObj: Phaser.GameObjects.GameObject,
  ): void {
    const bullet = bulletObj as Bullet;
    const player = this.player;

    if (!this.isActiveBulletObject(bullet) || !player?.active || this.ending) {
      return;
    }

    this.tryResolvePickupPriority(player);
    this.despawnBulletObject(bullet);

    if (player.isInvulnerable(this.time.now)) {
      return;
    }

    if (this.sessionState.activePowerUp === 'shield') {
      this.clearActivePowerUp();
      player.setInvulnerableUntil(this.time.now + PLAYER_SETTINGS.shieldGraceMs);
      this.hud.showBanner(this, 'SHIELD ABSORBED', PALETTE.lime);
      this.cameras.main.flash(90, 90, 255, 150, false);
      return;
    }

    this.sessionState.lives -= 1;
    player.setInvulnerableUntil(this.time.now + PLAYER_SETTINGS.invulnerabilityMs);
    this.audioManager.play('playerHit');
    this.spawnBurst(player.x, player.y, PALETTE.red);
    this.cameras.main.shake(180, FX_SETTINGS.playerHitShake, false);

    if (this.sessionState.lives <= 0) {
      this.finishRun('defeat');
    }
  }

  private handlePowerUpCollected(
    powerUpObj: Phaser.GameObjects.GameObject,
    _playerObj: Phaser.GameObjects.GameObject,
  ): void {
    const powerUp = powerUpObj as PowerUp;
    const player = this.player;

    if (!powerUp.active || !player?.active) {
      return;
    }

    powerUp.collect();
    this.applyPowerUp(powerUp.type);
  }

  private spawnPowerUp(x: number, y: number, forcedType?: PowerUpType): void {
    const powerUp = this.powerUps.get(x, y) as PowerUp | null;
    if (!powerUp) {
      return;
    }

    const type = forcedType ?? chooseWeighted(POWER_UP_SETTINGS.weights);
    powerUp.spawn(type, x, y);
    this.runHasSeenPowerUp = true;
    this.spawnBurst(x, y, POWER_UP_COLORS[type]);
    if (!this.collectibleHintShown) {
      this.collectibleHintShown = true;
      this.hud.showBanner(this, 'COLLECT ROUND POWER-UPS', PALETTE.white);
    }
    this.showFloatingText(
      x,
      y - 30,
      `COLLECT ${POWER_UP_LABELS[type]}`,
      POWER_UP_COLORS[type],
      16,
      760,
    );
  }

  private applyPowerUp(type: PowerUpType): void {
    this.sessionState.activePowerUp = type;
    this.sessionState.powerUpExpiresAt =
      type === 'shield' ? null : this.time.now + POWER_UP_SETTINGS.durationMs;
    this.player.setPowerState(type);
    this.player.extendInvulnerability(this.time.now + PLAYER_SETTINGS.pickupGraceMs);
    this.clearNearbyEnemyBullets();
    this.runHasSeenPowerUp = true;
    this.audioManager.play('pickup');
    this.hud.showBanner(this, POWER_UP_LABELS[type], POWER_UP_COLORS[type]);
    this.spawnBurst(this.player.x, this.player.y - 6, POWER_UP_COLORS[type]);
    this.showFloatingText(this.player.x, this.player.y - 42, POWER_UP_LABELS[type], POWER_UP_COLORS[type], 20, 820);
  }

  private clearActivePowerUp(): void {
    this.sessionState.activePowerUp = null;
    this.sessionState.powerUpExpiresAt = null;
    this.player.setPowerState(null);
  }

  private updatePowerUpTimers(time: number): void {
    if (
      this.sessionState.activePowerUp &&
      this.sessionState.activePowerUp !== 'shield' &&
      this.sessionState.powerUpExpiresAt !== null &&
      time >= this.sessionState.powerUpExpiresAt
    ) {
      this.clearActivePowerUp();
    }
  }

  private updateShieldVisual(time: number): void {
    const shieldActive = this.sessionState.activePowerUp === 'shield';
    this.shieldAura.setVisible(shieldActive);
    this.shieldAura.setPosition(this.player.x, this.player.y - 4);

    if (shieldActive) {
      this.shieldAura.setAlpha(0.35 + ((Math.sin(time * 0.008) + 1) * 0.12));
      this.shieldAura.setScale(1 + ((Math.sin(time * 0.005) + 1) * 0.03));
    }
  }

  private updatePowerUpMagnetism(): void {
    this.powerUps.children.each((child) => {
      const powerUp = child as PowerUp;
      if (!powerUp.active || !this.player.active) {
        return true;
      }

      const dx = this.player.x - powerUp.x;
      const dy = this.player.y - powerUp.y;
      if (dy > -8 && dy < 132 && Math.abs(dx) < 132) {
        powerUp.x += dx * 0.08;
        (powerUp.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      }

      if (Math.abs(dx) < 34 && Math.abs(dy) < 42) {
        this.handlePowerUpCollected(powerUp, this.player);
      }

      return true;
    });
  }

  private handleWaveCleared(): void {
    if (this.transitioning || this.ending) {
      return;
    }

    this.transitioning = true;
    this.clearTransientObjects();
    this.audioManager.play('waveClear');
    this.cameras.main.flash(140, 80, 255, 210, false);

    if (this.sessionState.wave >= WAVE_SETTINGS.length) {
      this.hud.showBanner(this, 'SECTOR SECURED', PALETTE.lime);
      this.time.delayedCall(GAMEPLAY_TIMINGS.restartDelayMs, () => {
        this.finishRun('victory', true);
      });
      return;
    }

    this.hud.showBanner(
      this,
      `WAVE ${this.sessionState.wave} CLEAR  //  INBOUND ${this.sessionState.wave + 1}`,
      PALETTE.cyan,
    );
    this.time.delayedCall(GAMEPLAY_TIMINGS.waveTransitionMs, () => {
      this.startWave(this.sessionState.wave + 1);
    });
  }

  private toggleMute(): void {
    const muted = this.audioManager.toggleMute();
    this.hud.showBanner(this, muted ? 'AUDIO MUTED' : 'AUDIO LIVE', muted ? PALETTE.red : PALETTE.cyan);
  }

  private restartRun(): void {
    if (this.restartQueued) {
      return;
    }

    this.restartQueued = true;
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.clearTransientObjects();
    this.scene.restart();
  }

  private finishRun(result: GameResult, skipSound = false): void {
    if (this.ending) {
      return;
    }

    this.ending = true;
    this.transitioning = true;
    this.sessionState.result = result;
    this.clearTransientObjects();
    this.powerUpGuaranteeTimer?.remove(false);
    this.powerUpGuaranteeTimer = null;

    if (!skipSound) {
      this.audioManager.play(result === 'defeat' ? 'gameOver' : 'waveClear');
    }

    if (result === 'defeat') {
      this.hud.showBanner(this, 'GAME OVER!', PALETTE.red);
      this.cameras.main.flash(180, 255, 80, 120, false);
    }

    this.time.delayedCall(GAMEPLAY_TIMINGS.restartDelayMs, () => {
      this.scene.start(SCENE_KEYS.GAME_OVER, {
        score: this.sessionState.score,
        highScore: this.sessionState.highScore,
        wave: this.sessionState.wave,
        result,
        isNewHighScore: this.isNewHighScore,
      });
    });
  }

  private clearTransientObjects(): void {
    this.disableGroupChildren(this.playerBullets);
    this.disableGroupChildren(this.enemyBullets);
    this.disableGroupChildren(this.powerUps);
  }

  private disableGroupChildren(group: Phaser.Physics.Arcade.Group): void {
    group.children.each((child) => {
      if (this.isActiveBulletObject(child)) {
        this.despawnBulletObject(child);
      } else if (child instanceof PowerUp) {
        child.collect();
      }
      return true;
    });
  }

  private spawnBurst(x: number, y: number, color: string): void {
    const tint = Phaser.Display.Color.HexStringToColor(color).color;

    for (let index = 0; index < FX_SETTINGS.hitBurstCount; index += 1) {
      const spark = this.add.image(x, y, TEXTURES.particle).setTint(tint).setDepth(16);
      const angle = Phaser.Math.DegToRad((360 / FX_SETTINGS.hitBurstCount) * index);
      const distance = Phaser.Math.Between(16, 26);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => {
          spark.destroy();
        },
      });
    }
  }

  private telegraphEnemyShot(shooter: Enemy): void {
    const warning = this.add
      .rectangle(shooter.x, shooter.y + 18, 12, 24, Phaser.Display.Color.HexStringToColor(PALETTE.red).color, 0.82)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);
    const halo = this.add
      .image(shooter.x, shooter.y + 18, TEXTURES.particle)
      .setTint(Phaser.Display.Color.HexStringToColor('#ffd7df').color)
      .setScale(0.6)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [warning, halo],
      alpha: 0,
      scale: 1.8,
      y: shooter.y + 28,
      duration: GAMEPLAY_TIMINGS.enemyShotTelegraphMs,
      ease: 'Quad.easeOut',
      onComplete: () => {
        warning.destroy();
        halo.destroy();
      },
    });
  }

  private updateHighScore(): void {
    if (this.sessionState.score <= this.sessionState.highScore) {
      return;
    }

    this.sessionState.highScore = updateStoredHighScore(this.sessionState.score);
    this.isNewHighScore = true;
  }

  private tryResolvePickupPriority(player: Player): void {
    const candidate = this.findPickupCandidateNearPlayer(player);
    if (!candidate) {
      return;
    }

    this.handlePowerUpCollected(candidate, player);
  }

  private findPickupCandidateNearPlayer(player: Player): PowerUp | null {
    let candidate: PowerUp | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    this.powerUps.children.each((child) => {
      const powerUp = child as PowerUp;
      if (!powerUp.active) {
        return true;
      }

      const dx = Math.abs(powerUp.x - player.x);
      const dy = Math.abs(powerUp.y - player.y);
      if (dx > 42 || dy > 52) {
        return true;
      }

      const distance = dx + dy;
      if (distance < closestDistance) {
        closestDistance = distance;
        candidate = powerUp;
      }

      return true;
    });

    return candidate;
  }

  private shouldForceEarlyPowerUpDrop(): boolean {
    return (
      this.sessionState.wave === 1 &&
      !this.guaranteedDropUsed &&
      !this.runHasSeenPowerUp &&
      this.killsThisWave >= 4
    );
  }

  private scheduleGuaranteedPowerUpDrop(waveNumber: number): void {
    this.powerUpGuaranteeTimer?.remove(false);
    this.powerUpGuaranteeTimer = null;

    if (waveNumber !== 1 || this.guaranteedDropUsed || this.runHasSeenPowerUp) {
      return;
    }

    this.powerUpGuaranteeTimer = this.time.delayedCall(10500, () => {
      if (
        this.ending ||
        this.transitioning ||
        this.sessionState.wave !== 1 ||
        this.guaranteedDropUsed ||
        this.runHasSeenPowerUp
      ) {
        return;
      }

      const anchor = this.pickGuaranteedDropAnchor();
      if (!anchor) {
        return;
      }

      this.guaranteedDropUsed = true;
      this.spawnPowerUp(anchor.x, anchor.y);
      this.hud.showBanner(this, 'SUPPLY DROP', PALETTE.cyan);
    });
  }

  private pickGuaranteedDropAnchor(): { x: number; y: number } | null {
    const livingEnemies = this.enemyGroup
      .getChildren()
      .filter((enemy): enemy is Enemy => enemy instanceof Enemy && enemy.active);

    if (!livingEnemies.length) {
      return null;
    }

    const sorted = livingEnemies.sort((left, right) => {
      const centerDistance = Math.abs(left.x - GAME_WIDTH * 0.5) - Math.abs(right.x - GAME_WIDTH * 0.5);
      if (centerDistance !== 0) {
        return centerDistance;
      }

      return left.y - right.y;
    });

    return { x: sorted[0].x, y: sorted[0].y };
  }

  private showFloatingText(
    x: number,
    y: number,
    message: string,
    color: string,
    fontSize = 18,
    duration = 760,
  ): void {
    const label = this.add
      .text(x, y, message, {
        fontFamily: '"Lucida Console", Monaco, monospace',
        fontSize: `${fontSize}px`,
        color,
        stroke: '#020711',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(24)
      .setShadow(0, 0, color, 18, false, true);

    this.tweens.add({
      targets: label,
      y: y - 22,
      alpha: 0,
      scale: 1.08,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        label.destroy();
      },
    });
  }

  private clearNearbyEnemyBullets(): void {
    this.enemyBullets.children.each((child) => {
      if (!this.isActiveBulletObject(child)) {
        return true;
      }

      const bullet = child as Bullet;
      if (Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y) <= 48) {
        this.despawnBulletObject(bullet);
      }

      return true;
    });
  }

  private isActiveBulletObject(value: unknown): value is Bullet {
    return Boolean(
      value &&
        typeof value === 'object' &&
        'active' in value &&
        (value as { active?: boolean }).active &&
        'x' in value &&
        'y' in value,
    );
  }

  private despawnBulletObject(value: unknown): void {
    if (!value || typeof value !== 'object') {
      return;
    }

    const bulletLike = value as Bullet & {
      disableBody?: (disableGameObject?: boolean, hideGameObject?: boolean) => void;
      setActive?: (active: boolean) => void;
      setVisible?: (visible: boolean) => void;
    };

    if (typeof bulletLike.despawn === 'function') {
      bulletLike.despawn();
      return;
    }

    bulletLike.disableBody?.(true, true);
    bulletLike.setActive?.(false);
    bulletLike.setVisible?.(false);
  }

  debugSpawnSidePickupHazard(type: PowerUpType = 'shield'): boolean {
    if (!this.player.active || this.ending || this.transitioning) {
      return false;
    }

    this.spawnPowerUp(this.player.x + 28, this.player.y - 12, type);
    const bullet = this.enemyBullets.get(
      this.player.x + 24,
      this.player.y - 8,
      TEXTURES.bulletEnemy,
    ) as Bullet | null;
    if (!bullet) {
      return false;
    }

    bullet.fire(this.player.x + 24, this.player.y - 8, -26, 36, 'enemy');
    return true;
  }
}
