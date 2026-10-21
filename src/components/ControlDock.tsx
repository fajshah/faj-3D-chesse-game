import React, { useState } from 'react';
import type { CameraPreset, BoardThemeId } from '../types/chess';
import {
  ChevronDown,
  ChevronUp,
  Camera,
  Palette,
  Undo2,
  Repeat,
  Volume2,
  VolumeX,
  FileText,
  Eye,
} from 'lucide-react';

interface ControlDockProps {
  currentCamera: CameraPreset;
  onSelectCamera: (preset: CameraPreset) => void;
  currentTheme: BoardThemeId;
  onSelectTheme: (theme: BoardThemeId) => void;
  onUndoMove: () => void;
  canUndo: boolean;
  onFlipBoard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  currentCamera,
  onSelectCamera,
  currentTheme,
  onSelectTheme,
  onUndoMove,
  canUndo,
  onFlipBoard,
  soundEnabled,
  onToggleSound,
  onToggleHistory,
  showHistory,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'themes'>('camera');

  const cameraPresets: { id: CameraPreset; label: string }[] = [
    { id: 'white', label: 'White' },
    { id: 'black', label: 'Black' },
    { id: 'topDown', label: 'Top-Down' },
    { id: 'side', label: 'Side 45°' },
    { id: 'free', label: 'Orbit' },
  ];

  const themes: { id: BoardThemeId; label: string }[] = [
    { id: 'wood', label: 'Walnut' },
    { id: 'marble', label: 'Marble' },
    { id: 'metallic', label: 'Metallic' },
    { id: 'cyber', label: 'Cyber' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-25 w-full max-w-[94vw] sm:max-w-xl pointer-events-auto flex flex-col items-center select-none transition-transform duration-300">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1 flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-slate-900 border-t border-x border-slate-800 text-[11px] font-semibold tracking-wider text-slate-400 hover:text-white transition-all cursor-pointer shadow-md"
        title="Toggle Dock (H)"
      >
        {isCollapsed ? (
          <>
            <ChevronUp size={14} /> <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown size={14} /> <span>Zen Mode</span>
          </>
        )}
      </button>

      {/* Main Unified Dock Panel */}
      {!isCollapsed && (
        <div className="w-full bg-slate-950/95 border border-slate-800/90 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-col gap-2">
          {/* Top row: Tab pills & Quick actions */}
          <div className="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1.5">
            {/* View & Theme Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('camera')}
                className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera size={13} /> Camera
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'themes'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette size={13} /> Themes
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Undo Move */}
              <button
                onClick={onUndoMove}
                disabled={!canUndo}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  canUndo
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                    : 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                }`}
                title="Undo Move"
              >
                <Undo2 size={15} />
              </button>

              {/* Flip Board Camera */}
              <button
                onClick={onFlipBoard}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                title="Flip Board View"
              >
                <Repeat size={15} />
              </button>

              {/* Move History Toggle */}
              <button
                onClick={onToggleHistory}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  showHistory
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
                title="Move Notation History"
              >
                <FileText size={15} />
              </button>

              {/* Mute / Unmute */}
              <button
                onClick={onToggleSound}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
          </div>

          {/* Sub-Panel: Camera Presets or Theme Selectors */}
          <div className="flex items-center justify-center gap-1 overflow-x-auto py-0.5">
            {activeTab === 'camera' &&
              cameraPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectCamera(preset.id)}
                  className={`flex-1 min-w-[64px] py-1 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center whitespace-nowrap ${
                    currentCamera === preset.id
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}

            {activeTab === 'themes' &&
              themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`flex-1 min-w-[64px] py-1 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center whitespace-nowrap ${
                    currentTheme === theme.id
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
