type SoundEffect = 'place' | 'clear' | 'invalid' | 'coin' | 'win';

class SoundPlayer {
  private readonly cache = new Map<SoundEffect, HTMLAudioElement>();
  private audioCtx: AudioContext | null = null;

  private getAudio(name: SoundEffect): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null;
    let el = this.cache.get(name);
    if (!el) {
      el = new Audio(`/sounds/${name}.wav`);
      el.preload = 'auto';
      this.cache.set(name, el);
    }
    return el;
  }

  private playSynthFallback(name: SoundEffect): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const playTone = (freq: number, startOffset: number, duration: number, gainPeak = 0.14) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.02);
      };

      switch (name) {
        case 'place':
          playTone(620, 0, 0.08, 0.14);
          break;
        case 'clear':
          playTone(523.25, 0, 0.09, 0.12);
          playTone(659.25, 0.08, 0.09, 0.12);
          playTone(783.99, 0.16, 0.14, 0.14);
          break;
        case 'invalid':
          playTone(150, 0, 0.12, 0.14);
          break;
        case 'coin':
          playTone(900, 0, 0.06, 0.12);
          playTone(1300, 0.06, 0.09, 0.12);
          break;
        case 'win':
          playTone(523.25, 0, 0.1, 0.12);
          playTone(659.25, 0.1, 0.1, 0.12);
          playTone(783.99, 0.2, 0.1, 0.12);
          playTone(1046.5, 0.3, 0.25, 0.15);
          break;
      }
    } catch {
      // Non-fatal
    }
  }

  private play(name: SoundEffect, enabled: boolean): void {
    if (!enabled) return;
    try {
      const base = this.getAudio(name);
      if (base) {
        const clone = base.cloneNode(true) as HTMLAudioElement;
        clone.volume = 0.6;
        void clone.play().catch(() => this.playSynthFallback(name));
        return;
      }
      this.playSynthFallback(name);
    } catch {
      this.playSynthFallback(name);
    }
  }

  playPlace(enabled: boolean): void {
    this.play('place', enabled);
  }
  playClear(enabled: boolean): void {
    this.play('clear', enabled);
  }
  playInvalid(enabled: boolean): void {
    this.play('invalid', enabled);
  }
  playCoin(enabled: boolean): void {
    this.play('coin', enabled);
  }
  playWin(enabled: boolean): void {
    this.play('win', enabled);
  }
}

export const soundPlayer = new SoundPlayer();
