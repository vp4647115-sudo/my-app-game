import React from 'react';
import { UserProfile } from '../types';

interface NavDrawerProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onNavigate: (screen: 'home' | 'bot' | 'arena' | 'friend' | 'profile' | 'settings' | 'learn') => void;
  onStartOffline: () => void;
  onOpenAuth: () => void;
  onOpenPayUModal?: () => void;
  onOpenApkInstall?: () => void;
  onOpenGuide?: () => void;
  onSignOut: () => void;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  user,
  onClose,
  onNavigate,
  onStartOffline,
  onOpenAuth,
  onOpenPayUModal,
  onOpenApkInstall,
  onOpenGuide,
  onSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-80 max-w-[85vw] bg-[#121411] border-r border-[#D4AF37]/30 h-full flex flex-col justify-between p-6 shadow-2xl animate-fade-in text-[#e3e3de]">
        {/* Header */}
        <div>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D4AF37] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                chess
              </span>
              <span className="font-brand text-2xl font-bold text-[#FAF9F6] gold-shimmer">
                VPN Chess
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-[#c4c7c7] hover:text-[#FAF9F6] transition-colors cursor-pointer"
              title="Close Menu"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* User Mini Card */}
          <div
            onClick={() => {
              onNavigate('profile');
              onClose();
            }}
            className="glass-panel p-3.5 rounded-xl flex items-center gap-3 mb-6 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full border border-[#D4AF37] overflow-hidden shrink-0 bg-[#1e201d] flex items-center justify-center">
              {user.avatarUrl && !user.avatarUrl.includes('googleusercontent.com') && !user.avatarUrl.includes('unsplash.com') ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-xl text-[#D4AF37]">person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-headline text-sm font-bold text-[#FAF9F6] truncate">
                {user.username}
              </h4>
              <p className="font-body text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider">
                ELO {user.elo} • {user.title || 'GM'}
              </p>
            </div>
            <span className="material-symbols-outlined text-sm text-[#D4AF37]">chevron_right</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 font-body text-xs font-semibold">
            {/* PayU VIP Subscription */}
            {onOpenPayUModal && (
              <button
                onClick={() => {
                  onOpenPayUModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl bg-gradient-to-r from-[#2C1F0D] to-[#1D1409] hover:brightness-110 text-[#FFC300] border border-[#FFB703]/50 shadow-[0_0_15px_rgba(255,183,3,0.2)] transition-all text-left cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[#FFC300] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>VIP Master Membership</span>
                    <span className="px-1.5 py-0.2 bg-[#FFB703] text-[#120B05] rounded text-[8px] font-black">PayU ₹</span>
                  </span>
                  <span className="text-[9px] text-[#E0C8A0] opacity-90">
                    {user.isPremium ? 'Active Plan: ' + (user.premiumPlan || 'VIP') : 'Unlock Stockfish 16, AI Coach & Badges'}
                  </span>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                onNavigate('home');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">home</span>
              <span>Home Dashboard</span>
            </button>

            <button
              onClick={() => {
                onNavigate('learn');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">psychology</span>
              <div className="flex flex-col">
                <span className="font-bold">Chess Master Academy</span>
                <span className="text-[9px] opacity-80">Tactics, Lessons & Q&A</span>
              </div>
            </button>

            <button
              onClick={() => {
                onNavigate('bot');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">smart_toy</span>
              <span>Play vs Bot Engine</span>
            </button>

            <button
              onClick={() => {
                onNavigate('arena');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
              <span>Play Online Arena</span>
            </button>

            <button
              onClick={() => {
                onNavigate('friend');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">group</span>
              <span>Play with Friend</span>
            </button>

            <button
              onClick={() => {
                onStartOffline();
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">phonelink_setup</span>
              <span>Play Offline (2P)</span>
            </button>

            <button
              onClick={() => {
                onNavigate('profile');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">person</span>
              <span>Profile & History</span>
            </button>

            <button
              onClick={() => {
                onNavigate('settings');
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">settings</span>
              <span>App Settings & Audio</span>
            </button>

            <button
              onClick={() => {
                onOpenAuth();
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#FAF9F6]/10 text-[#FAF9F6] transition-colors text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#D4AF37] text-xl">login</span>
              <span>Login & Account</span>
            </button>

            {onOpenGuide && (
              <button
                onClick={() => {
                  onOpenGuide();
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 text-[#D4AF37] transition-colors text-left cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-xl">help_outline</span>
                <div className="flex flex-col">
                  <span className="font-bold text-xs">New Member Instructions</span>
                  <span className="text-[9px] opacity-80">Software Usage & Features Guide</span>
                </div>
              </button>
            )}

            {onOpenApkInstall && (
              <button
                onClick={() => {
                  onOpenApkInstall();
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] font-bold transition-colors text-left cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-xl">get_app</span>
                <span>Install Software / APK</span>
              </button>
            )}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-body text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>SIGN OUT</span>
          </button>
          <div className="text-center font-body text-[10px] text-[#c4c7c7]/50 uppercase tracking-widest">
            VPN CHESS v2.4
          </div>
        </div>
      </div>
    </div>
  );
};
