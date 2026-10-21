import React from 'react';
import type { PieceSymbol } from 'chess.js';

interface PromotionModalProps {
  color: 'w' | 'b';
  onSelect: (piece: PieceSymbol) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect }) => {
  const pieces: { type: PieceSymbol; name: string; symbol: string; hotkey: string }[] = [
    { type: 'q', name: 'Queen', symbol: '♛', hotkey: 'Q' },
    { type: 'r', name: 'Rook', symbol: '♜', hotkey: 'R' },
    { type: 'b', name: 'Bishop', symbol: '♝', hotkey: 'B' },
    { type: 'n', name: 'Knight', symbol: '♞', hotkey: 'N' },
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-40 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl max-w-sm w-full text-center space-y-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 font-serif">Pawn Promotion</h2>
          <p className="text-slate-400 text-xs mt-1">Choose a piece to promote your pawn:</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 transition-all cursor-pointer group shadow"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {p.symbol}
              </span>
              <span className="text-xs font-semibold mt-1">{p.name}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">({p.hotkey})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
