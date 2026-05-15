// ============================================
// SOUND MANAGER - Web Audio API
// ============================================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicGain = null;
    this.engineOsc = null;
    this.engineGain = null;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.15;
    this.musicGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  playTone(freq, dur, type, vol, dest) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(dest || this.masterGain);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  playCoin() {
    this.playTone(880, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.12), 80);
  }

  playCrash() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    src.connect(g);
    g.connect(this.masterGain);
    src.start();
  }

  startEngine() {
    if (!this.ctx || this.engineOsc) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 80;
    this.engineGain.gain.value = 0.04;
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();
  }

  updateEngine(speed, maxSpeed) {
    if (!this.engineOsc) return;
    const ratio = speed / maxSpeed;
    this.engineOsc.frequency.value = 60 + ratio * 120;
    this.engineGain.gain.value = 0.03 + ratio * 0.04;
  }

  stopEngine() {
    if (this.engineOsc) {
      this.engineOsc.stop();
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  startMusic() {
    if (!this.ctx) return;
    this._playMusicLoop();
  }

  _playMusicLoop() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bpm = 130;
    const step = 60 / bpm / 2;
    const bass = [110, 110, 82.4, 82.4, 98, 98, 73.4, 73.4];
    for (let i = 0; i < 16; i++) {
      const freq = bass[i % bass.length];
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.12, now + i * step);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * step + step * 0.8);
      o.connect(g);
      g.connect(this.musicGain);
      o.start(now + i * step);
      o.stop(now + i * step + step);
    }
    this._musicTimer = setTimeout(() => this._playMusicLoop(), (16 * step) * 1000 - 50);
  }

  stopMusic() {
    clearTimeout(this._musicTimer);
  }

  stopAll() {
    this.stopEngine();
    this.stopMusic();
  }
}
