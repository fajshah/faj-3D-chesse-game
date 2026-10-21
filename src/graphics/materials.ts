import * as THREE from 'three';
import type { BoardThemeId } from '../types/chess';
import {
  createWoodTexture,
  createMarbleTexture,
  createContactShadowTexture,
  createBoardBorderTexture,
} from './proceduralTextures';

export interface ThemeMaterials {
  whiteMain: THREE.MeshStandardMaterial;
  whiteAccent: THREE.MeshStandardMaterial;
  blackMain: THREE.MeshStandardMaterial;
  blackAccent: THREE.MeshStandardMaterial;
  felt: THREE.MeshStandardMaterial;
  lightSquare: THREE.MeshStandardMaterial;
  darkSquare: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  table: THREE.MeshStandardMaterial;
  hoverHighlight: THREE.MeshBasicMaterial;
  selectedRing: THREE.MeshBasicMaterial;
  validMoveDot: THREE.MeshBasicMaterial;
  validCaptureRing: THREE.MeshBasicMaterial;
  lastMoveHighlight: THREE.MeshBasicMaterial;
  checkAura: THREE.MeshBasicMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  // Mezzanine architectural materials
  mezzanineBase: THREE.MeshStandardMaterial;
  mezzanineUnderglow: THREE.MeshStandardMaterial;
  mezzanineInlay: THREE.MeshStandardMaterial;
  mezzanineCorner: THREE.MeshStandardMaterial;
  mezzanineTray: THREE.MeshStandardMaterial;
  mezzanineRipple: THREE.MeshBasicMaterial;
}

export function buildThemeMaterials(themeId: BoardThemeId): ThemeMaterials {
  const shadowTex = createContactShadowTexture();

  // Highlight & indicator materials with coplanar polygonOffset to avoid Z-fighting
  const hoverHighlight = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const selectedRing = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const validMoveDot = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const validCaptureRing = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const lastMoveHighlight = new THREE.MeshBasicMaterial({
    color: 0xeab308,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -0.5,
    polygonOffsetUnits: -0.5,
  });

  const checkAura = new THREE.MeshBasicMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const contactShadow = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });

  const felt = new THREE.MeshStandardMaterial({
    color: 0x17331e, // Deep emerald billiard felt
    roughness: 0.92,
    metalness: 0.05,
  });

  const mezzanineRipple = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  if (themeId === 'marble') {
    const marbleLight = createMarbleTexture(false);
    const marbleDark = createMarbleTexture(true);

    const whiteMain = new THREE.MeshStandardMaterial({
      map: marbleLight,
      color: 0xf4f7fa,
      roughness: 0.2,
      metalness: 0.1,
    });
    const whiteAccent = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85,
    });
    const blackMain = new THREE.MeshStandardMaterial({
      map: marbleDark,
      color: 0x1e2025,
      roughness: 0.25,
      metalness: 0.15,
    });
    const blackAccent = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      roughness: 0.3,
      metalness: 0.8,
    });

    const lightSquare = new THREE.MeshStandardMaterial({
      map: marbleLight,
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.06,
    });
    const darkSquare = new THREE.MeshStandardMaterial({
      map: marbleDark,
      color: 0x181a20,
      roughness: 0.26,
      metalness: 0.12,
    });

    const frame = new THREE.MeshStandardMaterial({
      map: marbleDark,
      color: 0x121419,
      roughness: 0.28,
      metalness: 0.35,
    });

    const table = new THREE.MeshStandardMaterial({
      color: 0x07090d,
      roughness: 0.7,
      metalness: 0.2,
    });

    const mezzanineBase = new THREE.MeshStandardMaterial({
      color: 0x0f1116,
      roughness: 0.25,
      metalness: 0.45,
    });

    const mezzanineUnderglow = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.3,
    });

    const mezzanineInlay = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.9,
    });

    const mezzanineCorner = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.9,
    });

    const mezzanineTray = new THREE.MeshStandardMaterial({
      color: 0x090b0e,
      roughness: 0.85,
      metalness: 0.1,
    });

    return {
      whiteMain, whiteAccent, blackMain, blackAccent, felt,
      lightSquare, darkSquare, frame, table,
      hoverHighlight, selectedRing, validMoveDot, validCaptureRing,
      lastMoveHighlight, checkAura, contactShadow,
      mezzanineBase, mezzanineUnderglow, mezzanineInlay,
      mezzanineCorner, mezzanineTray, mezzanineRipple,
    };
  }

  if (themeId === 'metallic') {
    const whiteMain = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.18,
      metalness: 0.92,
    });
    const whiteAccent = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.85,
    });
    const blackMain = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.22,
      metalness: 0.88,
    });
    const blackAccent = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.3,
      metalness: 0.7,
    });

    const lightSquare = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.75,
    });
    const darkSquare = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.85,
    });

    const frame = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.82,
    });

    const table = new THREE.MeshStandardMaterial({
      color: 0x060911,
      roughness: 0.75,
      metalness: 0.3,
    });

    const mezzanineBase = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.3,
      metalness: 0.85,
    });

    const mezzanineUnderglow = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.1,
      roughness: 0.2,
      metalness: 0.5,
    });

    const mezzanineInlay = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.15,
      metalness: 0.95,
    });

    const mezzanineCorner = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.92,
    });

    const mezzanineTray = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.8,
      metalness: 0.2,
    });

    return {
      whiteMain, whiteAccent, blackMain, blackAccent, felt,
      lightSquare, darkSquare, frame, table,
      hoverHighlight, selectedRing, validMoveDot, validCaptureRing,
      lastMoveHighlight, checkAura, contactShadow,
      mezzanineBase, mezzanineUnderglow, mezzanineInlay,
      mezzanineCorner, mezzanineTray, mezzanineRipple,
    };
  }

  if (themeId === 'cyber') {
    const whiteMain = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x004455,
      emissiveIntensity: 0.4,
    });
    const whiteAccent = new THREE.MeshStandardMaterial({
      color: 0x38ef7d,
      roughness: 0.25,
      metalness: 0.8,
      emissive: 0x085522,
      emissiveIntensity: 0.5,
    });
    const blackMain = new THREE.MeshStandardMaterial({
      color: 0x181822,
      roughness: 0.35,
      metalness: 0.7,
    });
    const blackAccent = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      metalness: 0.75,
      emissive: 0x660818,
      emissiveIntensity: 0.6,
    });

    const lightSquare = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6,
    });
    const darkSquare = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.45,
      metalness: 0.7,
    });

    const frame = new THREE.MeshStandardMaterial({
      color: 0x04060a,
      roughness: 0.2,
      metalness: 0.9,
    });

    const table = new THREE.MeshStandardMaterial({
      color: 0x020306,
      roughness: 0.8,
      metalness: 0.5,
    });

    const mezzanineBase = new THREE.MeshStandardMaterial({
      color: 0x030509,
      roughness: 0.3,
      metalness: 0.9,
    });

    const mezzanineUnderglow = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 1.4,
      roughness: 0.1,
      metalness: 0.3,
    });

    const mezzanineInlay = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x005577,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });

    const mezzanineCorner = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0x440815,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.85,
    });

    const mezzanineTray = new THREE.MeshStandardMaterial({
      color: 0x060810,
      roughness: 0.85,
      metalness: 0.4,
    });

    return {
      whiteMain, whiteAccent, blackMain, blackAccent, felt,
      lightSquare, darkSquare, frame, table,
      hoverHighlight, selectedRing, validMoveDot, validCaptureRing,
      lastMoveHighlight, checkAura, contactShadow,
      mezzanineBase, mezzanineUnderglow, mezzanineInlay,
      mezzanineCorner, mezzanineTray, mezzanineRipple,
    };
  }

  // Default: Classic Walnut & Maple Heirloom Mezzanine
  const woodLight = createWoodTexture(false);
  const woodDark = createWoodTexture(true);
  const borderTex = createBoardBorderTexture(true);

  const whiteMain = new THREE.MeshStandardMaterial({
    map: woodLight,
    color: 0xfff0d8,
    roughness: 0.32,
    metalness: 0.08,
  });
  const whiteAccent = new THREE.MeshStandardMaterial({
    color: 0xd9b37a,
    roughness: 0.35,
    metalness: 0.25,
  });

  const blackMain = new THREE.MeshStandardMaterial({
    map: woodDark,
    color: 0x482e1d,
    roughness: 0.38,
    metalness: 0.1,
  });
  const blackAccent = new THREE.MeshStandardMaterial({
    color: 0x2e1b10,
    roughness: 0.45,
    metalness: 0.25,
  });

  const lightSquare = new THREE.MeshStandardMaterial({
    map: woodLight,
    color: 0xf5e9d3,
    roughness: 0.35,
    metalness: 0.05,
  });

  const darkSquare = new THREE.MeshStandardMaterial({
    map: woodDark,
    color: 0x5a341e,
    roughness: 0.4,
    metalness: 0.05,
  });

  const frame = new THREE.MeshStandardMaterial({
    map: borderTex,
    color: 0x241209,
    roughness: 0.32,
    metalness: 0.15,
  });

  const table = new THREE.MeshStandardMaterial({
    color: 0x100b08,
    roughness: 0.75,
    metalness: 0.08,
  });

  const mezzanineBase = new THREE.MeshStandardMaterial({
    color: 0x180d07,
    roughness: 0.35,
    metalness: 0.25,
  });

  const mezzanineUnderglow = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.95,
    roughness: 0.3,
    metalness: 0.4,
  });

  const mezzanineInlay = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Polished brass gold grid inlays
    roughness: 0.2,
    metalness: 0.92,
  });

  const mezzanineCorner = new THREE.MeshStandardMaterial({
    color: 0xc5a059, // Sculpted brass corner guards
    roughness: 0.22,
    metalness: 0.9,
  });

  const mezzanineTray = new THREE.MeshStandardMaterial({
    color: 0x122416, // Dark bottle green velvet tray
    roughness: 0.95,
    metalness: 0.02,
  });

  return {
    whiteMain, whiteAccent, blackMain, blackAccent, felt,
    lightSquare, darkSquare, frame, table,
    hoverHighlight, selectedRing, validMoveDot, validCaptureRing,
    lastMoveHighlight, checkAura, contactShadow,
    mezzanineBase, mezzanineUnderglow, mezzanineInlay,
    mezzanineCorner, mezzanineTray, mezzanineRipple,
  };
}
