/**
 * LAST LIGHT - Procedural Web Audio Engine
 * High atmospheric immersion with dynamic tension that scales with lantern fuel.
 */

window.LastLight = window.LastLight || {};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    
    // Ambient nodes
    this.windNode = null;
    this.droneGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneFilter = null;
    
    // Lantern crackle loop
    this.crackleTimer = null;
    
    // Dynamic tension / Heartbeat
    this.tensionGain = null;
    this.heartbeatTimer = null;
    this.lastHeartbeatTime = 0;
    
    // Current fuel cache for sound modulation
    this.currentFuel = 120;
    this.inSafeZone = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Ambient channel
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // SFX channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Tension channel
      this.tensionGain = this.ctx.createGain();
      this.tensionGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.tensionGain.connect(this.masterGain);

      this.startAmbientGenerators();
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // --- AMBIENT GENERATORS ---

  startAmbientGenerators() {
    if (!this.ctx) return;

    // 1. Howling wind generator (filtered noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish noise
      lastOut = output[i];
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Wind modulation LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // slow breathing wind
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    noiseSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain);

    noiseSource.start();
    lfo.start();

    // 2. Atmospheric Dark Drone
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc2.type = 'triangle';
    this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A
    this.droneOsc2.frequency.setValueAtTime(55.4, this.ctx.currentTime); // Detuned beats

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
    this.droneFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.ambientGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // 3. Lantern crackle loop
    this.startLanternCrackle();
  }

  startLanternCrackle() {
    const triggerCrackle = () => {
      if (this.ctx && this.initialized && !this.muted && this.currentFuel > 0) {
        // Occasional snap or sizzle of flame
        if (Math.random() < 0.45) {
          this.playCrackleSpark();
        }
      }
      const nextDelay = 180 + Math.random() * 450;
      this.crackleTimer = setTimeout(triggerCrackle, nextDelay);
    };
    triggerCrackle();
  }

  playCrackleSpark() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 800, now);

    gain.gain.setValueAtTime(0.025 * Math.random(), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Update audio parameters based on lantern fuel & safe zone
  updateLanternState(fuel, inSafeZone = false) {
    this.currentFuel = fuel;
    this.inSafeZone = inSafeZone;

    if (!this.ctx || !this.initialized) return;
    const now = this.ctx.currentTime;

    // Adjust drone warmth vs terror
    if (this.droneFilter && this.tensionGain) {
      if (fuel > 60) {
        // Calmer ambient drone
        this.droneFilter.frequency.setTargetAtTime(160, now, 1.0);
        this.tensionGain.gain.setTargetAtTime(0.0, now, 0.5);
      } else if (fuel > 30) {
        // Warning zone: drone grows rougher
        this.droneFilter.frequency.setTargetAtTime(260, now, 1.0);
        this.tensionGain.gain.setTargetAtTime(0.15, now, 0.5);
      } else if (fuel > 10) {
        // Severe darkness: intense drone, dissonant harmonics
        this.droneFilter.frequency.setTargetAtTime(420, now, 0.8);
        this.tensionGain.gain.setTargetAtTime(0.35, now, 0.5);
      } else {
        // Critical state
        this.droneFilter.frequency.setTargetAtTime(600, now, 0.5);
        this.tensionGain.gain.setTargetAtTime(0.55, now, 0.5);
      }
    }

    // Trigger heartbeat under 30s
    if (fuel <= 30 && fuel > 0 && !inSafeZone) {
      const interval = fuel <= 10 ? 600 : 1000; // faster heartbeat as darkness approaches
      const nowMs = performance.now();
      if (nowMs - this.lastHeartbeatTime > interval) {
        this.playHeartbeat();
        this.lastHeartbeatTime = nowMs;
      }
    }
  }

  // --- SOUND EFFECTS (SFX) ---

  playFootstep(isMud = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isMud ? 'triangle' : 'sine';
    const baseFreq = isMud ? 90 + Math.random() * 30 : 60 + Math.random() * 20;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isMud ? 220 : 180, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playHeartbeat() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const thump = (time, freq, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.tensionGain);

      osc.start(time);
      osc.stop(time + 0.16);
    };

    // Double thump (lub-dub)
    thump(now, 75, 0.45);
    thump(now + 0.18, 65, 0.32);
  }

  playFuelPickup(fuelType = 'MEDIUM') {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    // Harmonious shimmering chord
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      const vol = 0.2 - (idx * 0.03);
      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(vol, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.65);
    });
  }

  playDamage() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Impact noise burst + low crunch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playLanternPulse() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Resonant blazing whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playCreatureGrowl(creatureType = 'STALKER') {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (creatureType === 'WHISPER') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(750, now + 0.15);
      osc.frequency.linearRampToValueAtTime(520, now + 0.35);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    } else if (creatureType === 'ROOT_BEAST') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    } else if (creatureType === 'HOLLOW') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else {
      // Shadow Stalker
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.3);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  playCreatureDefeated() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playDialogueBlip(pitchOffset = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 + pitchOffset + (Math.random() * 40), now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playLoreDiscovery() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 987.77]; // G4, C5, E5, B5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);

      gain.gain.setValueAtTime(0.001, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.85);
    });
  }

  playPuzzleClick() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playPuzzleSolve() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Ancient stone mechanism unlocking + heavenly resonance
    const freqs = [220, 277.18, 329.63, 440, 554.37];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);

      gain.gain.setValueAtTime(0.01, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 1.3);
    });
  }

  playExtinguished() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Fade out ambient abruptly, play descending haunting hollow ring
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(0, now);
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 2.5);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 3.0);
  }

  playEndingMusic(endingType) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    let chords = [];
    if (endingType === 'DESTROY') {
      // Harsh fiery dramatic dissonance
      chords = [
        [130.81, 164.81, 207.65], // C - E - G#
        [110.00, 155.56, 196.00]  // A - Eb - G
      ];
    } else if (endingType === 'EXTINGUISH') {
      // Peaceful soothing sanctuary chords
      chords = [
        [174.61, 220.00, 261.63], // F - A - C
        [130.81, 196.00, 246.94]  // C - G - B
      ];
    } else {
      // THE LIGHT KEEPER - Majestic celestial chord
      chords = [
        [146.83, 220.00, 293.66, 369.99], // D - A - D - F#
        [164.81, 246.94, 329.63, 493.88]  // E - B - E - B
      ];
    }

    chords.forEach((chord, step) => {
      const stepTime = now + (step * 1.5);
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.001, stepTime);
        gain.gain.linearRampToValueAtTime(0.15, stepTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 2.4);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(stepTime);
        osc.stop(stepTime + 2.5);
      });
    });
  }
}

window.LastLight.Audio = new SoundEngine();
