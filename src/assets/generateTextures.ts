import Phaser from 'phaser';

import { TEXTURES } from './assetKeys';
import { PALETTE } from '../config/theme';

const toColorNumber = (color: string): number =>
  Phaser.Display.Color.HexStringToColor(color).color;

const drawPixelMap = (
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  palette: Record<string, string>,
  scale = 4,
): void => {
  if (scene.textures.exists(key)) {
    return;
  }

  const width = rows[0].length * scale;
  const height = rows.length * scale;
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);

  rows.forEach((row, rowIndex) => {
    row.split('').forEach((cell, columnIndex) => {
      const fill = palette[cell];
      if (!fill) {
        return;
      }

      graphics.fillStyle(toColorNumber(fill), 1);
      graphics.fillRect(columnIndex * scale, rowIndex * scale, scale, scale);
    });
  });

  graphics.generateTexture(key, width, height);
  graphics.destroy();
};

const drawCanvasTexture = (
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void => {
  if (scene.textures.exists(key)) {
    return;
  }

  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    return;
  }

  const ctx = texture.context;
  ctx.clearRect(0, 0, width, height);
  draw(ctx);
  texture.refresh();
};

const drawBulletTextures = (scene: Phaser.Scene): void => {
  drawCanvasTexture(scene, TEXTURES.bulletPlayer, 10, 24, (ctx) => {
    ctx.fillStyle = PALETTE.cyan;
    ctx.shadowBlur = 10;
    ctx.shadowColor = PALETTE.cyan;
    ctx.fillRect(3, 0, 4, 18);
    ctx.fillRect(2, 18, 6, 3);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(4, 2, 2, 12);
  });

  drawCanvasTexture(scene, TEXTURES.bulletEnemy, 14, 28, (ctx) => {
    ctx.fillStyle = '#ff466b';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff466b';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(13, 10);
    ctx.lineTo(7, 27);
    ctx.lineTo(1, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffbac8';
    ctx.fillRect(6, 5, 2, 15);
    ctx.fillStyle = '#5a1024';
    ctx.fillRect(6, 20, 2, 4);
  });

  drawCanvasTexture(scene, TEXTURES.particle, 8, 8, (ctx) => {
    ctx.fillStyle = PALETTE.white;
    ctx.beginPath();
    ctx.arc(4, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawPowerUpBadge = (
  scene: Phaser.Scene,
  key: string,
  color: string,
  drawIcon: (ctx: CanvasRenderingContext2D) => void,
): void => {
  drawCanvasTexture(scene, key, 44, 44, (ctx) => {
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;

    ctx.fillStyle = 'rgba(4, 8, 20, 0.92)';
    ctx.beginPath();
    ctx.arc(22, 22, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(22, 22, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#effcff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(22, 22, 11.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    drawIcon(ctx);
  });
};

const drawUtilityTextures = (scene: Phaser.Scene): void => {
  drawCanvasTexture(scene, TEXTURES.starfield, 128, 128, (ctx) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 128, 128);

    const stars = [
      PALETTE.white,
      PALETTE.cyan,
      'rgba(255, 255, 255, 0.5)',
      'rgba(88, 242, 255, 0.45)',
    ];

    for (let i = 0; i < 64; i += 1) {
      const x = Math.floor(Math.random() * 128);
      const y = Math.floor(Math.random() * 128);
      const size = Math.random() > 0.88 ? 2 : 1;
      ctx.fillStyle = stars[Math.floor(Math.random() * stars.length)];
      ctx.fillRect(x, y, size, size);
    }
  });

  drawCanvasTexture(scene, TEXTURES.scanlines, 4, 8, (ctx) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 4, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(0, 0, 4, 1);
    ctx.fillStyle = 'rgba(13, 20, 34, 0.22)';
    ctx.fillRect(0, 3, 4, 1);
    ctx.fillRect(0, 7, 4, 1);
  });
};

export const generateGameTextures = (scene: Phaser.Scene): void => {
  drawPixelMap(
    scene,
    TEXTURES.player,
    [
      '..CCCC....CCCC..',
      '.CCCCCC..CCCCCC.',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCWWCCCCCCCCWWCC',
      '..CCCCCCCCCCCC..',
      '...CCCCCCCCCC...',
    ],
    {
      C: PALETTE.cyan,
      W: PALETTE.white,
    },
  );

  drawPixelMap(
    scene,
    TEXTURES.enemyTop,
    [
      '..MMMMMMMM..',
      '.MMWWMMWWMM.',
      'MMMMMMMMMMMM',
      'MM.MMMM.MM.M',
      '..MM....MM..',
    ],
    {
      M: PALETTE.magenta,
      W: PALETTE.white,
    },
  );

  drawPixelMap(
    scene,
    TEXTURES.enemyMid,
    [
      '..LLLLLLLL..',
      '.LLWWLLWWLL.',
      'LLLLLLLLLLLL',
      'LL.LLLLLL.LL',
      '..LL....LL..',
    ],
    {
      L: PALETTE.lime,
      W: PALETTE.white,
    },
  );

  drawPixelMap(
    scene,
    TEXTURES.enemyBottom,
    [
      '..CCCCCCCC..',
      '.CCWWCCWWCC.',
      'CCCCCCCCCCCC',
      'CC.CCCCCC.CC',
      '..CC....CC..',
    ],
    {
      C: PALETTE.amber,
      W: PALETTE.white,
    },
  );

  drawPowerUpBadge(scene, TEXTURES.rapidFire, PALETTE.cyan, (ctx) => {
    ctx.fillStyle = PALETTE.cyan;
    ctx.fillRect(14, 13, 4, 18);
    ctx.fillRect(20, 10, 4, 24);
    ctx.fillRect(26, 13, 4, 18);
  });

  drawPowerUpBadge(scene, TEXTURES.doubleShot, PALETTE.magenta, (ctx) => {
    ctx.fillStyle = PALETTE.magenta;
    ctx.beginPath();
    ctx.moveTo(13, 22);
    ctx.lineTo(20, 15);
    ctx.lineTo(20, 19);
    ctx.lineTo(30, 19);
    ctx.lineTo(30, 25);
    ctx.lineTo(20, 25);
    ctx.lineTo(20, 29);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(31, 22);
    ctx.lineTo(24, 15);
    ctx.lineTo(24, 19);
    ctx.lineTo(14, 19);
    ctx.lineTo(14, 25);
    ctx.lineTo(24, 25);
    ctx.lineTo(24, 29);
    ctx.closePath();
    ctx.fill();
  });

  drawPowerUpBadge(scene, TEXTURES.shield, PALETTE.lime, (ctx) => {
    ctx.fillStyle = PALETTE.lime;
    ctx.beginPath();
    ctx.moveTo(22, 11);
    ctx.lineTo(31, 15);
    ctx.lineTo(30, 24);
    ctx.lineTo(22, 32);
    ctx.lineTo(14, 24);
    ctx.lineTo(13, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(20, 15, 4, 12);
    ctx.fillRect(16, 19, 12, 4);
  });

  drawBulletTextures(scene);
  drawUtilityTextures(scene);
};
