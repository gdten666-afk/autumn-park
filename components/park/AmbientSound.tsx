'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Weather, Scene } from '@/lib/types';

// === Weather sounds (noise-based) ===

class WeatherAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private cleanup: (() => void) | null = null;
  private vol = 0.35;

  private init() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  private noise(len: number, color: 'white' | 'pink' | 'brown'): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (color === 'pink' || color === 'brown') {
      let b0 = 0, b1 = 0;
      for (let i = 0; i < len; i++) {
        if (color === 'pink') {
          b0 = 0.99886 * b0 + d[i] * 0.0555179;
          b1 = 0.99332 * b1 + d[i] * 0.0750759;
          d[i] = (b0 + b1 + d[i] * 0.048) * 0.5;
        } else {
          b0 = (b0 + d[i] * 0.02) * 0.99;
          d[i] = b0 * 3;
        }
      }
    }
    return buf;
  }

  private playNoise(ctx: AudioContext, color: 'white' | 'pink' | 'brown', filterFreq: number, filterQ: number, gainVal: number, lfoFreq = 0): AudioNode[] {
    const nodes: AudioNode[] = [];
    const src = ctx.createBufferSource();
    src.buffer = this.noise(ctx.sampleRate * 3, color);
    src.loop = true;
    nodes.push(src);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    nodes.push(filter);
    src.connect(filter);

    if (lfoFreq > 0) {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = lfoFreq;
      nodes.push(lfo);
      const lfoG = ctx.createGain(); lfoG.gain.value = filterFreq * 0.3;
      nodes.push(lfoG);
      lfo.connect(lfoG); lfoG.connect(filter.frequency);
      lfo.start();
    }

    const gain = ctx.createGain(); gain.gain.value = gainVal;
    nodes.push(gain);
    filter.connect(gain); gain.connect(this.master!);
    src.start();
    return nodes;
  }

  async play(weather: Weather) {
    this.stop();
    if (weather === 'sunny' || weather === 'cloudy') return false;
    this.init();
    const ctx = this.ctx!;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { return false; } }

    const allNodes: AudioNode[] = [];

    if (weather === 'light-rain') {
      allNodes.push(...this.playNoise(ctx, 'pink', 3500, 0.4, 0.2, 0.15));
    } else if (weather === 'heavy-rain') {
      allNodes.push(...this.playNoise(ctx, 'pink', 2500, 0.7, 0.35, 0.3));
      // Lower rumble layer
      allNodes.push(...this.playNoise(ctx, 'brown', 200, 0.5, 0.12, 0));
    } else if (weather === 'fog' || weather === 'snow') {
      allNodes.push(...this.playNoise(ctx, 'brown', 250, 0.3, 0.12, 0.08));
    }

    this.cleanup = () => allNodes.forEach(n => { try { (n as any).stop?.(); } catch {} });
    this.master!.gain.setTargetAtTime(this.vol, ctx.currentTime + 0.1, 2);
    return true;
  }

  stop() { if (this.cleanup) { this.cleanup(); this.cleanup = null; } }
  setVolume(v: number) { this.vol = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.3); }
}

// === Procedural music generator ===

type MusicMood = 'calm' | 'warm' | 'melancholic' | 'reflective';

const SCENE_MOOD: Partial<Record<Scene, MusicMood>> = {
  'autumn-bench': 'calm',
  'darkroom': 'melancholic',
  'starlit-camp': 'warm',
  'lighthouse-coast': 'melancholic',
  'bookstore': 'reflective',
};

// Pentatonic scales
const SCALES: Record<MusicMood, { notes: number[]; baseOctave: number; tempo: number }> = {
  calm:        { notes: [0,2,4,7,9], baseOctave: 4, tempo: 3.5 },    // C D E G A — major pentatonic
  warm:        { notes: [0,2,4,7,9], baseOctave: 3, tempo: 4.5 },    // lower, slower
  melancholic: { notes: [0,3,5,7,10], baseOctave: 4, tempo: 5 },     // C Eb F G Bb — minor pentatonic
  reflective:  { notes: [0,2,4,7,9], baseOctave: 5, tempo: 6 },      // higher, sparse
};

class MusicGenerator {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private playing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private vol = 0.12;

  private init() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    // Add subtle reverb via delayed feedback
    const delay = this.ctx.createDelay(0.4);
    delay.delayTime.value = 0.35;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.25;
    delay.connect(feedback); feedback.connect(delay);
    this.master.connect(delay);
    delay.connect(this.ctx.destination);
  }

  private playNote(freq: number, duration: number, velocity = 0.6) {
    const ctx = this.ctx!;
    // Soft sine pad
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(velocity, ctx.currentTime + 0.3);
    env.gain.linearRampToValueAtTime(velocity * 0.5, ctx.currentTime + duration * 0.7);
    env.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    // Add subtle harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    const env2 = ctx.createGain();
    env2.gain.setValueAtTime(0, ctx.currentTime);
    env2.gain.linearRampToValueAtTime(velocity * 0.3, ctx.currentTime + 0.2);
    env2.gain.linearRampToValueAtTime(0, ctx.currentTime + duration * 0.5);

    osc.connect(env); env.connect(this.master!);
    osc2.connect(env2); env2.connect(this.master!);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.5);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + duration + 0.5);
  }

  private scheduleNote(mood: MusicMood) {
    const cfg = SCALES[mood];
    const scale = cfg.notes;
    const octave = cfg.baseOctave;
    const rootFreq = 130.81 * Math.pow(2, octave - 3); // C in chosen octave

    // Pick random note from scale
    const noteIdx = Math.floor(Math.random() * scale.length);
    const note = scale[noteIdx];
    // Occasionally jump up an octave
    const o = Math.random() < 0.2 ? 1 : 0;
    const freq = rootFreq * Math.pow(2, (note + o * 12) / 12);

    // Duration: long, sustained notes
    const duration = cfg.tempo * (0.5 + Math.random() * 1.5);

    // Velocity: gentle
    const vel = 0.4 + Math.random() * 0.4;

    this.playNote(freq, duration, vel);

    // Schedule next note
    const nextDelay = duration * 800 + Math.random() * cfg.tempo * 500;
    this.timer = setTimeout(() => { if (this.playing) this.scheduleNote(mood); }, nextDelay);
  }

  // Drone: sustained bass note
  private droneInterval: ReturnType<typeof setInterval> | null = null;
  private startDrone(freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.value = 0.04;
    osc.connect(env); env.connect(this.master!);
    osc.start();
    // Pulse the drone slowly
    this.droneInterval = setInterval(() => {
      env.gain.setTargetAtTime(0.03 + Math.random() * 0.03, ctx.currentTime, 2);
    }, 4000);
  }

  async play(mood: MusicMood) {
    this.stop();
    this.init();
    const ctx = this.ctx!;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { return false; } }

    this.playing = true;
    this.master!.gain.setTargetAtTime(this.vol, ctx.currentTime + 0.5, 3);

    // Start drone
    const rootFreq = 130.81 * Math.pow(2, SCALES[mood].baseOctave - 3);
    this.startDrone(rootFreq);

    // Start melody
    this.scheduleNote(mood);
    return true;
  }

  stop() {
    this.playing = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.droneInterval) { clearInterval(this.droneInterval); this.droneInterval = null; }
  }

  setVolume(v: number) { this.vol = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.3); }
}

// === Singletons ===
const weatherAudio = new WeatherAudio();
const musicGen = new MusicGenerator();

// === React component ===

interface AmbientSoundProps {
  weather: Weather;
  scene?: string;
}

export default function AmbientSound({ weather, scene }: AmbientSoundProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const loaded = useRef(false);

  // Determine mood from scene
  const mood: MusicMood | null = (scene ? SCENE_MOOD[scene as Scene] : null) || null;

  const toggleSound = useCallback(async () => {
    if (soundOn) { weatherAudio.stop(); setSoundOn(false); }
    else {
      const ok = await weatherAudio.play(weather);
      if (ok) setSoundOn(true);
    }
  }, [soundOn, weather]);

  const toggleMusic = useCallback(async () => {
    if (musicOn) { musicGen.stop(); setMusicOn(false); }
    else if (mood) {
      const ok = await musicGen.play(mood);
      if (ok) setMusicOn(true);
    }
  }, [musicOn, mood]);

  // Update weather sound when weather changes
  useEffect(() => {
    if (loaded.current && soundOn) { weatherAudio.stop(); weatherAudio.play(weather).then(ok => { if (!ok) setSoundOn(false); }); }
  }, [weather]); // eslint-disable-line
  useEffect(() => { loaded.current = true; }, []);

  // Stop on unmount
  useEffect(() => () => { weatherAudio.stop(); musicGen.stop(); }, []);

  const hasWeatherSound = weather !== 'sunny' && weather !== 'cloudy';

  return (
    <div className="fixed bottom-4 left-[170px] z-25 flex gap-2 max-md:bottom-16 max-md:left-[100px] max-md:gap-1">
      {/* Weather sound button */}
      <button onClick={toggleSound}
        className={`glass-btn flex items-center gap-1.5 !px-3 !py-1.5 text-xs transition-all ${soundOn ? '!bg-blue-100/50 !text-blue-700/60' : ''}`}
        title={soundOn ? '关闭天气音效' : '开启天气音效'}>
        <span className="text-sm">{soundOn ? '🌧' : '🔇'}</span>
        <span className="hidden md:inline text-black/25 text-[10px]">
          {hasWeatherSound ? (soundOn ? '音效' : '天气音') : '无'}
        </span>
      </button>

      {/* Music button */}
      <button onClick={toggleMusic}
        className={`glass-btn flex items-center gap-1.5 !px-3 !py-1.5 text-xs transition-all ${musicOn ? '!bg-purple-100/50 !text-purple-700/60' : ''}`}
        title={musicOn ? '关闭背景音乐' : '开启背景音乐'}>
        <span className="text-sm">{musicOn ? '🎵' : '🎶'}</span>
        <span className="hidden md:inline text-black/25 text-[10px]">
          {mood ? (musicOn ? '播放' : '音乐') : '无'}
        </span>
      </button>
    </div>
  );
}
