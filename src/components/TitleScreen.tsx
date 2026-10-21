import React, { useEffect } from 'react';
import type { GameMode, AiDifficulty, BoardThemeId } from '../types/chess';
import { Bot, Users, Sparkles, Volume2, VolumeX, Shield, Play } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (config: {
    mode: GameMode;
    playerColor: 'w' | 'b';
    aiDifficulty: AiDifficulty;
    timeControlSeconds: number;
    theme: BoardThemeId;
  }) => void;
  currentTheme: BoardThemeId;
  onThemeChange: (theme: BoardThemeId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  currentTheme,
  onThemeChange,
  soundEnabled,
  onToggleSound,
}) => {
  const [mode, setMode] = React.useState<GameMode>('ai');
  const [playerColor, setPlayerColor] = React.useState<'w' | 'b'>('w');
  const [aiDifficulty, setAiDifficulty] = React.useState<AiDifficulty>('medium');
  const [timeControl, setTimeControl] = React.useState<number>(0);

  // Keyboard shortcut: Press Enter or Space to immediately start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame({
          mode,
          playerColor,
          aiDifficulty,
          timeControlSeconds: timeControl,
          theme: currentTheme,
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, playerColor, aiDifficulty, timeControl, currentTheme, onStartGame]);

  return (
    <div className="absolute inset-0 pointer-events-auto flex flex-col items-center justify-between p-4 sm:p-8 z-30 select-none overflow-y-auto">
      {/* Sound toggle top-right */}
      <div className="w-full flex justify-end">
        <button
          onClick={onToggleSound}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-amber-500/50 transition-all cursor-pointer shadow-lg"
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Hero Title Lockup & Bespoke Inline SVG Crest */}
      <div className="flex flex-col items-center text-center max-w-xl mx-auto my-auto space-y-4">
        {/* Bespoke King Crown & Shield SVG */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            {/* Base Shield */}
            <path
              d="M 50,5 L 85,20 L 85,55 C 85,75 50,95 50,95 C 50,95 15,75 15,55 L 15,20 Z"
              fill="url(#shieldGrad)"
              stroke="url(#goldGrad)"
              strokeWidth="2.5"
            />
            {/* Checkerboard emblem inside shield */}
            <path d="M 50,22 L 65,37 L 50,52 L 35,37 Z" fill="#ca8a04" opacity="0.35" />
            {/* Regal King piece silhouette */}
            <path
              d="M 48,22 L 52,22 L 52,27 L 57,27 L 57,31 L 52,31 L 52,36 L 48,36 L 48,31 L 43,31 L 43,27 L 48,27 Z"
              fill="url(#goldGrad)"
            />
            <path
              d="M 36,44 C 40,40 60,40 64,44 C 61,54 59,62 66,74 L 34,74 C 41,62 39,54 36,44 Z"
              fill="url(#goldGrad)"
            />
            <path d="M 30,74 L 70,74 L 72,79 L 28,79 Z" fill="url(#goldGrad)" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 font-serif drop-shadow-md">
            Grandmaster 3D
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium tracking-wide mt-1">
            Tactical Three.js Chess Experience
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-left space-y-4 max-w-md">
          {/* Game Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Game Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode('ai')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  mode === 'ai'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <Bot size={16} /> vs AI
              </button>
              <button
                onClick={() => setMode('passAndPlay')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  mode === 'passAndPlay'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <Users size={16} /> 2 Players
              </button>
              <button
                onClick={() => setMode('analysis')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  mode === 'analysis'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <Sparkles size={16} /> Free Board
              </button>
            </div>
          </div>

          {/* AI Settings (shown if mode is AI) */}
          {mode === 'ai' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Play As
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setPlayerColor('w')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      playerColor === 'w'
                        ? 'bg-white text-slate-900 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    White
                  </button>
                  <button
                    onClick={() => setPlayerColor('b')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      playerColor === 'b'
                        ? 'bg-slate-950 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Black
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setAiDifficulty(diff)}
                      className={`py-1.5 text-[11px] font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                        aiDifficulty === diff
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff === 'easy' ? 'Novice' : diff === 'medium' ? 'Club' : 'Master'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Time Control */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Timer
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-800 p-1 rounded-xl">
              {[
                { label: 'Unlimited', val: 0 },
                { label: '3 min', val: 180 },
                { label: '5 min', val: 300 },
                { label: '10 min', val: 600 },
              ].map((tc) => (
                <button
                  key={tc.val}
                  onClick={() => setTimeControl(tc.val)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    timeControl === tc.val
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Board Theme
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'wood' as const, label: 'Walnut' },
                { id: 'marble' as const, label: 'Marble' },
                { id: 'metallic' as const, label: 'Metallic' },
                { id: 'cyber' as const, label: 'Cyber' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`py-1.5 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                    currentTheme === t.id
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Start CTA Button */}
          <button
            onClick={() =>
              onStartGame({
                mode,
                playerColor,
                aiDifficulty,
                timeControlSeconds: timeControl,
                theme: currentTheme,
              })
            }
            className="w-full mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-bold text-base tracking-wide flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-amber-500/25"
          >
            <Play size={18} fill="currentColor" /> START MATCH
          </button>
        </div>

        {/* Control Hint Line */}
        <p className="text-slate-500 text-xs tracking-wider">
          Click / Tap Piece to Move · Drag to Orbit · Scroll to Zoom
        </p>
      </div>

      <div className="text-slate-600 text-[11px] font-mono">
        ENTER or SPACE to Play
      </div>
    </div>
  );
};
