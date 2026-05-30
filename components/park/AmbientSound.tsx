'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Weather, Scene } from '@/lib/types';

// Weather → sound type
const WEATHER_SOUND: Record<Weather, 'rain-light' | 'rain-heavy' | 'wind' | 'none'> = {
  'sunny': 'none',
  'cloudy': 'wind',
  'light-rain': 'rain-light',
  'heavy-rain': 'rain-heavy',
  'fog': 'wind',
  'snow': 'wind',
};

// Scene → extra ambient layer
const SCENE_AMBIENT: Partial<Record<Scene, 'fire' | 'waves' | 'pages'>> = {
  'starlit-camp': 'fire',
  'lighthouse-coast': 'waves',
  'bookstore': 'pages',
};

// === Web Audio sound generators ===

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private running = false;
  private volume = 0;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private noiseNode(ctx: AudioContext, color: 'white' | 'pink' | 'brown'): AudioNode {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // Generate noise
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Approximate pink/brown noise with simple filtering
    if (color === 'pink' || color === 'brown') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const white = data[i];
        if (color === 'pink') {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          data[i] = b0 + b1 + white * 0.048;
        } else {
          b0 = (b0 + white * 0.02) * 0.99;
          data[i] = b0;
        }
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    return source;
  }

  // Rain: filtered noise with modulation
  private createRain(heavy: boolean): { nodes: AudioNode[]; cleanup: () => void } {
    const ctx = this.getCtx();
    const nodes: AudioNode[] = [];

    // Base noise
    const noise = this.noiseNode(ctx, 'pink') as AudioBufferSourceNode;
    nodes.push(noise);

    // Bandpass filter for rain sound (focus on mid-high frequencies)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = heavy ? 3000 : 4000;
    filter.Q.value = heavy ? 0.8 : 0.5;
    nodes.push(filter);

    noise.connect(filter);

    // Rain intensity modulation (gentle variation)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = heavy ? 0.3 : 0.15;
    nodes.push(lfo);

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = heavy ? 0.4 : 0.25;
    nodes.push(lfoGain);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Gain for this sound
    const gain = ctx.createGain();
    gain.gain.value = heavy ? 0.35 : 0.2;
    nodes.push(gain);

    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();

    return { nodes, cleanup: () => { try { noise.stop(); lfo.stop(); } catch {} } };
  }

  // Wind: low-frequency brown noise with slow modulation
  private createWind(): { nodes: AudioNode[]; cleanup: () => void } {
    const ctx = this.getCtx();
    const nodes: AudioNode[] = [];

    const noise = this.noiseNode(ctx, 'brown') as AudioBufferSourceNode;
    nodes.push(noise);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    nodes.push(filter);

    noise.connect(filter);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    nodes.push(lfo);

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    nodes.push(lfoGain);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    nodes.push(gain);

    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();

    return { nodes, cleanup: () => { try { noise.stop(); lfo.stop(); } catch {} } };
  }

  // Fire crackle: high-frequency noise bursts + low rumble
  private createFire(): { nodes: AudioNode[]; cleanup: () => void } {
    const ctx = this.getCtx();
    const nodes: AudioNode[] = [];

    // High crackle
    const noise = this.noiseNode(ctx, 'white') as AudioBufferSourceNode;
    nodes.push(noise);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    nodes.push(hp);

    noise.connect(hp);

    // Rapid amplitude modulation for crackling effect
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 12;
    nodes.push(lfo);

    const ampMod = ctx.createGain();
    ampMod.gain.value = 1;
    nodes.push(ampMod);

    // Use lfo to modulate crackle intensity via a waveshaper
    // Simpler: just connect with low gain
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    nodes.push(gain);

    hp.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();
    lfo.start();

    return { nodes, cleanup: () => { try { noise.stop(); lfo.stop(); } catch {} } };
  }

  // Waves: low oscillation
  private createWaves(): { nodes: AudioNode[]; cleanup: () => void } {
    const ctx = this.getCtx();
    const nodes: AudioNode[] = [];

    const noise = this.noiseNode(ctx, 'brown') as AudioBufferSourceNode;
    nodes.push(noise);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    nodes.push(filter);

    noise.connect(filter);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // ~8 second wave cycle
    nodes.push(lfo);

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 100;
    nodes.push(lfoGain);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    nodes.push(gain);

    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();

    return { nodes, cleanup: () => { try { noise.stop(); lfo.stop(); } catch {} } };
  }

  // Pages: subtle high-frequency rustle
  private createPages(): { nodes: AudioNode[]; cleanup: () => void } {
    const ctx = this.getCtx();
    const nodes: AudioNode[] = [];

    const noise = this.noiseNode(ctx, 'white') as AudioBufferSourceNode;
    nodes.push(noise);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 6000;
    filter.Q.value = 0.3;
    nodes.push(filter);

    noise.connect(filter);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    nodes.push(lfo);

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    nodes.push(lfoGain);

    const ampGain = ctx.createGain();
    ampGain.gain.value = 0;
    nodes.push(ampGain);

    lfo.connect(lfoGain);
    lfoGain.connect(ampGain.gain);
    filter.connect(ampGain);
    ampGain.connect(this.masterGain!);

    lfo.start();
    noise.start();

    return { nodes, cleanup: () => { try { noise.stop(); lfo.stop(); } catch {} } };
  }

  private cleanup: (() => void) | null = null;

  async play(weather: Weather, scene?: string) {
    if (this.running) this.stop();

    const wType = WEATHER_SOUND[weather] || 'none';
    const sType = (scene ? SCENE_AMBIENT[scene as Scene] : undefined) || undefined;

    if (wType === 'none' && !sType) return;

    const ctx = this.getCtx();

    // Resume suspended context (browser autoplay policy)
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }

    this.activeNodes = [];
    const cleanups: (() => void)[] = [];

    // Weather layer
    if (wType === 'rain-light') { const r = this.createRain(false); this.activeNodes.push(...r.nodes); cleanups.push(r.cleanup); }
    else if (wType === 'rain-heavy') { const r = this.createRain(true); this.activeNodes.push(...r.nodes); cleanups.push(r.cleanup); }
    else if (wType === 'wind') { const r = this.createWind(); this.activeNodes.push(...r.nodes); cleanups.push(r.cleanup); }

    // Scene layer
    if (sType === 'fire') { const r = this.createFire(); this.activeNodes.push(...r.nodes); cleanups.push(r.cleanup); }
    else if (sType === 'waves') { const r = this.createWaves(); this.activeNodes.push(...r.nodes); cleanups.push(r.cleanup); }
    else if (sType === 'pages') { const r = this.createPages(); this.activeNodes.push(...r.nodes); cleanups.push(r.cleanup); }

    this.cleanup = () => cleanups.forEach(c => c());
    this.running = true;

    // Fade in to target volume
    this.masterGain!.gain.setTargetAtTime(this.volume, ctx.currentTime + 0.1, 2);
  }

  stop() {
    if (this.cleanup) this.cleanup();
    this.activeNodes = [];
    this.running = false;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.5);
    }
  }

  getVolume() { return this.volume; }
}

// Singleton engine
let engine: SoundEngine | null = null;
function getEngine(): SoundEngine {
  if (!engine) engine = new SoundEngine();
  return engine;
}

// === React component ===

interface AmbientSoundProps {
  weather: Weather;
  scene?: string;
}

export default function AmbientSound({ weather, scene }: AmbientSoundProps) {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const engRef = useRef(getEngine());

  const toggle = useCallback(async () => {
    const eng = engRef.current;
    if (enabled) {
      eng.stop();
      setEnabled(false);
    } else {
      eng.setVolume(volume);
      await eng.play(weather, scene);
      setEnabled(true);
    }
  }, [enabled, weather, scene, volume]);

  // Update sound when weather/scene changes
  useEffect(() => {
    if (enabled) engRef.current.play(weather, scene);
  }, [weather, scene]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => { engRef.current.stop(); }, []);

  const scenesWithSound = ['starlit-camp', 'lighthouse-coast', 'bookstore'];
  const hasSound = WEATHER_SOUND[weather] !== 'none' || (!!scene && scenesWithSound.includes(scene));

  return (
    <div className="fixed bottom-4 right-24 z-25 max-md:bottom-16 max-md:right-16">
      <button onClick={toggle}
        className={`glass-btn flex items-center gap-1.5 !px-3 !py-1.5 text-xs transition-all ${enabled ? '!bg-amber-100/60 !text-amber-700/70' : ''}`}
        title={enabled ? '关闭环境音' : '开启环境音'}>
        <span>{enabled ? '🔊' : '🔇'}</span>
        <span className={`hidden md:inline ${enabled ? '' : 'text-black/25'}`}>
          {hasSound ? (enabled ? '音效' : '环境音') : '🎵'}
        </span>
      </button>
    </div>
  );
}
