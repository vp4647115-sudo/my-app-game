import React, { useState, useEffect } from 'react';
import { UserProfile, GameSettings, MatchHistoryItem, ActiveMatchConfig } from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadGameSettings,
  saveGameSettings,
  loadMatchHistory,
  addMatchHistoryItem,
  isSupabaseConfigured,
  supabase,
} from './services/supabaseClient';

import { HeaderNav } from './components/HeaderNav';
import { BottomNav, TabType } from './components/BottomNav';
import { ThreeChessBackground } from './components/ThreeChessBackground';

import { HomeScreen } from './components/HomeScreen';
import { BotSelectScreen } from './components/BotSelectScreen';
import { ArenaScreen } from './components/ArenaScreen';
import { FriendScreen } from './components/FriendScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ChessBoardGame } from './components/ChessBoardGame';

import { EditProfileModal } from './components/EditProfileModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => loadUserProfile());
  const [settings, setSettings] = useState<GameSettings>(() => loadGameSettings());
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>(() => loadMatchHistory());

  // Listen to Supabase Auth state if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          const email = session.user.email;
          setUser((prev) => {
            const updated = { ...prev, username: email.split('@')[0], jwtActive: true };
            saveUserProfile(updated);
            return updated;
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          const email = session.user.email;
          setUser((prev) => {
            const updated = { ...prev, username: email.split('@')[0], jwtActive: true };
            saveUserProfile(updated);
            return updated;
          });
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<
    'home' | 'bot' | 'arena' | 'friend' | 'profile' | 'settings' | 'game'
  >('home');
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Match Config when playing
  const [activeMatch, setActiveMatch] = useState<ActiveMatchConfig | null>(null);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Synchronize Tab with Screen
  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'home') setCurrentScreen('home');
    else if (tab === 'profile') setCurrentScreen('profile');
    else if (tab === 'settings') setCurrentScreen('settings');
  };

  // Screen navigation helper
  const handleNavigate = (screen: 'home' | 'bot' | 'arena' | 'friend' | 'profile' | 'settings') => {
    setCurrentScreen(screen);
    if (screen === 'home') setActiveTab('home');
    else if (screen === 'profile') setActiveTab('profile');
    else if (screen === 'settings') setActiveTab('settings');
  };

  // Update settings handler
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveGameSettings(newSettings);
  };

  // Start a new chess match
  const handleStartMatch = (matchConfig: ActiveMatchConfig) => {
    setActiveMatch(matchConfig);
    setCurrentScreen('game');
  };

  // Complete match handler
  const handleGameComplete = (result: 'WIN' | 'LOSS' | 'DRAW', eloChange: number) => {
    if (!activeMatch) return;

    // Build Match History Item
    const newItem: MatchHistoryItem = {
      id: 'm_' + Date.now(),
      result,
      timeControl: `${activeMatch.timeControlMinutes} MIN ${
        activeMatch.timeControlMinutes <= 3 ? 'BULLET' : 'BLITZ'
      }`,
      opponentName: activeMatch.opponentName,
      opponentElo: activeMatch.opponentElo,
      eloChange,
      timestamp: 'JUST NOW',
      mode: activeMatch.mode,
    };

    const updatedHistory = addMatchHistoryItem(newItem);
    setMatchHistory(updatedHistory);

    // Update User Stats
    const updatedUser: UserProfile = {
      ...user,
      elo: user.elo + eloChange,
      gamesPlayed: user.gamesPlayed + 1,
      wins: result === 'WIN' ? user.wins + 1 : user.wins,
      losses: result === 'LOSS' ? user.losses + 1 : user.losses,
      draws: result === 'DRAW' ? user.draws + 1 : user.draws,
      weeklyEloChange: user.weeklyEloChange + eloChange,
    };

    setUser(updatedUser);
    saveUserProfile(updatedUser);
  };

  // Save profile updates
  const handleSaveProfile = (updated: UserProfile) => {
    setUser(updated);
    saveUserProfile(updated);
  };

  return (
    <div className="min-h-screen bg-[#121411] text-[#e3e3de] font-body relative overflow-x-hidden">
      {/* 3D Background Canvas (shown on Home, Arena, Bot screens) */}
      {currentScreen !== 'game' && <ThreeChessBackground />}

      {/* Top Header Navigation (Hidden during active match) */}
      {currentScreen !== 'game' && (
        <HeaderNav
          user={user}
          onOpenMenu={() => handleNavigate('home')}
          onOpenProfile={() => handleNavigate('profile')}
          onOpenSettings={() => handleNavigate('settings')}
          onOpenAuth={() => setIsAuthOpen(true)}
          showBack={currentScreen !== 'home'}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {/* Main Screen Content */}
      <main className="relative z-10">
        {currentScreen === 'home' && (
          <HomeScreen user={user} onNavigate={handleNavigate} />
        )}

        {currentScreen === 'bot' && (
          <BotSelectScreen
            onStartMatch={handleStartMatch}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'arena' && (
          <ArenaScreen
            user={user}
            onStartMatch={handleStartMatch}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'friend' && (
          <FriendScreen
            user={user}
            onStartMatch={handleStartMatch}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            user={user}
            matchHistory={matchHistory}
            onOpenEditModal={() => setIsEditProfileOpen(true)}
            onBack={currentScreen === 'profile' && activeTab === 'home' ? () => setCurrentScreen('home') : undefined}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            user={user}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onSignOut={() => setIsAuthOpen(true)}
            onBack={currentScreen === 'settings' && activeTab === 'home' ? () => setCurrentScreen('home') : undefined}
          />
        )}

        {currentScreen === 'game' && activeMatch && (
          <ChessBoardGame
            config={activeMatch}
            user={user}
            settings={settings}
            onGameComplete={handleGameComplete}
            onExit={() => setCurrentScreen('home')}
          />
        )}
      </main>

      {/* Bottom Navigation Shell (Hidden during active match) */}
      {currentScreen !== 'game' && (
        <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />
      )}

      {/* Modals */}
      {isEditProfileOpen && (
        <EditProfileModal
          user={user}
          onSave={handleSaveProfile}
          onClose={() => setIsEditProfileOpen(false)}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onSuccess={(email) => {
            const updated = { ...user, username: email.split('@')[0], jwtActive: true };
            setUser(updated);
            saveUserProfile(updated);
          }}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}
