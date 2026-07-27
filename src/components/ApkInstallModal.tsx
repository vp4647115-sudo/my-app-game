import React, { useState, useEffect } from 'react';

interface ApkInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Direct user with mobile APK / WebApp instructions
      alert(
        'To install as native app/APK:\n1. Open browser menu (⋮ or Share icon)\n2. Tap "Install App" or "Add to Home Screen"\n3. Launch directly from your home screen as standalone software!'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-[#D4AF37]/30 shadow-2xl space-y-5 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer p-1"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#806412] p-0.5 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl text-[#121411]">android</span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">Install Software / APK</h3>
            <p className="text-xs text-[#D4AF37] font-semibold">Standalone Native Web Game</p>
          </div>
        </div>

        <p className="text-xs text-[#c4c7c7] leading-relaxed">
          Convert and run <strong className="text-white">VPN Chess</strong> directly as installed software on your Android phone, Tablet, PC, or iOS device without browser address bars!
        </p>

        {/* Feature list */}
        <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Instant Home Screen Launch</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Full-screen Offline & Online Gameplay</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Ultra Low Latency FIDE Chess Engine</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {installed ? (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-bold">
              ✓ App Installed Successfully! Launch from Home Screen.
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#aa8820] text-[#121411] font-headline font-bold text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">download_for_offline</span>
              <span>{deferredPrompt ? 'INSTALL APK / APP NOW' : 'HOW TO INSTALL TO PHONE/PC'}</span>
            </button>
          )}

          <div className="text-[11px] text-[#c4c7c7]/70 text-center leading-normal">
            Android: Chrome Menu &rarr; "Install app" or "Add to Home Screen"
            <br />
            iOS / Safari: Share button &rarr; "Add to Home Screen"
          </div>
        </div>
      </div>
    </div>
  );
};
