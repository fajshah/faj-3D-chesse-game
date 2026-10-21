/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { ChessScene } from './graphics/ChessScene';
import { sounds } from './audio/soundEffects';
import { getBestAiMove } from './game/chessAi';
import type {
  GameMode,
  AiDifficulty,
  BoardThemeId,
  CameraPreset,
  CapturedPieces,
  MoveRecord,
} from './types/chess';
import { TitleScreen } from './components/TitleScreen';
import { HudOverlay } from './components/HudOverlay';
import { ControlDock } from './components/ControlDock';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { MoveHistoryDrawer } from './components/MoveHistoryDrawer';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ChessScene | null>(null);
  const chessRef = useRef<Chess>(new Chess());

  // Game state
  const [gameState, setGameState] = useState<'title' | 'playing' | 'gameOver'>('title');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('medium');
  const [theme, setTheme] = useState<BoardThemeId>('wood');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('white');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Turn and board status
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [movesHistory, setMovesHistory] = useState<MoveRecord[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({ w: [], b: [] });

  // Timers
  const [timeControl, setTimeControl] = useState<number>(0);
  const [whiteTime, setWhiteTime] = useState<number>(0);
  const [blackTime, setBlackTime] = useState<number>(0);

  // Modals & Panels
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    color: 'w' | 'b';
  } | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{
    winner: 'w' | 'b' | 'draw' | null;
    reason: string;
  } | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new ChessScene(mountRef.current, theme);
    sceneRef.current = scene;

    // Start with title screen cinematic rotation
    scene.setCinematicRotation(true);
    scene.syncPieces(chessRef.current.board());

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Synchronize captured pieces with the side Mezzanine balconies in 3D
  useEffect(() => {
    sceneRef.current?.syncCapturedBalcony(capturedPieces);
  }, [capturedPieces]);

  // Sync turn clock tick
  useEffect(() => {
    if (gameState !== 'playing' || timeControl === 0) return;

    const timer = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeOut('w');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeOut('b');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, turn, timeControl]);

  // Handle timeout
  const handleTimeOut = (flaggedColor: 'w' | 'b') => {
    sounds.playDefeat();
    const winner = flaggedColor === 'w' ? 'b' : 'w';
    setGameOverInfo({
      winner,
      reason: `${flaggedColor === 'w' ? 'White' : 'Black'} ran out of time`,
    });
    setGameState('gameOver');
  };

  // Check game over status
  const checkGameOver = useCallback(() => {
    const chess = chessRef.current;
    if (chess.isGameOver()) {
      let winner: 'w' | 'b' | 'draw' | null = null;
      let reason = '';

      if (chess.isCheckmate()) {
        winner = chess.turn() === 'w' ? 'b' : 'w';
        reason = `${winner === 'w' ? 'White' : 'Black'} wins by checkmate`;
        sounds.playVictory();
      } else if (chess.isDraw()) {
        winner = 'draw';
        if (chess.isStalemate()) {
          reason = 'Draw by stalemate';
        } else if (chess.isThreefoldRepetition()) {
          reason = 'Draw by threefold repetition';
        } else if (chess.isInsufficientMaterial()) {
          reason = 'Draw by insufficient material';
        } else {
          reason = 'Draw by 50-move rule';
        }
        sounds.playDefeat();
      }

      setGameOverInfo({ winner, reason });
      setGameState('gameOver');
      return true;
    }
    return false;
  }, []);

  // Update check aura in 3D
  const updateCheckAura = useCallback(() => {
    const chess = chessRef.current;
    if (chess.inCheck()) {
      setIsCheck(true);
      sounds.playCheck();

      // Find the king of the threatened color
      const currentTurn = chess.turn();
      const board = chess.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (piece && piece.type === 'k' && piece.color === currentTurn) {
            sceneRef.current?.setCheckSquare(piece.square);
            return;
          }
        }
      }
    } else {
      setIsCheck(false);
      sceneRef.current?.setCheckSquare(null);
    }
  }, []);

  // Execute AI turn
  const triggerAiMove = useCallback(
    async (difficulty: AiDifficulty) => {
      const chess = chessRef.current;
      if (chess.isGameOver()) return;

      setIsAiThinking(true);
      const move = await getBestAiMove(chess, difficulty);
      setIsAiThinking(false);

      if (!move) return;

      const legalMove = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (!legalMove) return;

      // Animate 3D movement
      sceneRef.current?.animateMove(move.from, move.to, () => {
        sceneRef.current?.syncPieces(chess.board());
      });

      // Sound
      if (legalMove.captured) {
        sounds.playCapture();
      } else if (legalMove.san.includes('O-O')) {
        sounds.playCastle();
      } else {
        sounds.playMove();
      }

      // Record move
      const record: MoveRecord = {
        from: move.from,
        to: move.to,
        san: legalMove.san,
        piece: legalMove.piece,
        color: legalMove.color,
        captured: legalMove.captured,
        promotion: legalMove.promotion,
      };

      setMovesHistory((prev) => [...prev, record]);
      if (legalMove.captured) {
        setCapturedPieces((prev) => ({
          ...prev,
          [legalMove.color]: [...prev[legalMove.color], legalMove.captured as PieceSymbol],
        }));
      }

      sceneRef.current?.setLastMove(move.from, move.to);
      setTurn(chess.turn());
      updateCheckAura();
      checkGameOver();
    },
    [checkGameOver, updateCheckAura]
  );

  // Execute a human move
  const executeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: PieceSymbol) => {
      const chess = chessRef.current;
      const move = chess.move({
        from,
        to,
        promotion: promotionPiece || 'q',
      });

      if (!move) return;

      // Clear highlights
      setSelectedSquare(null);
      sceneRef.current?.setSelectedSquare(null);
      sceneRef.current?.setValidMoves([]);

      // 3D Arc animation
      sceneRef.current?.animateMove(from, to, () => {
        sceneRef.current?.syncPieces(chess.board());
      });

      // Audio feedback
      if (promotionPiece) {
        sounds.playPromotion();
      } else if (move.captured) {
        sounds.playCapture();
      } else if (move.san.includes('O-O')) {
        sounds.playCastle();
      } else {
        sounds.playMove();
      }

      // Record move
      const record: MoveRecord = {
        from,
        to,
        san: move.san,
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        promotion: move.promotion,
      };

      setMovesHistory((prev) => [...prev, record]);
      if (move.captured) {
        setCapturedPieces((prev) => ({
          ...prev,
          [move.color]: [...prev[move.color], move.captured as PieceSymbol],
        }));
      }

      sceneRef.current?.setLastMove(from, to);
      const nextTurn = chess.turn();
      setTurn(nextTurn);
      updateCheckAura();

      const ended = checkGameOver();
      if (ended) return;

      // If AI mode and next turn is AI
      if (gameMode === 'ai' && nextTurn !== playerColor) {
        setTimeout(() => {
          triggerAiMove(aiDifficulty);
        }, 150);
      }
    },
    [gameMode, playerColor, aiDifficulty, triggerAiMove, checkGameOver, updateCheckAura]
  );

  // Square click handling from 3D raycaster
  const handleSquareClicked = useCallback(
    (square: Square) => {
      if (gameState !== 'playing') return;
      const chess = chessRef.current;

      // In AI mode, prevent moving on AI's turn
      if (gameMode === 'ai' && chess.turn() !== playerColor) return;

      const pieceOnSquare = chess.get(square);

      // Case 1: No piece currently selected
      if (!selectedSquare) {
        if (pieceOnSquare && pieceOnSquare.color === chess.turn()) {
          setSelectedSquare(square);
          sceneRef.current?.setSelectedSquare(square);
          sounds.playSelect();

          // Compute legal target squares
          const legalMoves = chess.moves({ square, verbose: true });
          sceneRef.current?.setValidMoves(
            legalMoves.map((m) => ({ to: m.to, captured: m.captured }))
          );
        }
        return;
      }

      // Case 2: A piece is already selected
      // Did user click another piece of their own?
      if (pieceOnSquare && pieceOnSquare.color === chess.turn()) {
        if (square === selectedSquare) {
          // Deselect
          setSelectedSquare(null);
          sceneRef.current?.setSelectedSquare(null);
          sceneRef.current?.setValidMoves([]);
          return;
        } else {
          // Switch selection
          setSelectedSquare(square);
          sceneRef.current?.setSelectedSquare(square);
          sounds.playSelect();

          const legalMoves = chess.moves({ square, verbose: true });
          sceneRef.current?.setValidMoves(
            legalMoves.map((m) => ({ to: m.to, captured: m.captured }))
          );
          return;
        }
      }

      // Check if target is a legal move
      const legalMoves = chess.moves({ square: selectedSquare, verbose: true });
      const targetMove = legalMoves.find((m) => m.to === square);

      if (targetMove) {
        // Check for promotion
        const selectedPiece = chess.get(selectedSquare);
        if (
          selectedPiece &&
          selectedPiece.type === 'p' &&
          (square[1] === '8' || square[1] === '1')
        ) {
          setPendingPromotion({
            from: selectedSquare,
            to: square,
            color: selectedPiece.color,
          });
          return;
        }

        executeMove(selectedSquare, square);
      } else {
        // Invalid target: deselect
        setSelectedSquare(null);
        sceneRef.current?.setSelectedSquare(null);
        sceneRef.current?.setValidMoves([]);
      }
    },
    [gameState, gameMode, playerColor, selectedSquare, executeMove]
  );

  // Hook raycast callback to scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.onSquareClicked = handleSquareClicked;
    }
  }, [handleSquareClicked]);

  // Start new game
  const handleStartGame = (config: {
    mode: GameMode;
    playerColor: 'w' | 'b';
    aiDifficulty: AiDifficulty;
    timeControlSeconds: number;
    theme: BoardThemeId;
  }) => {
    setGameMode(config.mode);
    setPlayerColor(config.playerColor);
    setAiDifficulty(config.aiDifficulty);
    setTimeControl(config.timeControlSeconds);
    setWhiteTime(config.timeControlSeconds);
    setBlackTime(config.timeControlSeconds);
    setTheme(config.theme);

    // Reset chess board
    chessRef.current = new Chess();
    setTurn('w');
    setIsCheck(false);
    setIsAiThinking(false);
    setSelectedSquare(null);
    setMovesHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setGameOverInfo(null);
    setGameState('playing');

    // Setup 3D Scene camera and board
    if (sceneRef.current) {
      sceneRef.current.setCinematicRotation(false);
      sceneRef.current.setTheme(config.theme);
      sceneRef.current.syncPieces(chessRef.current.board());
      sceneRef.current.setLastMove(null, null);
      sceneRef.current.setCheckSquare(null);
      sceneRef.current.setSelectedSquare(null);
      sceneRef.current.setValidMoves([]);

      // Orient camera to player's color
      const preset: CameraPreset = config.playerColor === 'w' ? 'white' : 'black';
      setCameraPreset(preset);
      sceneRef.current.setCameraPreset(preset);
    }

    // If player is Black in AI mode, trigger AI's opening move as White
    if (config.mode === 'ai' && config.playerColor === 'b') {
      setTimeout(() => {
        triggerAiMove(config.aiDifficulty);
      }, 500);
    }
  };

  // Undo Move
  const handleUndoMove = () => {
    const chess = chessRef.current;
    if (gameState !== 'playing' || chess.history().length === 0) return;

    // In AI mode, undo 2 moves (AI move + player move)
    if (gameMode === 'ai') {
      chess.undo();
      chess.undo();
    } else {
      chess.undo();
    }

    // Refresh state
    sceneRef.current?.syncPieces(chess.board());
    setSelectedSquare(null);
    sceneRef.current?.setSelectedSquare(null);
    sceneRef.current?.setValidMoves([]);

    // Recalculate captured pieces and history
    const history = chess.history({ verbose: true });
    const records: MoveRecord[] = history.map((h) => ({
      from: h.from,
      to: h.to,
      san: h.san,
      piece: h.piece,
      color: h.color,
      captured: h.captured,
      promotion: h.promotion,
    }));
    setMovesHistory(records);

    const caps: CapturedPieces = { w: [], b: [] };
    for (const h of history) {
      if (h.captured) {
        caps[h.color].push(h.captured);
      }
    }
    setCapturedPieces(caps);

    const last = records[records.length - 1];
    sceneRef.current?.setLastMove(last ? last.from : null, last ? last.to : null);

    setTurn(chess.turn());
    updateCheckAura();
    sounds.playMove();
  };

  // Flip board perspective
  const handleFlipBoard = () => {
    const nextPreset = cameraPreset === 'white' ? 'black' : 'white';
    setCameraPreset(nextPreset);
    sceneRef.current?.setCameraPreset(nextPreset);
  };

  // Camera preset selector
  const handleSelectCamera = (preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneRef.current?.setCameraPreset(preset);
  };

  // Theme selector
  const handleSelectTheme = (newTheme: BoardThemeId) => {
    setTheme(newTheme);
    sceneRef.current?.setTheme(newTheme);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFlipBoard();
      } else if (e.key === 'u' || e.key === 'U') {
        handleUndoMove();
      } else if (e.key === '1') {
        handleSelectCamera('white');
      } else if (e.key === '2') {
        handleSelectCamera('black');
      } else if (e.key === '3') {
        handleSelectCamera('topDown');
      } else if (e.key === '4') {
        handleSelectCamera('side');
      } else if (e.key === '5') {
        handleSelectCamera('free');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [soundEnabled, cameraPreset, gameState]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0c0f17] select-none font-sans">
      {/* 3D WebGL Canvas Container mounted in dedicated isolated div */}
      <div ref={mountRef} className="absolute inset-0 z-0 touch-none w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          currentTheme={theme}
          onThemeChange={handleSelectTheme}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Playing & Game Over State HUD */}
      {(gameState === 'playing' || gameState === 'gameOver') && (
        <>
          <HudOverlay
            mode={gameMode}
            turn={turn}
            playerColor={playerColor}
            isCheck={isCheck}
            isAiThinking={isAiThinking}
            whiteTime={whiteTime}
            blackTime={blackTime}
            timeControlSeconds={timeControl}
            capturedPieces={capturedPieces}
            onResetGame={() =>
              handleStartGame({
                mode: gameMode,
                playerColor,
                aiDifficulty,
                timeControlSeconds: timeControl,
                theme,
              })
            }
            onReturnToTitle={() => {
              setGameState('title');
              sceneRef.current?.setCinematicRotation(true);
            }}
          />

          <ControlDock
            currentCamera={cameraPreset}
            onSelectCamera={handleSelectCamera}
            currentTheme={theme}
            onSelectTheme={handleSelectTheme}
            onUndoMove={handleUndoMove}
            canUndo={movesHistory.length > 0}
            onFlipBoard={handleFlipBoard}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onToggleHistory={() => setShowHistoryDrawer(!showHistoryDrawer)}
            showHistory={showHistoryDrawer}
          />
        </>
      )}

      {/* Move History Drawer */}
      {showHistoryDrawer && (
        <MoveHistoryDrawer
          moves={movesHistory}
          onClose={() => setShowHistoryDrawer(false)}
        />
      )}

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={pendingPromotion.color}
          onSelect={(piece) => {
            const { from, to } = pendingPromotion;
            setPendingPromotion(null);
            executeMove(from, to, piece);
          }}
        />
      )}

      {/* Victory / Defeat Modal */}
      {gameState === 'gameOver' && gameOverInfo && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          totalMoves={movesHistory.length}
          onRematch={() =>
            handleStartGame({
              mode: gameMode,
              playerColor,
              aiDifficulty,
              timeControlSeconds: timeControl,
              theme,
            })
          }
          onAnalysis={() => {
            setGameState('playing');
            setGameMode('analysis');
          }}
          onMenu={() => {
            setGameState('title');
            sceneRef.current?.setCinematicRotation(true);
          }}
        />
      )}
    </div>
  );
}
