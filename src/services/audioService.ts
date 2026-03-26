/**
 * Simple Audio Service for SPARKWavv Cinematic Cues
 * Uses Web Audio API for lightweight, zero-asset ambient sounds.
 */

class AudioService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private pulseTimer: any = null;

  private init() {
    if (this.context) return;
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 0.1; // Low default volume
  }

  /**
   * Play a low-frequency ambient hum
   */
  startAmbientHum() {
    this.init();
    if (!this.context || !this.masterGain) return;
    if (this.ambientOsc) return;

    this.ambientOsc = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(40, this.context.currentTime); // 40Hz hum
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, this.context.currentTime);
    
    this.ambientOsc.connect(filter);
    filter.connect(this.masterGain);
    
    this.ambientOsc.start();
    
    // Subtle frequency modulation for "living" feel
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientOsc.frequency);
    lfo.start();
  }

  stopAmbientHum() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc.disconnect();
      this.ambientOsc = null;
    }
  }

  /**
   * Momentum Pulse (Discovery Phase)
   * Rhythmic, driving heartbeat representing forward motion.
   */
  startMomentumPulse() {
    this.init();
    if (!this.context || !this.masterGain) return;
    this.stopAmbientHum();
    if (this.pulseTimer) return;

    const pulse = () => {
      if (!this.context || !this.masterGain) return;
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 0.5);
    };

    pulse();
    this.pulseTimer = setInterval(pulse, 1000);
  }

  stopMomentumPulse() {
    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }
  }

  /**
   * Play a crystalline chime sound
   */
  playChime() {
    this.init();
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // Quick slide up
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2);
  }

  /**
   * Play a "fusion" flare sound
   */
  playFusionFlare() {
    this.init();
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const noise = this.context.createBufferSource();
    const bufferSize = this.context.sampleRate * 1; // 1 second
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;
    
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    filter.Q.value = 10;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 1);
  }

  setVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(val, this.context?.currentTime || 0, 0.1);
    }
  }
}

export const audioService = new AudioService();
