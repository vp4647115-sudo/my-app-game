import { Chess, Square } from 'chess.js';
import { AIDifficulty } from '../types';

// Piece value weights
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified Piece-Square Tables (PST) for midgame evaluation
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

// Evaluate board position from White's perspective
export function evaluateBoard(game: Chess): number {
  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = PIECE_VALUES[piece.type] || 0;
        const index = r * 8 + c;
        let pstVal = 0;

        if (piece.type === 'p') pstVal = PAWN_PST[index];
        else if (piece.type === 'n') pstVal = KNIGHT_PST[index];
        else if (piece.type === 'b') pstVal = BISHOP_PST[index];

        const totalPieceScore = val + pstVal;
        if (piece.color === 'w') {
          score += totalPieceScore;
        } else {
          score -= totalPieceScore;
        }
      }
    }
  }

  return score;
}

// Minimax with Alpha-Beta Pruning
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Cutoff
    }
    return minEval;
  }
}

// Compute best move for AI
export async function getAIMove(
  game: Chess,
  difficulty: AIDifficulty
): Promise<string | null> {
  const possibleMoves = game.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;

  // Add small artificial delay for realistic bot thinking
  const delayMs = Math.min(1000, 300 + Math.random() * 500);
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  // Determine difficulty profile
  if (difficulty === 'beginner') {
    // 70% random, 30% basic capture
    if (Math.random() < 0.7) {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      return possibleMoves[randomIndex].san;
    }
  } else if (difficulty === 'easy') {
    // 35% random move, else depth 1 search
    if (Math.random() < 0.35) {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      return possibleMoves[randomIndex].san;
    }
  }

  let searchDepth = 1;
  if (difficulty === 'medium') searchDepth = 2;
  else if (difficulty === 'hard') searchDepth = 2;
  else if (difficulty === 'expert') searchDepth = 3;
  else if (difficulty === 'master') searchDepth = 3;
  else if (difficulty === 'grandmaster') searchDepth = 4;

  const isAIWhite = game.turn() === 'w';
  let bestMove: string = possibleMoves[0].san;
  let bestValue = isAIWhite ? -Infinity : Infinity;

  // Prioritize captures and checks for move ordering
  possibleMoves.sort((a, b) => {
    const aVal = a.captured ? 10 : 0;
    const bVal = b.captured ? 10 : 0;
    return bVal - aVal;
  });

  for (const move of possibleMoves) {
    game.move(move);
    const boardValue = minimax(
      game,
      searchDepth - 1,
      -Infinity,
      Infinity,
      !isAIWhite
    );
    game.undo();

    if (isAIWhite) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move.san;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move.san;
      }
    }
  }

  return bestMove;
}
