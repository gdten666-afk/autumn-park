'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Weather } from '@/lib/types';
import { DEFAULT_PLAYLIST, trackName } from '@/lib/playlist';

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

type PlayerState = { playing: boolean; trackName: string; index: number };

class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playlist: string[] = [];
  private order: string[] = [];
  private currentIdx = 0;
  private vol = 0.3;
  private fadeTimers = new Set<ReturnType<typeof setInterval>>();
  private fadingOut: HTMLAudioElement[] = [];
  private stopped = true;
  private listeners = new Set<(s: PlayerState) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      // 首次用户交互后轻柔淡入启动（若用户本会话未主动关闭过音乐）
      window.addEventListener('pointerdown', () => this.autoStart(), { once: true });
      window.addEventListener('keydown', () => this.autoStart(), { once: true });
    }
  }

  subscribe(fn: (s: PlayerState) => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private emit() {
    const active = Boolean(this.audio && !this.stopped && !this.audio.paused);
    const state: PlayerState = {
      playing: active,
      trackName: active ? trackName(this.order[this.currentIdx]) : '',
      index: this.currentIdx,
    };
    this.listeners.forEach(l => l(state));
  }

  private autoStart() {
    if (this.stopped && !sessionStorage.getItem('park_music_off')) {
      if (this.playlist.length === 0) this.playlist = DEFAULT_PLAYLIST;
      this.startQuietly();
    }
  }

  private shuffle() {
    const arr = [...this.playlist];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private fadeElement(el: HTMLAudioElement, target: number, ms: number, done?: () => void): void {
    const from = el.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    const timer = setInterval(() => {
      i++;
      el.volume = from + (target - from) * (i / steps);
      if (i >= steps) {
        clearInterval(timer);
        this.fadeTimers.delete(timer);
        el.volume = target;
        done?.();
      }
    }, 50);
    this.fadeTimers.add(timer);
  }

  private fadeTo(target: number, ms: number, done?: () => void) {
    const el = this.audio;
    if (!el) { done?.(); return; }
    this.fadeElement(el, target, ms, done);
  }

  private clearFades() {
    this.fadeTimers.forEach(t => clearInterval(t));
    this.fadeTimers.clear();
  }

  private playTrack(url: string, crossfade = true) {
    const prev = this.audio;
    this.fadingOut.forEach(a => { try { a.pause(); } catch {} });
    this.fadingOut = [];

    const audio = new Audio(url);
    audio.volume = 0;
    audio.loop = false;
    audio.onended = () => this.next();
    audio.onerror = () => this.next();
    this.audio = audio;
    audio.play()?.catch(() => {});

    if (prev && crossfade && !prev.paused) {
      // 交叉淡入淡出：旧曲继续播放并淡出，新曲淡入，结束后再停旧曲
      prev.onended = null;
      prev.onerror = null;
      this.fadingOut.push(prev);
      this.fadeElement(audio, this.vol, 1000);
      this.fadeElement(prev, 0, 1000, () => {
        try { prev.pause(); } catch {}
        this.fadingOut = this.fadingOut.filter(a => a !== prev);
      });
    } else {
      this.fadeElement(audio, this.vol, 1000);
    }
    this.emit();
  }

  startQuietly() {
    this.stopped = false;
    if (!this.audio && this.order.length === 0) {
      this.order = this.shuffle();
      this.currentIdx = 0;
      this.playTrack(this.order[0], true);
    } else if (this.audio) {
      this.audio.play()?.catch(() => {});
      this.fadeTo(this.vol, 1200);
      this.emit();
    }
  }

  async play(playlist: string[]) {
    if (playlist.length === 0) return false;
    this.playlist = playlist;
    this.order = this.shuffle();
    this.currentIdx = 0;
    this.stopped = false;
    this.playTrack(this.order[0], true);
    return true;
  }

  pause() {
    if (!this.audio || this.stopped) return;
    this.fadeTo(0, 500, () => { this.audio?.pause(); this.emit(); });
  }

  resume() {
    if (this.stopped || !this.audio) return;
    this.audio.play()?.catch(() => {});
    this.fadeTo(this.vol, 800);
    this.emit();
  }

  toggle() {
    if (this.stopped) { this.startQuietly(); return; }
    if (this.audio && !this.audio.paused) this.pause();
    else this.resume();
  }

  next() {
    if (this.order.length === 0) return;
    this.stopped = false;
    this.currentIdx = (this.currentIdx + 1) % this.order.length;
    this.playTrack(this.order[this.currentIdx], true);
  }

  prev() {
    if (this.order.length === 0) return;
    this.stopped = false;
    this.currentIdx = (this.currentIdx - 1 + this.order.length) % this.order.length;
    this.playTrack(this.order[this.currentIdx], true);
  }

  setVolume(v: number) {
    this.vol = Math.max(0, Math.min(1, v));
    if (this.audio && !this.audio.paused) this.fadeTo(this.vol, 200);
  }

  resumeSafe(): boolean {
    return this.playlist.length > 0 && !this.stopped;
  }

  isActive(): boolean {
    return Boolean(this.audio && !this.stopped && !this.audio.paused);
  }

  stop() {
    sessionStorage.setItem('park_music_off', '1');
    this.stopped = true;
    this.stopAudio();
    this.emit();
  }

  teardown() {
    this.stopped = true;
    this.stopAudio();
    this.emit();
  }

  private stopAudio() {
    this.clearFades();
    this.fadingOut.forEach(a => { try { a.pause(); } catch {} });
    this.fadingOut = [];
    if (this.audio) { this.audio.pause(); this.audio.onended = null; this.audio.onerror = null; this.audio = null; }
  }
}

// === Singletons ===
const weatherAudio = new WeatherAudio();
const musicPlayer = new MusicPlayer();

// === React component ===

interface AmbientSoundProps {
  weather: Weather;
  scene?: string;
  placement?: 'masthead' | 'corner';
}

export default function AmbientSound({ weather, scene, placement = 'corner' }: AmbientSoundProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [player, setPlayer] = useState<PlayerState>({ playing: false, trackName: '', index: 0 });
  const [volume, setVolume] = useState(0.3);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const unsubscribe = musicPlayer.subscribe(setPlayer);
    return unsubscribe;
  }, []);

  const toggleSound = useCallback(async () => {
    if (soundOn) { weatherAudio.stop(); setSoundOn(false); }
    else { const ok = await weatherAudio.play(weather); if (ok) setSoundOn(true); }
  }, [soundOn, weather]);

  const toggleMusic = useCallback(() => {
    if (player.playing) musicPlayer.pause();
    else if (musicPlayer.resumeSafe()) musicPlayer.resume();
    else {
      musicPlayer.play(DEFAULT_PLAYLIST);
    }
  }, [player.playing]);

  // 天气变化时更新环境音
  useEffect(() => {
    if (loaded.current && soundOn) { weatherAudio.stop(); weatherAudio.play(weather).then(ok => { if (!ok) setSoundOn(false); }); }
  }, [weather]); // eslint-disable-line
  useEffect(() => { loaded.current = true; }, []);

  // 音乐是全局单例，跨场景持续播放同一首歌，不做任何切歌。
  // 只有公园页根实例（无 scene）卸载时才完全停止；角落实例卸载只停它自己的天气音效。
  useEffect(() => {
    return () => {
      weatherAudio.stop();
      if (!scene) musicPlayer.teardown();
    };
  }, [scene]);

  const hasWeatherSound = weather !== 'sunny' && weather !== 'cloudy';

  const changeVolume = (v: number) => {
    setVolume(v);
    musicPlayer.setVolume(v);
  };

  return (
    <div className={placement === 'masthead'
      ? 'flex gap-2 items-center'
      : 'fixed bottom-4 left-4 md:left-[calc(var(--panel-w)+40px)] z-25 flex gap-2 items-end max-md:bottom-4 max-md:left-2'}>
      {/* 天气音效 */}
      <button onClick={toggleSound}
        className={`chip ${soundOn ? '!border-[rgba(193,95,60,0.45)] !text-[var(--accent)]' : ''}`}
        title={soundOn ? '关闭天气音效' : '开启天气音效'}>
        <span>{soundOn ? '◍' : '○'}</span>
        <span className="hidden md:inline">{hasWeatherSound ? (soundOn ? '天气音效' : '天气音') : '无'}</span>
      </button>

      {/* 音乐 */}
      <div className="relative">
        <div className="chip cursor-pointer select-none" onClick={toggleMusic} title={player.playing ? '暂停' : '播放'}>
          <span>{player.playing ? 'Ⅱ' : '▶'}</span>
          <b className="hidden md:inline" style={{ color: 'var(--ink)', fontWeight: 600 }}>{player.trackName || '背景音乐'}</b>
          <button
            className="ml-1 text-[11px]"
            style={{ color: 'var(--ink-weak)' }}
            onClick={e => { e.stopPropagation(); setShowMusicPanel(v => !v); }}
            title="播放设置"
          >⋯</button>
        </div>
        {showMusicPanel && (
          <div className="glass-strong absolute bottom-11 left-0 w-56 p-4" style={{ zIndex: 30 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>{player.trackName || '背景音乐'}</span>
              <span className="text-[10px]" style={{ color: 'var(--ink-weak)' }}>{player.playing ? '播放中' : '已暂停'}</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <button className="glass-btn !px-3 !py-1.5" style={{ minWidth: 40, minHeight: 32 }} onClick={() => musicPlayer.prev()} title="上一首">⏮</button>
              <button className="glass-btn !px-3 !py-1.5" style={{ minWidth: 40, minHeight: 32 }} onClick={() => musicPlayer.toggle()} title="播放/暂停">{player.playing ? '暂停' : '播放'}</button>
              <button className="glass-btn !px-3 !py-1.5" style={{ minWidth: 40, minHeight: 32 }} onClick={() => musicPlayer.next()} title="下一首">⏭</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'var(--ink-weak)' }}>音量</span>
              <input
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={e => changeVolume(parseFloat(e.target.value))}
                className="flex-1" style={{ accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
