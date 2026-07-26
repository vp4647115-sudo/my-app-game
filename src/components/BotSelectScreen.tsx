import React, { useState } from 'react';
import { AIDifficulty, PlayerColor, ActiveMatchConfig } from '../types';

interface BotSelectScreenProps {
  onStartMatch: (config: ActiveMatchConfig) => void;
  onBack: () => void;
}

interface DifficultyOption {
  id: AIDifficulty;
  title: string;
  elo: string;
  icon: string;
  description: string;
  isElite?: boolean;
}

const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    elo: 'ELO 400-800',
    icon: 'school',
    description: 'Fundamental patterns. Focuses on safe moves and basic piece development.',
  },
  {
    id: 'easy',
    title: 'Easy',
    elo: 'ELO 800-1200',
    icon: 'child_care',
    description: 'Casual play. Occasional tactical oversights and standard openings.',
  },
  {
    id: 'medium',
    title: 'Medium',
    elo: 'ELO 1200-1600',
    icon: 'cognition',
    description: 'Club level strength. Understands central control and minor tactics.',
  },
  {
    id: 'hard',
    title: 'Hard',
    elo: 'ELO 1600-2000',
    icon: 'military_tech',
    description: 'Advanced competition. Strong positional awareness and endgame precision.',
  },
  {
    id: 'expert',
    title: 'Expert',
    elo: 'ELO 2000-2400',
    icon: 'psychology',
    description: 'National Master depth. Calculated aggression and deep calculation depth.',
  },
  {
    id: 'master',
    title: 'Master',
    elo: 'ELO 2400-2800',
    icon: 'workspace_premium',
    description: 'World-class calculation. Ruthless efficiency and flawless tactical vision.',
  },
  {
    id: 'grandmaster',
    title: 'Grandmaster',
    elo: 'ELO 3000+',
    icon: 'stars',
    description:
      'The zenith of chess artificial intelligence. An uncompromising, supreme computational force that leaves zero room for error. Only for those who seek perfection.',
    isElite: true,
  },
];

export const BotSelectScreen: React.FC<BotSelectScreenProps> = ({ onStartMatch, onBack }) => {
  const [selectedSide, setSelectedSide] = useState<PlayerColor>('white');
  const [selectedDiff, setSelectedDiff] = useState<AIDifficulty>('beginner');

  const handleCommence = () => {
    // Determine player color 'w' or 'b'
    let finalColor: 'w' | 'b' = 'w';
    if (selectedSide === 'black') finalColor = 'b';
    else if (selectedSide === 'random') finalColor = Math.random() < 0.5 ? 'w' : 'b';

    const diffObj = DIFFICULTIES.find((d) => d.id === selectedDiff);
    const opponentElo = diffObj ? parseInt(diffObj.elo.replace(/\D/g, '')) || 1200 : 1200;

    onStartMatch({
      mode: 'bot',
      difficulty: selectedDiff,
      playerColor: finalColor,
      timeControlMinutes: 10,
      incrementSeconds: 0,
      opponentName: `Engine Bot (${diffObj?.title || 'Medium'})`,
      opponentElo,
      rated: false,
    });
  };

  return (
    <div className="pt-20 pb-28 px-6 max-w-4xl mx-auto text-[#e3e3de]">
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

      {/* Header Section */}
      <div className="mb-10 text-center">
        <h2 className="font-headline text-2xl md:text-3xl text-[#FAF9F6] font-bold mb-2 tracking-wide">
          CHALLENGE THE ENGINE
        </h2>
        <p className="font-body text-sm text-[#c4c7c7]/80 max-w-lg mx-auto">
          Select your opponent's tier and choose your side for the ultimate strategic encounter.
        </p>
      </div>

      {/* Side Selection */}
      <section className="mb-10">
        <h3 className="font-body text-xs font-bold text-[#D4AF37] tracking-widest mb-4 text-center uppercase">
          CHOOSE YOUR SIDE
        </h3>
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setSelectedSide('white')}
            className={`w-24 h-24 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 ${
              selectedSide === 'white'
                ? 'bg-[#FAF9F6] text-[#121411] border-[#FAF9F6] shadow-lg scale-105'
                : 'glass-panel text-[#c4c7c7] border-white/10 hover:border-white/30'
            }`}
          >
            <span
              className="material-symbols-outlined text-3xl mb-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              chess_pawn
            </span>
            <span className="font-body text-[10px] font-bold tracking-wider">WHITE</span>
          </button>

          <button
            onClick={() => setSelectedSide('random')}
            className={`w-24 h-24 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 ${
              selectedSide === 'random'
                ? 'bg-[#FAF9F6] text-[#121411] border-[#FAF9F6] shadow-lg scale-105'
                : 'glass-panel text-[#c4c7c7] border-white/10 hover:border-white/30'
            }`}
          >
            <span className="material-symbols-outlined text-3xl mb-1">shuffle</span>
            <span className="font-body text-[10px] font-bold tracking-wider">RANDOM</span>
          </button>

          <button
            onClick={() => setSelectedSide('black')}
            className={`w-24 h-24 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 ${
              selectedSide === 'black'
                ? 'bg-[#FAF9F6] text-[#121411] border-[#FAF9F6] shadow-lg scale-105'
                : 'glass-panel text-[#c4c7c7] border-white/10 hover:border-white/30'
            }`}
          >
            <span
              className="material-symbols-outlined text-3xl mb-1"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              chess_pawn
            </span>
            <span className="font-body text-[10px] font-bold tracking-wider">BLACK</span>
          </button>
        </div>
      </section>

      {/* Difficulty Tiers Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DIFFICULTIES.map((diff) => {
          const isSelected = selectedDiff === diff.id;

          if (diff.isElite) {
            return (
              <div
                key={diff.id}
                onClick={() => setSelectedDiff(diff.id)}
                className={`group md:col-span-2 lg:col-span-3 relative p-6 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? 'border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/15 to-transparent shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                    : 'border-[#D4AF37]/20 glass-panel hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">diamond</span>
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-[#D4AF37]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        stars
                      </span>
                      <span className="font-body text-xs font-bold text-[#D4AF37] tracking-[0.2em]">
                        ELITE TIER
                      </span>
                    </div>
                    <span className="font-body text-xs font-bold text-[#D4AF37]">{diff.elo}</span>
                  </div>
                  <h4
                    className={`font-headline text-2xl font-bold transition-colors ${
                      isSelected ? 'text-[#D4AF37]' : 'text-[#FAF9F6] group-hover:text-[#D4AF37]'
                    }`}
                  >
                    {diff.title}
                  </h4>
                  <p className="font-body text-xs md:text-sm text-[#c4c7c7] mt-3 max-w-2xl leading-relaxed">
                    {diff.description}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={diff.id}
              onClick={() => setSelectedDiff(diff.id)}
              className={`group relative p-5 rounded-xl border glass-panel cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'border-white/5 hover:border-[#D4AF37]/30'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`material-symbols-outlined transition-colors ${
                    isSelected ? 'text-[#D4AF37]' : 'text-[#c4c7c7] group-hover:text-[#D4AF37]'
                  }`}
                >
                  {diff.icon}
                </span>
                <span className="font-body text-[10px] text-[#c4c7c7] font-semibold">{diff.elo}</span>
              </div>
              <h4
                className={`font-headline text-lg font-semibold transition-colors ${
                  isSelected ? 'text-[#D4AF37]' : 'text-[#FAF9F6] group-hover:text-[#D4AF37]'
                }`}
              >
                {diff.title}
              </h4>
              <p className="font-body text-xs text-[#c4c7c7]/80 mt-2 leading-relaxed">
                {diff.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* CTA Action */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <button
          onClick={handleCommence}
          className="w-full md:w-80 h-14 bg-[#FAF9F6] text-[#121411] font-body text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
        >
          <span>COMMENCE MATCH</span>
          <span className="material-symbols-outlined">play_arrow</span>
        </button>
        <button className="font-body text-[10px] text-[#c4c7c7] hover:text-[#D4AF37] transition-colors uppercase tracking-[0.3em]">
          Configure Engine Settings
        </button>
      </div>
    </div>
  );
};
