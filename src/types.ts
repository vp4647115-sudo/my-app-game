export type GameMode = 'bot' | 'online' | 'friend' | 'offline';

export type AIDifficulty = 
  | 'beginner'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'master'
  | 'grandmaster';

export type PlayerColor = 'white' | 'black' | 'random';

export interface UserProfile {
  id: string;
  username: string;
  elo: number;
  title: string; // e.g. 'GM', 'IM', 'FM', 'Master', 'Novice'
  country: string;
  bio: string;
  avatarUrl: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  weeklyEloChange: number;
  linkedGoogle: boolean;
  jwtActive: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 100
  reducedMotion: boolean;
  highContrast: boolean;
  boardTheme: 'walnut' | 'marble' | 'classic';
}

export interface MatchHistoryItem {
  id: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  timeControl: string; // e.g. '10 MIN BLITZ', '5 MIN BLITZ', '3 MIN BULLET'
  opponentName: string;
  opponentElo: number;
  eloChange: number;
  timestamp: string;
  pgn?: string;
  mode: GameMode;
}

export interface ActiveMatchConfig {
  mode: GameMode;
  difficulty?: AIDifficulty;
  playerColor: 'w' | 'b';
  timeControlMinutes: number;
  incrementSeconds: number;
  roomCode?: string;
  opponentName: string;
  opponentElo: number;
  opponentAvatar?: string;
  rated: boolean;
}

export interface RoomConfig {
  code: string;
  timeControl: string;
  timeMinutes: number;
  rated: boolean;
  boardTheme: string;
  createdAt: number;
}
