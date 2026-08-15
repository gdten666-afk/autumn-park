// lib/types.ts

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'light-rain' | 'heavy-rain' | 'fog' | 'snow';
export type Scene = 'autumn-bench' | 'darkroom' | 'starlit-camp' | 'lighthouse-coast' | 'bookstore';
export type UserRole = 'operator' | 'user';

export interface User {
  id: string;
  name: string;
  display_name?: string;
  bio?: string;
  role: UserRole;
  invite_code: string;
  created_at: string;
}

export interface UserSession {
  userId: string;
  name: string;
  role: UserRole;
}

export interface Photo {
  id: string;
  user_id: string;
  filename: string;
  caption: string;
  is_public: boolean;
  created_at: string;
  author_name?: string;
}

export interface Space {
  user_id: string;
  scene: Scene;
  weather: Weather;
  updated_at: string;
  owner_name?: string;
}

export interface SeasonState {
  season: Season;
  transitionWeight: number;    // 0 = pure season, 1 = midpoint
  secondarySeason: Season | null;
}

export interface WeatherVote {
  user_id: string;
  date: string;
  vote: Weather;
}

export interface DailyWeather {
  date: string;
  weather: Weather;
  set_at: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
