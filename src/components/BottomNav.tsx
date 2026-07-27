import React from 'react';

export type TabType = 'home' | 'learn' | 'profile' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="fixed bottom-0 w-full z-50 bg-[#121411]/90 backdrop-blur-xl border-t border-white/10 shadow-2xl flex justify-around items-center h-16 px-4">
      {/* Home Tab */}
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 relative ${
          activeTab === 'home' ? 'text-[#FAF9F6] scale-105' : 'text-[#c4c7c7]/60 hover:text-[#FAF9F6]'
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}
        >
          home
        </span>
        <span className="font-body text-[10px] tracking-wider uppercase mt-0.5">Home</span>
        {activeTab === 'home' && (
          <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
        )}
      </button>

      {/* Learn Academy Tab */}
      <button
        onClick={() => onSelectTab('learn')}
        className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 relative ${
          activeTab === 'learn' ? 'text-[#D4AF37] scale-105 font-bold' : 'text-[#c4c7c7]/60 hover:text-[#D4AF37]'
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: activeTab === 'learn' ? "'FILL' 1" : "'FILL' 0" }}
        >
          psychology
        </span>
        <span className="font-body text-[10px] tracking-wider uppercase mt-0.5">Learn AI</span>
        {activeTab === 'learn' && (
          <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
        )}
      </button>

      {/* Profile Tab */}
      <button
        onClick={() => onSelectTab('profile')}
        className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 relative ${
          activeTab === 'profile' ? 'text-[#FAF9F6] scale-105' : 'text-[#c4c7c7]/60 hover:text-[#FAF9F6]'
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
        >
          person
        </span>
        <span className="font-body text-[10px] tracking-wider uppercase mt-0.5">Profile</span>
        {activeTab === 'profile' && (
          <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
        )}
      </button>

      {/* Settings Tab */}
      <button
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 relative ${
          activeTab === 'settings' ? 'text-[#FAF9F6] scale-105' : 'text-[#c4c7c7]/60 hover:text-[#FAF9F6]'
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: activeTab === 'settings' ? "'FILL' 1" : "'FILL' 0" }}
        >
          settings
        </span>
        <span className="font-body text-[10px] tracking-wider uppercase mt-0.5">Settings</span>
        {activeTab === 'settings' && (
          <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
        )}
      </button>
    </nav>
  );
};
