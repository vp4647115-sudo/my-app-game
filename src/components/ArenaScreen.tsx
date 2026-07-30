import React, { useState } from 'react';
import { UserProfile, ActiveMatchConfig } from '../types';

interface ArenaScreenProps {
  user: UserProfile;
  onStartMatch: (config: ActiveMatchConfig) => void;
  onBack: () => void;
}

export const ArenaScreen: React.FC<ArenaScreenProps> = ({ user, onStartMatch, onBack }) => {
  const [isRanked, setIsRanked] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string>('Connecting to proxy network...');

  const handleFindMatch = () => {
    setIsSearching(true);
    setSearchStatus('Ultra-fast Low-Ping Proxy Connected (12ms)...');

    setTimeout(() => {
      // Pick online opponent
      const opponents = [
        { name: 'Grandmaster_Lars', elo: 2810, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDStYFdzyUT63P-_K2DGhNguEomRVy1t4uTZuZbnzRRYSP6UH5egIzIdxPtKeIMNUvhp3CRZXdXs0PtiMmboH3AlvpB4gnzBfvznzEvKMZ-u4EaReuXSot3pl8FefLThPUc7BgqJ7NIoPT-KJ_FZzhbslnKjz5svMxipf_dvY9g5FyGqu_o4MQlOGYwAsAjJKOOTz58a2KHF7w35hmK0i-H2nvH8FHqrsx-zcjOJ-7l_MZXt5KBBnMYSdQzyUwGjTUTexKzl5oXBngK' },
        { name: 'Sofia_P_88', elo: 2840, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGByqOVp82ycKsMZ51hPLm3Uuia9SiJw0wwC45wSE6k86geDNqgOdyOWpjtW0GaBGdUNQXrjcaCw6SWjl7BROuhGRD63AMjA_QGvgPBnq5ZRlt4bFnUK9IJQfunsTBDGxgIsPwqiZF1HOAPTGMfqiEmgMYsI6qaMTbd-3Cmtsi2TjdhFULD4mm8ORh-WXfkHZNDYthwdrBp-_h8KPCT_ilPYTDarFMhKj6_pzkchZcT0Gs594v6Bp3Uzwo9peUexqAQk1NX0sVY5uh' },
        { name: 'Magnus_Clone', elo: 2890, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUmSczAx28bh3q9G_K7fM0RJ1vHcB_MS06Wm8J7dqcFeNqipJ2-rpDT743cWwCDZR4OXTgXOFraNzS9birat48Sskdj6RcCXN5SFAo7LhSOrdPhThFv0eVm5jVPTQss3mBY_sqALuOexn6oamTSNk9ffoo1KQ69VCfCv5XBVeglzAdqr_VogEEtCLtFEQxFDj9xIfhm_ixZU5TfgU14QBty8iD9ELrQpfS6J2BgJyNe-lAta6sL7aCg8KmPSUnkpFIw1s1P5sgFJdg' },
      ];
      const opp = opponents[Math.floor(Math.random() * opponents.length)];
      const randomColor: 'w' | 'b' = Math.random() < 0.5 ? 'w' : 'b';

      setIsSearching(false);
      onStartMatch({
        mode: 'online',
        playerColor: randomColor,
        timeControlMinutes: 5,
        incrementSeconds: 3,
        opponentName: opp.name,
        opponentElo: opp.elo,
        opponentAvatar: opp.avatar,
        rated: isRanked,
      });
    }, 600);
  };

  return (
    <div className="pt-20 pb-28 px-6 max-w-4xl mx-auto text-[#e3e3de] chess-pattern min-h-screen">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-body text-[#c4c7c7] hover:text-[#FAF9F6] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Home</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="w-full text-center mb-10">
        <h2 className="font-headline text-3xl md:text-4xl text-[#FAF9F6] font-bold mb-2">
          Grandmaster Arena
        </h2>
        <p className="font-body text-sm text-[#c4c7c7]/80 max-w-lg mx-auto leading-relaxed">
          Enter the sanctum. Match with global elites in high-stakes intellectual combat.
        </p>
      </section>

      {/* Control Panel */}
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        {/* Standing & Toggle */}
        <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1 w-full md:w-auto text-left">
            <span className="font-body text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest">
              CURRENT STANDING
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-[#FAF9F6]">{user.elo}</span>
              <span className="font-body text-xs text-[#c4c7c7]">ELO</span>
            </div>
          </div>

          {/* Ranked / Casual Toggle */}
          <div className="flex p-1 bg-[#1e201d] rounded-lg border border-white/5 w-full md:w-auto">
            <button
              onClick={() => setIsRanked(true)}
              className={`flex-1 px-6 py-2 rounded-md font-body text-xs font-bold transition-all ${
                isRanked
                  ? 'bg-[#FAF9F6] text-[#121411] shadow'
                  : 'text-[#c4c7c7] hover:text-[#FAF9F6]'
              }`}
            >
              RANKED
            </button>
            <button
              onClick={() => setIsRanked(false)}
              className={`flex-1 px-6 py-2 rounded-md font-body text-xs font-bold transition-all ${
                !isRanked
                  ? 'bg-[#FAF9F6] text-[#121411] shadow'
                  : 'text-[#c4c7c7] hover:text-[#FAF9F6]'
              }`}
            >
              CASUAL
            </button>
          </div>
        </div>

        {/* Find Match Action Button */}
        <div className="relative group">
          <button
            onClick={handleFindMatch}
            disabled={isSearching}
            className="w-full h-24 bg-[#FAF9F6] text-[#121411] rounded-xl flex items-center justify-center gap-4 hover:bg-white transition-all active:scale-[0.98] animate-pulse-gold cursor-pointer disabled:opacity-80"
          >
            {isSearching ? (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-2xl text-[#D4AF37]">
                  progress_activity
                </span>
                <span className="font-headline text-base md:text-lg font-bold tracking-wider">
                  {searchStatus}
                </span>
              </div>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-3xl text-[#121411]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  play_arrow
                </span>
                <span className="font-headline text-xl md:text-2xl font-bold tracking-widest">
                  FIND MATCH
                </span>
              </>
            )}
          </button>
          <div className="absolute -bottom-2 -right-2 w-full h-full border border-[#D4AF37]/20 rounded-xl -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform pointer-events-none" />
        </div>

        {/* Region Latency Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#D4AF37]">public</span>
              <div>
                <p className="font-body text-xs font-bold text-[#FAF9F6]">NORTH AMERICA</p>
                <p className="text-[10px] text-[#c4c7c7]/80">Optimal Connection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">24ms</span>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-emerald-400 rounded-xs" />
                <div className="w-1 h-3 bg-emerald-400 rounded-xs" />
                <div className="w-1 h-3 bg-emerald-400 rounded-xs" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-lg flex justify-between items-center opacity-70">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#c4c7c7]">public</span>
              <div>
                <p className="font-body text-xs font-bold text-[#c4c7c7]">EUROPE WEST</p>
                <p className="text-[10px] text-[#c4c7c7]/80">Stable</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#c4c7c7]">112ms</span>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-[#c4c7c7] rounded-xs" />
                <div className="w-1 h-3 bg-[#c4c7c7] rounded-xs" />
                <div className="w-1 h-3 bg-white/10 rounded-xs" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-lg flex justify-between items-center opacity-70">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#c4c7c7]">public</span>
              <div>
                <p className="font-body text-xs font-bold text-[#c4c7c7]">ASIA PACIFIC</p>
                <p className="text-[10px] text-[#c4c7c7]/80">Connecting...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#c4c7c7]">245ms</span>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-[#c4c7c7] rounded-xs" />
                <div className="w-1 h-3 bg-white/10 rounded-xs" />
                <div className="w-1 h-3 bg-white/10 rounded-xs" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-lg flex justify-between items-center border-[#D4AF37]/40 border">
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-[#D4AF37]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <div>
                <p className="font-body text-xs font-bold text-[#FAF9F6]">AUTO-SELECT</p>
                <p className="text-[10px] text-[#D4AF37]">Best Performance</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#D4AF37]">check_circle</span>
          </div>
        </div>

        {/* Active Players Visualization */}
        <div className="w-full flex justify-center items-center gap-4 py-2">
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#121411] overflow-hidden">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDStYFdzyUT63P-_K2DGhNguEomRVy1t4uTZuZbnzRRYSP6UH5egIzIdxPtKeIMNUvhp3CRZXdXs0PtiMmboH3AlvpB4gnzBfvznzEvKMZ-u4EaReuXSot3pl8FefLThPUc7BgqJ7NIoPT-KJ_FZzhbslnKjz5svMxipf_dvY9g5FyGqu_o4MQlOGYwAsAjJKOOTz58a2KHF7w35hmK0i-H2nvH8FHqrsx-zcjOJ-7l_MZXt5KBBnMYSdQzyUwGjTUTexKzl5oXBngK"
                alt="Master 1"
              />
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-[#121411] overflow-hidden">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGByqOVp82ycKsMZ51hPLm3Uuia9SiJw0wwC45wSE6k86geDNqgOdyOWpjtW0GaBGdUNQXrjcaCw6SWjl7BROuhGRD63AMjA_QGvgPBnq5ZRlt4bFnUK9IJQfunsTBDGxgIsPwqiZF1HOAPTGMfqiEmgMYsI6qaMTbd-3Cmtsi2TjdhFULD4mm8ORh-WXfkHZNDYthwdrBp-_h8KPCT_ilPYTDarFMhKj6_pzkchZcT0Gs594v6Bp3Uzwo9peUexqAQk1NX0sVY5uh"
                alt="Master 2"
              />
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-[#121411] overflow-hidden">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUmSczAx28bh3q9G_K7fM0RJ1vHcB_MS06Wm8J7dqcFeNqipJ2-rpDT743cWwCDZR4OXTgXOFraNzS9birat48Sskdj6RcCXN5SFAo7LhSOrdPhThFv0eVm5jVPTQss3mBY_sqALuOexn6oamTSNk9ffoo1KQ69VCfCv5XBVeglzAdqr_VogEEtCLtFEQxFDj9xIfhm_ixZU5TfgU14QBty8iD9ELrQpfS6J2BgJyNe-lAta6sL7aCg8KmPSUnkpFIw1s1P5sgFJdg"
                alt="Master 3"
              />
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-[#121411] bg-[#333532] flex items-center justify-center text-[10px] font-bold text-[#e3e3de]">
              +4k
            </div>
          </div>
          <p className="font-body text-xs font-bold text-[#c4c7c7] tracking-wider uppercase">
            4,281 MASTERS ONLINE
          </p>
        </div>
      </div>
    </div>
  );
};
