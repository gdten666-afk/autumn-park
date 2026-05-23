// app/park/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ParkCanvas from '@/components/park/ParkCanvas';
import ParkScene from '@/components/park/ParkScene';
import GSAPAnimations from '@/components/park/GSAPAnimations';
import PublicPath from '@/components/park/PublicPath';
import CornerTransition from '@/components/space/CornerTransition';
import CornerView from '@/components/space/CornerView';
import LoginModal from '@/components/auth/LoginModal';
import UserMenu from '@/components/auth/UserMenu';
import AdminPanel from '@/components/admin/AdminPanel';
import WeatherLayer from '@/components/weather/WeatherLayer';
import WeatherVote from '@/components/weather/WeatherVote';
import MessageWall from '@/components/park/MessageWall';
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
      <ParkCanvas onSeasonChange={handleSeasonChange}>
        {/* Scene layer (trees, ground, sky) */}
        <ParkScene seasonState={seasonState} weather={weather} />

        {/* Welcome hero */}
        <div className="welcome-text absolute" style={{ left: '4vw', top: '22vh', zIndex: 20 }}>
          <div className="flex flex-col items-start max-w-lg">
            {/* Season badge */}
            <div className="glass-btn inline-flex items-center gap-2 mb-6 cursor-default">
              <span className="w-2 h-2 rounded-full bg-amber-400/50 animate-breathe" />
              <span className="text-white/40 text-xs tracking-wider">
                {SEASON_NAME[seasonState.season]} · 四季公园
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl text-white/80 font-serif tracking-[0.05em] mb-4 leading-tight"
              style={{ fontFamily: '"Noto Serif SC", Georgia, serif', textShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
              一个在秋天<br />等花开的人
            </h1>

            {/* Subtitle */}
            <p className="text-white/30 text-sm leading-relaxed max-w-xs mb-8" style={{ lineHeight: '1.8' }}>
              沿着蜿蜒小径漫步，偶然遇见某个人的照片，
              <br />踏入他用天气和光影建成的角落。
            </p>

            {/* CTA hint */}
            <div className="flex items-center gap-3 text-white/20 text-xs">
              <span className="w-8 h-px bg-white/10" />
              向右漫步，探索公园
              <svg width="14" height="14" viewBox="0 0 14 14" className="opacity-50">
                <path d="M 3,7 L 11,7 M 8,4 L 11,7 L 8,10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Scroll hint — bottom center */}
        <div className="scroll-hint absolute z-10 bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1">
              <div className="w-1 h-2 rounded-full bg-white/20 animate-bounce" style={{animationDuration: '1.5s'}} />
            </div>
            <p className="text-white/10 text-[10px] tracking-[0.3em]">漫步</p>
          </div>
        </div>

        <PublicPath />
        <MessageWall />
      </ParkCanvas>

      <ParticleOverlay seasonState={seasonState} weather={weather} />
      <WeatherLayer weather={weather} />
      <GSAPAnimations />

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
          className="fixed top-4 right-4 z-30 glass-btn"
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
