import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, MatchHistoryItem, GameSettings } from '../types';
import { saveFirebaseUserProfile, addFirebaseMatchHistory, auth as firebaseAuth } from './firebaseClient';

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
  avatarUrl: '',
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

// Profile storage API (scoped by user ID to prevent cross-account data leakage)
export function loadUserProfile(userId?: string): UserProfile {
  const targetKey = userId ? `vpn_chess_profile_${userId}` : 'vpn_chess_profile';
  const saved = localStorage.getItem(targetKey) || localStorage.getItem('vpn_chess_profile');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const rawAvatar = typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : '';
        const isStockPhoto = rawAvatar.includes('googleusercontent.com') || rawAvatar.includes('unsplash.com');
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          id: userId || parsed.id || DEFAULT_PROFILE.id,
          avatarUrl: isStockPhoto ? '' : rawAvatar,
          elo: typeof parsed.elo === 'number' && !isNaN(parsed.elo) ? parsed.elo : DEFAULT_PROFILE.elo,
          wins: typeof parsed.wins === 'number' && !isNaN(parsed.wins) ? parsed.wins : DEFAULT_PROFILE.wins,
          losses: typeof parsed.losses === 'number' && !isNaN(parsed.losses) ? parsed.losses : DEFAULT_PROFILE.losses,
          draws: typeof parsed.draws === 'number' && !isNaN(parsed.draws) ? parsed.draws : DEFAULT_PROFILE.draws,
          gamesPlayed: typeof parsed.gamesPlayed === 'number' && !isNaN(parsed.gamesPlayed) ? parsed.gamesPlayed : DEFAULT_PROFILE.gamesPlayed,
        };
      }
    } catch (e) {
      console.error('Failed to parse saved profile:', e);
    }
  }
  return { ...DEFAULT_PROFILE, id: userId || DEFAULT_PROFILE.id };
}

// Track missing tables on current Supabase project to prevent 404 noise
const missingTables = new Set<string>();

export function saveUserProfile(profile: UserProfile): void {
  const targetKey = profile.id ? `vpn_chess_profile_${profile.id}` : 'vpn_chess_profile';
  localStorage.setItem(targetKey, JSON.stringify(profile));
  localStorage.setItem('vpn_chess_profile', JSON.stringify(profile));

  // Sync to Firestore if Firebase Auth is active
  if (firebaseAuth.currentUser) {
    saveFirebaseUserProfile(firebaseAuth.currentUser.uid, profile).catch((e) =>
      console.warn('Firebase profile sync notice:', e)
    );
  }
  
  // Try syncing to Supabase if connected and profiles table exists
  const client = getSupabase();
  if (client && !missingTables.has('profiles')) {
    try {
      client
        .from('profiles')
        .upsert({
          user_id: profile.id,
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
          (res) => {
            if (res.error) {
              const msg = res.error.message?.toLowerCase() || '';
              if (res.status === 404 || msg.includes('does not exist') || msg.includes('relation') || res.error.code === 'PGRST204') {
                missingTables.add('profiles');
              }
            }
          },
          (err) => {
            if (err?.status === 404 || err?.message?.includes('404')) {
              missingTables.add('profiles');
            }
          }
        );
    } catch (e) {
      // Ignore sync failure
    }
  }
}

// Clear all user cache on sign out
export function clearUserCache(): void {
  if (typeof localStorage === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('vpn_chess_')) {
      if (key !== 'vpn_chess_welcome_seen' && key !== 'vpn_chess_supabase_url' && key !== 'vpn_chess_supabase_key') {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
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

  // Sync to Firestore if Firebase Auth is active
  if (firebaseAuth.currentUser) {
    addFirebaseMatchHistory(firebaseAuth.currentUser.uid, item).catch((e) =>
      console.warn('Firebase match history sync notice:', e)
    );
  }

  const client = getSupabase();
  if (client && !missingTables.has('matches')) {
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
          (res) => {
            if (res.error) {
              const msg = res.error.message?.toLowerCase() || '';
              if (res.status === 404 || msg.includes('does not exist') || msg.includes('relation') || res.error.code === 'PGRST204') {
                missingTables.add('matches');
              }
            }
          },
          (err) => {
            if (err?.status === 404 || err?.message?.includes('404')) {
              missingTables.add('matches');
            }
          }
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
