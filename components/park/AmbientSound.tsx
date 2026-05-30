'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Weather, Scene } from '@/lib/types';
import { SCENE_PLAYLIST, DEFAULT_PLAYLIST } from '@/lib/playlist';

// === Weather sound engine (noise-based, same as before) ===

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
    src.loop = true; nodes.push(src);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = filterFreq; filter.Q.value = filterQ;
    nodes.push(filter); src.connect(filter);
    if (lfoFreq > 0) {
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = lfoFreq;
      nodes.push(lfo);
      const lfoG = ctx.createGain(); lfoG.gain.value = filterFreq * 0.3;
      nodes.push(lfoG); lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start();
    }
    const gain = ctx.createGain(); gain.gain.value = gainVal;
    nodes.push(gain); filter.connect(gain); gain.connect(this.master!);
    src.start();
    return nodes;
  }

  async play(weather: Weather) {
    this.stop();
    if (weather === 'sunny' || weather === 'cloudy') return false;
    this.init(); const ctx = this.ctx!;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { return false; } }
    const allNodes: AudioNode[] = [];
    if (weather === 'light-rain') allNodes.push(...this.playNoise(ctx, 'pink', 3500, 0.4, 0.2, 0.15));
    else if (weather === 'heavy-rain') {
      allNodes.push(...this.playNoise(ctx, 'pink', 2500, 0.7, 0.35, 0.3));
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

// === MP3 Music Player ===

class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playlist: string[] = [];
  private currentIdx = -1;
  private vol = 0.3;

  private shuffle() {
    // Fisher-Yates
    const arr = [...this.playlist];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async play(playlist: string[]) {
    this.stop();
    if (playlist.length === 0) return false;
    this.playlist = playlist;
    const shuffled = this.shuffle();
    this.currentIdx = 0;
    this.playTrack(shuffled[0]);
    return true;
  }

  private playTrack(url: string): boolean {
    this.audio = new Audio(url);
    this.audio.volume = this.vol;
    this.audio.loop = false;
    this.audio.onended = () => this.playNext();
    this.audio.onerror = () => this.playNext();
    const promise = this.audio.play();
    if (promise) {
      promise.catch(() => {
        // Autoplay blocked — audio will play after first user interaction
      });
    }
    return true;
  }

  private playNext() {
    if (this.playlist.length === 0) return;
    // Reshuffle when all tracks played
    if (this.currentIdx >= this.playlist.length - 1) {
      const shuffled = this.shuffle();
      this.currentIdx = 0;
      this.playTrack(shuffled[0]);
    } else {
      this.currentIdx++;
      // Use shuffled order by re-shuffling on wrap, otherwise just advance
      this.playTrack(this.playlist[(this.currentIdx) % this.playlist.length]);
    }
  }

  stop() {
    if (this.audio) { this.audio.pause(); this.audio = null; }
  }

  setVolume(v: number) {
    this.vol = v;
    if (this.audio) this.audio.volume = v;
  }
}

// === Singletons ===
const weatherAudio = new WeatherAudio();
const musicPlayer = new MusicPlayer();

// === React component ===

interface AmbientSoundProps {
  weather: Weather;
  scene?: string;
}

export default function AmbientSound({ weather, scene }: AmbientSoundProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const loaded = useRef(false);
  const autoPlayTried = useRef(false);

  // Auto-play music on page load
  const tryAutoPlay = useCallback(async () => {
    if (autoPlayTried.current) return;
    autoPlayTried.current = true;
    const playlist = (scene ? SCENE_PLAYLIST[scene] : null) || DEFAULT_PLAYLIST;
    if (playlist.length === 0) return;
    const ok = await musicPlayer.play(playlist);
    if (ok) setMusicOn(true);
  }, [scene]);

  // Try auto-play immediately; if blocked, try again on first user click
  useEffect(() => {
    tryAutoPlay();
    const onUserClick = () => { tryAutoPlay(); document.removeEventListener('click', onUserClick, true); };
    document.addEventListener('click', onUserClick, true);
    return () => document.removeEventListener('click', onUserClick, true);
  }, [tryAutoPlay]);

  const toggleSound = useCallback(async () => {
    if (soundOn) { weatherAudio.stop(); setSoundOn(false); }
    else { const ok = await weatherAudio.play(weather); if (ok) setSoundOn(true); }
  }, [soundOn, weather]);

  const toggleMusic = useCallback(async () => {
    if (musicOn) { musicPlayer.stop(); setMusicOn(false); }
    else {
      const playlist = (scene ? SCENE_PLAYLIST[scene] : null) || DEFAULT_PLAYLIST;
      if (playlist.length === 0) return;
      const ok = await musicPlayer.play(playlist);
      if (ok) setMusicOn(true);
    }
  }, [musicOn, scene]);

  // Auto-update weather sound
  useEffect(() => {
    if (loaded.current && soundOn) { weatherAudio.stop(); weatherAudio.play(weather).then(ok => { if (!ok) setSoundOn(false); }); }
  }, [weather]); // eslint-disable-line
  useEffect(() => { loaded.current = true; }, []);

  // Cleanup on unmount
  useEffect(() => () => { weatherAudio.stop(); musicPlayer.stop(); }, []);

  const hasWeatherSound = weather !== 'sunny' && weather !== 'cloudy';

  return (
    <div className="fixed bottom-4 left-[250px] z-25 flex gap-2 max-md:bottom-4 max-md:left-[130px] max-md:gap-1">
      <button onClick={toggleSound}
        className={`glass-btn flex items-center gap-1.5 !px-3 !py-1.5 text-xs transition-all ${soundOn ? '!bg-blue-100/50 !text-blue-700/60' : ''}`}
        title={soundOn ? '关闭天气音效' : '开启天气音效'}>
        <span className="text-sm">{soundOn ? '🌧' : '🔇'}</span>
        <span className="hidden md:inline text-black/25 text-[10px]">
          {hasWeatherSound ? (soundOn ? '音效' : '天气音') : '无'}
        </span>
      </button>

      <button onClick={toggleMusic}
        className={`glass-btn flex items-center gap-1.5 !px-3 !py-1.5 text-xs transition-all ${musicOn ? '!bg-purple-100/50 !text-purple-700/60' : ''}`}
        title={musicOn ? '关闭背景音乐' : '开启背景音乐'}>
        <span className="text-sm">{musicOn ? '🎵' : '🎶'}</span>
        <span className="hidden md:inline text-black/25 text-[10px]">
          {musicOn ? '播放' : '音乐'}
        </span>
      </button>
    </div>
  );
}
