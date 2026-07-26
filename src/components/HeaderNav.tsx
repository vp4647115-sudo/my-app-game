import React from 'react';
import { UserProfile } from '../types';

interface HeaderNavProps {
  user: UserProfile;
  onOpenMenu?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  user,
  onOpenMenu,
  onOpenProfile,
  onOpenSettings,
  onOpenAuth,
  showBack,
  onBack,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#121411]/80 backdrop-blur-md border-b border-white/10 shadow-sm flex justify-between items-center px-6 h-14">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="p-1 rounded-full text-primary hover:bg-white/5 active:scale-95 transition-transform cursor-pointer"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
        ) : (
          <button
            onClick={onOpenMenu}
            className="p-1 rounded-full text-primary hover:bg-white/5 active:scale-95 transition-transform cursor-pointer"
            title="Menu"
          >
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>
        )}
        <h1 className="font-headline text-lg md:text-xl tracking-widest text-[#e3e3de] font-semibold">
          VPN CHESS MASTER
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Sign In / Register"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="hidden sm:inline">Auth</span>
          </button>
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1 rounded-full text-[#c4c7c7] hover:text-[#FAF9F6] transition-colors cursor-pointer"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        )}
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]/50 active:scale-95 transition-transform cursor-pointer"
          title="User Profile"
        >
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
