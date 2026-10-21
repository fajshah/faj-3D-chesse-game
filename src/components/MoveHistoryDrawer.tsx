import React, { useEffect, useRef } from 'react';
import type { MoveRecord } from '../types/chess';
import { X, Copy, Check } from 'lucide-react';

interface MoveHistoryDrawerProps {
  moves: MoveRecord[];
  onClose: () => void;
}

export const MoveHistoryDrawer: React.FC<MoveHistoryDrawerProps> = ({ moves, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into pairs (White & Black)
  const movePairs: { num: number; white: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  const handleCopyPGN = () => {
    let pgn = '';
    movePairs.forEach((pair) => {
      pgn += `${pair.num}. ${pair.white.san} `;
      if (pair.black) {
        pgn += `${pair.black.san} `;
      }
    });
    navigator.clipboard.writeText(pgn.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-14 right-3 sm:right-4 z-30 w-72 sm:w-80 max-h-[60vh] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col pointer-events-auto select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Move History
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyPGN}
            disabled={moves.length === 0}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Copy PGN Notation"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-y-auto flex-1 font-mono text-xs pr-1 space-y-1">
        {movePairs.length === 0 ? (
          <p className="text-slate-500 italic text-center py-6">No moves played yet</p>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.num}
              className="flex items-center py-1 px-2 rounded-lg hover:bg-slate-900/60 transition-colors"
            >
              <span className="w-8 text-slate-500 font-semibold">{pair.num}.</span>
              <span className="flex-1 font-medium text-slate-200">{pair.white.san}</span>
              <span className="flex-1 font-medium text-slate-300">
                {pair.black ? pair.black.san : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
