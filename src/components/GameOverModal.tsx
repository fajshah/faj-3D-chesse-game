import React from 'react';
import { Trophy, RefreshCw, Home, Search } from 'lucide-react';

interface GameOverModalProps {
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  totalMoves: number;
  onRematch: () => void;
  onAnalysis: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  totalMoves,
  onRematch,
  onAnalysis,
  onMenu,
}) => {
  const isDraw = winner === 'draw';
  const title = isDraw
    ? 'Game Drawn'
    : winner === 'w'
    ? 'White Victorious!'
    : 'Black Victorious!';

  return (
    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-40 select-none animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
        {/* Trophy / Emblem */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
          <Trophy size={34} />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-500">
            {title}
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 font-medium">{reason}</p>
        </div>

        {/* Match Statistics */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-left">
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-semibold">Total Turns</span>
            <span className="text-base font-bold text-slate-200 font-mono">{totalMoves}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-semibold">Deciding State</span>
            <span className="text-base font-bold text-amber-400 capitalize truncate block">
              {winner === 'draw' ? 'Draw' : 'Checkmate'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onRematch}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <RefreshCw size={16} /> Play Again
          </button>

          <button
            onClick={onAnalysis}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-slate-700 transition-all cursor-pointer border border-slate-700"
          >
            <Search size={15} /> Free Analysis Mode
          </button>

          <button
            onClick={onMenu}
            className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white font-medium text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home size={14} /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
