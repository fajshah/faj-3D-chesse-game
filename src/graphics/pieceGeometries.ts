import * as THREE from 'three';
import type { PieceSymbol } from 'chess.js';

/**
 * Procedural composite 3-12 part chess piece 3D models.
 * Strictly adheres to Three.js Craft guidelines:
 * - Multi-part composite THREE.Group hierarchies
 * - Primary silhouette, secondary read, and accent details
 * - Bottom-center pivot at Y=0 (flush with board surface)
 * - Cached reusable BufferGeometries for optimal memory & zero stutter
 */

// Cache geometries so all 32 pieces share identical buffer allocations
let cachedGeometries: Record<string, THREE.BufferGeometry> | null = null;

function initGeometries(): Record<string, THREE.BufferGeometry> {
  const g: Record<string, THREE.BufferGeometry> = {};

  // Shared base plinths
  g.feltPad = new THREE.CylinderGeometry(0.36, 0.36, 0.02, 32);
  g.feltPad.translate(0, 0.01, 0);

  g.basePawn = new THREE.CylinderGeometry(0.32, 0.38, 0.12, 32);
  g.basePawn.translate(0, 0.08, 0);

  g.baseMajor = new THREE.CylinderGeometry(0.35, 0.42, 0.14, 32);
  g.baseMajor.translate(0, 0.09, 0);

  g.baseRoyal = new THREE.CylinderGeometry(0.37, 0.44, 0.16, 32);
  g.baseRoyal.translate(0, 0.1, 0);

  // Pawn components
  g.pawnStem = new THREE.CylinderGeometry(0.18, 0.28, 0.45, 24);
  g.pawnStem.translate(0, 0.36, 0);

  g.pawnRing = new THREE.TorusGeometry(0.22, 0.04, 12, 24);
  g.pawnRing.rotateX(Math.PI / 2);
  g.pawnRing.translate(0, 0.6, 0);

  g.pawnHead = new THREE.SphereGeometry(0.22, 24, 20);
  g.pawnHead.translate(0, 0.82, 0);

  // Rook components
  g.rookStem = new THREE.CylinderGeometry(0.28, 0.34, 0.65, 24);
  g.rookStem.translate(0, 0.48, 0);

  g.rookShelf = new THREE.CylinderGeometry(0.36, 0.28, 0.12, 24);
  g.rookShelf.translate(0, 0.86, 0);

  g.rookParapetOuter = new THREE.CylinderGeometry(0.38, 0.36, 0.22, 24);
  g.rookParapetOuter.translate(0, 1.02, 0);

  g.rookInnerFloor = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 20);
  g.rookInnerFloor.translate(0, 0.96, 0);

  g.rookCrenel = new THREE.BoxGeometry(0.1, 0.12, 0.18);

  // Knight components
  g.knightBaseCollar = new THREE.CylinderGeometry(0.28, 0.36, 0.15, 24);
  g.knightBaseCollar.translate(0, 0.23, 0);

  // Sculpted arched steed neck and chest
  g.knightChest = new THREE.CylinderGeometry(0.24, 0.28, 0.5, 20);
  g.knightChest.translate(0, 0.52, -0.04);
  g.knightChest.rotateX(0.18);

  g.knightHead = new THREE.BoxGeometry(0.24, 0.32, 0.38);
  g.knightHead.translate(0, 0.88, 0.1);
  g.knightHead.rotateX(-0.15);

  g.knightMuzzle = new THREE.CylinderGeometry(0.12, 0.16, 0.28, 16);
  g.knightMuzzle.rotateX(Math.PI / 2.8);
  g.knightMuzzle.translate(0, 0.8, 0.28);

  g.knightMane = new THREE.BoxGeometry(0.08, 0.52, 0.15);
  g.knightMane.translate(0, 0.7, -0.16);

  g.knightEar = new THREE.ConeGeometry(0.06, 0.16, 8);
  g.knightEar.rotateX(-0.2);

  // Bishop components
  g.bishopCollarLower = new THREE.CylinderGeometry(0.26, 0.34, 0.14, 24);
  g.bishopCollarLower.translate(0, 0.22, 0);

  g.bishopStem = new THREE.CylinderGeometry(0.18, 0.26, 0.65, 24);
  g.bishopStem.translate(0, 0.58, 0);

  g.bishopWaistRing = new THREE.TorusGeometry(0.21, 0.04, 12, 24);
  g.bishopWaistRing.rotateX(Math.PI / 2);
  g.bishopWaistRing.translate(0, 0.92, 0);

  g.bishopMitre = new THREE.SphereGeometry(0.24, 24, 24);
  g.bishopMitre.scale(1, 1.45, 1);
  g.bishopMitre.translate(0, 1.25, 0);

  g.bishopSlit = new THREE.BoxGeometry(0.04, 0.24, 0.3);
  g.bishopSlit.rotateY(Math.PI / 4);
  g.bishopSlit.translate(0, 1.34, 0);

  g.bishopFinial = new THREE.SphereGeometry(0.07, 16, 16);
  g.bishopFinial.translate(0, 1.62, 0);

  // Queen components
  g.queenStem = new THREE.CylinderGeometry(0.22, 0.34, 0.8, 24);
  g.queenStem.translate(0, 0.64, 0);

  g.queenWaistTorus = new THREE.TorusGeometry(0.26, 0.045, 12, 24);
  g.queenWaistTorus.rotateX(Math.PI / 2);
  g.queenWaistTorus.translate(0, 1.05, 0);

  g.queenCoronet = new THREE.CylinderGeometry(0.38, 0.24, 0.38, 24, 1, true);
  g.queenCoronet.translate(0, 1.28, 0);

  g.queenDome = new THREE.SphereGeometry(0.22, 20, 16);
  g.queenDome.translate(0, 1.26, 0);

  g.queenCrownPearl = new THREE.SphereGeometry(0.045, 12, 12);
  g.queenTopSpire = new THREE.CylinderGeometry(0.04, 0.08, 0.16, 12);
  g.queenTopSpire.translate(0, 1.54, 0);
  g.queenTopPearl = new THREE.SphereGeometry(0.08, 16, 16);
  g.queenTopPearl.translate(0, 1.66, 0);

  // King components
  g.kingStem = new THREE.CylinderGeometry(0.24, 0.36, 0.92, 24);
  g.kingStem.translate(0, 0.72, 0);

  g.kingCollarRing = new THREE.TorusGeometry(0.28, 0.05, 12, 24);
  g.kingCollarRing.rotateX(Math.PI / 2);
  g.kingCollarRing.translate(0, 1.2, 0);

  g.kingDome = new THREE.CylinderGeometry(0.36, 0.28, 0.28, 24);
  g.kingDome.translate(0, 1.36, 0);

  g.kingCrossVertical = new THREE.BoxGeometry(0.08, 0.32, 0.08);
  g.kingCrossVertical.translate(0, 1.68, 0);

  g.kingCrossHorizontal = new THREE.BoxGeometry(0.24, 0.08, 0.08);
  g.kingCrossHorizontal.translate(0, 1.72, 0);

  return g;
}

export function createCompositePieceMesh(
  type: PieceSymbol,
  mainMaterial: THREE.Material,
  accentMaterial: THREE.Material,
  feltMaterial: THREE.Material
): THREE.Group {
  if (!cachedGeometries) {
    cachedGeometries = initGeometries();
  }
  const g = cachedGeometries;
  const group = new THREE.Group();

  // Bottom felt pad for every piece
  const feltMesh = new THREE.Mesh(g.feltPad, feltMaterial);
  group.add(feltMesh);

  switch (type) {
    case 'p': {
      // Pawn: 4 parts
      const base = new THREE.Mesh(g.basePawn, mainMaterial);
      const stem = new THREE.Mesh(g.pawnStem, mainMaterial);
      const ring = new THREE.Mesh(g.pawnRing, accentMaterial);
      const head = new THREE.Mesh(g.pawnHead, mainMaterial);

      base.castShadow = true; base.receiveShadow = true;
      stem.castShadow = true; stem.receiveShadow = true;
      ring.castShadow = true;
      head.castShadow = true; head.receiveShadow = true;

      group.add(base, stem, ring, head);
      break;
    }

    case 'r': {
      // Rook: 6 parts
      const base = new THREE.Mesh(g.baseMajor, mainMaterial);
      const stem = new THREE.Mesh(g.rookStem, mainMaterial);
      const shelf = new THREE.Mesh(g.rookShelf, accentMaterial);
      const parapet = new THREE.Mesh(g.rookParapetOuter, mainMaterial);
      const innerFloor = new THREE.Mesh(g.rookInnerFloor, accentMaterial);

      base.castShadow = true; base.receiveShadow = true;
      stem.castShadow = true; stem.receiveShadow = true;
      shelf.castShadow = true;
      parapet.castShadow = true; parapet.receiveShadow = true;
      innerFloor.castShadow = true;

      group.add(base, stem, shelf, parapet, innerFloor);

      // 4 crenels along parapet
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const crenel = new THREE.Mesh(g.rookCrenel, accentMaterial);
        crenel.position.set(Math.sin(angle) * 0.32, 1.08, Math.cos(angle) * 0.32);
        crenel.rotation.y = angle;
        crenel.castShadow = true;
        group.add(crenel);
      }
      break;
    }

    case 'n': {
      // Knight: 7 parts
      const base = new THREE.Mesh(g.baseMajor, mainMaterial);
      const collar = new THREE.Mesh(g.knightBaseCollar, accentMaterial);
      const chest = new THREE.Mesh(g.knightChest, mainMaterial);
      const head = new THREE.Mesh(g.knightHead, mainMaterial);
      const muzzle = new THREE.Mesh(g.knightMuzzle, mainMaterial);
      const mane = new THREE.Mesh(g.knightMane, accentMaterial);

      const earL = new THREE.Mesh(g.knightEar, accentMaterial);
      earL.position.set(-0.08, 1.08, 0.04);
      earL.rotation.z = 0.2;

      const earR = new THREE.Mesh(g.knightEar, accentMaterial);
      earR.position.set(0.08, 1.08, 0.04);
      earR.rotation.z = -0.2;

      base.castShadow = true; base.receiveShadow = true;
      collar.castShadow = true;
      chest.castShadow = true; chest.receiveShadow = true;
      head.castShadow = true; head.receiveShadow = true;
      muzzle.castShadow = true;
      mane.castShadow = true;
      earL.castShadow = true;
      earR.castShadow = true;

      group.add(base, collar, chest, head, muzzle, mane, earL, earR);
      break;
    }

    case 'b': {
      // Bishop: 6 parts
      const base = new THREE.Mesh(g.baseMajor, mainMaterial);
      const collar = new THREE.Mesh(g.bishopCollarLower, accentMaterial);
      const stem = new THREE.Mesh(g.bishopStem, mainMaterial);
      const waistRing = new THREE.Mesh(g.bishopWaistRing, accentMaterial);
      const mitre = new THREE.Mesh(g.bishopMitre, mainMaterial);
      const slit = new THREE.Mesh(g.bishopSlit, accentMaterial);
      const finial = new THREE.Mesh(g.bishopFinial, accentMaterial);

      base.castShadow = true; base.receiveShadow = true;
      collar.castShadow = true;
      stem.castShadow = true; stem.receiveShadow = true;
      waistRing.castShadow = true;
      mitre.castShadow = true; mitre.receiveShadow = true;
      slit.castShadow = true;
      finial.castShadow = true;

      group.add(base, collar, stem, waistRing, mitre, slit, finial);
      break;
    }

    case 'q': {
      // Queen: 8 parts
      const base = new THREE.Mesh(g.baseRoyal, mainMaterial);
      const stem = new THREE.Mesh(g.queenStem, mainMaterial);
      const torus = new THREE.Mesh(g.queenWaistTorus, accentMaterial);
      const dome = new THREE.Mesh(g.queenDome, mainMaterial);
      const coronet = new THREE.Mesh(g.queenCoronet, accentMaterial);
      const spire = new THREE.Mesh(g.queenTopSpire, accentMaterial);
      const pearl = new THREE.Mesh(g.queenTopPearl, accentMaterial);

      base.castShadow = true; base.receiveShadow = true;
      stem.castShadow = true; stem.receiveShadow = true;
      torus.castShadow = true;
      dome.castShadow = true; dome.receiveShadow = true;
      coronet.castShadow = true;
      spire.castShadow = true;
      pearl.castShadow = true;

      group.add(base, stem, torus, dome, coronet, spire, pearl);

      // 8 coronet edge pearls
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const crownBall = new THREE.Mesh(g.queenCrownPearl, accentMaterial);
        crownBall.position.set(Math.sin(angle) * 0.38, 1.48, Math.cos(angle) * 0.38);
        crownBall.castShadow = true;
        group.add(crownBall);
      }
      break;
    }

    case 'k': {
      // King: 8 parts
      const base = new THREE.Mesh(g.baseRoyal, mainMaterial);
      const stem = new THREE.Mesh(g.kingStem, mainMaterial);
      const collar = new THREE.Mesh(g.kingCollarRing, accentMaterial);
      const dome = new THREE.Mesh(g.kingDome, mainMaterial);
      const crossV = new THREE.Mesh(g.kingCrossVertical, accentMaterial);
      const crossH = new THREE.Mesh(g.kingCrossHorizontal, accentMaterial);

      base.castShadow = true; base.receiveShadow = true;
      stem.castShadow = true; stem.receiveShadow = true;
      collar.castShadow = true;
      dome.castShadow = true; dome.receiveShadow = true;
      crossV.castShadow = true;
      crossH.castShadow = true;

      group.add(base, stem, collar, dome, crossV, crossH);
      break;
    }
  }

  // Optimize raycasting and bounding calculations
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData.parentPiece = group;
    }
  });

  return group;
}
