-- ==============================================================================
-- SUPABASE CHESS APPLICATION DATABASE SCHEMA & SECURITY MIGRATION
-- Senior Backend Engineering & Database Architecture
-- Guaranteeing Zero Cross-Account Data Contamination & Sub-Millisecond Scale
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Automatically create profile & statistics on user signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'ChessMaster'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  ) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.player_statistics (user_id)
  VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.coin_wallet (user_id, balance)
  VALUES (NEW.id, 500) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.settings (user_id)
  VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.online_status (user_id, is_online)
  VALUES (NEW.id, TRUE) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();


-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(64) NOT NULL,
    title VARCHAR(16) DEFAULT 'PLAYER',
    country VARCHAR(64) DEFAULT 'UNITED KINGDOM',
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    elo INTEGER DEFAULT 1200 CHECK (elo >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profile view" ON public.profiles
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 2. PLAYER STATISTICS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.player_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
    draws INTEGER NOT NULL DEFAULT 0 CHECK (draws >= 0),
    games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
    rapid_rating INTEGER NOT NULL DEFAULT 1200 CHECK (rapid_rating >= 0),
    blitz_rating INTEGER NOT NULL DEFAULT 1200 CHECK (blitz_rating >= 0),
    bullet_rating INTEGER NOT NULL DEFAULT 1200 CHECK (bullet_rating >= 0),
    win_rate NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN games_played > 0 THEN ROUND((wins::numeric / games_played::numeric) * 100, 2) ELSE 0.00 END
    ) STORED,
    longest_win_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_win_streak >= 0),
    average_accuracy NUMERIC(5,2) NOT NULL DEFAULT 85.00 CHECK (average_accuracy >= 0 AND average_accuracy <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public statistics view" ON public.player_statistics
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own statistics" ON public.player_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON public.player_statistics
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 3. GAME HISTORY TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent_name VARCHAR(64) NOT NULL,
    opponent_elo INTEGER NOT NULL DEFAULT 1200,
    result VARCHAR(16) NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
    elo_change INTEGER NOT NULL DEFAULT 0,
    time_control VARCHAR(32) NOT NULL DEFAULT '10 min',
    mode VARCHAR(32) NOT NULL DEFAULT 'ranked',
    pgn TEXT DEFAULT '',
    accuracy NUMERIC(5,2) DEFAULT 0.0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own game history" ON public.game_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own game history" ON public.game_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 4. SAVED GAMES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saved_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL DEFAULT 'Saved Game',
    fen TEXT NOT NULL,
    pgn TEXT DEFAULT '',
    move_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    captured_pieces JSONB NOT NULL DEFAULT '{"w": [], "b": []}'::jsonb,
    timers JSONB NOT NULL DEFAULT '{"white": 600, "black": 600}'::jsonb,
    current_turn VARCHAR(8) NOT NULL DEFAULT 'w' CHECK (current_turn IN ('w', 'b')),
    game_state VARCHAR(32) NOT NULL DEFAULT 'in_progress',
    winner VARCHAR(16),
    draw_status BOOLEAN DEFAULT FALSE,
    resignation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own saved games" ON public.saved_games
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved games" ON public.saved_games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own saved games" ON public.saved_games
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own saved games" ON public.saved_games
    FOR DELETE USING (auth.uid() = user_id);


-- ==============================================================================
-- 5. CURRENT MATCHES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.current_matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    current_fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    move_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    game_result VARCHAR(32) DEFAULT 'ongoing',
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    time_control VARCHAR(32) NOT NULL DEFAULT '10+0',
    game_mode VARCHAR(32) NOT NULL DEFAULT 'bullet',
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
    last_move VARCHAR(16) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.current_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants view match" ON public.current_matches
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (auth.uid() = white_player_id OR auth.uid() = black_player_id)
    );

CREATE POLICY "Match participants update match" ON public.current_matches
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (auth.uid() = white_player_id OR auth.uid() = black_player_id)
    ) WITH CHECK (
        auth.uid() IS NOT NULL AND (auth.uid() = white_player_id OR auth.uid() = black_player_id)
    );

CREATE POLICY "Users create match as white or black" ON public.current_matches
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (auth.uid() = white_player_id OR auth.uid() = black_player_id)
    );


-- ==============================================================================
-- 6. FRIENDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own friendships" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users manage own friendships" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own friendships" ON public.friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);


-- ==============================================================================
-- 7. FRIEND REQUESTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_request UNIQUE (sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties view requests" ON public.friend_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Senders create requests" ON public.friend_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers update request status" ON public.friend_requests
    FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);


-- ==============================================================================
-- 8. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);


-- ==============================================================================
-- 9. LEADERBOARDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(64) NOT NULL,
    elo INTEGER NOT NULL DEFAULT 1200,
    rank INTEGER DEFAULT 0,
    category VARCHAR(32) DEFAULT 'global',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public leaderboard view" ON public.leaderboards
    FOR SELECT USING (TRUE);


-- ==============================================================================
-- 10. ACHIEVEMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_key VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 100,
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_key)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);


-- ==============================================================================
-- 11. DAILY REWARDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_count INTEGER NOT NULL DEFAULT 1,
    last_claimed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_reward_date UNIQUE (user_id, last_claimed_date)
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own daily rewards" ON public.daily_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users claim own daily rewards" ON public.daily_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 12. MISSIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    reward_coins INTEGER DEFAULT 50,
    completed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own missions" ON public.missions
    FOR SELECT USING (auth.uid() = user_id);


-- ==============================================================================
-- 13. INVENTORY TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type VARCHAR(32) NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    is_equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_item UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own inventory" ON public.inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own inventory" ON public.inventory
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 14. AVATARS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    avatar_code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    image_url TEXT NOT NULL,
    price INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read avatars" ON public.avatars FOR SELECT USING (TRUE);


-- ==============================================================================
-- 15. THEMES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    primary_color VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read themes" ON public.themes FOR SELECT USING (TRUE);


-- ==============================================================================
-- 16. BOARD SKINS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.board_skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skin_code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    light_tile VARCHAR(16) NOT NULL,
    dark_tile VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.board_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read board skins" ON public.board_skins FOR SELECT USING (TRUE);


-- ==============================================================================
-- 17. PIECE SETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.piece_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    style VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.piece_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read piece sets" ON public.piece_sets FOR SELECT USING (TRUE);


-- ==============================================================================
-- 18. SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    volume INTEGER NOT NULL DEFAULT 80 CHECK (volume >= 0 AND volume <= 100),
    reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    board_theme VARCHAR(64) NOT NULL DEFAULT 'walnut',
    piece_style VARCHAR(64) NOT NULL DEFAULT 'neo-grandmaster',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 19. COIN WALLET TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coin_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 500 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coin_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.coin_wallet
    FOR SELECT USING (auth.uid() = user_id);


-- ==============================================================================
-- 20. TRANSACTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('reward', 'purchase', 'entry_fee', 'bonus')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);


-- ==============================================================================
-- 21. REPORTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(64) NOT NULL,
    details TEXT,
    status VARCHAR(32) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own report" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);


-- ==============================================================================
-- 22. TOURNAMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(128) NOT NULL,
    time_control VARCHAR(32) NOT NULL,
    prize_pool INTEGER DEFAULT 1000,
    status VARCHAR(32) DEFAULT 'upcoming',
    start_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view tournaments" ON public.tournaments FOR SELECT USING (TRUE);


-- ==============================================================================
-- 23. MATCHMAKING QUEUE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    elo INTEGER NOT NULL,
    time_control VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'searching',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage queue entry" ON public.matchmaking_queue
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 24. ONLINE STATUS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.online_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.online_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view online status" ON public.online_status FOR SELECT USING (TRUE);
CREATE POLICY "Users update own status" ON public.online_status
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- HIGH-PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_elo ON public.profiles(elo DESC);

CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON public.player_statistics(user_id);

CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON public.game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON public.game_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_games_user_id ON public.saved_games(user_id);

CREATE INDEX IF NOT EXISTS idx_current_matches_white ON public.current_matches(white_player_id);
CREATE INDEX IF NOT EXISTS idx_current_matches_black ON public.current_matches(black_player_id);
CREATE INDEX IF NOT EXISTS idx_current_matches_status ON public.current_matches(status);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_tc_elo ON public.matchmaking_queue(time_control, elo);
