import React from 'react';
import { UserProfile } from '../types';

interface HomeScreenProps {
  user: UserProfile;
  onNavigate: (screen: 'bot' | 'arena' | 'friend' | 'profile' | 'settings') => void;
  onStartOffline: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onNavigate, onStartOffline }) => {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-20 pb-28 px-6">
      {/* Premium Logo Section */}
      <div className="mb-12 text-center animate-fade-in">
        <div className="relative inline-block mb-4">
          <span
            className="material-symbols-outlined text-[80px] text-[#FAF9F6] drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chess
          </span>
          <div className="absolute -top-1 -right-2">
            <span className="material-symbols-outlined text-[#D4AF37] text-[24px]">
              verified_user
            </span>
          </div>
        </div>
        <h2 className="font-brand text-3xl md:text-5xl text-[#FAF9F6] tracking-[0.15em] font-bold mb-2 gold-shimmer drop-shadow-md">
          VPN CHESS
        </h2>
        <div className="h-px w-28 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto" />
        <p className="font-body text-xs text-[#D4AF37] mt-3 tracking-[0.3em] uppercase font-semibold">
          Grandmaster Protocols
        </p>
      </div>

      {/* Action Grid */}
      <div className="w-full max-w-sm grid grid-cols-1 gap-4">
        {/* Play vs Bot */}
        <button
          onClick={() => onNavigate('bot')}
          className="group relative flex items-center justify-between p-5 rounded-xl glass-panel active:scale-[0.98] hover:border-[#D4AF37]/40 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="bg-[#FAF9F6]/5 p-3 rounded-lg group-hover:bg-[#FAF9F6]/10 transition-colors">
              <span className="material-symbols-outlined text-[#FAF9F6]">smart_toy</span>
            </div>
            <div>
              <span className="block font-headline text-lg font-semibold text-[#FAF9F6]">
                Play vs Bot
              </span>
              <span className="block font-body text-[10px] text-[#c4c7c7]/60 uppercase tracking-wider">
                Training Mode
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity">
            chevron_right
          </span>
        </button>

        {/* Play Online */}
        <button
          onClick={() => onNavigate('arena')}
          className="group relative flex items-center justify-between p-5 rounded-xl glass-panel active:scale-[0.98] hover:border-[#D4AF37]/40 transition-all duration-300 overflow-hidden text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-[#FAF9F6]/5 p-3 rounded-lg group-hover:bg-[#FAF9F6]/10 transition-colors">
              <span
                className="material-symbols-outlined text-[#FAF9F6]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                public
              </span>
            </div>
            <div>
              <span className="block font-headline text-lg font-semibold text-[#FAF9F6]">
                Play Online
              </span>
              <span className="block font-body text-[10px] text-[#D4AF37] uppercase tracking-wider font-medium">
                Secure Global Proxy
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity relative z-10">
            chevron_right
          </span>
        </button>

        {/* Play with Friend */}
        <button
          onClick={() => onNavigate('friend')}
          className="group relative flex items-center justify-between p-5 rounded-xl glass-panel active:scale-[0.98] hover:border-[#D4AF37]/40 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="bg-[#FAF9F6]/5 p-3 rounded-lg group-hover:bg-[#FAF9F6]/10 transition-colors">
              <span className="material-symbols-outlined text-[#FAF9F6]">group</span>
            </div>
            <div>
              <span className="block font-headline text-lg font-semibold text-[#FAF9F6]">
                Play with Friend
              </span>
              <span className="block font-body text-[10px] text-[#c4c7c7]/60 uppercase tracking-wider">
                Direct Room Invite
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity">
            chevron_right
          </span>
        </button>

        {/* Play Offline / Local Pass & Play */}
        <button
          onClick={onStartOffline}
          className="group relative flex items-center justify-between p-5 rounded-xl glass-panel active:scale-[0.98] hover:border-[#D4AF37]/40 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="bg-[#FAF9F6]/5 p-3 rounded-lg group-hover:bg-[#FAF9F6]/10 transition-colors">
              <span className="material-symbols-outlined text-[#D4AF37]">phonelink_setup</span>
            </div>
            <div>
              <span className="block font-headline text-lg font-semibold text-[#FAF9F6]">
                Play Offline
              </span>
              <span className="block font-body text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold">
                Local Pass & Play (2 Players)
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity">
            chevron_right
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className="group relative flex items-center justify-between p-5 rounded-xl glass-panel active:scale-[0.98] hover:border-[#D4AF37]/40 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#D4AF37]/30">
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="block font-headline text-lg font-semibold text-[#FAF9F6]">
                Profile & Statistics
              </span>
              <span className="block font-body text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold">
                Player History & Account
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity">
            chevron_right
          </span>
        </button>
      </div>

      {/* Settings Floating Icon */}
      <div className="fixed top-20 right-6 z-20">
        <button
          onClick={() => onNavigate('settings')}
          className="p-3 rounded-full bg-[#121411]/80 backdrop-blur-md border border-[#FAF9F6]/10 hover:bg-[#FAF9F6]/10 transition-all active:rotate-90 text-[#c4c7c7]"
          title="Quick Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </div>
  );
};
