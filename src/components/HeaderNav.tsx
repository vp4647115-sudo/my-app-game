import React from 'react';
import { UserProfile } from '../types';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderNavProps {
  user: UserProfile;
  isAuthenticated?: boolean;
  onOpenMenu?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  user,
  isAuthenticated,
  onOpenMenu,
  onOpenProfile,
  onOpenSettings,
  onOpenAuth,
  onSignOut,
  showBack,
  onBack,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#121411]/90 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-md flex justify-between items-center px-2.5 sm:px-4 md:px-6 h-14">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {showBack ? (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-[#FAF9F6] hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
        ) : (
          <button
            onClick={onOpenMenu}
            className="p-1.5 rounded-lg text-[#FAF9F6] hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Navigation Menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
        <button
          onClick={showBack ? onBack : onOpenMenu}
          className="flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition-opacity text-left cursor-pointer min-w-0 overflow-hidden"
        >
          <span className="material-symbols-outlined text-[#D4AF37] text-xl sm:text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            chess
          </span>
          <h1 className="font-brand text-xs sm:text-sm md:text-base lg:text-lg font-extrabold tracking-wider text-[#FAF9F6] gold-shimmer drop-shadow-sm whitespace-nowrap truncate">
            VPN CHESS MASTER
          </h1>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
        <ThemeToggle className="scale-75 sm:scale-90 origin-right" />

        {/* Logout Button with Small Icon */}
        <button
          onClick={onSignOut || onOpenAuth}
          className="px-1.5 sm:px-2 py-0.5 bg-red-500/20 hover:bg-red-500/35 text-red-300 border border-red-500/40 hover:border-red-500/60 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 transition-all cursor-pointer shadow-sm active:scale-95"
          title="Sign Out / Logout"
        >
          <span className="material-symbols-outlined text-[11px] sm:text-xs font-bold text-red-400">logout</span>
          <span className="whitespace-nowrap">LOGOUT</span>
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-[#c4c7c7] hover:text-[#FAF9F6] hover:bg-white/10 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title="Settings & Customization"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">settings</span>
          </button>
        )}

        <button
          onClick={onOpenProfile}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-[#D4AF37]/60 hover:border-[#D4AF37] active:scale-95 transition-all cursor-pointer shadow-md bg-[#1e201d] flex items-center justify-center shrink-0"
          title="User Profile & Stats"
        >
          {user.avatarUrl && !user.avatarUrl.includes('googleusercontent.com') && !user.avatarUrl.includes('unsplash.com') ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-base sm:text-lg text-[#D4AF37]">person</span>
          )}
        </button>
      </div>
    </header>
  );
};
