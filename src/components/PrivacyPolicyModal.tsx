import React from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-fade-in">
      <div className="bg-[#181a17] border border-[#D4AF37]/30 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-[#e3e3de] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#121411]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#D4AF37]">shield</span>
            <h2 className="font-display font-bold text-lg text-[#FAF9F6] tracking-wide">
              PRIVACY POLICY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Privacy Policy"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 font-body text-sm text-[#c4c7c7] leading-relaxed">
          <p className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
            Last Updated: July 2026
          </p>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#FAF9F6] text-base">1. Introduction</h3>
            <p>
              Welcome to VPN Chess Master. We value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how your data is collected, used, and safeguarded when using our application.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#FAF9F6] text-base">2. Information We Collect</h3>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-white">Account Information:</strong> When signing in with Google or creating an account, we store your email address and display name to manage your player profile, game history, and match records.
              </li>
              <li>
                <strong className="text-white">Game Statistics:</strong> Your ELO rating, game results, move histories, and puzzle achievements are recorded to provide leaderboard rankings and analytics.
              </li>
              <li>
                <strong className="text-white">Device & Preferences:</strong> Sound settings, theme preferences, and offline board layouts are stored locally on your device.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#FAF9F6] text-base">3. How We Use Your Data</h3>
            <p>
              Your data is strictly used to authenticate your identity, synchronize your chess progress across sessions, power real-time online matchmaking, and prevent fraud. We do not sell or rent your personal information to third parties.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#FAF9F6] text-base">4. Security & Storage</h3>
            <p>
              All data transmissions are encrypted using standard SSL/TLS protocols. Authentication is securely managed via standard authentication providers (Google Firebase & Supabase).
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#FAF9F6] text-base">5. Contact Us</h3>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please contact our support team at <span className="text-[#D4AF37]">privacy@vpnchessmaster.com</span>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#121411] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] font-body text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>
  );
};
