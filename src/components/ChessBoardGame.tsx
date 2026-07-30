import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { animate, stagger } from 'animejs';
import { ActiveMatchConfig, UserProfile, GameSettings, MatchHistoryItem } from '../types';
import { getAIMove, evaluateBoard } from '../services/aiEngine';
import { soundService } from '../services/sound';
import { useChessAudio } from '../hooks/useChessAudio';
import { ChessPieceSvg, PieceStyle } from './ChessPieceSvg';

interface ChessBoardGameProps {
  config: ActiveMatchConfig;
  user: UserProfile;
  settings: GameSettings;
  onGameComplete: (result: 'WIN' | 'LOSS' | 'DRAW', eloChange: number, pgn: string) => void;
  onExit: () => void;
}

export const ChessBoardGame: React.FC<ChessBoardGameProps> = ({
  config,
  user,
  settings,
  onGameComplete,
  onExit,
}) => {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameOverResult, setGameOverResult] = useState<{
    result: 'WIN' | 'LOSS' | 'DRAW';
    reason: string;
    eloChange: number;
  } | null>(null);

  // Local Graphic Customization Overrides
  const [activeBoardTheme, setActiveBoardTheme] = useState<'walnut' | 'emerald' | 'obsidian' | 'royal' | 'marble'>(
    settings.boardTheme || 'walnut'
  );
  const [activePieceStyle, setActivePieceStyle] = useState<PieceStyle>(
    settings.pieceStyle || 'neo-grandmaster'
  );
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);

  // Clocks in seconds
  const [playerTime, setPlayerTime] = useState<number>(config.timeControlMinutes * 60);
  const [opponentTime, setOpponentTime] = useState<number>(config.timeControlMinutes * 60);
  const [moveDuration, setMoveDuration] = useState<number>(0);
  const [totalMatchSeconds, setTotalMatchSeconds] = useState<number>(0);

  const playerColor: Color = config.playerColor;

  // Active turn indicators
  const isBottomClockActive =
    config.mode === 'offline' ? game.turn() === 'w' : game.turn() === playerColor;
  const isTopClockActive = !isBottomClockActive;

  const isPlayerTurn =
    config.mode === 'offline' ? true : game.turn() === playerColor;
  const activeTurnColor: Color =
    config.mode === 'offline' ? game.turn() : playerColor;

  const [turnNotice, setTurnNotice] = useState<string | null>(null);

  // Pawn Promotion Dialog State
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Keep gameRef updated to avoid stale state in polling interval
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Active game ID counter to discard stale bot moves
  const activeGameIdRef = useRef<number>(0);

  // Ref to ensure Bot doesn't trigger multiple times
  const botMovingRef = useRef<boolean>(false);

  // Timestamp delta tracker for exact clock calculation across background tabs
  const lastTickTimeRef = useRef<number>(Date.now());

  const { playMove, playCapture, playCheck, playCastle, playPromote, playGameEnd, playDraw, playLowTime } = useChessAudio(settings);

  // Sound helper wrapper
  const playSnd = useCallback(
    (type: 'move' | 'capture' | 'check' | 'end' | 'castle' | 'promote' | 'draw' | 'lowTime', victory?: boolean) => {
      try {
        if (type === 'move') playMove();
        else if (type === 'capture') playCapture();
        else if (type === 'check') playCheck();
        else if (type === 'castle') playCastle();
        else if (type === 'promote') playPromote();
        else if (type === 'draw') playDraw();
        else if (type === 'lowTime') playLowTime();
        else if (type === 'end') playGameEnd(Boolean(victory));
      } catch (err) {
        // Audio error silent catch
      }
    },
    [playMove, playCapture, playCheck, playCastle, playPromote, playDraw, playLowTime, playGameEnd]
  );

  // Anime.js Entrance Animation for Chessboard (Only once on mount)
  useEffect(() => {
    if (!settings.lowPerformanceMode) {
      try {
        animate('.board-square', {
          scale: [0.95, 1],
          opacity: [0, 1],
          delay: stagger(6, { grid: [8, 8], from: 'center' }),
          duration: 350,
          ease: 'outQuad',
        });
      } catch (err) {
        console.warn('Board square animation skipped:', err);
      }
    }
  }, []);

  // Anime.js Last Move Impact Animation
  useEffect(() => {
    if (lastMove && !settings.lowPerformanceMode) {
      try {
        animate('.last-move-sq', {
          scale: [1.08, 1],
          duration: 200,
          ease: 'outQuad',
        });
      } catch (err) {
        console.warn('Last move animation skipped:', err);
      }
    }
  }, [lastMove]);

  // Gemini AI In-Game Coach State
  const [isGeminiCoachOpen, setIsGeminiCoachOpen] = useState(false);
  const [geminiCoachData, setGeminiCoachData] = useState<any>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const handleFetchGeminiCoach = async () => {
    setIsCoachLoading(true);
    setIsGeminiCoachOpen(true);
    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: game.fen(),
          lastMove: lastMove ? { from: lastMove.from, to: lastMove.to } : undefined,
          playerElo: user.elo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeminiCoachData(data);
      }
    } catch (err) {
      console.error('Failed to fetch coach:', err);
    } finally {
      setIsCoachLoading(false);
    }
  };

  // Handle Game Over
  const handleGameOver = useCallback(
    (result: 'WIN' | 'LOSS' | 'DRAW', reason: string) => {
      if (gameOverResult) return;

      let eloChange = 0;
      if (result === 'WIN') eloChange = config.rated ? 12 : 0;
      else if (result === 'LOSS') eloChange = config.rated ? -10 : 0;

      playSnd('end', result === 'WIN');
      setGameOverResult({ result, reason, eloChange });
      onGameComplete(result, eloChange, game.pgn());
    },
    [gameOverResult, config.rated, playSnd, game, onGameComplete]
  );

  // Check board state after every move
  const checkGameEndConditions = useCallback(
    (g: Chess) => {
      if (g.isCheckmate()) {
        const winner = g.turn() === 'w' ? 'b' : 'w';
        if (winner === playerColor) {
          playSnd('end', true);
          handleGameOver('WIN', 'Checkmate!');
        } else {
          playSnd('end', false);
          handleGameOver('LOSS', 'Checkmate!');
        }
      } else if (g.isStalemate()) {
        playSnd('draw');
        handleGameOver('DRAW', 'Draw by Stalemate');
      } else if (g.isThreefoldRepetition()) {
        playSnd('draw');
        handleGameOver('DRAW', 'Draw by Threefold Repetition');
      } else if (g.isInsufficientMaterial()) {
        playSnd('draw');
        handleGameOver('DRAW', 'Draw by Insufficient Material');
      } else if (g.isDraw()) {
        playSnd('draw');
        handleGameOver('DRAW', 'Draw by 50-Move Rule');
      } else if (g.inCheck()) {
        playSnd('check');
      }
    },
    [playerColor, handleGameOver, playSnd]
  );

  // Real-time friend room state sync (polling every 800ms safely)
  useEffect(() => {
    if (config.mode !== 'friend' || !config.roomCode || gameOverResult) return;

    const syncRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${config.roomCode}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.room && data.room.fen) {
          if (data.room.fen !== gameRef.current.fen()) {
            const updated = new Chess(data.room.fen);
            setGame(updated);
            if (data.room.lastMove) {
              setLastMove(data.room.lastMove);
            }
            setMoveHistory(updated.history());
            playSnd('move');
            checkGameEndConditions(updated);
          }
        }
      } catch (err) {
        // Catch silently to prevent unhandled rejection console noise
      }
    };

    syncRoom();
    const timer = setInterval(syncRoom, 800);
    return () => clearInterval(timer);
  }, [config.mode, config.roomCode, gameOverResult, playSnd, checkGameEndConditions]);

  // Timer Countdown Effect
  useEffect(() => {
    if (gameOverResult) return;

    lastTickTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.max(1, Math.floor((now - lastTickTimeRef.current) / 1000));
      lastTickTimeRef.current = now;

      const turn = game.turn();
      const isBottomTurn =
        config.mode === 'offline' ? turn === 'w' : turn === playerColor;

      if (isBottomTurn) {
        setPlayerTime((t) => {
          const next = Math.max(0, t - deltaSeconds);
          if (next <= 10 && next > 0 && next < t) {
            playSnd('lowTime');
          }
          return next;
        });
      } else {
        setOpponentTime((t) => Math.max(0, t - deltaSeconds));
      }

      setMoveDuration((s) => s + deltaSeconds);
      setTotalMatchSeconds((s) => s + deltaSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [game, config.mode, playerColor, gameOverResult]);

  // Handle Timeout Game Over
  useEffect(() => {
    if (gameOverResult) return;

    if (playerTime <= 0) {
      handleGameOver('LOSS', 'Time expired');
    } else if (opponentTime <= 0) {
      handleGameOver('WIN', 'Opponent time expired');
    }
  }, [playerTime, opponentTime, gameOverResult, handleGameOver]);

  // Quick Chat State for Online Matches
  const [opponentChatBubble, setOpponentChatBubble] = useState<string | null>(null);
  const [showQuickChatMenu, setShowQuickChatMenu] = useState<boolean>(false);

  // Send initial human opponent greeting in online mode
  useEffect(() => {
    if (config.mode === 'online') {
      const timer = setTimeout(() => {
        const greetings = ['Good luck! ♟️', 'GL HF! 🤝', 'Hello! Have a good game!'];
        const chosen = greetings[Math.floor(Math.random() * greetings.length)];
        setOpponentChatBubble(chosen);
        setTimeout(() => setOpponentChatBubble(null), 4000);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [config.mode]);

  // AI Bot & Online Opponent Turn Execution
  useEffect(() => {
    if (gameOverResult) return;

    const isBotOrOnlineMode = config.mode === 'bot' || config.mode === 'online';

    if (!isPlayerTurn && isBotOrOnlineMode && !botMovingRef.current) {
      botMovingRef.current = true;
      setIsBotThinking(true);
      const currentId = activeGameIdRef.current;

      let diff = config.difficulty || 'medium';
      if (config.mode === 'online') {
        const elo = config.opponentElo || 2000;
        if (elo >= 2800) diff = 'grandmaster';
        else if (elo >= 2400) diff = 'master';
        else diff = 'hard';
      }

      // Simulate realistic human move delay for online matches (1.2s - 3.2s)
      const moveDelay = config.mode === 'online' ? Math.floor(Math.random() * 2000) + 1200 : 300;

      getAIMove(gameRef.current, diff)
        .then((aiSan) => {
          if (!aiSan || activeGameIdRef.current !== currentId) {
            setIsBotThinking(false);
            botMovingRef.current = false;
            return;
          }

          setTimeout(() => {
            if (activeGameIdRef.current !== currentId) {
              setIsBotThinking(false);
              botMovingRef.current = false;
              return;
            }

            const copy = new Chess(gameRef.current.fen());
            const moveRes = copy.move(aiSan);
            if (moveRes) {
              setGame(copy);
              setLastMove({ from: moveRes.from, to: moveRes.to });
              setMoveHistory(copy.history());
              setMoveDuration(0);

              if (moveRes.flags.includes('k') || moveRes.flags.includes('q')) playSnd('castle');
              else if (moveRes.flags.includes('p')) playSnd('promote');
              else if (moveRes.captured) playSnd('capture');
              else playSnd('move');

              checkGameEndConditions(copy);

              // Occasional opponent reactions on captures/checks in online mode
              if (config.mode === 'online' && Math.random() < 0.25) {
                const reactions = ['Nice tactic!', 'Tricky move...', 'Oooh!', 'Well played!'];
                const react = reactions[Math.floor(Math.random() * reactions.length)];
                setTimeout(() => {
                  setOpponentChatBubble(react);
                  setTimeout(() => setOpponentChatBubble(null), 3000);
                }, 800);
              }
            }
            setIsBotThinking(false);
            botMovingRef.current = false;
          }, moveDelay);
        })
        .catch(() => {
          setIsBotThinking(false);
          botMovingRef.current = false;
        });
    }
  }, [isPlayerTurn, config.mode, config.difficulty, config.opponentElo, gameOverResult, playSnd, checkGameEndConditions]);

  // Execute Move Helper with Promotion
  const executeMove = (from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n' = 'q') => {
    try {
      const copy = new Chess(game.fen());
      const moveRes = copy.move({ from, to, promotion });

      if (moveRes) {
        activeGameIdRef.current++;
        setGame(copy);
        setLastMove({ from, to });
        setMoveHistory(copy.history());
        setSelectedSquare(null);
        setValidMoves([]);
        setMoveDuration(0);

        if (moveRes.flags.includes('k') || moveRes.flags.includes('q')) playSnd('castle');
        else if (moveRes.flags.includes('p')) playSnd('promote');
        else if (moveRes.captured) playSnd('capture');
        else playSnd('move');

        checkGameEndConditions(copy);

        // If playing in friend mode, post move to room
        if (config.mode === 'friend' && config.roomCode) {
          fetch('/api/rooms/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: config.roomCode,
              from,
              to,
              promotion,
              fen: copy.fen(),
              san: moveRes.san,
            }),
          }).catch(() => {});
        }
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } catch {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Handle Square Selection and Move Execution
  const handleSquareClick = (square: Square) => {
    if (gameOverResult || isBotThinking || pendingPromotion) return;

    if (!isPlayerTurn) {
      setTurnNotice("It is your opponent's turn to move!");
      setTimeout(() => setTurnNotice(null), 2500);
      return;
    }

    const piece = game.get(square);

    // If square has active player's piece, select it
    if (piece && piece.color === activeTurnColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to));
      return;
    }

    // If a square was already selected, attempt to move
    if (selectedSquare) {
      let targetSq = square;
      const selectedPiece = game.get(selectedSquare);

      // Support castling by clicking the target rook
      if (selectedPiece?.type === 'k') {
        if (selectedSquare === 'e1') {
          if (square === 'h1') targetSq = 'g1';
          else if (square === 'a1') targetSq = 'c1';
        } else if (selectedSquare === 'e8') {
          if (square === 'h8') targetSq = 'g8';
          else if (square === 'a8') targetSq = 'c8';
        }
      }

      // Check if this move is a Pawn Promotion
      const isPawnPromotion =
        selectedPiece?.type === 'p' &&
        ((selectedPiece.color === 'w' && targetSq.endsWith('8')) ||
          (selectedPiece.color === 'b' && targetSq.endsWith('1')));

      if (isPawnPromotion) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        const isValid = moves.some((m) => m.to === targetSq);
        if (isValid) {
          setPendingPromotion({ from: selectedSquare, to: targetSq });
          return;
        }
      }

      executeMove(selectedSquare, targetSq, 'q');
    }
  };

  // Undo Move
  const handleUndo = () => {
    if (moveHistory.length === 0 || gameOverResult) return;
    if (config.mode === 'online' || config.mode === 'friend') {
      setTurnNotice('Undo is not available in live online matches!');
      setTimeout(() => setTurnNotice(null), 2500);
      return;
    }
    activeGameIdRef.current++;
    botMovingRef.current = false;
    setIsBotThinking(false);
    setPendingPromotion(null);
    const copy = new Chess(game.fen());
    copy.undo(); // Undo AI move
    if (config.mode === 'bot') copy.undo(); // Undo Player move
    setGame(copy);
    setMoveHistory(copy.history());
    setSelectedSquare(null);
    setValidMoves([]);
    playSnd('move');
  };

  // New Game Reset
  const handleNewGame = () => {
    activeGameIdRef.current++;
    botMovingRef.current = false;
    setIsBotThinking(false);
    setPendingPromotion(null);
    const newG = new Chess();
    setGame(newG);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameOverResult(null);
    setPlayerTime(config.timeControlMinutes * 60);
    setOpponentTime(config.timeControlMinutes * 60);
    setMoveDuration(0);
    playSnd('move');
  };

  // Auto Move / Hint
  const handleAutoMove = () => {
    if (gameOverResult || isBotThinking) return;
    setIsBotThinking(true);
    getAIMove(game, config.difficulty || 'medium')
      .then((aiSan) => {
        if (!aiSan) return;
        const copy = new Chess(game.fen());
        const moveRes = copy.move(aiSan);
        if (moveRes) {
          setGame(copy);
          setLastMove({ from: moveRes.from, to: moveRes.to });
          setMoveHistory(copy.history());
          setMoveDuration(0);
          if (moveRes.captured) playSnd('capture');
          else playSnd('move');
          checkGameEndConditions(copy);
        }
      })
      .catch(() => {})
      .finally(() => setIsBotThinking(false));
  };

  // Resign
  const handleResign = () => {
    if (confirm('Are you sure you want to resign the match?')) {
      handleGameOver('LOSS', 'Resignation');
    }
  };

  // Format Timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Render 8x8 Board Squares (Flipped if Player is Black)
  const rows = playerColor === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const cols = playerColor === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  // Memoize Evaluation Score to avoid re-evaluating on timer ticks & hovers
  const evalScore = React.useMemo(() => evaluateBoard(game), [game]);
  const evalPercent = Math.max(10, Math.min(90, 50 + evalScore / 30));

  // Memoize valid moves set for O(1) square lookups
  const validMovesSet = React.useMemo(() => new Set(validMoves), [validMoves]);

  // Determine Board Theme Colors & Styling
  const getSquareColor = (isDarkSquare: boolean) => {
    if (settings.highContrast) {
      return isDarkSquare ? 'bg-[#292a27]' : 'bg-[#5f5e5e]';
    }
    switch (activeBoardTheme) {
      case 'emerald':
        return isDarkSquare ? 'bg-[#2E5A44]' : 'bg-[#E2DDD0]';
      case 'obsidian':
        return isDarkSquare ? 'bg-[#161B22]' : 'bg-[#38444D]';
      case 'royal':
        return isDarkSquare ? 'bg-[#1A2332]' : 'bg-[#E5E9F0]';
      case 'marble':
        return isDarkSquare ? 'bg-[#423838]' : 'bg-[#FAF9F6]';
      case 'walnut':
      default:
        // Tournament Wood Theme (Matching Uploaded Screenshot): Warm Golden Birch & Walnut
        return isDarkSquare ? 'bg-[#9A663A]' : 'bg-[#DEC085]';
    }
  };

  const isCheckState = game.inCheck();

  return (
    <div className="pt-14 pb-16 px-2.5 max-w-[420px] mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-[#e3e3de] relative">
      {/* Turn Notice Alert Banner */}
      {turnNotice && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-[#121411] px-4 py-1.5 rounded-lg font-body text-xs font-bold shadow-2xl animate-bounce flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">info</span>
          <span>{turnNotice}</span>
        </div>
      )}

      {/* Auto Check Warning Banner */}
      {isCheckState && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-1.5 rounded-lg font-headline text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse flex items-center gap-1.5 border border-red-300">
          <span className="material-symbols-outlined text-sm">warning</span>
          <span>KING IS IN CHECK!</span>
        </div>
      )}

      {/* Top Match Bar Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          onClick={onExit}
          className="p-1.5 rounded-lg glass-panel hover:bg-white/10 active:scale-95 transition-all text-[#c4c7c7] flex items-center gap-1 text-[11px] font-body cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Exit</span>
        </button>

        {/* Graphics Customization Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="px-2.5 py-1 rounded-lg glass-panel hover:bg-white/10 active:scale-95 transition-all text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1 text-[11px] font-body font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">palette</span>
            <span>Style</span>
            <span className="material-symbols-outlined text-xs">expand_more</span>
          </button>

          {/* Graphics Customization Dropdown Panel */}
          {showStyleMenu && (
            <div className="absolute right-0 top-9 z-50 glass-panel p-3 rounded-xl border border-white/15 shadow-2xl w-56 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                <span className="font-headline text-[10px] font-bold text-[#FAF9F6]">GRAPHICS CUSTOMIZER</span>
                <button
                  onClick={() => setShowStyleMenu(false)}
                  className="text-white/60 hover:text-white"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>

              {/* Board Theme Options */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Board Theme
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { id: 'walnut', label: 'Walnut Wood' },
                    { id: 'emerald', label: 'Emerald' },
                    { id: 'obsidian', label: 'Obsidian' },
                    { id: 'royal', label: 'Sapphire' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setActiveBoardTheme(theme.id as any);
                      }}
                      className={`px-2 py-1 rounded text-left border transition-all cursor-pointer ${
                        activeBoardTheme === theme.id
                          ? 'bg-[#D4AF37] text-[#121411] font-bold border-[#D4AF37]'
                          : 'bg-white/5 text-[#c4c7c7] border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Piece Set Options */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                  Piece Style
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { id: 'neo-grandmaster', label: 'Grandmaster' },
                    { id: 'classic-staunton', label: 'Staunton' },
                    { id: '3d-metallic', label: '3D Metallic' },
                    { id: 'minimalist', label: 'Minimal' },
                  ].map((pStyle) => (
                    <button
                      key={pStyle.id}
                      onClick={() => {
                        setActivePieceStyle(pStyle.id as PieceStyle);
                      }}
                      className={`px-2 py-1 rounded text-left border transition-all cursor-pointer ${
                        activePieceStyle === pStyle.id
                          ? 'bg-[#D4AF37] text-[#121411] font-bold border-[#D4AF37]'
                          : 'bg-white/5 text-[#c4c7c7] border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {pStyle.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Opponent Card Header */}
      <div className="w-full glass-panel px-3 py-2 rounded-xl flex items-center justify-between mb-1.5 border border-white/10 shadow-md relative">
        {/* Opponent Chat Bubble Popup */}
        {opponentChatBubble && (
          <div className="absolute -top-9 left-12 bg-[#FAF9F6] text-[#121411] px-3 py-1 rounded-xl text-xs font-bold shadow-xl border border-[#D4AF37] animate-bounce z-30 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#D4AF37]">chat</span>
            <span>{opponentChatBubble}</span>
            <div className="absolute -bottom-1.5 left-4 w-2.5 h-2.5 bg-[#FAF9F6] rotate-45 border-r border-b border-[#D4AF37]" />
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img
              src={
                config.opponentAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={config.opponentName}
              className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/40"
            />
            {isBotThinking && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              {config.opponentCountry && (
                <span className="text-xs">{config.opponentCountry}</span>
              )}
              <span className="font-headline text-xs font-bold text-[#FAF9F6]">
                {config.opponentName}
              </span>
              <span className="bg-[#333532] text-[#D4AF37] text-[8px] font-bold px-1 py-0.2 rounded">
                {config.opponentElo}
              </span>
            </div>
            {isBotThinking ? (
              <span className="font-body text-[9px] text-[#D4AF37] animate-pulse">
                Analyzing board...
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-body text-[9px] text-[#c4c7c7]/80 flex items-center gap-1 font-semibold">
                  {config.mode === 'offline'
                    ? game.turn() === 'b'
                      ? "Black's Turn"
                      : "White's Turn"
                    : isTopClockActive
                    ? "Opponent's turn"
                    : 'Waiting...'}
                </span>
                {config.mode === 'online' && (
                  <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ⚡ {config.opponentPing || 22}ms
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Chat Button & Opponent Clock */}
        <div className="flex items-center gap-2">
          {config.mode === 'online' && (
            <div className="relative">
              <button
                onClick={() => setShowQuickChatMenu(!showQuickChatMenu)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#D4AF37] cursor-pointer transition-colors"
                title="Send Emote / Chat"
              >
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
              </button>

              {/* Quick Chat Menu Popover */}
              {showQuickChatMenu && (
                <div className="absolute right-0 top-8 bg-[#17181D] border border-[#D4AF37]/40 rounded-xl p-2 shadow-2xl z-40 w-44 space-y-1">
                  <div className="text-[9px] font-bold text-[#A8A8A8] uppercase tracking-wider px-1 mb-1">
                    Quick Chat
                  </div>
                  {[
                    '👋 GL HF!',
                    '👏 Great Move!',
                    '😅 Oops!',
                    '🤝 Well Played!',
                    '🔥 Good Game!',
                  ].map((msg) => (
                    <button
                      key={msg}
                      onClick={() => {
                        setShowQuickChatMenu(false);
                        // Opponent responds after 1.5s
                        setTimeout(() => {
                          const replies = [
                            'Thanks! You too! 🤝',
                            'Good luck! ♟️',
                            'Haha thanks! 😄',
                            'Gg! 🔥',
                          ];
                          setOpponentChatBubble(replies[Math.floor(Math.random() * replies.length)]);
                          setTimeout(() => setOpponentChatBubble(null), 3000);
                        }, 1200);
                      }}
                      className="w-full text-left px-2 py-1 rounded text-xs text-[#FAF9F6] hover:bg-[#D4AF37]/20 transition-colors cursor-pointer"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Opponent Clock */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div
              className={`px-3 py-1 rounded-lg font-headline text-sm font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                isTopClockActive
                  ? 'bg-[#FAF9F6] text-[#121411] shadow-md ring-2 ring-[#D4AF37]'
                  : 'bg-[#1a1a1a] text-[#c4c7c7]'
              }`}
            >
              {isTopClockActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
              <span>{formatTime(opponentTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Engine Position Evaluation Meter */}
      <div className="w-full h-1 bg-[#333532] rounded-full my-1 overflow-hidden border border-white/5 relative">
        <div
          className="h-full bg-[#FAF9F6] transition-all duration-300"
          style={{ width: `${evalPercent}%` }}
        />
      </div>

      {/* Redesigned Graphic Chessboard Container */}
      <div className="w-full aspect-square max-w-[350px] sm:max-w-[390px] bg-[#6E4826] p-2 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#8B5E34] shadow-[0_12px_32px_rgba(0,0,0,0.8)] relative my-0.5">
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-inner border border-[#4A2E16]">
          {rows.map((row) =>
            cols.map((col) => {
              const square = `${col}${row}` as Square;
              const isDarkSquare = (row + col.charCodeAt(0)) % 2 === 0;
              const piece = game.get(square);

              const isSelected = selectedSquare === square;
              const isValidTarget = validMovesSet.has(square);
              const isLastMove = lastMove?.from === square || lastMove?.to === square;
              const isKingInCheck =
                game.inCheck() && piece?.type === 'k' && piece?.color === game.turn();

              // High Graphic Background Styles
              let bgClass = getSquareColor(isDarkSquare);

              if (isSelected) bgClass = 'bg-[#F2D06B]/80 ring-4 ring-amber-300 z-30 shadow-2xl';
              else if (isKingInCheck) bgClass = 'bg-red-600/90 shadow-[0_0_25px_rgba(239,68,68,1)] animate-pulse z-30';
              else if (isLastMove) bgClass += ' ring-2 ring-[#D4AF37]/60 bg-blend-overlay';

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`board-square ${
                    isLastMove ? 'last-move-sq' : ''
                  } relative flex items-center justify-center cursor-pointer select-none transition-all duration-150 border border-black/5 ${bgClass}`}
                >
                  {/* File/Rank Notation Labels */}
                  {col === (playerColor === 'w' ? 'a' : 'h') && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-extrabold opacity-40 pointer-events-none">
                      {row}
                    </span>
                  )}
                  {row === (playerColor === 'w' ? 1 : 8) && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-extrabold opacity-40 pointer-events-none">
                      {col}
                    </span>
                  )}

                  {/* King Check Pulsing Aura Visual */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 rounded-lg bg-red-500/40 animate-ping pointer-events-none" />
                  )}

                  {/* Valid Move Target Highlight Dot or Capture Ring */}
                  {isValidTarget && (
                    <div
                      className={`absolute rounded-full z-10 transition-transform ${
                        piece
                          ? 'w-full h-full border-4 border-amber-400 bg-amber-400/20 scale-95'
                          : 'w-4 h-4 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]'
                      }`}
                    />
                  )}

                  {/* High Quality Chess Piece Render */}
                  {piece && (
                    <div
                      className={`w-[85%] h-[85%] flex items-center justify-center z-20 pointer-events-none transition-transform duration-200 ${
                        isSelected ? 'scale-110 drop-shadow-2xl' : 'drop-shadow-md'
                      }`}
                    >
                      <ChessPieceSvg color={piece.color} type={piece.type} style={activePieceStyle} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pawn Promotion Options Overlay Modal */}
        {pendingPromotion && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-4 animate-fade-in">
            <p className="font-headline text-xs sm:text-sm font-bold text-[#D4AF37] mb-3 uppercase tracking-wider">
              Choose Pawn Promotion
            </p>
            <div className="flex gap-2 sm:gap-3 bg-[#121411] p-3 rounded-xl border border-[#D4AF37]/40 shadow-2xl">
              {(['q', 'r', 'b', 'n'] as const).map((pType) => (
                <button
                  key={pType}
                  onClick={() => {
                    if (pendingPromotion) {
                      const { from, to } = pendingPromotion;
                      setPendingPromotion(null);
                      executeMove(from, to, pType);
                    }
                  }}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-[#262822] hover:bg-[#D4AF37]/20 border border-white/20 hover:border-[#D4AF37] rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 group shadow-lg"
                >
                  <div className="w-10 h-10 group-hover:scale-110 transition-transform">
                    <ChessPieceSvg color={game.turn()} type={pType} style={activePieceStyle} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player Card Header */}
      <div className="w-full glass-panel px-3 py-2 rounded-xl flex items-center justify-between mt-1.5 border border-white/10 shadow-md">
        <div className="flex items-center gap-2.5">
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/50 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-headline text-xs font-bold text-[#FAF9F6]">
                {user.username}
              </span>
              <span className="bg-[#333532] text-[#D4AF37] text-[8px] font-bold px-1 py-0.2 rounded">
                {user.elo}
              </span>
            </div>
            <span className="font-body text-[9px] text-[#c4c7c7]/80 flex items-center gap-1 font-semibold">
              {config.mode === 'offline'
                ? game.turn() === 'w'
                  ? "White's Turn"
                  : "Black's Turn"
                : isBottomClockActive
                ? 'Your turn'
                : 'Waiting...'}
            </span>
          </div>
        </div>

        {/* Player Clock */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <div
            className={`px-3 py-1 rounded-lg font-headline text-sm font-bold tracking-wider transition-all flex items-center gap-1.5 ${
              isBottomClockActive
                ? 'bg-[#FAF9F6] text-[#121411] shadow-md ring-2 ring-[#D4AF37]'
                : 'bg-[#1a1a1a] text-[#c4c7c7]'
            }`}
          >
            {isBottomClockActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
            <span>{formatTime(playerTime)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Tournament Control Buttons Row */}
      <div className="w-full flex items-center justify-between gap-1.5 mt-2.5">
        <button
          onClick={handleAutoMove}
          disabled={isBotThinking}
          className="flex-1 py-2 rounded-lg bg-[#221D18] hover:bg-[#2E2822] text-[#E0D5C1] border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow flex items-center justify-center gap-1"
        >
          MOVE
        </button>

        <button
          onClick={handleUndo}
          disabled={moveHistory.length === 0}
          className="flex-1 py-2 rounded-lg bg-[#221D18] hover:bg-[#2E2822] text-[#E0D5C1] border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer active:scale-95 shadow flex items-center justify-center gap-1"
        >
          UNDO
        </button>

        <button
          onClick={handleNewGame}
          className="flex-1 py-2 rounded-lg bg-[#2A231C] hover:bg-[#382E25] text-[#E6C265] border border-[#C29B38] text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow flex items-center justify-center gap-1 font-headline"
        >
          NEW GAME
        </button>

        <button
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          className="flex-1 py-2 rounded-lg bg-[#221D18] hover:bg-[#2E2822] text-[#E0D5C1] border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow flex items-center justify-center gap-1"
        >
          STYLE
        </button>
      </div>

      {/* Chess Master Coach Modal */}
      {isGeminiCoachOpen && (
        <div className="fixed inset-0 z-50 bg-[#121411]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full space-y-4 border border-[#D4AF37]/40 shadow-2xl relative">
            <button
              onClick={() => setIsGeminiCoachOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#e3e3de] flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-[#FAF9F6]">
                  Chess Master AI Analysis
                </h3>
                <span className="text-[10px] text-[#D4AF37] font-mono">Live In-Game Coach</span>
              </div>
            </div>

            {isCoachLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <span className="material-symbols-outlined text-3xl text-[#D4AF37] animate-spin">
                  progress_activity
                </span>
                <p className="text-xs text-[#c4c7c7]">Chess Master is analyzing current board state...</p>
              </div>
            ) : geminiCoachData ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#121411] border border-[#D4AF37]/30">
                  <span className="font-bold text-[#D4AF37] uppercase tracking-wider block mb-1">
                    Key Tactical Concept: {geminiCoachData.keyConcept}
                  </span>
                  <p className="text-[#c4c7c7] leading-relaxed">{geminiCoachData.evaluation}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#121411] border border-white/10">
                  <span className="font-bold text-[#FAF9F6] block mb-1">Coach Recommendation:</span>
                  <p className="text-[#c4c7c7] leading-relaxed">{geminiCoachData.coachingAdvice}</p>
                </div>

                {geminiCoachData.recommendedMoves?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-[#FAF9F6] block">Candidate Moves:</span>
                    {geminiCoachData.recommendedMoves.map((m: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-[#121411] border border-white/5 font-mono">
                        <span className="text-[#D4AF37] font-bold">{m.san}</span> ({m.from} → {m.to}):{' '}
                        <span className="text-[#c4c7c7] font-sans">{m.explanation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <button
              onClick={() => setIsGeminiCoachOpen(false)}
              className="w-full py-2.5 bg-[#D4AF37] text-[#121411] font-bold text-xs uppercase rounded-xl cursor-pointer"
            >
              Back to Game
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverResult && (
        <div className="fixed inset-0 z-50 bg-[#121411]/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="glass-panel p-8 rounded-2xl max-w-sm w-full text-center space-y-6 border border-[#D4AF37]/30 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[#FAF9F6]/5 border-2 border-[#D4AF37] flex items-center justify-center mx-auto">
              <span
                className="material-symbols-outlined text-4xl text-[#D4AF37]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {gameOverResult.result === 'WIN' ? 'trophy' : 'workspace_premium'}
              </span>
            </div>

            <div>
              <h3 className="font-headline text-2xl font-bold text-[#FAF9F6]">
                {gameOverResult.result === 'WIN'
                  ? 'VICTORY ACHIEVED'
                  : gameOverResult.result === 'LOSS'
                  ? 'DEFEAT'
                  : 'DRAW MATCH'}
              </h3>
              <p className="font-body text-xs text-[#c4c7c7] mt-1">{gameOverResult.reason}</p>
            </div>

            <div className="bg-[#FAF9F6]/5 p-4 rounded-xl border border-white/5">
              <span className="font-body text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider block mb-1">
                ELO RATING CHANGE
              </span>
              <span
                className={`font-headline text-3xl font-bold ${
                  gameOverResult.eloChange > 0
                    ? 'text-[#D4AF37]'
                    : gameOverResult.eloChange < 0
                    ? 'text-red-400'
                    : 'text-[#c4c7c7]'
                }`}
              >
                {gameOverResult.eloChange >= 0
                  ? `+${gameOverResult.eloChange}`
                  : gameOverResult.eloChange}{' '}
                ELO
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onExit}
                className="w-full bg-[#FAF9F6] text-[#121411] py-3.5 rounded-lg font-body text-xs font-bold tracking-widest uppercase hover:bg-white active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                RETURN TO ARENA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
