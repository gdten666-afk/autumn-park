// app/park/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ParkCanvas from '@/components/park/ParkCanvas';
import PublicPath from '@/components/park/PublicPath';
import CornerTransition from '@/components/space/CornerTransition';
import CornerView from '@/components/space/CornerView';
import LoginModal from '@/components/auth/LoginModal';
import UserMenu from '@/components/auth/UserMenu';
import AdminPanel from '@/components/admin/AdminPanel';
import WeatherLayer from '@/components/weather/WeatherLayer';
import WeatherVote from '@/components/weather/WeatherVote';
import type { SeasonState, Weather, UserSession } from '@/lib/types';

const ParticleOverlay = dynamic(() => import('@/components/park/ParticleOverlay'), { ssr: false });

export default function ParkPage() {
  const [seasonState, setSeasonState] = useState<SeasonState>({
    season: 'autumn', transitionWeight: 0, secondarySeason: null,
  });
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
