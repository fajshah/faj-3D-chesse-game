import type { Square, PieceSymbol, Color } from 'chess.js';

export type GameMode = 'ai' | 'passAndPlay' | 'analysis';
export type AiDifficulty = 'easy' | 'medium' | 'hard';
export type BoardThemeId = 'wood' | 'marble' | 'metallic' | 'cyber';
export type CameraPreset = 'white' | 'black' | 'topDown' | 'side' | 'free';

export interface GameSettings {
  mode: GameMode;
  playerColor: 'w' | 'b';
  aiDifficulty: AiDifficulty;
  timeControlSeconds: number; // 0 for untimed, 180 for 3 min, 600 for 10 min, etc.
  theme: BoardThemeId;
  soundEnabled: boolean;
  autoFlipOnTurn: boolean;
  showValidMoves: boolean;
  showCoordinates: boolean;
}

export interface CapturedPieces {
  w: PieceSymbol[];
  b: PieceSymbol[];
}

export interface MoveRecord {
  from: Square;
  to: Square;
  san: string;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
}

export interface BoardThemeConfig {
  id: BoardThemeId;
  name: string;
  lightSquareColor: string;
  darkSquareColor: string;
  whitePieceColor: string;
  blackPieceColor: string;
  frameColor: string;
  tableColor: string;
}
