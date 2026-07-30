import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, MatchHistoryItem, GameSettings } from '../types';

// Safely obtain environment variables or localStorage keys for Supabase
const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = env.VITE_SUPABASE_URL || '';
  const envKey = env.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('vpn_chess_supabase_url') || '' : '';
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('vpn_chess_supabase_key') || '' : '';

  return {
    url: (envUrl || localUrl).trim(),
    key: (envKey || localKey).trim(),
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
}

// Initial instance setup
initSupabaseClient();

export function saveSupabaseCredentials(url: string, key: string): SupabaseClient | null {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('vpn_chess_supabase_url', url.trim());
    localStorage.setItem('vpn_chess_supabase_key', key.trim());
  }
  supabaseInstance = null;
  const client = initSupabaseClient();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('vpn_chess_supabase_updated'));
  }
  return client;
}

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseInstance) {
    initSupabaseClient();
  }
  return supabaseInstance;
};

// Getter wrapper for legacy imports expecting `supabase` client variable
export const supabase = {
  get auth() {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client is not configured.');
    return client.auth;
  },
  from(table: string) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client is not configured.');
    return client.from(table);
  },
} as unknown as SupabaseClient;

export function isSupabaseReady(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

export function isSupabaseConfigured(): boolean {
  return isSupabaseReady();
}

// Local default user profile matching real user score initialization
export const DEFAULT_PROFILE: UserProfile = {
  id: 'gm_user_1',
  username: 'Alexander Thorne',
  elo: 1200,
  title: 'PLAYER',
  country: 'UNITED KINGDOM',
  bio: 'Strategic chess enthusiast climbing the ranks in real-time matches.',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6xTNEwFjfA7-dpbYxtGhuyRNVpjM3s7bt5AwyA06tElZEecAVhx26oEJIymkWKUGPyHZL4xu3uA2ayXLYORI-2Onlt3UmYmHbusMxjo3wNt2CtRAS5Nn1IBM18qZDBgPjHgZNdgCj32ikLQ0-ZAxPS-zHXkvbr9KrG6HigoItT6Guc70T18aZAspcgVla-k7YHbp-JWRy5jeIzgkod5HYaGpMfq_3uoOE8j5U1j9eoEveVSC7q8Qj27hi32RhtC0x50O2T_HVka5q',
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  weeklyEloChange: 0,
  linkedGoogle: true,
  jwtActive: true,
};

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  volume: 80,
  reducedMotion: false,
  highContrast: false,
  boardTheme: 'walnut',
  pieceStyle: 'neo-grandmaster',
};

// Real score match history (starts empty, only real matches are saved)
export const DEFAULT_MATCH_HISTORY: MatchHistoryItem[] = [];

// Profile storage API
export function loadUserProfile(): UserProfile {
  const saved = localStorage.getItem('vpn_chess_profile');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved profile:', e);
    }
  }
  return DEFAULT_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem('vpn_chess_profile', JSON.stringify(profile));
  
  // Try syncing to Supabase if connected
  const client = getSupabase();
  if (client) {
    try {
      client
        .from('profiles')
        .upsert({
          id: profile.id,
          username: profile.username,
          elo: profile.elo,
          title: profile.title,
          country: profile.country,
          bio: profile.bio,
          avatar_url: profile.avatarUrl,
          games_played: profile.gamesPlayed,
          wins: profile.wins,
          losses: profile.losses,
          draws: profile.draws,
          updated_at: new Date().toISOString(),
        })
        .then(
          () => {},
          () => {}
        );
    } catch (e) {
      // Ignore sync failure
    }
  }
}

// Match history API
export function loadMatchHistory(): MatchHistoryItem[] {
  const saved = localStorage.getItem('vpn_chess_history');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse match history:', e);
    }
  }
  return DEFAULT_MATCH_HISTORY;
}

export function addMatchHistoryItem(item: MatchHistoryItem): MatchHistoryItem[] {
  const current = loadMatchHistory();
  const updated = [item, ...current];
  localStorage.setItem('vpn_chess_history', JSON.stringify(updated));

  const client = getSupabase();
  if (client) {
    try {
      client
        .from('matches')
        .insert({
          id: item.id,
          result: item.result,
          time_control: item.timeControl,
          opponent_name: item.opponentName,
          opponent_elo: item.opponentElo,
          elo_change: item.eloChange,
          timestamp: item.timestamp,
          mode: item.mode,
        })
        .then(
          () => {},
          () => {}
        );
    } catch (e) {
      // Ignore sync failure
    }
  }

  return updated;
}

// Settings storage API
export function loadGameSettings(): GameSettings {
  const saved = localStorage.getItem('vpn_chess_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveGameSettings(settings: GameSettings): void {
  localStorage.setItem('vpn_chess_settings', JSON.stringify(settings));
}
