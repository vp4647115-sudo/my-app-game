import React from 'react';
import { UserProfile, GameSettings } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface SettingsScreenProps {
  user: UserProfile;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onOpenEditProfile: () => void;
  onSignOut: () => void;
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  settings,
  onUpdateSettings,
  onOpenEditProfile,
  onSignOut,
  onBack,
}) => {
  const handleToggleSound = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, soundEnabled: e.target.checked });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, volume: parseInt(e.target.value) || 0 });
  };

  const handleToggleReducedMotion = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, reducedMotion: e.target.checked });
  };

  const handleToggleHighContrast = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, highContrast: e.target.checked });
  };

  return (
    <div className="pt-20 pb-28 px-6 max-w-4xl mx-auto space-y-8 text-[#e3e3de]">
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-body text-[#c4c7c7] hover:text-[#FAF9F6] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Page Title */}
      <div className="space-y-1">
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-[#FAF9F6]">Settings</h2>
        <p className="font-body text-sm text-[#c4c7c7]/80">Customize your elite chess experience.</p>
      </div>

      {/* Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Settings Card */}
        <section className="glass-panel rounded-xl p-6 flex flex-col justify-between space-y-6 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D4AF37]">account_circle</span>
            <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">Account Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="font-body text-sm text-[#c4c7c7]">Profile Username</span>
              <span className="font-body text-sm text-[#FAF9F6] font-semibold">
                {user.username}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="font-body text-sm text-[#c4c7c7]">ELO Rating</span>
              <span className="bg-[#1a1a1a] px-3 py-1 rounded-lg text-[#D4AF37] font-bold text-xs tracking-widest border border-[#D4AF37]/30">
                {user.elo}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenEditProfile}
            className="w-full bg-[#FAF9F6] text-[#121411] py-3 rounded-lg font-body text-xs font-bold tracking-widest uppercase hover:bg-white active:scale-95 transition-all cursor-pointer shadow"
          >
            EDIT PROFILE
          </button>
        </section>

        {/* Audio Settings Card */}
        <section className="glass-panel rounded-xl p-6 flex flex-col justify-between space-y-6 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D4AF37]">volume_up</span>
            <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">Audio</h3>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-body text-sm font-semibold text-[#FAF9F6]">
                  Wooden Movement Sounds
                </span>
                <span className="text-[11px] text-[#c4c7c7]/70">
                  Tactile walnut and ivory impact effects
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={handleToggleSound}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FAF9F6] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]" />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-[#FAF9F6]">Volume</span>
                <span className="font-body text-xs font-bold text-[#D4AF37]">
                  {settings.volume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={handleVolumeChange}
                className="w-full custom-slider cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Security Settings Card */}
        <section className="glass-panel rounded-xl p-6 flex flex-col space-y-6 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D4AF37]">verified_user</span>
            <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">Security</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
              <span className="material-symbols-outlined text-[#c4c7c7]">token</span>
              <div className="flex flex-col">
                <span className="font-body text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase">
                  AUTHENTICATION
                </span>
                <span className="font-body text-sm font-semibold text-[#FAF9F6]">
                  JWT Session Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
              <span className="material-symbols-outlined text-[#D4AF37]">database</span>
              <div className="flex flex-col">
                <span className="font-body text-[10px] font-bold text-[#c4c7c7] tracking-wider uppercase">
                  DATABASE CONNECTION
                </span>
                <span className="font-body text-sm font-semibold text-[#FAF9F6]">
                  {isSupabaseConfigured ? 'Supabase DB Connected' : 'Express Local DB Active'}
                </span>
              </div>
              <span
                className="material-symbols-outlined text-green-400 ml-auto"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          </div>
        </section>

        {/* Accessibility Card */}
        <section className="glass-panel rounded-xl p-6 flex flex-col space-y-6 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D4AF37]">visibility</span>
            <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">Accessibility</h3>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-body text-sm font-semibold text-[#FAF9F6]">
                  Reduced Motion
                </span>
                <span className="text-[11px] text-[#c4c7c7]/70">
                  Disable board sliding animations
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={handleToggleReducedMotion}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FAF9F6] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]" />
              </label>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-body text-sm font-semibold text-[#FAF9F6]">
                  High Contrast
                </span>
                <span className="text-[11px] text-[#c4c7c7]/70">
                  Increase board square visibility
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={handleToggleHighContrast}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FAF9F6] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]" />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Danger Zone / Logout */}
      <div className="pt-6 border-t border-white/10 text-center">
        <button
          onClick={onSignOut}
          className="px-8 py-3 text-red-400 font-body text-xs font-bold tracking-widest uppercase border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors cursor-pointer"
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
};
