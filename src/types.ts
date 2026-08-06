export type GameMode = 'bot' | 'online' | 'friend' | 'offline' | 'learn';

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
  isPremium?: boolean;
  premiumPlan?: 'Starter' | 'Gold' | 'Diamond' | 'Lifetime' | string;
  vipBadge?: boolean;
  coins?: number;
  gems?: number;
  battlePassUnlocked?: boolean;
  inventory?: string[];
  membershipExpiresAt?: string;
}

export interface PayUStorePackage {
  id: string;
  category: 'membership' | 'coins' | 'gems' | 'cosmetics' | 'battlepass';
  name: string;
  badge?: string;
  priceINR: number;
  originalPriceINR?: number;
  period?: string;
  coinsReward?: number;
  gemsReward?: number;
  popular?: boolean;
  bestValue?: boolean;
  features: string[];
}

export interface PayUOrderTransaction {
  orderId: string;
  txnid: string;
  userId: string;
  userEmail: string;
  itemCategory: string;
  itemId: string;
  itemName: string;
  amountINR: number;
  discountINR: number;
  netAmountINR: number;
  couponCode?: string;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'payu_express';
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  payuHash: string;
  timestamp: string;
  invoiceUrl?: string;
  rewardsDelivered: {
    coins?: number;
    gems?: number;
    isPremium?: boolean;
    planName?: string;
    itemUnlocked?: string;
  };
}

export interface PayUCoupon {
  code: string;
  discountPercent: number;
  flatDiscountINR: number;
  minPurchaseINR: number;
  validUntil: string;
  description: string;
  active: boolean;
}

export interface PayUInvoice {
  invoiceNumber: string;
  txnid: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
  category: string;
  amountINR: number;
  discountINR: number;
  gstINR: number;
  totalINR: number;
  date: string;
  paymentStatus: string;
  merchantDetails: {
    name: string;
    gstin: string;
    supportEmail: string;
  };
}

export interface GameSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 100
  reducedMotion: boolean;
  highContrast: boolean;
  lowPerformanceMode?: boolean; // Battery saver / Smooth FPS on low-end mobile
  boardTheme: 'walnut' | 'emerald' | 'obsidian' | 'royal' | 'marble';
  pieceStyle: 'neo-grandmaster' | 'classic-staunton' | '3d-metallic' | 'minimalist';
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
  opponentCountry?: string;
  opponentPing?: number;
  rated: boolean;
  initialFen?: string;
  initialMoveHistory?: string[];
  initialPlayerTime?: number;
  initialOpponentTime?: number;
  initialFenHistory?: string[];
}

export interface OngoingGameSession {
  config: ActiveMatchConfig;
  fen: string;
  moveHistory: string[];
  playerTime: number;
  opponentTime: number;
  fenHistory: string[];
  lastMove?: { from: string; to: string } | null;
  updatedAt: number;
  userId: string;
}

export interface RoomConfig {
  code: string;
  timeControl: string;
  timeMinutes: number;
  rated: boolean;
  boardTheme: string;
  createdAt: number;
}

export interface GeminiCoachResponse {
  evaluation: string;
  keyConcept: string;
  coachingAdvice: string;
  recommendedMoves: {
    san: string;
    from: string;
    to: string;
    explanation: string;
  }[];
}

export interface GeminiPuzzleChallenge {
  title: string;
  fen: string;
  playerColor: 'w' | 'b';
  goal: string;
  solutionSan: string[];
  explanation: string;
  difficulty: string;
}

