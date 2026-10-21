import React from 'react';
import type { GameMode, CapturedPieces } from '../types/chess';
import type { PieceSymbol } from 'chess.js';
import { RotateCcw, Home, Clock, AlertTriangle, Cpu, User } from 'lucide-react';

interface HudOverlayProps {
  mode: GameMode;
  turn: 'w' | 'b';
  playerColor: 'w' | 'b';
  isCheck: boolean;
  isAiThinking: boolean;
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  timeControlSeconds: number;
  capturedPieces: CapturedPieces;
  onResetGame: () => void;
  onReturnToTitle: () => void;
}

const PIECE_SYMBOLS: Record<PieceSymbol, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

const PIECE_SCORES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  mode,
  turn,
  playerColor,
  isCheck,
  isAiThinking,
  whiteTime,
  blackTime,
  timeControlSeconds,
  capturedPieces,
  onResetGame,
  onReturnToTitle,
}) => {
  // Calculate material advantages
  const whiteScore = capturedPieces.b.reduce((acc, p) => acc + (PIECE_SCORES[p] || 0), 0);
  const blackScore = capturedPieces.w.reduce((acc, p) => acc + (PIECE_SCORES[p] || 0), 0);
  const whiteDiff = whiteScore - blackScore;
  const blackDiff = blackScore - whiteScore;

  // Determine top player (Black if player is White, or White if player is Black)
  const isWhiteAtBottom = playerColor === 'w';

  const renderPlayerCluster = (color: 'w' | 'b', isTop: boolean) => {
    const isCurrentTurn = turn === color;
    const isPlayerAi = mode === 'ai' && color !== playerColor;
    const timeRemaining = color === 'w' ? whiteTime : blackTime;
    const materialAdvantage = color === 'w' ? whiteDiff : blackDiff;
    const capturedByThisPlayer = color === 'w' ? capturedPieces.b : capturedPieces.w;

    return (
      <div
        className={`pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border transition-all shadow-lg ${
          isCurrentTurn
            ? 'bg-slate-900 border-amber-500/70 text-slate-100 ring-1 ring-amber-500/30'
            : 'bg-slate-950/90 border-slate-800 text-slate-400'
        }`}
      >
        {/* Avatar / Role */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm ${
            color === 'w'
              ? 'bg-amber-100 text-slate-900 shadow-inner'
              : 'bg-slate-800 text-amber-100 border border-slate-700'
          }`}
        >
          {isPlayerAi ? <Cpu size={16} /> : <User size={16} />}
        </div>

        {/* Player Name and Captured Pieces */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-semibold truncate text-slate-200">
              {color === 'w' ? 'White' : 'Black'}
              {isPlayerAi && ' (AI)'}
            </span>
            {materialAdvantage > 0 && (
              <span className="text-[11px] font-bold text-emerald-400">
                +{materialAdvantage}
              </span>
            )}
          </div>

          {/* Captured Pieces list */}
          <div className="flex items-center text-xs tracking-tight h-4 overflow-hidden text-slate-400">
            {capturedByThisPlayer.map((p, idx) => (
              <span key={idx} className="mr-0.5 scale-90">
                {PIECE_SYMBOLS[p]}
              </span>
            ))}
          </div>
        </div>

        {/* Clock Timer (if timed game) */}
        {timeControlSeconds > 0 && (
          <div
            className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs sm:text-sm font-mono font-bold tabular-nums ${
              timeRemaining < 30 && isCurrentTurn
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse'
                : isCurrentTurn
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
            }`}
          >
            <Clock size={12} className="opacity-70" />
            {formatTimer(timeRemaining)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* Top Bar: Opponent Cluster, Center Turn/Check Banner, Right Navigation */}
      <div className="w-full flex items-start justify-between gap-2">
        {/* Opponent (Top Cluster) */}
        <div className="max-w-[260px] sm:max-w-xs">
          {renderPlayerCluster(isWhiteAtBottom ? 'b' : 'w', true)}
        </div>

        {/* Center Alert / Turn Indicator */}
        <div className="pointer-events-auto flex flex-col items-center">
          {isCheck && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/90 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-900/50 mb-1 animate-bounce">
              <AlertTriangle size={14} /> CHECK!
            </div>
          )}
          {isAiThinking && (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Thinking...
            </div>
          )}
        </div>

        {/* Top-Right Quick Navigation */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={onResetGame}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-md"
            title="Restart Match"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onReturnToTitle}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-md"
            title="Return to Menu"
          >
            <Home size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Player Cluster (Bottom-Left) */}
      <div className="w-full flex items-end justify-between gap-2 pb-16 sm:pb-14">
        <div className="max-w-[260px] sm:max-w-xs">
          {renderPlayerCluster(isWhiteAtBottom ? 'w' : 'b', false)}
        </div>
      </div>
    </div>
  );
};
