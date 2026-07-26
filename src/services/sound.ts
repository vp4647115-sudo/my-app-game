// Web Audio API Synthesizer for tactile wooden and ivory impact sounds

class SoundService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play wooden move sound
  playMove(volume: number = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Low impact thump (walnut board resonance)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(0.5 * (volume / 100), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

      // High tactile click (ivory impact)
      const bufferSize = ctx.sampleRate * 0.02;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 3;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3 * (volume / 100), now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Play capture impact sound
  playCapture(volume: number = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Heavier double knock
      this.playMove(volume);

      setTimeout(() => {
        if (!ctx) return;
        const now2 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now2);
        osc.frequency.exponentialRampToValueAtTime(60, now2 + 0.12);

        gain.gain.setValueAtTime(0.7 * (volume / 100), now2);
        gain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now2);
        osc.stop(now2 + 0.12);
      }, 30);
    } catch (e) {
      console.warn('Capture sound failed:', e);
    }
  }

  // Play check alert chime
  playCheck(volume: number = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6

      gain.gain.setValueAtTime(0.4 * (volume / 100), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Check sound failed:', e);
    }
  }

  // Play victory / defeat fanfare
  playGameEnd(victory: boolean, volume: number = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = victory ? [523.25, 659.25, 783.99, 1046.50] : [400, 350, 300, 250];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.1;

        osc.type = victory ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.3 * (volume / 100), noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } catch (e) {
      console.warn('Game end sound failed:', e);
    }
  }
}

export const soundService = new SoundService();
