import Phaser from 'phaser';

import { generateGameTextures } from '../assets/generateTextures';
import { getAudioManager } from '../audio/AudioManager';
import { SCENE_KEYS } from '../config/app';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create(): void {
    generateGameTextures(this);
    getAudioManager().boot();
    this.scene.start(SCENE_KEYS.TITLE);
  }
}
