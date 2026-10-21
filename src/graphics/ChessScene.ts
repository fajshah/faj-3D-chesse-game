import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Square, PieceSymbol, Color } from 'chess.js';
import type { BoardThemeId, CameraPreset } from '../types/chess';
import { buildThemeMaterials, ThemeMaterials } from './materials';
import { createCompositePieceMesh } from './pieceGeometries';

export interface PieceObjectData {
  square: Square;
  type: PieceSymbol;
  color: Color;
  group: THREE.Group;
}

export interface MoveAnimation {
  pieceGroup: THREE.Group;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
  onComplete?: () => void;
}

export class ChessScene {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private animationFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // Materials & theme
  private currentTheme: BoardThemeId;
  private materials: ThemeMaterials;

  // Board & square meshes
  private boardGroup: THREE.Group = new THREE.Group();
  private squareMeshes: Map<Square, THREE.Mesh> = new Map();
  private piecesGroup: THREE.Group = new THREE.Group();
  private piecesMap: Map<Square, PieceObjectData> = new Map();
  private capturedMeshesGroup: THREE.Group = new THREE.Group();
  private activeAnimation: MoveAnimation | null = null;

  // Visual indicators
  private hoverMesh!: THREE.Mesh;
  private selectedRingMesh!: THREE.Mesh;
  private lastMoveFromMesh!: THREE.Mesh;
  private lastMoveToMesh!: THREE.Mesh;
  private checkAuraMesh!: THREE.Mesh;
  private landingRippleMesh!: THREE.Mesh;
  private rippleStartTime: number = 0;
  private validMoveMarkers: THREE.Mesh[] = [];

  // Interaction & raycasting
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2(-1000, -1000);
  private hoveredSquare: Square | null = null;
  private selectedSquare: Square | null = null;
  private checkSquare: Square | null = null;

  // Camera animation target
  private cameraTargetPos: THREE.Vector3 | null = null;
  private cameraTargetLookAt: THREE.Vector3 | null = null;
  private isCinematicRotating: boolean = false;

  // Callbacks
  public onSquareClicked?: (square: Square) => void;

  constructor(container: HTMLDivElement, theme: BoardThemeId = 'wood') {
    this.container = container;
    this.currentTheme = theme;

    // Software WebGL check
    this.isSoftwareGl = (() => {
      if (typeof document === 'undefined') return true;
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c13);
    this.scene.fog = new THREE.FogExp2(0x0a0c13, 0.022);

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.setDefaultCameraPosition(aspect);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. RoomEnvironment for realistic PBR metal & glass reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera from dipping below the floor
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 24;
    this.controls.target.set(0, 0.28, 0);

    // 6. Materials
    this.materials = buildThemeMaterials(this.currentTheme);

    // 7. Lighting Rig (Key, Fill, Rim)
    this.setupLighting();

    // 8. Board & Indicators
    this.setupMezzanineBoard();
    this.setupIndicators();

    // 9. Input & Resizing listeners
    this.bindEvents();

    // 10. Start render loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private setDefaultCameraPosition(aspect: number) {
    const isMobilePortrait = aspect < 1;
    const distY = isMobilePortrait ? 10.8 : 8.4;
    const distZ = isMobilePortrait ? 10.2 : 7.8;
    this.camera.position.set(0, distY, distZ);
  }

  private setupLighting() {
    // Warm Directional Key Light (casts soft shadows)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.4);
    keyLight.position.set(6.5, 15, 8.5);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 32;
      const d = 7.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Cool Rim / Backlight
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.25);
    rimLight.position.set(-8.5, 11, -8.5);
    this.scene.add(rimLight);

    // Under-board Mezzanine Point Light for soft ground bounce
    const underGlowLight = new THREE.PointLight(0xf59e0b, 1.2, 10, 1.5);
    underGlowLight.position.set(0, 0.15, 0);
    this.scene.add(underGlowLight);

    // Hemisphere Light (sky/floor ambient)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1a120c, 0.95);
    this.scene.add(hemiLight);
  }

  /**
   * Sets up the grand multi-tiered Mezzanine architectural chess board
   */
  private setupMezzanineBoard() {
    this.scene.add(this.boardGroup);
    this.scene.add(this.capturedMeshesGroup);
    this.scene.add(this.piecesGroup);

    // Large ambient table / pedestal
    const tableGeo = new THREE.CylinderGeometry(9.6, 10.5, 0.9, 56);
    const tableMesh = new THREE.Mesh(tableGeo, this.materials.table);
    tableMesh.position.set(0, -0.45, 0);
    tableMesh.receiveShadow = true;
    this.boardGroup.add(tableMesh);

    // Contact shadow underneath mezzanine board
    const shadowGeo = new THREE.PlaneGeometry(12.5, 12.5);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.materials.contactShadow);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.005, 0);
    this.boardGroup.add(shadowMesh);

    // --- MEZZANINE TIER 0: Foundation Podium Plinth ---
    const podiumGeo = new THREE.BoxGeometry(11.8, 0.22, 10.2);
    const podiumMesh = new THREE.Mesh(podiumGeo, this.materials.mezzanineBase);
    podiumMesh.position.set(0, 0.06, 0);
    podiumMesh.receiveShadow = true;
    podiumMesh.castShadow = true;
    this.boardGroup.add(podiumMesh);

    // --- MEZZANINE TIER 1: Recessed Under-Glow Channel ---
    const underglowGeo = new THREE.BoxGeometry(9.6, 0.08, 9.6);
    const underglowMesh = new THREE.Mesh(underglowGeo, this.materials.mezzanineUnderglow);
    underglowMesh.position.set(0, 0.14, 0);
    this.boardGroup.add(underglowMesh);

    // --- MEZZANINE TIER 2: Floating Upper Mezzanine Deck ---
    const upperDeckGeo = new THREE.BoxGeometry(9.2, 0.16, 9.2);
    const upperDeckMesh = new THREE.Mesh(upperDeckGeo, this.materials.frame);
    upperDeckMesh.position.set(0, 0.21, 0);
    upperDeckMesh.receiveShadow = true;
    upperDeckMesh.castShadow = true;
    this.boardGroup.add(upperDeckMesh);

    // --- MEZZANINE TIER 3: Golden Brass Grid Inlay Bed ---
    // A metallic polished sheet peeking through the gaps between squares
    const inlayBedGeo = new THREE.PlaneGeometry(8.06, 8.06);
    const inlayBedMesh = new THREE.Mesh(inlayBedGeo, this.materials.mezzanineInlay);
    inlayBedMesh.rotation.x = -Math.PI / 2;
    inlayBedMesh.position.set(0, 0.288, 0);
    inlayBedMesh.receiveShadow = true;
    this.boardGroup.add(inlayBedMesh);

    // --- MEZZANINE CORNER BRACKETS: 4 Sculpted Metallic Corner Columns ---
    const cornerPositions = [
      { x: -4.55, z: -4.55 },
      { x: 4.55, z: -4.55 },
      { x: -4.55, z: 4.55 },
      { x: 4.55, z: 4.55 },
    ];

    cornerPositions.forEach((pos) => {
      const colGroup = new THREE.Group();
      // Tiered corner pillar
      const colBaseGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.26, 16);
      const colBaseMesh = new THREE.Mesh(colBaseGeo, this.materials.mezzanineCorner);
      colBaseMesh.position.set(0, 0.13, 0);
      colBaseMesh.castShadow = true;

      const colCapGeo = new THREE.SphereGeometry(0.16, 16, 14);
      colCapGeo.scale(1, 0.7, 1);
      const colCapMesh = new THREE.Mesh(colCapGeo, this.materials.mezzanineCorner);
      colCapMesh.position.set(0, 0.29, 0);
      colCapMesh.castShadow = true;

      colGroup.add(colBaseMesh, colCapMesh);
      colGroup.position.set(pos.x, 0, pos.z);
      this.boardGroup.add(colGroup);
    });

    // --- SIDE MEZZANINE BALCONIES: Sunken Captured Piece Trays ---
    // West Balcony (X = -5.15) & East Balcony (X = +5.15)
    [-5.15, 5.15].forEach((balconyX) => {
      const trayBorderGeo = new THREE.BoxGeometry(1.05, 0.12, 7.8);
      const trayBorderMesh = new THREE.Mesh(trayBorderGeo, this.materials.frame);
      trayBorderMesh.position.set(balconyX, 0.16, 0);
      trayBorderMesh.receiveShadow = true;

      const trayVelvetGeo = new THREE.BoxGeometry(0.85, 0.04, 7.5);
      const trayVelvetMesh = new THREE.Mesh(trayVelvetGeo, this.materials.mezzanineTray);
      trayVelvetMesh.position.set(balconyX, 0.19, 0);
      trayVelvetMesh.receiveShadow = true;

      this.boardGroup.add(trayBorderMesh, trayVelvetMesh);
    });

    // 64 Individual Beveled Board Squares (0.97 x 0.97 each, with 0.03 brass gap)
    const squareGeo = new THREE.BoxGeometry(0.97, 0.08, 0.97);
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const square = `${files[f]}${r + 1}` as Square;
        const isLight = (r + f) % 2 !== 0;
        const squareMat = isLight ? this.materials.lightSquare : this.materials.darkSquare;

        const squareMesh = new THREE.Mesh(squareGeo, squareMat);
        const posX = f - 3.5;
        const posZ = 3.5 - r;
        squareMesh.position.set(posX, 0.29, posZ);
        squareMesh.receiveShadow = true;
        squareMesh.userData = { square };

        this.squareMeshes.set(square, squareMesh);
        this.boardGroup.add(squareMesh);
      }
    }

    // Add Coordinate Labels along edges (A-H and 1-8)
    this.createCoordinateLabels();
  }

  private createCoordinateLabels() {
    const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const createTextCanvas = (text: string) => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#eab308'; // Polished gold engraved
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 34);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const labelGeo = new THREE.PlaneGeometry(0.48, 0.48);

    // File labels on south and north borders
    files.forEach((f, idx) => {
      const tex = createTextCanvas(f);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });

      // South edge (white perspective)
      const meshS = new THREE.Mesh(labelGeo, mat);
      meshS.rotation.x = -Math.PI / 2;
      meshS.position.set(idx - 3.5, 0.31, 4.3);
      this.boardGroup.add(meshS);

      // North edge (black perspective)
      const meshN = new THREE.Mesh(labelGeo, mat);
      meshN.rotation.x = -Math.PI / 2;
      meshN.rotation.z = Math.PI;
      meshN.position.set(idx - 3.5, 0.31, -4.3);
      this.boardGroup.add(meshN);
    });

    // Rank labels on west and east borders
    ranks.forEach((r, idx) => {
      const tex = createTextCanvas(r);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });

      // West edge
      const meshW = new THREE.Mesh(labelGeo, mat);
      meshW.rotation.x = -Math.PI / 2;
      meshW.rotation.z = Math.PI / 2;
      meshW.position.set(-4.3, 0.31, 3.5 - idx);
      this.boardGroup.add(meshW);

      // East edge
      const meshE = new THREE.Mesh(labelGeo, mat);
      meshE.rotation.x = -Math.PI / 2;
      meshE.rotation.z = -Math.PI / 2;
      meshE.position.set(4.3, 0.31, 3.5 - idx);
      this.boardGroup.add(meshE);
    });
  }

  private setupIndicators() {
    // Hover square indicator
    const hoverGeo = new THREE.PlaneGeometry(0.96, 0.96);
    this.hoverMesh = new THREE.Mesh(hoverGeo, this.materials.hoverHighlight);
    this.hoverMesh.rotation.x = -Math.PI / 2;
    this.hoverMesh.position.set(0, 0.335, 0);
    this.hoverMesh.visible = false;
    this.scene.add(this.hoverMesh);

    // Selected piece ring
    const ringGeo = new THREE.RingGeometry(0.38, 0.48, 32);
    this.selectedRingMesh = new THREE.Mesh(ringGeo, this.materials.selectedRing);
    this.selectedRingMesh.rotation.x = -Math.PI / 2;
    this.selectedRingMesh.position.set(0, 0.34, 0);
    this.selectedRingMesh.visible = false;
    this.scene.add(this.selectedRingMesh);

    // Last move from/to indicator planes
    const lastMoveGeo = new THREE.PlaneGeometry(0.94, 0.94);
    this.lastMoveFromMesh = new THREE.Mesh(lastMoveGeo, this.materials.lastMoveHighlight);
    this.lastMoveFromMesh.rotation.x = -Math.PI / 2;
    this.lastMoveFromMesh.position.set(0, 0.332, 0);
    this.lastMoveFromMesh.visible = false;
    this.scene.add(this.lastMoveFromMesh);

    this.lastMoveToMesh = new THREE.Mesh(lastMoveGeo, this.materials.lastMoveHighlight);
    this.lastMoveToMesh.rotation.x = -Math.PI / 2;
    this.lastMoveToMesh.position.set(0, 0.332, 0);
    this.lastMoveToMesh.visible = false;
    this.scene.add(this.lastMoveToMesh);

    // King Check warning aura
    const checkGeo = new THREE.RingGeometry(0.2, 0.52, 32);
    this.checkAuraMesh = new THREE.Mesh(checkGeo, this.materials.checkAura);
    this.checkAuraMesh.rotation.x = -Math.PI / 2;
    this.checkAuraMesh.position.set(0, 0.342, 0);
    this.checkAuraMesh.visible = false;
    this.scene.add(this.checkAuraMesh);

    // Mezzanine Landing Shockwave / Ripple ring
    const rippleGeo = new THREE.RingGeometry(0.1, 0.18, 32);
    this.landingRippleMesh = new THREE.Mesh(rippleGeo, this.materials.mezzanineRipple);
    this.landingRippleMesh.rotation.x = -Math.PI / 2;
    this.landingRippleMesh.position.set(0, 0.336, 0);
    this.landingRippleMesh.visible = false;
    this.scene.add(this.landingRippleMesh);
  }

  public squareToWorldPos(square: Square): THREE.Vector3 {
    const f = square.charCodeAt(0) - 97;
    const r = parseInt(square[1], 10) - 1;
    return new THREE.Vector3(f - 3.5, 0.33, 3.5 - r);
  }

  /**
   * Synchronize all 3D pieces with the current chess board matrix
   */
  public syncPieces(board: ({ square: Square; type: PieceSymbol; color: Color } | null)[][]) {
    // Collect target squares and pieces from the authoritative chess.js board
    const newBoardMap = new Map<Square, { type: PieceSymbol; color: Color }>();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const item = board[r][f];
        if (item) {
          newBoardMap.set(item.square, { type: item.type, color: item.color });
        }
      }
    }

    // 1. Remove pieces that are no longer on the board or changed
    const currentSquares = Array.from(this.piecesMap.keys());
    for (const sq of currentSquares) {
      const currentPiece = this.piecesMap.get(sq)!;
      const targetPiece = newBoardMap.get(sq);

      if (!targetPiece || targetPiece.type !== currentPiece.type || targetPiece.color !== currentPiece.color) {
        this.piecesGroup.remove(currentPiece.group);
        this.scene.remove(currentPiece.group);
        this.piecesMap.delete(sq);
      }
    }

    // 2. Extra safety sweep: purge any orphan mesh from piecesGroup
    const activeGroupSet = new Set(Array.from(this.piecesMap.values()).map((p) => p.group));
    const orphans: THREE.Object3D[] = [];
    this.piecesGroup.children.forEach((child) => {
      if (!activeGroupSet.has(child as THREE.Group)) {
        orphans.push(child);
      }
    });
    orphans.forEach((child) => {
      this.piecesGroup.remove(child);
      this.scene.remove(child);
    });

    // 3. Create newly appeared pieces (e.g. initial setup or pawn promotion)
    for (const [sq, pieceInfo] of newBoardMap.entries()) {
      if (!this.piecesMap.has(sq)) {
        const mainMat = pieceInfo.color === 'w' ? this.materials.whiteMain : this.materials.blackMain;
        const accentMat = pieceInfo.color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
        const group = createCompositePieceMesh(pieceInfo.type, mainMat, accentMat, this.materials.felt);

        const worldPos = this.squareToWorldPos(sq);
        group.position.copy(worldPos);

        // Black pieces face forward toward White (+Z), White pieces face forward toward Black (-Z)
        if (pieceInfo.color === 'w') {
          group.rotation.y = 0;
        } else {
          group.rotation.y = Math.PI;
        }

        this.piecesGroup.add(group);
        this.piecesMap.set(sq, {
          square: sq,
          type: pieceInfo.type,
          color: pieceInfo.color,
          group,
        });
      }
    }
  }

  /**
   * Smoothly animates a piece moving from square to target square with landing ripple
   * and immediately removes any captured piece from the board
   */
  public animateMove(
    from: Square,
    to: Square,
    onComplete?: () => void
  ) {
    const pieceData = this.piecesMap.get(from);
    if (!pieceData) {
      onComplete?.();
      return;
    }

    // 1. Immediately remove any defeated / captured enemy piece on target square 'to'
    const capturedTarget = this.piecesMap.get(to);
    if (capturedTarget && capturedTarget !== pieceData) {
      this.piecesGroup.remove(capturedTarget.group);
      this.scene.remove(capturedTarget.group);
      this.piecesMap.delete(to);
    }

    // 2. Check En Passant capture (pawn moving diagonally to an empty square)
    if (pieceData.type === 'p' && from[0] !== to[0] && !capturedTarget) {
      const epSquare = `${to[0]}${from[1]}` as Square;
      const epPiece = this.piecesMap.get(epSquare);
      if (epPiece) {
        this.piecesGroup.remove(epPiece.group);
        this.scene.remove(epPiece.group);
        this.piecesMap.delete(epSquare);
      }
    }

    const startPos = this.squareToWorldPos(from);
    const targetPos = this.squareToWorldPos(to);

    this.activeAnimation = {
      pieceGroup: pieceData.group,
      startPos,
      targetPos,
      startTime: performance.now(),
      duration: 280, // Snappy yet smooth 280ms arc
      onComplete: () => {
        pieceData.square = to;
        this.piecesMap.delete(from);
        this.piecesMap.set(to, pieceData);
        pieceData.group.position.copy(targetPos);

        // Trigger mezzanine landing shockwave ripple
        this.triggerLandingRipple(targetPos);

        onComplete?.();
      },
    };
  }

  private triggerLandingRipple(targetPos: THREE.Vector3) {
    this.landingRippleMesh.position.set(targetPos.x, 0.336, targetPos.z);
    this.landingRippleMesh.scale.set(1, 1, 1);
    this.materials.mezzanineRipple.opacity = 0.85;
    this.landingRippleMesh.visible = true;
    this.rippleStartTime = performance.now();
  }

  /**
   * Synchronizes defeated pieces in the side Mezzanine graveyard trays (fallen / laid flat)
   */
  public syncCapturedBalcony(captured: { w: PieceSymbol[]; b: PieceSymbol[] }) {
    // Clear previous captured 3D pieces
    while (this.capturedMeshesGroup.children.length > 0) {
      this.capturedMeshesGroup.remove(this.capturedMeshesGroup.children[0]);
    }

    // Black pieces defeated by White placed on East Balcony (X = +5.15)
    captured.b.forEach((type, idx) => {
      if (idx >= 16) return;
      const group = createCompositePieceMesh(
        type,
        this.materials.blackMain,
        this.materials.blackAccent,
        this.materials.felt
      );
      // Scaled down and laid flat horizontally so they are clearly defeated/inactive
      group.scale.set(0.52, 0.52, 0.52);
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const posX = 5.15 + (col === 0 ? -0.2 : 0.2);
      const posZ = -3.2 + row * 0.85;
      group.position.set(posX, 0.22, posZ);
      group.rotation.x = Math.PI / 2;
      group.rotation.y = -Math.PI / 2;
      this.capturedMeshesGroup.add(group);
    });

    // White pieces defeated by Black placed on West Balcony (X = -5.15)
    captured.w.forEach((type, idx) => {
      if (idx >= 16) return;
      const group = createCompositePieceMesh(
        type,
        this.materials.whiteMain,
        this.materials.whiteAccent,
        this.materials.felt
      );
      // Scaled down and laid flat horizontally so they are clearly defeated/inactive
      group.scale.set(0.52, 0.52, 0.52);
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const posX = -5.15 + (col === 0 ? 0.2 : -0.2);
      const posZ = -3.2 + row * 0.85;
      group.position.set(posX, 0.22, posZ);
      group.rotation.x = Math.PI / 2;
      group.rotation.y = Math.PI / 2;
      this.capturedMeshesGroup.add(group);
    });
  }

  public setHoverSquare(square: Square | null) {
    this.hoveredSquare = square;
    if (square) {
      const pos = this.squareToWorldPos(square);
      this.hoverMesh.position.set(pos.x, 0.335, pos.z);
      this.hoverMesh.visible = true;
    } else {
      this.hoverMesh.visible = false;
    }
  }

  public setSelectedSquare(square: Square | null) {
    this.selectedSquare = square;
    if (square) {
      const pos = this.squareToWorldPos(square);
      this.selectedRingMesh.position.set(pos.x, 0.34, pos.z);
      this.selectedRingMesh.visible = true;
    } else {
      this.selectedRingMesh.visible = false;
    }
  }

  public setLastMove(from: Square | null, to: Square | null) {
    if (from && to) {
      const posFrom = this.squareToWorldPos(from);
      const posTo = this.squareToWorldPos(to);
      this.lastMoveFromMesh.position.set(posFrom.x, 0.332, posFrom.z);
      this.lastMoveToMesh.position.set(posTo.x, 0.332, posTo.z);
      this.lastMoveFromMesh.visible = true;
      this.lastMoveToMesh.visible = true;
    } else {
      this.lastMoveFromMesh.visible = false;
      this.lastMoveToMesh.visible = false;
    }
  }

  public setCheckSquare(square: Square | null) {
    this.checkSquare = square;
    if (square) {
      const pos = this.squareToWorldPos(square);
      this.checkAuraMesh.position.set(pos.x, 0.342, pos.z);
      this.checkAuraMesh.visible = true;
    } else {
      this.checkAuraMesh.visible = false;
    }
  }

  /**
   * Sets valid target move markers on the board
   */
  public setValidMoves(moves: { to: Square; captured?: PieceSymbol }[]) {
    // Clean old markers
    for (const marker of this.validMoveMarkers) {
      this.scene.remove(marker);
    }
    this.validMoveMarkers = [];

    const dotGeo = new THREE.CircleGeometry(0.18, 24);
    const ringGeo = new THREE.RingGeometry(0.36, 0.46, 28);

    for (const m of moves) {
      const pos = this.squareToWorldPos(m.to);
      let marker: THREE.Mesh;

      if (m.captured) {
        // Attack/capture ring
        marker = new THREE.Mesh(ringGeo, this.materials.validCaptureRing);
      } else {
        // Move circle
        marker = new THREE.Mesh(dotGeo, this.materials.validMoveDot);
      }

      marker.rotation.x = -Math.PI / 2;
      marker.position.set(pos.x, 0.338, pos.z);
      this.scene.add(marker);
      this.validMoveMarkers.push(marker);
    }
  }

  public setCameraPreset(preset: CameraPreset) {
    const isMobilePortrait = this.camera.aspect < 1;
    const yMultiplier = isMobilePortrait ? 1.25 : 1.0;
    const zMultiplier = isMobilePortrait ? 1.25 : 1.0;

    switch (preset) {
      case 'white':
        this.cameraTargetPos = new THREE.Vector3(0, 8.0 * yMultiplier, 7.8 * zMultiplier);
        this.cameraTargetLookAt = new THREE.Vector3(0, 0.28, 0);
        this.isCinematicRotating = false;
        break;
      case 'black':
        this.cameraTargetPos = new THREE.Vector3(0, 8.0 * yMultiplier, -7.8 * zMultiplier);
        this.cameraTargetLookAt = new THREE.Vector3(0, 0.28, 0);
        this.isCinematicRotating = false;
        break;
      case 'topDown':
        this.cameraTargetPos = new THREE.Vector3(0, 11.5 * yMultiplier, 0.001);
        this.cameraTargetLookAt = new THREE.Vector3(0, 0.28, 0);
        this.isCinematicRotating = false;
        break;
      case 'side':
        this.cameraTargetPos = new THREE.Vector3(7.8 * zMultiplier, 7.5 * yMultiplier, 0);
        this.cameraTargetLookAt = new THREE.Vector3(0, 0.28, 0);
        this.isCinematicRotating = false;
        break;
      case 'free':
        this.cameraTargetPos = null;
        this.cameraTargetLookAt = null;
        this.isCinematicRotating = false;
        break;
    }
  }

  public setCinematicRotation(enable: boolean) {
    this.isCinematicRotating = enable;
  }

  public setTheme(theme: BoardThemeId) {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    this.materials = buildThemeMaterials(theme);

    // Rebuild board elements with new theme materials
    while (this.boardGroup.children.length > 0) {
      this.boardGroup.remove(this.boardGroup.children[0]);
    }
    this.squareMeshes.clear();
    this.setupMezzanineBoard();

    // Update pieces
    for (const [, pieceData] of this.piecesMap.entries()) {
      const mainMat = pieceData.color === 'w' ? this.materials.whiteMain : this.materials.blackMain;
      const accentMat = pieceData.color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
      pieceData.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry.type === 'CylinderGeometry' && child.position.y <= 0.02) {
            child.material = this.materials.felt;
          } else if (child.geometry.type.includes('Torus') || child.geometry.type.includes('Cone') || child.geometry.type.includes('Ring')) {
            child.material = accentMat;
          } else {
            child.material = mainMat;
          }
        }
      });
    }
  }

  private bindEvents() {
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isPointerDown = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      pointerDownPos = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      // Check hover when not dragging orbit
      if (!isPointerDown) {
        this.raycastHover();
      }
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      isPointerDown = false;
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

      // Distance threshold: if moved more than 8 pixels, it was an orbit drag, not a click
      const dx = clientX - pointerDownPos.x;
      const dy = clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) < 8) {
        this.raycastClick();
      }
    };

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    dom.addEventListener('mousemove', onPointerMove);
    dom.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    dom.addEventListener('touchmove', onPointerMove, { passive: true });
    dom.addEventListener('touchend', onPointerUp, { passive: true });

    // Handle user camera override
    this.controls.addEventListener('start', () => {
      this.cameraTargetPos = null;
      this.cameraTargetLookAt = null;
    });

    // Resize listener
    window.addEventListener('resize', this.onResize);
  }

  private raycastHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.squareMeshes.values()), false);

    if (intersects.length > 0) {
      const sq = intersects[0].object.userData.square as Square;
      if (sq !== this.hoveredSquare) {
        this.setHoverSquare(sq);
      }
    } else {
      if (this.hoveredSquare !== null) {
        this.setHoverSquare(null);
      }
    }
  }

  private raycastClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check intersecting pieces
    const pieceMeshes: THREE.Object3D[] = [];
    this.piecesMap.forEach((p) => {
      p.group.traverse((c) => {
        if (c instanceof THREE.Mesh) pieceMeshes.push(c);
      });
    });

    const pieceHits = this.raycaster.intersectObjects(pieceMeshes, false);
    if (pieceHits.length > 0) {
      const hitMesh = pieceHits[0].object;
      const pieceGroup = hitMesh.userData.parentPiece as THREE.Group;
      for (const [sq, p] of this.piecesMap.entries()) {
        if (p.group === pieceGroup) {
          this.onSquareClicked?.(sq);
          return;
        }
      }
    }

    // 2. Check intersecting board squares
    const squareHits = this.raycaster.intersectObjects(Array.from(this.squareMeshes.values()), false);
    if (squareHits.length > 0) {
      const sq = squareHits[0].object.userData.square as Square;
      this.onSquareClicked?.(sq);
    }
  }

  public onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    // 1. Cinematic rotation on title screen
    if (this.isCinematicRotating) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 1.1;
    } else {
      this.controls.autoRotate = false;
    }

    // 2. Camera transition interpolation
    if (this.cameraTargetPos) {
      this.camera.position.lerp(this.cameraTargetPos, 0.07);
      if (this.camera.position.distanceTo(this.cameraTargetPos) < 0.05) {
        this.cameraTargetPos = null;
      }
    }
    if (this.cameraTargetLookAt) {
      this.controls.target.lerp(this.cameraTargetLookAt, 0.07);
      if (this.controls.target.distanceTo(this.cameraTargetLookAt) < 0.05) {
        this.cameraTargetLookAt = null;
      }
    }

    // 3. Piece Move Animation (parabolic arc)
    if (this.activeAnimation) {
      const now = performance.now();
      const elapsed = now - this.activeAnimation.startTime;
      const progress = Math.min(elapsed / this.activeAnimation.duration, 1);

      // Smooth ease-out curve
      const t = 1 - Math.pow(1 - progress, 3);

      const curPos = new THREE.Vector3().lerpVectors(
        this.activeAnimation.startPos,
        this.activeAnimation.targetPos,
        t
      );

      // Parabolic jump arc height (sin peak)
      const arcHeight = Math.sin(progress * Math.PI) * 0.78;
      curPos.y = this.activeAnimation.startPos.y + arcHeight;

      this.activeAnimation.pieceGroup.position.copy(curPos);

      // Slight tilt while in flight for game feel
      this.activeAnimation.pieceGroup.rotation.z = Math.sin(progress * Math.PI) * 0.08;

      if (progress >= 1) {
        this.activeAnimation.pieceGroup.position.copy(this.activeAnimation.targetPos);
        this.activeAnimation.pieceGroup.rotation.z = 0;
        const cb = this.activeAnimation.onComplete;
        this.activeAnimation = null;
        cb?.();
      }
    }

    // 4. Mezzanine landing ripple animation
    if (this.landingRippleMesh && this.landingRippleMesh.visible) {
      const elapsed = performance.now() - this.rippleStartTime;
      const duration = 280;
      if (elapsed < duration) {
        const p = elapsed / duration;
        const scale = 1 + p * 2.8;
        this.landingRippleMesh.scale.set(scale, scale, 1);
        this.materials.mezzanineRipple.opacity = (1 - p) * 0.85;
      } else {
        this.landingRippleMesh.visible = false;
      }
    }

    // 5. Subtle king check indicator breathing / pulsating
    if (this.checkSquare && this.checkAuraMesh.visible) {
      const pulse = 0.5 + Math.sin(performance.now() * 0.006) * 0.25;
      this.materials.checkAura.opacity = pulse;
    }

    // 6. Update controls & render
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
