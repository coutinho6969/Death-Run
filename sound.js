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

    const bufferSize = this.ctx.sampleRate * 2.0;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
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
    this.musicPattern = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this._playMusicLoop();
  }

  _playMusicLoop() {
    if (!this.ctx) return;
    
    const bpm = 170;
    const secondsPerBeat = 60.0 / bpm;
    const step = secondsPerBeat / 4; // 16th notes

    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this._scheduleNote(this.musicPattern, this.nextNoteTime);
      this._nextNote(step);
    }
    this._musicTimer = setTimeout(() => this._playMusicLoop(), 25);
  }

  _nextNote(step) {
    this.nextNoteTime += step;
    this.musicPattern++;
    if (this.musicPattern >= 64) {
      this.musicPattern = 0;
    }
  }

  _scheduleNote(stepIdx, time) {
    // Bateria Post-Punk (Reta e enérgica)
    if (stepIdx % 4 === 0) this.playKick(time);
    if (stepIdx % 8 === 4) this.playSnare(time);
    if (stepIdx % 2 === 0) this.playHiHat(time);

    // Progressão de acordes: A - Bm - C#m - D
    const bar = Math.floor(stepIdx / 16);
    const progression = [
      { bass: 110.00, chord: [220, 277.18, 329.63] }, // A Major
      { bass: 123.47, chord: [246.94, 293.66, 369.99] }, // B Minor
      { bass: 138.59, chord: [277.18, 329.63, 415.30] }, // C# Minor
      { bass: 146.83, chord: [293.66, 369.99, 440.00] }  // D Major
    ];
    
    const current = progression[bar % 4];

    // Baixo (Oitava abaixo)
    if (stepIdx % 4 === 0 || stepIdx % 8 === 6) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = current.bass / 2;
      
      g.gain.setValueAtTime(0.2, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      
      o.connect(g);
      g.connect(this.musicGain);
      o.start(time);
      o.stop(time + 0.3);
    }

    // O Famoso Riff de Guitarra (Boys Don't Cry)
    // A, B, C#, D, C#, B, A
    const riffNotes = [440.00, 493.88, 554.37, 587.33, 554.37, 493.88, 440.00, 440.00];
    if (stepIdx % 2 === 0) {
      const noteIdx = (stepIdx % 16) / 2;
      if (noteIdx < riffNotes.length) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square'; // Som levemente oitavado/limpo
        o.frequency.value = riffNotes[noteIdx];
        
        // Filtro para suavizar o square e parecer mais uma guitarra clean
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        g.gain.setValueAtTime(0.1, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        o.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain);
        o.start(time);
        o.stop(time + 0.2);
      }
    }
  }

  playKick(time) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.musicGain);
    o.frequency.setValueAtTime(150, time);
    o.frequency.exponentialRampToValueAtTime(0.001, time + 0.3);
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    o.start(time);
    o.stop(time + 0.3);
  }

  playSnare(time) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseGain = this.ctx.createGain();
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);
    
    o.connect(g);
    g.connect(this.musicGain);

    o.frequency.setValueAtTime(250, time);
    o.frequency.exponentialRampToValueAtTime(0.001, time + 0.15);
    g.gain.setValueAtTime(0.2, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    noiseGain.gain.setValueAtTime(0.25, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    o.start(time);
    o.stop(time + 0.15);
    noise.start(time);
    noise.stop(time + 0.15);
  }

  playHiHat(time) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);

    g.gain.setValueAtTime(0.08, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  stopMusic() {
    clearTimeout(this._musicTimer);
  }

  stopAll() {
    this.stopEngine();
    this.stopMusic();
  }
}
