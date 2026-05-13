import type { SoundKey } from '../types/game';

type AudioContextLike = AudioContext;
type MusicMode = 'off' | 'title' | 'game' | 'game-over';

const AudioContextCtor =
  typeof window !== 'undefined'
    ? (window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    : undefined;

export class AudioManager {
  private readonly baseVolume = 0.115;

  private context: AudioContextLike | null = null;

  private masterGain: GainNode | null = null;

  private musicGain: GainNode | null = null;

  private initialized = false;

  private muted = false;

  private musicMode: MusicMode = 'off';

  private musicTimer: number | null = null;

  private musicStep = 0;

  private lastMusicTickAt = 0;

  private ensureContext(): AudioContextLike | null {
    if (!AudioContextCtor) {
      return null;
    }

    if (!this.context) {
      this.context = new AudioContextCtor();
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.42;
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.updateMasterGain();
      this.initialized = true;
    }

    return this.context;
  }

  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        // Browser autoplay restrictions can still block resume; gameplay continues silently.
      }
    }

    this.refreshMusicLoop();
  }

  boot(): void {
    this.ensureContext();
  }

  play(key: SoundKey): void {
    const context = this.ensureContext();
    if (!context || !this.masterGain || context.state !== 'running') {
      return;
    }

    const variance = 0.97 + Math.random() * 0.06;

    switch (key) {
      case 'playerShoot':
        this.toneSweep('square', 860 * variance, 540 * variance, 0.055, 0.055);
        break;
      case 'enemyShoot':
        this.toneSweep('triangle', 320 * variance, 210 * variance, 0.075, 0.04);
        break;
      case 'enemyHit':
        this.toneSweep('triangle', 340 * variance, 124 * variance, 0.09, 0.06);
        this.noiseBurst(0.045, 0.024, 1600);
        break;
      case 'pickup':
        this.sequence([
          { frequency: 500, duration: 0.05, type: 'triangle', volume: 0.04 },
          { frequency: 690, duration: 0.06, type: 'triangle', volume: 0.044 },
          { frequency: 900, duration: 0.07, type: 'triangle', volume: 0.05 },
        ]);
        break;
      case 'playerHit':
        this.noiseBurst(0.1, 0.045, 380);
        this.toneSweep('square', 170 * variance, 78 * variance, 0.14, 0.06);
        break;
      case 'gameOver':
        this.sequence([
          { frequency: 250, duration: 0.12, type: 'sawtooth', volume: 0.05 },
          { frequency: 176, duration: 0.14, type: 'sawtooth', volume: 0.05 },
          { frequency: 118, duration: 0.18, type: 'sawtooth', volume: 0.06 },
        ]);
        break;
      case 'waveClear':
        this.sequence([
          { frequency: 420, duration: 0.055, type: 'square', volume: 0.04 },
          { frequency: 570, duration: 0.06, type: 'square', volume: 0.04 },
          { frequency: 760, duration: 0.08, type: 'triangle', volume: 0.05 },
          { frequency: 940, duration: 0.12, type: 'triangle', volume: 0.05 },
        ]);
        break;
      default:
        break;
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateMasterGain();
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMusicMode(mode: MusicMode): void {
    this.musicMode = mode;
    this.musicStep = 0;
    this.refreshMusicLoop();
  }

  getMusicMode(): MusicMode {
    return this.musicMode;
  }

  getDebugAudioState(): { contextState: AudioContextState | 'unavailable'; musicMode: MusicMode; lastMusicTickAt: number } {
    return {
      contextState: this.context?.state ?? 'unavailable',
      musicMode: this.musicMode,
      lastMusicTickAt: this.lastMusicTickAt,
    };
  }

  private updateMasterGain(): void {
    if (!this.masterGain) {
      return;
    }

    this.masterGain.gain.value = this.muted ? 0 : this.baseVolume;
  }

  private refreshMusicLoop(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    const context = this.ensureContext();
    if (!context || this.musicMode === 'off') {
      return;
    }

    const interval = this.getMusicInterval(this.musicMode);
    this.playMusicStep();
    this.musicTimer = window.setInterval(() => {
      this.playMusicStep();
    }, interval);
  }

  private getMusicInterval(mode: MusicMode): number {
    switch (mode) {
      case 'title':
        return 760;
      case 'game':
        return 420;
      case 'game-over':
        return 900;
      default:
        return 640;
    }
  }

  private playMusicStep(): void {
    if (!this.context || !this.musicGain || this.context.state !== 'running') {
      return;
    }

    const step = this.musicStep;
    this.lastMusicTickAt = Date.now();

    switch (this.musicMode) {
      case 'title':
        this.playTitleMusic(step);
        break;
      case 'game':
        this.playGameMusic(step);
        break;
      case 'game-over':
        this.playGameOverMusic(step);
        break;
      default:
        break;
    }

    this.musicStep += 1;
  }

  private playTitleMusic(step: number): void {
    const notes = [262, 330, 392, 330, 440, 392];
    const frequency = notes[step % notes.length];
    this.musicTone('triangle', frequency, 0.22, 0.018);
    this.musicTone('sine', frequency / 2, 0.3, 0.014, 0.04);
  }

  private playGameMusic(step: number): void {
    const bass = [110, 110, 138, 110, 165, 138, 110, 147];
    const lead = [440, 554, 660, 554, 494, 660, 740, 660];
    this.musicTone('sine', bass[step % bass.length], 0.26, 0.017);

    if (step % 2 === 0) {
      this.musicTone('triangle', lead[step % lead.length], 0.14, 0.012, 0.02);
    } else {
      this.musicTone('triangle', lead[step % lead.length] * 0.5, 0.1, 0.009, 0.02);
    }
  }

  private playGameOverMusic(step: number): void {
    const notes = [196, 174, 147, 131];
    const frequency = notes[step % notes.length];
    this.musicTone('triangle', frequency, 0.28, 0.016);
    this.musicTone('sine', frequency / 2, 0.36, 0.012, 0.05);
  }

  private musicTone(
    type: OscillatorType,
    frequency: number,
    duration: number,
    volume: number,
    offset = 0,
  ): void {
    if (!this.context || !this.musicGain) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime + offset;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(frequency * 0.985, 40), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.musicGain);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private toneSweep(
    type: OscillatorType,
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    offset = 0,
  ): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime + offset;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 40), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private noiseBurst(duration: number, volume: number, filterFrequency: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < output.length; i += 1) {
      output[i] = (Math.random() * 2 - 1) * (1 - i / output.length);
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFrequency;
    filter.Q.value = 0.4;

    const gain = this.context.createGain();
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + duration);
  }

  private sequence(
    notes: Array<{
      frequency: number;
      duration: number;
      type: OscillatorType;
      volume: number;
    }>,
  ): void {
    let cursor = 0;
    for (const note of notes) {
      this.toneSweep(
        note.type,
        note.frequency,
        note.frequency * 1.04,
        note.duration,
        note.volume,
        cursor,
      );
      cursor += note.duration * 0.92;
    }
  }
}

const sharedAudioManager = new AudioManager();

export const getAudioManager = (): AudioManager => sharedAudioManager;
