import * as THREE from 'three';

/**
 * Procedural texture generation for zero-404 realistic wood, marble, board coordinates, and contact shadows.
 */

export function createWoodTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base background
  const baseColor = isDark ? '#3d2415' : '#cbb08a';
  const grainColor1 = isDark ? '#2b180d' : '#ba9d73';
  const grainColor2 = isDark ? '#53321d' : '#decaa4';

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Organic rings / wavy wood grain lines
  ctx.lineWidth = 1.5;
  for (let y = 0; y < 512; y += 3) {
    const distort1 = Math.sin(y * 0.05) * 12 + Math.cos(y * 0.02) * 6;
    ctx.strokeStyle = (y % 6 === 0 ? grainColor1 : grainColor2);
    ctx.globalAlpha = 0.35 + Math.sin(y * 0.1) * 0.15;
    ctx.beginPath();
    ctx.moveTo(0, y + distort1);
    for (let x = 0; x <= 512; x += 16) {
      const wobble = Math.sin(x * 0.03 + y * 0.08) * 4;
      ctx.lineTo(x, y + distort1 + wobble);
    }
    ctx.stroke();
  }

  // Fine microscopic wood fibers
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillRect(rx, ry, Math.random() * 4 + 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMarbleTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColor = isDark ? '#141416' : '#f0f3f6';
  const veinColor = isDark ? '#32363e' : '#b0b8c2';
  const accentColor = isDark ? '#5a6270' : '#8c96a4';

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Marble veining passes
  for (let v = 0; v < 8; v++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);

    ctx.strokeStyle = v % 2 === 0 ? veinColor : accentColor;
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.globalAlpha = 0.25;

    for (let step = 0; step < 20; step++) {
      x += (Math.random() - 0.5) * 60 + 20;
      y += (Math.random() - 0.5) * 60 + 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Soft cloudy smoke overlay
  const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  grad.addColorStop(0, isDark ? 'rgba(30,30,35,0.2)' : 'rgba(235,240,245,0.3)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBoardBorderTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isDark ? '#1a0e08' : '#2c180e';
  ctx.fillRect(0, 0, 512, 512);

  // Deep beveled polished wood grain
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#3d2012';
  for (let i = 0; i < 512; i += 4) {
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i + (Math.sin(i * 0.05) * 4));
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
