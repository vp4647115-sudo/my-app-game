import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { ActiveMatchConfig, UserProfile, GameSettings, MatchHistoryItem } from '../types';
import { getAIMove, evaluateBoard } from '../services/aiEngine';
import { soundService } from '../services/sound';
import { ChessPieceSvg } from './ChessPieceSvg';

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

  // Keep gameRef updated to avoid stale state in polling interval
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Ref to ensure Bot doesn't trigger multiple times
  const botMovingRef = useRef<boolean>(false);

  // Sound helper wrapper
  const playSnd = useCallback(
    (type: 'move' | 'capture' | 'check' | 'end', victory?: boolean) => {
      if (!settings.soundEnabled) return;
      if (type === 'move') soundService.playMove(settings.volume);
      else if (type === 'capture') soundService.playCapture(settings.volume);
      else if (type === 'check') soundService.playCheck(settings.volume);
      else if (type === 'end') soundService.playGameEnd(Boolean(victory), settings.volume);
    },
    [settings.soundEnabled, settings.volume]
  );

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
          handleGameOver('WIN', 'Checkmate!');
        } else {
          handleGameOver('LOSS', 'Checkmate!');
        }
      } else if (g.isDraw() || g.isStalemate() || g.isThreefoldRepetition()) {
        handleGameOver('DRAW', 'Stalemate / Draw');
      } else if (g.inCheck()) {
        playSnd('check');
      }
    },
    [playerColor, handleGameOver, playSnd]
  );

  // Real-time friend room state sync (polling every 800ms)
  useEffect(() => {
    if (config.mode !== 'friend' || !config.roomCode || gameOverResult) return;

    const syncRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${config.roomCode}`);
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
      } catch {
        // Ignore network error
      }
    };

    syncRoom();
    const timer = setInterval(syncRoom, 800);
    return () => clearInterval(timer);
  }, [config.mode, config.roomCode, gameOverResult, playSnd, checkGameEndConditions]);

  // Timer Countdown Effect
  useEffect(() => {
    if (gameOverResult) return;

    const interval = setInterval(() => {
      const turn = game.turn();
      const isBottomTurn =
        config.mode === 'offline' ? turn === 'w' : turn === playerColor;

      if (isBottomTurn) {
        setPlayerTime((t) => Math.max(0, t - 1));
      } else {
        setOpponentTime((t) => Math.max(0, t - 1));
      }

      setMoveDuration((s) => s + 1);
      setTotalMatchSeconds((s) => s + 1);
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

  // AI Bot Turn Execution
  useEffect(() => {
    if (gameOverResult) return;

    if (!isPlayerTurn && config.mode === 'bot' && !botMovingRef.current) {
      botMovingRef.current = true;
      setIsBotThinking(true);

      const diff = config.difficulty || 'medium';
      getAIMove(game, diff)
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
        .finally(() => {
          setIsBotThinking(false);
          botMovingRef.current = false;
        });
    }
  }, [isPlayerTurn, game, config.mode, config.difficulty, gameOverResult, playSnd, checkGameEndConditions]);

  // Handle Square Selection and Move Execution
  const handleSquareClick = (square: Square) => {
    if (gameOverResult || isBotThinking) return;

    if (!isPlayerTurn) {
      setTurnNotice("It is your opponent's turn to move! Please wait.");
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

    // If a square was already selected, attempt to move to square
    if (selectedSquare) {
      try {
        const copy = new Chess(game.fen());
        const moveRes = copy.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // Auto queen for simplicity
        });

        if (moveRes) {
          setGame(copy);
          setLastMove({ from: selectedSquare, to: square });
          setMoveHistory(copy.history());
          setSelectedSquare(null);
          setValidMoves([]);
          setMoveDuration(0);

          if (moveRes.captured) playSnd('capture');
          else playSnd('move');

          checkGameEndConditions(copy);

          // If playing in friend mode, post move to room
          if (config.mode === 'friend' && config.roomCode) {
            fetch('/api/rooms/move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: config.roomCode,
                from: selectedSquare,
                to: square,
                promotion: 'q',
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
    }
  };

  // Undo Move
  const handleUndo = () => {
    if (moveHistory.length === 0 || gameOverResult) return;
    const copy = new Chess(game.fen());
    copy.undo(); // Undo AI move
    if (config.mode === 'bot') copy.undo(); // Undo Player move
    setGame(copy);
    setMoveHistory(copy.history());
    setSelectedSquare(null);
    setValidMoves([]);
    playSnd('move');
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

  // Calculate Evaluation Score Bar
  const evalScore = evaluateBoard(game); // Positive = White advantage, Negative = Black advantage
  const evalPercent = Math.max(10, Math.min(90, 50 + evalScore / 30));

  return (
    <div className="pt-16 pb-24 px-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen text-[#e3e3de] relative">
      {/* Turn Notice Alert Banner */}
      {turnNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-[#121411] px-5 py-2.5 rounded-xl font-body text-xs font-bold shadow-2xl animate-bounce flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{turnNotice}</span>
        </div>
      )}

      {/* Top Match Bar Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onExit}
          className="p-2 rounded-lg glass-panel hover:bg-white/10 active:scale-95 transition-all text-[#c4c7c7] flex items-center gap-1.5 text-xs font-body"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Exit Sanctum</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="bg-[#FAF9F6]/5 px-3 py-1 rounded-full border border-white/10 font-body text-[10px] text-[#D4AF37] font-bold uppercase flex items-center gap-2">
            <span>{config.timeControlMinutes}m Blitz • {config.rated ? 'Rated' : 'Casual'}</span>
            <span className="text-white/40">•</span>
            <span className="text-[#FAF9F6] font-mono">Match: {formatTime(totalMatchSeconds)}</span>
          </span>
        </div>
      </div>

      {/* Opponent Card Header */}
      <div className="w-full glass-panel p-3.5 rounded-xl flex items-center justify-between mb-3 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                config.opponentAvatar ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDStYFdzyUT63P-_K2DGhNguEomRVy1t4uTZuZbnzRRYSP6UH5egIzIdxPtKeIMNUvhp3CRZXdXs0PtiMmboH3AlvpB4gnzBfvznzEvKMZ-u4EaReuXSot3pl8FefLThPUc7BgqJ7NIoPT-KJ_FZzhbslnKjz5svMxipf_dvY9g5FyGqu_o4MQlOGYwAsAjJKOOTz58a2KHF7w35hmK0i-H2nvH8FHqrsx-zcjOJ-7l_MZXt5KBBnMYSdQzyUwGjTUTexKzl5oXBngK'
              }
              alt={config.opponentName}
              className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40"
            />
            {isBotThinking && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#D4AF37] rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-sm font-bold text-[#FAF9F6]">
                {config.opponentName}
              </span>
              <span className="bg-[#333532] text-[#D4AF37] text-[9px] font-bold px-1.5 py-0.5 rounded">
                {config.opponentElo}
              </span>
            </div>
            {isBotThinking ? (
              <span className="font-body text-[10px] text-[#D4AF37] animate-pulse">
                Thinking move...
              </span>
            ) : (
              <span className="font-body text-[10px] text-[#c4c7c7]/80 flex items-center gap-1 font-semibold">
                {config.mode === 'offline'
                  ? game.turn() === 'b'
                    ? "Black's Turn (Active Clock)"
                    : "White's Turn"
                  : isTopClockActive
                  ? "Opponent's turn to move"
                  : 'Waiting...'}
              </span>
            )}
          </div>
        </div>

        {/* Opponent Clock */}
        <div className="flex flex-col items-end gap-0.5">
          <div
            className={`px-4 py-2 rounded-lg font-headline text-lg font-bold tracking-wider transition-all flex items-center gap-2 ${
              isTopClockActive
                ? 'bg-[#FAF9F6] text-[#121411] shadow-xl scale-105 ring-2 ring-[#D4AF37]'
                : 'bg-[#1a1a1a] text-[#c4c7c7]'
            }`}
          >
            {isTopClockActive && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
            <span>{formatTime(opponentTime)}</span>
          </div>
          {isTopClockActive && (
            <span className="text-[10px] text-[#D4AF37] font-bold font-mono">
              {moveDuration}s move time
            </span>
          )}
        </div>
      </div>

      {/* Engine Position Evaluation Meter */}
      <div className="w-full h-1.5 bg-[#333532] rounded-full mb-3 overflow-hidden border border-white/5 relative">
        <div
          className="h-full bg-[#FAF9F6] transition-all duration-500"
          style={{ width: `${evalPercent}%` }}
        />
      </div>

      {/* Chessboard Container */}
      <div className="w-full aspect-square max-w-[460px] glass-panel rounded-2xl p-2 md:p-3 border-2 border-[#D4AF37]/30 shadow-2xl relative">
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden shadow-inner">
          {rows.map((row) =>
            cols.map((col) => {
              const square = `${col}${row}` as Square;
              const isDarkSquare = (row + col.charCodeAt(0)) % 2 === 0;
              const piece = game.get(square);

              const isSelected = selectedSquare === square;
              const isValidTarget = validMoves.includes(square);
              const isLastMove = lastMove?.from === square || lastMove?.to === square;
              const isKingInCheck =
                game.inCheck() && piece?.type === 'k' && piece?.color === game.turn();

              // Custom color scheme
              let bgClass = isDarkSquare
                ? settings.highContrast
                  ? 'bg-[#292a27]'
                  : 'bg-[#3D2B24]' // Walnut
                : settings.highContrast
                ? 'bg-[#5f5e5e]'
                : 'bg-[#d7ba89]'; // Ivory

              if (isSelected) bgClass = 'bg-[#D4AF37]/80';
              else if (isKingInCheck) bgClass = 'bg-red-600/80 animate-pulse';
              else if (isLastMove) bgClass = isDarkSquare ? 'bg-[#D4AF37]/40' : 'bg-[#D4AF37]/30';

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150 ${bgClass}`}
                >
                  {/* File/Rank Notation Labels */}
                  {col === (playerColor === 'w' ? 'a' : 'h') && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-30 pointer-events-none">
                      {row}
                    </span>
                  )}
                  {row === (playerColor === 'w' ? 1 : 8) && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-30 pointer-events-none">
                      {col}
                    </span>
                  )}

                  {/* Valid move target indicator dot */}
                  {isValidTarget && (
                    <div
                      className={`absolute rounded-full z-10 ${
                        piece ? 'w-full h-full border-4 border-[#D4AF37]' : 'w-3.5 h-3.5 bg-[#D4AF37]/90'
                      }`}
                    />
                  )}

                  {/* Chess Piece Graphic */}
                  {piece && (
                    <div
                      className={`w-[82%] h-[82%] flex items-center justify-center z-20 pointer-events-none transition-transform duration-200 ${
                        isSelected ? 'scale-110 drop-shadow-xl' : 'drop-shadow'
                      }`}
                    >
                      <ChessPieceSvg color={piece.color} type={piece.type} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Player Card Header */}
      <div className="w-full glass-panel p-3.5 rounded-xl flex items-center justify-between mt-3 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/50"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-sm font-bold text-[#FAF9F6]">
                {user.username}
              </span>
              <span className="bg-[#333532] text-[#D4AF37] text-[9px] font-bold px-1.5 py-0.5 rounded">
                {user.elo}
              </span>
            </div>
            <span className="font-body text-[10px] text-[#c4c7c7]/80 flex items-center gap-1 font-semibold">
              {config.mode === 'offline'
                ? game.turn() === 'w'
                  ? "White's Turn (Active Clock)"
                  : "Black's Turn"
                : isBottomClockActive
                ? 'Your turn to move'
                : 'Waiting for opponent...'}
            </span>
          </div>
        </div>

        {/* Player Clock */}
        <div className="flex flex-col items-end gap-0.5">
          <div
            className={`px-4 py-2 rounded-lg font-headline text-lg font-bold tracking-wider transition-all flex items-center gap-2 ${
              isBottomClockActive
                ? 'bg-[#FAF9F6] text-[#121411] shadow-xl scale-105 ring-2 ring-[#D4AF37]'
                : 'bg-[#1a1a1a] text-[#c4c7c7]'
            }`}
          >
            {isBottomClockActive && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
            <span>{formatTime(playerTime)}</span>
          </div>
          {isBottomClockActive && (
            <span className="text-[10px] text-[#D4AF37] font-bold font-mono">
              {moveDuration}s move time
            </span>
          )}
        </div>
      </div>

      {/* Bottom Game Controls */}
      <div className="w-full flex items-center justify-between gap-3 mt-4">
        <button
          onClick={handleUndo}
          disabled={moveHistory.length === 0}
          className="flex-1 py-2.5 rounded-lg glass-panel text-xs font-body font-bold text-[#c4c7c7] hover:text-[#FAF9F6] border border-white/10 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
        >
          Undo
        </button>
        <button
          onClick={handleResign}
          className="flex-1 py-2.5 rounded-lg glass-panel text-xs font-body font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 active:scale-95 transition-all cursor-pointer"
        >
          Resign
        </button>
      </div>

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
