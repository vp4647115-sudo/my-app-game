import React, { useState, useEffect } from 'react';
import { UserProfile, GameSettings, GeminiCoachResponse, GeminiPuzzleChallenge } from '../types';
import { Chess, Square } from 'chess.js';
import { ChessPieceSvg } from './ChessPieceSvg';
import { useChessAudio } from '../hooks/useChessAudio';

interface LearnAcademyScreenProps {
  user: UserProfile;
  settings: GameSettings;
  onBack: () => void;
  onStartMatch: (config: any) => void;
  onOpenPayUModal?: () => void;
}

export const LearnAcademyScreen: React.FC<LearnAcademyScreenProps> = ({
  user,
  settings,
  onBack,
  onStartMatch,
  onOpenPayUModal,
}) => {
  const [activeTab, setActiveTab] = useState<'tutor' | 'puzzle' | 'openings' | 'practice'>('tutor');
  const { playMove, playCapture, playGameEnd } = useChessAudio(settings);

  // --- Tutor Q&A State ---
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorTopic, setTutorTopic] = useState('General Strategy');
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // Suggested Questions
  const suggestedQuestions = [
    'How do I counter the Sicilian Defense as White?',
    'What are the core principles of rook endgames?',
    'How can I spot pins, forks, and skewers faster in blitz games?',
    'When should I pawn storm my opponent castled king?',
    'How do I improve my chess calculation and stop blunder mistakes?',
  ];

  const handleAskTutor = async (questionToAsk?: string) => {
    const q = questionToAsk || tutorQuestion;
    if (!q.trim()) return;

    setIsTutorLoading(true);
    setTutorAnswer(null);

    try {
      const res = await fetch('/api/gemini/ask-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, topic: tutorTopic }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setTutorAnswer(data.answer);
      } else {
        setTutorAnswer('Focus on controlling the center (d4/e4), developing knights and bishops, and castling early!');
      }
    } catch (err) {
      setTutorAnswer('Control the central squares, keep your king safe, and calculate captures carefully before moving!');
    } finally {
      setIsTutorLoading(false);
    }
  };

  // --- Puzzle Challenge State ---
  const [puzzleTopic, setPuzzleTopic] = useState('Tactical Pin');
  const [puzzle, setPuzzle] = useState<GeminiPuzzleChallenge | null>(null);
  const [isPuzzleLoading, setIsPuzzleLoading] = useState(false);
  const [puzzleChess, setPuzzleChess] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [puzzleFeedback, setPuzzleFeedback] = useState<string | null>(null);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const fetchNewPuzzle = async () => {
    setIsPuzzleLoading(true);
    setPuzzleFeedback(null);
    setPuzzleSolved(false);
    setSelectedSquare(null);

    try {
      const res = await fetch('/api/gemini/generate-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: puzzleTopic, difficulty: 'Medium' }),
      });
      const data = await res.json();
      if (data.success && data.fen) {
        try {
          const ch = new Chess(data.fen);
          setPuzzle(data);
          setPuzzleChess(ch);
        } catch {
          const defaultFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
          setPuzzle({ ...data, fen: defaultFen });
          setPuzzleChess(new Chess(defaultFen));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPuzzleLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'puzzle' && !puzzle) {
      fetchNewPuzzle();
    }
  }, [activeTab]);

  const handlePuzzleSquareClick = (sq: Square) => {
    if (!puzzleChess || puzzleSolved) return;

    if (!selectedSquare) {
      const piece = puzzleChess.get(sq);
      if (piece && piece.color === puzzleChess.turn()) {
        setSelectedSquare(sq);
      }
      return;
    }

    if (selectedSquare === sq) {
      setSelectedSquare(null);
      return;
    }

    try {
      const move = puzzleChess.move({ from: selectedSquare, to: sq, promotion: 'q' });
      if (move) {
        const playedSan = move.san;
        const targetSan = puzzle?.solutionSan?.[0];

        if (targetSan && (playedSan === targetSan || playedSan.replace(/[+#]/g, '') === targetSan.replace(/[+#]/g, ''))) {
          setPuzzleSolved(true);
          setPuzzleFeedback(`🎉 EXCELLENT! Brilliant execution of ${playedSan}. ${puzzle?.explanation || ''}`);
          setPuzzleChess(new Chess(puzzleChess.fen()));
          playGameEnd(true);
        } else {
          setPuzzleFeedback(`Not quite the optimal tactic (you played ${playedSan}). Try again or analyze the board!`);
          if (move.captured) playCapture();
          else playMove();
          // Undo move
          puzzleChess.undo();
          setPuzzleChess(new Chess(puzzleChess.fen()));
        }
      } else {
        const newPiece = puzzleChess.get(sq);
        if (newPiece && newPiece.color === puzzleChess.turn()) {
          setSelectedSquare(sq);
        } else {
          setSelectedSquare(null);
        }
      }
    } catch {
      setSelectedSquare(null);
    }
  };

  // --- Practice Board & Gemini Coach State ---
  const [practiceChess, setPracticeChess] = useState<Chess>(() => new Chess());
  const [practiceSelectedSquare, setPracticeSelectedSquare] = useState<Square | null>(null);
  const [coachAnalysis, setCoachAnalysis] = useState<GeminiCoachResponse | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const handleAskCoachForCurrentPosition = async () => {
    setIsCoachLoading(true);
    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: practiceChess.fen(),
          playerElo: user.elo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCoachAnalysis(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const handlePracticeSquareClick = (sq: Square) => {
    if (!practiceSelectedSquare) {
      const piece = practiceChess.get(sq);
      if (piece && piece.color === practiceChess.turn()) {
        setPracticeSelectedSquare(sq);
      }
      return;
    }

    if (practiceSelectedSquare === sq) {
      setPracticeSelectedSquare(null);
      return;
    }

    try {
      const newChess = new Chess(practiceChess.fen());
      const move = newChess.move({ from: practiceSelectedSquare, to: sq, promotion: 'q' });
      if (move) {
        setPracticeChess(newChess);
        setPracticeSelectedSquare(null);
      } else {
        const piece = practiceChess.get(sq);
        if (piece && piece.color === practiceChess.turn()) {
          setPracticeSelectedSquare(sq);
        } else {
          setPracticeSelectedSquare(null);
        }
      }
    } catch {
      setPracticeSelectedSquare(null);
    }
  };

  // Openings Data
  const openings = [
    {
      name: 'Sicilian Defense',
      moves: '1. e4 c5',
      idea: 'Asymmetrical counter-attack aiming for victory with Black.',
      tier: 'GRANDMASTER FAVORITE',
      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      name: "Queen's Gambit",
      moves: '1. d4 d5 2. c4',
      idea: 'Offer a flank pawn to dominate the central squares d4 and e4.',
      tier: 'TACTICAL MASTER',
      color: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]',
    },
    {
      name: 'Italian Game',
      moves: '1. e4 e5 2. Nf3 Nc6 3. Bc4',
      idea: 'Rapid piece development targeting Black vulnerable f7 pawn.',
      tier: 'CLASSICAL FUNDAMENTAL',
      color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    },
    {
      name: 'Ruy Lopez (Spanish Opening)',
      moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5',
      idea: 'Pressures knight on c6 to control e5 and d4 central levers.',
      tier: 'WORLD CHAMPION CLASSIC',
      color: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    },
  ];

  const boardThemeClass = settings.boardTheme === 'emerald'
    ? 'bg-[#18392b] border-[#2d6a4f]'
    : settings.boardTheme === 'obsidian'
    ? 'bg-[#1a1a1a] border-[#333333]'
    : 'bg-[#2b1f1d] border-[#4a3532]';

  const isLowPerf = settings.lowPerformanceMode;

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 max-w-6xl mx-auto flex flex-col space-y-6">
      {/* Header Banner */}
      <div className={`rounded-2xl p-6 ${isLowPerf ? 'bg-[#1b1e19] border border-[#D4AF37]/30' : 'glass-panel border border-[#D4AF37]/40 shadow-xl bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-[#121411]'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-lg shrink-0">
            <span className="material-symbols-outlined text-3xl">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37] text-[#121411]">
                Chess Master AI
              </span>
              <span className="text-xs text-[#c4c7c7] font-mono">Grandmaster Tutor Engine</span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-[#FAF9F6] mt-1">
              VPN Chess Learning Academy
            </h1>
            <p className="text-xs text-[#c4c7c7]">
              Master tactics, ask Chess Master strategies, practice puzzles, and receive real-time coaching.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPayUModal && (
            <button
              onClick={onOpenPayUModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#FF8C00] text-[#120B05] text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(255,183,3,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
              <span>{user.isPremium ? 'VIP Active' : 'PayU VIP ₹10'}</span>
            </button>
          )}

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#e3e3de] border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'tutor', label: 'Chess Master Tutor Q&A', icon: 'chat' },
          { id: 'puzzle', label: 'Daily Tactical Puzzles', icon: 'extension' },
          { id: 'openings', label: 'Master Openings', icon: 'menu_book' },
          { id: 'practice', label: 'Interactive AI Board', icon: 'sports_esports' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#D4AF37] text-[#121411] border-[#D4AF37] shadow-md'
                : 'bg-[#181a17] text-[#c4c7c7] border-white/5 hover:border-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Chess Master Tutor Q&A */}
      {activeTab === 'tutor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className={`p-6 rounded-2xl ${isLowPerf ? 'bg-[#181a17] border border-white/10' : 'glass-panel border border-white/10 shadow-lg'} space-y-4`}>
              <h2 className="font-headline text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37]">auto_awesome</span>
                Ask Chess Master
              </h2>
              <p className="text-xs text-[#c4c7c7]">
                Type any chess question regarding strategies, defense, endgames, or famous tactical themes.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
                  placeholder="e.g. How do I punish over-aggressive pawn pushes?"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#121411] border border-white/15 text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  onClick={() => handleAskTutor()}
                  disabled={isTutorLoading}
                  className="px-6 py-3 bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0 disabled:opacity-50"
                >
                  {isTutorLoading ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>Ask AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Answer Output */}
              {tutorAnswer && (
                <div className="p-5 rounded-xl bg-[#121411] border border-[#D4AF37]/40 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>CHESS MASTER TUTOR ANALYSIS</span>
                  </div>
                  <div className="text-xs text-[#e3e3de] leading-relaxed whitespace-pre-line font-mono">
                    {tutorAnswer}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className={`p-6 rounded-2xl ${isLowPerf ? 'bg-[#181a17] border border-white/10' : 'glass-panel border border-white/10 shadow-lg'} space-y-4`}>
            <h3 className="font-headline text-sm font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">lightbulb</span>
              Suggested Questions
            </h3>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTutorQuestion(q);
                    handleAskTutor(q);
                  }}
                  className="p-3 rounded-xl bg-[#121411] hover:bg-[#1f221e] border border-white/10 hover:border-[#D4AF37]/40 text-left text-xs text-[#c4c7c7] hover:text-[#FAF9F6] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span>{q}</span>
                  <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 text-[#D4AF37] transition-opacity">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Daily Tactical Puzzles */}
      {activeTab === 'puzzle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col items-center">
            {isPuzzleLoading ? (
              <div className="w-full aspect-square max-w-[420px] rounded-2xl bg-[#181a17] border border-white/10 flex flex-col items-center justify-center p-6 space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#D4AF37] animate-spin">
                  progress_activity
                </span>
                <p className="text-xs text-[#c4c7c7]">Chess Master is calculating tactical puzzle position...</p>
              </div>
            ) : puzzleChess ? (
              <div className="w-full max-w-[420px] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#c4c7c7] px-1">
                  <span className="font-bold text-[#FAF9F6]">{puzzle?.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                    {puzzle?.difficulty}
                  </span>
                </div>

                {/* Puzzle Chess Board */}
                <div className={`w-full aspect-square rounded-2xl overflow-hidden border-2 ${boardThemeClass} p-1 grid grid-cols-8 grid-rows-8 shadow-2xl`}>
                  {puzzleChess.board().flatMap((row, rIdx) =>
                    row.map((piece, cIdx) => {
                      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
                      const squareName = (files[cIdx] + ranks[rIdx]) as Square;
                      const isLight = (rIdx + cIdx) % 2 === 0;
                      const isSelected = selectedSquare === squareName;

                      return (
                        <div
                          key={squareName}
                          onClick={() => handlePuzzleSquareClick(squareName)}
                          className={`relative flex items-center justify-center cursor-pointer select-none transition-all ${
                            isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]'
                          } ${isSelected ? 'ring-2 ring-inset ring-[#D4AF37] z-10' : ''}`}
                        >
                          {piece && (
                            <div className="w-[82%] h-[82%]">
                              <ChessPieceSvg
                                color={piece.color}
                                type={piece.type}
                                style={settings.pieceStyle}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Feedback */}
                {puzzleFeedback && (
                  <div className={`p-4 rounded-xl text-xs font-bold ${puzzleSolved ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' : 'bg-red-500/15 border border-red-500/40 text-red-300'} animate-fade-in`}>
                    {puzzleFeedback}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className={`p-6 rounded-2xl ${isLowPerf ? 'bg-[#181a17] border border-white/10' : 'glass-panel border border-white/10 shadow-lg'} space-y-4`}>
              <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">Puzzle Controls</h3>
              <p className="text-xs text-[#c4c7c7]">{puzzle?.goal || 'Click pieces to play the optimal move.'}</p>

              <div>
                <label className="block text-xs text-[#c4c7c7] mb-1 font-bold uppercase tracking-wider">
                  Tactical Topic
                </label>
                <select
                  value={puzzleTopic}
                  onChange={(e) => setPuzzleTopic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#121411] border border-white/15 text-xs text-[#FAF9F6]"
                >
                  <option value="Tactical Pin">Tactical Pin</option>
                  <option value="Royal Fork">Royal Fork</option>
                  <option value="Back-Rank Mate">Back-Rank Mate</option>
                  <option value="Discovered Attack">Discovered Attack</option>
                  <option value="Endgame Pawn Promotion">Endgame Pawn Promotion</option>
                </select>
              </div>

              <button
                onClick={fetchNewPuzzle}
                disabled={isPuzzleLoading}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Generate New Tactical Puzzle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Master Openings */}
      {activeTab === 'openings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {openings.map((op, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl ${isLowPerf ? 'bg-[#181a17] border border-white/10' : 'glass-panel border border-white/10 shadow-lg'} space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${op.color}`}>
                  {op.tier}
                </span>
                <span className="font-mono text-xs text-[#FAF9F6] font-bold">{op.moves}</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-[#FAF9F6]">{op.name}</h3>
              <p className="text-xs text-[#c4c7c7] leading-relaxed">{op.idea}</p>

              <button
                onClick={() => {
                  setActiveTab('practice');
                  setPracticeChess(new Chess());
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs text-[#D4AF37] font-bold border border-[#D4AF37]/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>Practice this Opening</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Interactive AI Practice Board */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[420px] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#c4c7c7] px-1">
                <span>Free Practice Sandbox</span>
                <button
                  onClick={() => setPracticeChess(new Chess())}
                  className="text-[#D4AF37] underline font-bold cursor-pointer"
                >
                  Reset Board
                </button>
              </div>

              {/* Practice Board */}
              <div className={`w-full aspect-square rounded-2xl overflow-hidden border-2 ${boardThemeClass} p-1 grid grid-cols-8 grid-rows-8 shadow-2xl`}>
                {practiceChess.board().flatMap((row, rIdx) =>
                  row.map((piece, cIdx) => {
                    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
                    const squareName = (files[cIdx] + ranks[rIdx]) as Square;
                    const isLight = (rIdx + cIdx) % 2 === 0;
                    const isSelected = practiceSelectedSquare === squareName;

                    return (
                      <div
                        key={squareName}
                        onClick={() => handlePracticeSquareClick(squareName)}
                        className={`relative flex items-center justify-center cursor-pointer select-none transition-all ${
                          isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]'
                        } ${isSelected ? 'ring-2 ring-inset ring-[#D4AF37] z-10' : ''}`}
                      >
                        {piece && (
                          <div className="w-[82%] h-[82%]">
                            <ChessPieceSvg
                              color={piece.color}
                              type={piece.type}
                              style={settings.pieceStyle}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Coach Analysis Side Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-6 rounded-2xl ${isLowPerf ? 'bg-[#181a17] border border-white/10' : 'glass-panel border border-white/10 shadow-lg'} space-y-4`}>
              <h3 className="font-headline text-lg font-bold text-[#FAF9F6] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37]">psychology</span>
                Chess Master Coach Real-Time Insight
              </h3>

              <button
                onClick={handleAskCoachForCurrentPosition}
                disabled={isCoachLoading}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#b8972e] text-[#121411] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isCoachLoading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                    <span>Analyzing Position...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    <span>Analyze Current Board State</span>
                  </>
                )}
              </button>

              {coachAnalysis && (
                <div className="space-y-3 pt-2 text-xs border-t border-white/10 animate-fade-in">
                  <div className="p-3 rounded-xl bg-[#121411] border border-[#D4AF37]/30">
                    <span className="font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
                      Theme: {coachAnalysis.keyConcept}
                    </span>
                    <p className="text-[#c4c7c7]">{coachAnalysis.evaluation}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121411] border border-white/10">
                    <span className="font-bold text-[#FAF9F6] block mb-1">Master Advice:</span>
                    <p className="text-[#c4c7c7]">{coachAnalysis.coachingAdvice}</p>
                  </div>

                  {coachAnalysis.recommendedMoves?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-[#FAF9F6] block">Best Moves:</span>
                      {coachAnalysis.recommendedMoves.map((m, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-[#121411] border border-white/5 font-mono">
                          <span className="text-[#D4AF37] font-bold">{m.san}</span> ({m.from} → {m.to}):{' '}
                          <span className="text-[#c4c7c7] font-sans">{m.explanation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
