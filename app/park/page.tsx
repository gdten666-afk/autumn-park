// app/park/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
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
import ParticleOverlay from '@/components/park/ParticleOverlay';
import AmbientSound from '@/components/park/AmbientSound';
import MessageWall from '@/components/park/MessageWall';
import StatsBar from '@/components/park/StatsBar';
import { getSeasonState } from '@/lib/seasons';
import type { SeasonState, Weather, UserSession } from '@/lib/types';

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
        <div className="welcome-text pointer-events-none relative px-4 md:px-0" style={{ paddingTop: 'clamp(72px, 14vh, 140px)', paddingLeft: '4vw', zIndex: 20 }}>
          <div className="flex flex-col items-start max-w-lg">
            <div className="kicker mb-5">AUTUMN PARK · 四季流转</div>
            <h1 className="m-0 text-[clamp(30px,5vw,52px)] leading-[1.22] font-medium tracking-wide">
              在秋天，<br />
              慢慢<em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>散步</em>。
            </h1>
            <p className="text-[13px] leading-[2] max-w-[300px] mb-7" style={{ color: 'var(--ink-faint)' }}>
              照片、留言与天气都安静地留在这里。向下走，逛逛这座公园。
            </p>
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={() => { if (session) enterCorner(session.userId, session.name); else setShowLogin(true); }}
                className="btn-primary"
              >
                进入公园 →
              </button>
              <button
                onClick={() => window.scrollTo({ top: window.innerHeight * 0.95, behavior: 'smooth' })}
                className="btn-ghost"
              >
                浏览相册
              </button>
            </div>
          </div>
        </div>

        {/* Scroll hint — bottom center */}
        <div className="scroll-hint relative z-10 flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-px" style={{ background: 'rgba(60,52,40,0.22)' }} />
            <p className="m-0 text-[10px] tracking-[0.34em]" style={{ color: 'var(--ink-weak)' }}>向下漫步</p>
          </div>
        </div>

        <PublicPath />
        <MessageWall />
      </ParkCanvas>

      <WeatherLayer weather={weather} />
      <ParticleOverlay seasonState={seasonState} weather={weather} />
      <StatsBar />
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
          className="fixed top-4 z-30 glass-btn right-4 md:right-[296px]"
        >
          进入我的角落
        </button>
      )}

      <WeatherVote />
      <AmbientSound weather={weather} />

      {/* Corner transition + view */}
      {cornerUserId && (
        <>
          <CornerTransition
            isEntering={isTransitioning}
            onEntered={() => setIsTransitioning(false)}
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
