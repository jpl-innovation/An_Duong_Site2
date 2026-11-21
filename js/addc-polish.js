// ADDC 3D polish: clear glass that lets the sun into the rooms, and one smooth transition for every discrete change.
import { MeshStandardMaterial, DoubleSide } from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- glass ----------
// The models carry physically based transmission glass. In the browser that costs a second full render of the scene
// behind it and washes the rooms milky on the site's transparent canvas, and as a solid caster it shades the interiors.
// Clear glass here is a thin reflective sheet: the rooms read through it, the sun reaches them.
const clear = new WeakMap();
function clearGlass(material) {
  if (!material || material.name !== 'Glass') return material;
  if (!clear.has(material)) {
    clear.set(material, new MeshStandardMaterial({
      name: 'Glass', color: 0xe8f0ed, metalness: 0, roughness: .05, transparent: true, opacity: .13,
      depthWrite: false, envMapIntensity: 1.6, side: DoubleSide,
    }));
  }
  return clear.get(material);
}
const noShadow = /^(Glass|Curtain|LampShadeLit|Downlight)$/;

export function prepareModel(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(clearGlass) : clearGlass(o.material);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some(m => m && noShadow.test(m.name))) {
      // Every viewer turns casting on for the whole model after loading; glass and sheers stay out of the shadow map.
      Object.defineProperty(o, 'castShadow', { get: () => false, set: () => {}, configurable: true });
    }
  });
  return root;
}

// ---------- transitions ----------
// A change of model, material, colour, light or view used to land in one frame. fade(change) keeps the frame you were
// looking at on top, applies the change underneath, and dissolves to it. It is interruptible: a second change mid-fade
// starts from what is on screen at that moment, so rapid clicks never jump.
const DURATION = 360;
const easeOut = t => 1 - Math.pow(1 - t, 3);

export function installFade(stage, renderer, scene, camera) {
  if (reduced) return change => change();
  const veil = document.createElement('canvas');
  veil.className = 'stage-veil';
  veil.setAttribute('aria-hidden', 'true');
  const scratch = document.createElement('canvas');
  const vctx = veil.getContext('2d'), sctx = scratch.getContext('2d');
  renderer.domElement.after(veil);
  let start = 0, alpha = 0, raf = 0;

  const step = now => {
    const t = Math.min(1, (now - start) / DURATION);
    alpha = 1 - easeOut(t);
    veil.style.opacity = alpha.toFixed(3);
    if (t < 1) raf = requestAnimationFrame(step);
    else { raf = 0; alpha = 0; veil.style.visibility = 'hidden'; }
  };

  return function fade(change) {
    const src = renderer.domElement, w = src.width, h = src.height;
    if (!w || !h || !stage.isConnected) return change();
    try {
      renderer.render(scene, camera);                       // the drawing buffer holds this frame until the task ends
      scratch.width = w; scratch.height = h;
      sctx.drawImage(src, 0, 0);
      if (alpha > 0) { sctx.globalAlpha = alpha; sctx.drawImage(veil, 0, 0); sctx.globalAlpha = 1; }
      veil.width = w; veil.height = h;
      vctx.drawImage(scratch, 0, 0);
    } catch (e) {
      return change();
    }
    for (const [k, v] of [['left', src.offsetLeft], ['top', src.offsetTop], ['width', src.offsetWidth], ['height', src.offsetHeight]]) veil.style.setProperty(k, v + 'px', 'important');
    alpha = 1; veil.style.opacity = '1'; veil.style.visibility = 'visible';
    change();
    start = performance.now();
    if (!raf) raf = requestAnimationFrame(step);
  };
}
