import { Chess, Square, PieceSymbol } from 'chess.js';
import type { AiDifficulty } from '../types/chess';

// Standard chess piece values in centipawns
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (from White's perspective, index 0 is a8, index 63 is h1)
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

const ROOK_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDGAME_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-20,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

function getSquareIndex(square: Square, color: 'w' | 'b'): number {
  const file = square.charCodeAt(0) - 97; // 0 to 7
  const rank = 8 - parseInt(square[1], 10); // 0 to 7 from top
  const index = rank * 8 + file;
  if (color === 'b') {
    // Flip vertically for black
    const blackRank = 7 - rank;
    return blackRank * 8 + file;
  }
  return index;
}

function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const square = (String.fromCharCode(97 + f) + (8 - r)) as Square;
      const pieceVal = PIECE_VALUES[piece.type];
      const sqIdx = getSquareIndex(square, piece.color);

      let pstVal = 0;
      switch (piece.type) {
        case 'p': pstVal = PAWN_PST[sqIdx]; break;
        case 'n': pstVal = KNIGHT_PST[sqIdx]; break;
        case 'b': pstVal = BISHOP_PST[sqIdx]; break;
        case 'r': pstVal = ROOK_PST[sqIdx]; break;
        case 'q': pstVal = QUEEN_PST[sqIdx]; break;
        case 'k': pstVal = KING_MIDGAME_PST[sqIdx]; break;
      }

      const totalVal = pieceVal + pstVal;
      score += piece.color === 'w' ? totalVal : -totalVal;
    }
  }

  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });
  // Move ordering: checks and captures first for better alpha-beta pruning
  moves.sort((a, b) => {
    const scoreA = (a.captured ? PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece] : 0) + (a.san.includes('+') ? 50 : 0);
    const scoreB = (b.captured ? PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece] : 0) + (b.san.includes('+') ? 50 : 0);
    return scoreB - scoreA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Finds the best move for current player using minimax with alpha-beta pruning
 */
export async function getBestAiMove(
  chess: Chess,
  difficulty: AiDifficulty
): Promise<{ from: Square; to: Square; promotion?: string } | null> {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Simulate realistic human thinking delay (350 - 750ms)
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 300));

  const isMaximizing = chess.turn() === 'w';

  // Easy mode: 35% random move or depth 1 search
  if (difficulty === 'easy') {
    if (Math.random() < 0.35) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return { from: randomMove.from, to: randomMove.to, promotion: randomMove.promotion };
    }
  }

  // Determine search depth based on difficulty
  const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  let bestMove = moves[0];
  let bestVal = isMaximizing ? -Infinity : Infinity;

  // Shuffle slightly so games don't always play the exact same opening line
  const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    chess.move(move);
    const moveVal = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();

    if (isMaximizing) {
      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = move;
      }
    } else {
      if (moveVal < bestVal) {
        bestVal = moveVal;
        bestMove = move;
      }
    }
  }

  return { from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion };
}
