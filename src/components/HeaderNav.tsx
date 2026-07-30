import React from 'react';
import { UserProfile } from '../types';

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
    <header className="fixed top-0 w-full z-50 bg-[#121411]/80 backdrop-blur-md border-b border-white/10 shadow-sm flex justify-between items-center px-6 h-14">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-[#FAF9F6] hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
        ) : (
          <button
            onClick={onOpenMenu}
            className="p-1.5 rounded-lg text-[#FAF9F6] hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Navigation Menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
        <button
          onClick={showBack ? onBack : onOpenMenu}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#D4AF37] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            chess
          </span>
          <h1 className="font-brand text-xl md:text-2xl font-bold tracking-wider text-[#FAF9F6] gold-shimmer drop-shadow-sm">
            VPN Chess
          </h1>
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {isAuthenticated ? (
          <button
            onClick={onSignOut || onOpenAuth}
            className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            title="Sign Out / Logout"
          >
            <span className="material-symbols-outlined text-sm font-bold">logout</span>
            <span>LOGOUT</span>
          </button>
        ) : (
          onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              title="Sign In / Login to Account"
            >
              <span className="material-symbols-outlined text-sm font-bold">login</span>
              <span>LOGIN</span>
            </button>
          )
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-[#c4c7c7] hover:text-[#FAF9F6] hover:bg-white/10 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title="Settings & Audio"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        )}
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#D4AF37]/60 hover:border-[#D4AF37] active:scale-95 transition-all cursor-pointer shadow-md bg-[#1e201d] flex items-center justify-center"
          title="User Profile & Stats"
        >
          {user.avatarUrl && !user.avatarUrl.includes('googleusercontent.com') && !user.avatarUrl.includes('unsplash.com') ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-lg text-[#D4AF37]">person</span>
          )}
        </button>
      </div>
    </header>
  );
};
