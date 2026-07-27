import React, { useState } from 'react';
import { UserProfile, MatchHistoryItem } from '../types';

interface ProfileScreenProps {
  user: UserProfile;
  matchHistory: MatchHistoryItem[];
  onOpenEditModal: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  matchHistory,
  onOpenEditModal,
  onUpdateProfile,
  onBack,
}) => {
  const [filterResult, setFilterResult] = useState<'ALL' | 'WIN' | 'LOSS' | 'DRAW'>('ALL');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateProfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdateProfile({
            ...user,
            avatarUrl: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredHistory = matchHistory.filter((item) => {
    if (filterResult === 'ALL') return true;
    return item.result === filterResult;
  });

  // Calculate real score stats from match history
  const realGamesPlayed = matchHistory.length > 0 ? matchHistory.length : user.gamesPlayed;
  const realWins = matchHistory.length > 0 ? matchHistory.filter((m) => m.result === 'WIN').length : user.wins;
  const realLosses = matchHistory.length > 0 ? matchHistory.filter((m) => m.result === 'LOSS').length : user.losses;
  const realDraws = matchHistory.length > 0 ? matchHistory.filter((m) => m.result === 'DRAW').length : user.draws;
  const realWeeklyElo = matchHistory.reduce((acc, m) => acc + (m.eloChange || 0), 0) || user.weeklyEloChange;

  return (
    <div className="pt-20 pb-28 px-6 max-w-4xl mx-auto space-y-6 text-[#e3e3de]">
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

      {/* Hero Section */}
      <section className="glass-panel rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-lg border border-white/10">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar with GM badge and Upload Button */}
        <div className="relative shrink-0 group">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-[#FAF9F6]/20 p-1 relative overflow-hidden bg-[#1e201d]">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-full h-full object-cover rounded-full"
            />
            {/* Hover Camera Overlay / Upload Button */}
            <label
              htmlFor="profile-avatar-input"
              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
              title="Upload New Profile Picture"
            >
              <span className="material-symbols-outlined text-2xl text-[#D4AF37]">photo_camera</span>
              <span className="font-body text-[9px] font-bold uppercase tracking-wider mt-0.5 text-[#FAF9F6]">Upload</span>
            </label>
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#D4AF37] text-[#121411] px-2.5 py-0.5 rounded-full font-body text-[10px] font-bold shadow">
            {user.title || 'GM'}
          </div>
        </div>

        {/* Profile Info */}
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-[#FAF9F6]">
              {user.username}
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-1.5 bg-[#333532] px-3 py-1 rounded-full border border-white/5 w-fit mx-auto md:mx-0">
              <span
                className="material-symbols-outlined text-xs text-[#D4AF37]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                flag
              </span>
              <span className="font-body text-[10px] font-bold text-[#c4c7c7] tracking-wider uppercase">
                {user.country}
              </span>
            </div>
          </div>
          <p className="font-body text-xs md:text-sm text-[#c4c7c7]/80 max-w-md leading-relaxed">
            {user.bio}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <label
              htmlFor="profile-avatar-input-btn"
              className="px-3.5 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] rounded-lg font-body text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              <span>UPLOAD PHOTO</span>
              <input
                id="profile-avatar-input-btn"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={onOpenEditModal}
              className="px-3.5 py-1.5 rounded-lg border border-white/20 text-[#FAF9F6] hover:bg-white/10 font-body text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>EDIT PROFILE</span>
            </button>
          </div>
        </div>

        {/* ELO Rating Card */}
        <div className="flex flex-col items-center justify-center bg-[#FAF9F6]/5 px-6 py-4 rounded-xl border border-[#D4AF37]/20 shrink-0">
          <span className="font-body text-[10px] font-bold text-[#D4AF37] tracking-widest uppercase mb-1">
            ELO RATING
          </span>
          <span className="font-headline text-3xl md:text-4xl font-bold text-[#FAF9F6]">
            {user.elo}
          </span>
          <span className="font-body text-[10px] text-[#d4aca0] font-bold mt-1 uppercase">
            {realWeeklyElo >= 0 ? `+${realWeeklyElo}` : realWeeklyElo} THIS WEEK
          </span>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl text-center border border-white/5 hover:border-[#D4AF37]/30 transition-all">
          <span className="font-body text-[10px] text-[#c4c7c7] font-bold uppercase tracking-wider">
            GAMES PLAYED
          </span>
          <p className="font-headline text-2xl font-bold text-[#FAF9F6] mt-1">
            {realGamesPlayed.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl text-center border border-white/5 hover:border-[#D4AF37]/30 transition-all">
          <span className="font-body text-[10px] text-[#c4c7c7] font-bold uppercase tracking-wider">
            WINS
          </span>
          <p className="font-headline text-2xl font-bold text-[#D4AF37] mt-1">
            {realWins.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl text-center border border-white/5 hover:border-[#D4AF37]/30 transition-all">
          <span className="font-body text-[10px] text-[#c4c7c7] font-bold uppercase tracking-wider">
            LOSSES
          </span>
          <p className="font-headline text-2xl font-bold text-[#e7bdb1] mt-1">
            {realLosses.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl text-center border border-white/5 hover:border-[#D4AF37]/30 transition-all">
          <span className="font-body text-[10px] text-[#c4c7c7] font-bold uppercase tracking-wider">
            DRAWS
          </span>
          <p className="font-headline text-2xl font-bold text-[#c4c7c7] mt-1">
            {realDraws.toLocaleString()}
          </p>
        </div>
      </section>

      {/* Match History Section */}
      <section className="space-y-4 pt-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-headline text-xl font-bold text-[#FAF9F6]">Match History</h3>
          <div className="flex gap-2">
            {(['ALL', 'WIN', 'LOSS', 'DRAW'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterResult(r)}
                className={`font-body text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterResult === r
                    ? 'bg-[#D4AF37] text-[#121411]'
                    : 'text-[#c4c7c7] hover:text-[#FAF9F6] bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#c4c7c7]/40">history</span>
            <p className="font-body text-sm text-[#c4c7c7]">No matches found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const isWin = item.result === 'WIN';
              const isDraw = item.result === 'DRAW';

              return (
                <div
                  key={item.id}
                  className="glass-panel p-4 rounded-xl flex items-center justify-between border border-white/5 hover:border-[#D4AF37]/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        isWin
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                          : isDraw
                          ? 'bg-white/5 border-white/10 text-[#c4c7c7]'
                          : 'bg-[#e7bdb1]/10 border-[#e7bdb1]/30 text-[#e7bdb1]'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: isWin ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {isWin ? 'workspace_premium' : isDraw ? 'horizontal_rule' : 'close'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-body text-[10px] font-bold tracking-wider ${
                            isWin
                              ? 'text-[#D4AF37]'
                              : isDraw
                              ? 'text-[#c4c7c7]'
                              : 'text-[#e7bdb1]'
                          }`}
                        >
                          {item.result}
                        </span>
                        <span className="text-[#c4c7c7]/40 text-[10px]">•</span>
                        <span className="font-body text-[10px] font-semibold text-[#c4c7c7]">
                          {item.timeControl}
                        </span>
                      </div>
                      <p className="font-body text-sm font-semibold text-[#FAF9F6]">
                        {item.opponentName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-body text-sm font-bold ${
                        item.eloChange > 0
                          ? 'text-[#FAF9F6]'
                          : item.eloChange < 0
                          ? 'text-[#e7bdb1]'
                          : 'text-[#c4c7c7]'
                      }`}
                    >
                      {item.eloChange > 0 ? `+${item.eloChange}` : item.eloChange} ELO
                    </p>
                    <p className="font-body text-[10px] text-[#c4c7c7]/60">{item.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
