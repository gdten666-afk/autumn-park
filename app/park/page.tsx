// app/park/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ParkCanvas from '@/components/park/ParkCanvas';
import ParkScene from '@/components/park/ParkScene';
import PublicPath from '@/components/park/PublicPath';
import CornerTransition from '@/components/space/CornerTransition';
import CornerView from '@/components/space/CornerView';
import LoginModal from '@/components/auth/LoginModal';
import UserMenu from '@/components/auth/UserMenu';
import AdminPanel from '@/components/admin/AdminPanel';
import WeatherLayer from '@/components/weather/WeatherLayer';
import WeatherVote from '@/components/weather/WeatherVote';
import { getSeasonState } from '@/lib/seasons';
import type { SeasonState, Weather, UserSession } from '@/lib/types';

const ParticleOverlay = dynamic(() => import('@/components/park/ParticleOverlay'), { ssr: false });

const SEASON_NAME: Record<string, string> = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
};

export default function ParkPage() {
  const [seasonState, setSeasonState] = useState<SeasonState>(() => getSeasonState());
  const [weather, setWeather] = useState<Weather>('sunny');
  const [session, setSession] = useState<UserSession | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [scrollX, setScrollX] = useState(0);

  // Corner navigation
  const [cornerUserId, setCornerUserId] = useState<string | null>(null);
  const [cornerOwnerName, setCornerOwnerName] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch current weather
  useEffect(() => {
    fetch('/api/weather/today')
      .then(r => r.json())
      .then(data => { if (data.ok) setWeather(data.data.weather); });
  }, []);

  const handleSeasonChange = useCallback((state: SeasonState) => {
    setSeasonState(state);
  }, []);

  // Enter a corner
  const enterCorner = useCallback((userId: string, name?: string) => {
    setCornerUserId(userId);
    setCornerOwnerName(name || '');
    setIsTransitioning(true);
    if (!name) {
      fetch(`/api/space/${userId}`)
        .then(r => r.json())
        .then(data => { if (data.ok) setCornerOwnerName(data.data.owner_name); });
    }
  }, []);

  const exitCorner = useCallback(() => {
    setIsTransitioning(false);
    setTimeout(() => setCornerUserId(null), 1500);
  }, []);

  const handleLogin = useCallback((userSession: UserSession) => {
    setSession(userSession);
    setShowLogin(false);
  }, []);

  const handleLogout = useCallback(() => {
    document.cookie = 'park_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setSession(null);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ParkCanvas onSeasonChange={handleSeasonChange} onScroll={setScrollX}>
        {/* Scene layer (trees, ground, sky) */}
        <ParkScene seasonState={seasonState} weather={weather} scrollX={scrollX} />

        {/* Welcome area at the start */}
        <div className="absolute z-10" style={{ left: '2vw', top: '28vh' }}>
          <div className="flex flex-col items-start max-w-sm">
            <p className="text-white/20 text-xs tracking-[0.3em] mb-2">
              {SEASON_NAME[seasonState.season]} · 四季公园
            </p>
            <h1 className="text-3xl text-white/70 font-serif tracking-widest mb-3 leading-relaxed"
              style={{ fontFamily: '"Noto Serif SC", serif' }}>
              一个在秋天等花开的人
            </h1>
            <p className="text-white/25 text-xs leading-relaxed max-w-xs">
              沿着小径漫步，走进每个人用照片和天气建成的角落。
              <br />此刻是<span className="text-white/40">{SEASON_NAME[seasonState.season]}天</span>，公园正向你敞开。
            </p>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute z-10 bottom-8 left-1/2 -translate-x-1/2 animate-pulse"
          style={{ animationDuration: '3s' }}>
          <p className="text-white/15 text-xs tracking-widest">向右漫步 →</p>
        </div>

        <PublicPath />
      </ParkCanvas>

      <ParticleOverlay seasonState={seasonState} weather={weather} />
      <WeatherLayer weather={weather} />

      {/* User controls */}
      {session ? (
        <UserMenu
          session={session}
          onEnterCorner={() => enterCorner(session.userId, session.name)}
          onOpenAdmin={() => setShowAdmin(true)}
          onLogout={handleLogout}
        />
      ) : (
        <button
          onClick={() => setShowLogin(true)}
          className="fixed top-4 right-4 z-30 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm text-white/60 transition-colors"
        >
          进入我的角落
        </button>
      )}

      <WeatherVote />

      {/* Corner transition + view */}
      {cornerUserId && (
        <>
          <CornerTransition
            isEntering={isTransitioning}
            onEntered={() => setIsTransitioning(false)}
            onExited={exitCorner}
            ownerName={cornerOwnerName}
          />
          {!isTransitioning && (
            <CornerView
              userId={cornerUserId}
              isOwner={session?.userId === cornerUserId}
              onExit={exitCorner}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showLogin && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showAdmin && session?.role === 'operator' && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
