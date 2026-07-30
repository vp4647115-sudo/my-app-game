// Web Audio API Synthesizer for tactile wooden and ivory impact chess sounds

export interface ChessAudioOptions {
  captured?: boolean;
  inCheck?: boolean;
  isCheckmate?: boolean;
  isCastle?: boolean;
  isPromotion?: boolean;
  isDraw?: boolean;
  victory?: boolean;
}

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

  // Helper to normalize volume (0 to 100) -> 0.0 to 1.0
  private getVol(vol: number = 80): number {
    const raw = typeof vol === 'number' ? vol : 80;
    return Math.max(0, Math.min(1, raw / 100));
  }

  // Play standard wooden move sound (smooth sub thud + ivory contact click)
  playMove(volume: number = 80) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const v = this.getVol(volume);
      const now = ctx.currentTime;

      // Low impact thud (walnut board resonance)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.08);

      gain.gain.setValueAtTime(0.45 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

      // High tactile click (felt & wood contact)
      const bufferSize = Math.floor(ctx.sampleRate * 0.02);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1900;
      filter.Q.value = 3.5;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25 * v, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('Audio playMove failed:', e);
    }
  }

  // Play capture impact sound (heavier double-knock clatter)
  playCapture(volume: number = 80) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const v = this.getVol(volume);
      this.playMove(volume);

      setTimeout(() => {
        if (!ctx) return;
        const now2 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(230, now2);
        osc.frequency.exponentialRampToValueAtTime(55, now2 + 0.11);

        gain.gain.setValueAtTime(0.6 * v, now2);
        gain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now2);
        osc.stop(now2 + 0.11);
      }, 35);
    } catch (e) {
      console.warn('Audio playCapture failed:', e);
    }
  }

  // Play castling sound (rapid dual wooden slide & snap)
  playCastle(volume: number = 80) {
    this.playMove(volume);
    setTimeout(() => {
      this.playMove(volume);
    }, 90);
  }

  // Play pawn promotion sound (majestic ascending chime)
  playPromote(volume: number = 80) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const v = this.getVol(volume);
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3 * v, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (e) {
      console.warn('Audio playPromote failed:', e);
    }
  }

  // Play check alert chime (resonant harmonic bell)
  playCheck(volume: number = 80) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const v = this.getVol(volume);
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18); // E6

      gain.gain.setValueAtTime(0.4 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio playCheck failed:', e);
    }
  }

  // Play victory / defeat / checkmate fanfare
  playGameEnd(victory: boolean, volume: number = 80) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const v = this.getVol(volume);
      const now = ctx.currentTime;
      const notes = victory
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // C Major 7th Fanfare
        : [392.00, 369.99, 329.63, 261.63]; // Somber descending minor

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.12;

        osc.type = victory ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.35 * v, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch (e) {
      console.warn('Audio playGameEnd failed:', e);
    }
  }

  // Play draw sound (warm ambient resolution swell)
  playDraw(volume: number = 80) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const v = this.getVol(volume);
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(554.37, now + 0.3); // C#5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25 * v, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio playDraw failed:', e);
    }
  }

  // Play low-time ticker pulse
  playLowTime(volume: number = 80) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const v = this.getVol(volume);
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.2 * v, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio playLowTime failed:', e);
    }
  }

  // Auto-detect move audio cue based on options
  playMoveCue(options: ChessAudioOptions, volume: number = 80) {
    if (options.isCheckmate) {
      this.playGameEnd(options.victory ?? true, volume);
    } else if (options.isDraw) {
      this.playDraw(volume);
    } else if (options.inCheck) {
      this.playCheck(volume);
    } else if (options.isPromotion) {
      this.playPromote(volume);
    } else if (options.isCastle) {
      this.playCastle(volume);
    } else if (options.captured) {
      this.playCapture(volume);
    } else {
      this.playMove(volume);
    }
  }
}

export const soundService = new SoundService();
