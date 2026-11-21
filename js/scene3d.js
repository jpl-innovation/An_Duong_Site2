import { createModelLoader, preloadModels, downloaded } from './addc-loader.js?v=20261121f';
import { prepareModel, installFade } from './addc-polish.js?v=20261121f';
import { installStageOrbit } from './addc-orbit.js?v=20261121f';
import { assembleHouse, createPhasePlayer, mountedModel } from './addc-motion.js?v=20261121f';
/* ADDC 3D: procedural models, built from code so the site works today.
   When realistic GLB files are ready (see 3D-PROMPTS.md), put them in models/ and fill in MODELS below.
   An empty string keeps the procedural model. One WebGL renderer per page, paused while off-screen. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const MODELS = {
  "be-tong": "models/be-tong.glb",
  "thep": "models/thep.glb",
  "gach": "models/gach.glb",
  "da": "models/da.glb",
  "go": "models/go.glb",
  "gach-op": "models/gach-op.glb",
  "kinh": "models/kinh.glb",
  "terrazzo": "models/terrazzo.glb",
  "house": "models/house.glb",
  "room": "models/room.glb",
  "sofa": "models/noi-that-sofa.glb",
  "ban-tra": "models/noi-that-ban-tra.glb",
  "ban-an": "models/noi-that-ban-an.glb",
  "ghe-an": "models/noi-that-ghe-an.glb",
  "tu-bep": "models/noi-that-tu-bep.glb",
  "giuong": "models/noi-that-giuong.glb",
  "tu-ao": "models/noi-that-tu-ao.glb",
  "ban-lam-viec": "models/noi-that-ban-lam-viec.glb",
  "ke-sach": "models/noi-that-ke-sach.glb",
  "phases": [
    "models/phase-0.glb",
    "models/phase-1.glb",
    "models/phase-2.glb",
    "models/phase-3.glb",
    "models/phase-4.glb",
    "models/phase-5.glb",
    "models/phase-6.glb"
  ],
  "details": {
    "coc-mong": "models/chi-tiet-coc-mong.glb",
    "cot": "models/chi-tiet-cot.glb",
    "dam-san": "models/chi-tiet-dam-san.glb",
    "tuong": "models/chi-tiet-tuong.glb",
    "chong-tham": "models/chi-tiet-chong-tham.glb"
  },
  "extras": "models/addc-extras.glb"
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const easeOut = t => 1 - Math.pow(1 - t, 3);

/* Deterministic random so textures look the same on every visit. */
let seed = 20150601;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

/* ---------- Canvas textures ---------- */
function tex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  return t;
}
function speckle(g, w, h, n, colors, smin = 1, smax = 2, amin = 0.08, amax = 0.35) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = amin + rnd() * (amax - amin);
    g.fillStyle = pick(colors);
    const s = smin + rnd() * (smax - smin);
    g.fillRect(rnd() * w, rnd() * h, s, s);
  }
  g.globalAlpha = 1;
}
const T = {
  concrete: () => tex(512, 512, (g, w, h) => {
    g.fillStyle = '#9d9a91'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 26000, ['#7d7a72', '#b5b2a9', '#8c8980', '#a9a69c']);
    for (let i = 0; i < 260; i++) { g.globalAlpha = .35 + rnd() * .3; g.fillStyle = '#5d5a53'; g.beginPath(); g.arc(rnd() * w, rnd() * h, .6 + rnd() * 1.8, 0, 7); g.fill(); }
    g.globalAlpha = .07; g.fillStyle = '#3d3b36';
    for (let y = 128; y < h; y += 128) g.fillRect(0, y, w, 2);
    g.globalAlpha = 1;
  }),
  brickFace: () => tex(128, 64, (g, w, h) => {
    g.fillStyle = '#b4613a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1400, ['#8e4426', '#c97a4f', '#a24f2c', '#d48b5d'], 1, 2.5, .15, .5);
  }),
  brickEnd: () => tex(64, 64, (g, w, h) => {
    g.fillStyle = '#b4613a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 500, ['#8e4426', '#c97a4f'], 1, 2, .2, .5);
    g.fillStyle = '#4a2414';
    [[8, 8], [36, 8], [8, 36], [36, 36]].forEach(([x, y]) => g.fillRect(x, y, 20, 20));
  }),
  brickWall: () => tex(512, 512, (g, w, h) => {
    g.fillStyle = '#c9bfa8'; g.fillRect(0, 0, w, h);
    const bw = 128, bh = 48, m = 8;
    for (let r = 0; r * (bh + m) < h; r++) {
      const off = r % 2 ? -bw / 2 : 0;
      for (let x = off; x < w; x += bw) {
        g.fillStyle = pick(['#b05d37', '#a65531', '#bb6a41', '#9d4f2d', '#c27247']);
        g.fillRect(x + m / 2, r * (bh + m) + m / 2, bw - m, bh);
      }
    }
    speckle(g, w, h, 9000, ['#7f3a1f', '#d58d62'], 1, 2, .1, .35);
  }),
  wood: (base, dark, planks = false) => tex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y0 = rnd() * h, amp = 2 + rnd() * 9, f = .004 + rnd() * .01, ph = rnd() * 6;
      g.globalAlpha = .05 + rnd() * .22; g.strokeStyle = dark; g.lineWidth = .6 + rnd() * 2.4;
      g.beginPath();
      for (let x = 0; x <= w; x += 12) { const y = y0 + Math.sin(x * f + ph) * amp; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
    if (planks) {
      g.fillStyle = 'rgba(40,24,12,.55)';
      for (let y = 0; y < h; y += 64) {
        g.fillRect(0, y, w, 2);
        const j = (y / 64) % 2 ? 160 : 380; g.fillRect(j, y, 2, 64);
      }
    }
  }),
  marble: () => tex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#ebe7de'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 12000, ['#d9d4c8', '#f6f3ec'], 2, 5, .1, .4);
    g.filter = 'blur(1.2px)';
    for (let v = 0; v < 16; v++) {
      let x = rnd() * w, y = rnd() * h, a = rnd() * Math.PI * 2;
      g.strokeStyle = pick(['#9c968a', '#b8b2a4', '#7f796d', '#c7a974']);
      g.globalAlpha = .25 + rnd() * .45; g.lineWidth = .8 + rnd() * 2.6;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 120; s++) { a += (rnd() - .5) * .5; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); }
      g.stroke();
    }
    g.filter = 'none'; g.globalAlpha = 1;
  }),
  tile: (grout = true) => tex(256, 256, (g, w, h) => {
    g.fillStyle = '#cfc8b9'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 5000, ['#bdb6a6', '#ddd7ca', '#b3ac9c'], 1, 3, .1, .35);
    if (grout) { g.fillStyle = '#8f897d'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); }
  }),
  plaster: color => tex(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 4000, ['rgba(0,0,0,.25)', 'rgba(255,255,255,.6)'], 1, 3, .04, .12);
  }),
  microcement: () => tex(512, 512, (g, w, h) => {
    g.fillStyle = '#b3aea3'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(18px)';
    for (let i = 0; i < 70; i++) { g.globalAlpha = .12; g.fillStyle = pick(['#8f8a7f', '#cfcac0', '#a39e93']); g.beginPath(); g.arc(rnd() * w, rnd() * h, 20 + rnd() * 60, 0, 7); g.fill(); }
    g.filter = 'none'; g.globalAlpha = 1;
    speckle(g, w, h, 6000, ['#8f8a7f', '#cfcac0'], 1, 2, .08, .25);
  }),
  // Terrazzo: cement ground with marble and glass chips (as in the Sunwah Pearl and Pham Van Bach projects).
  terrazzo: () => tex(512, 512, (g, w, h) => {
    g.fillStyle = '#e4ded2'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 6000, ['#d6cfc1', '#efeae1'], 1, 2, .2, .5);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = pick(['#b9b1a3', '#8c8478', '#d9cdb8', '#6f7d72', '#c49a7a', '#f4f1ea']);
      g.globalAlpha = .65 + rnd() * .35;
      const x = rnd() * w, y = rnd() * h, r = 1.5 + rnd() * 6;
      g.beginPath(); g.moveTo(x + r, y);
      for (let k = 1; k < 6; k++) { const a = k / 6 * Math.PI * 2 + rnd() * .5; g.lineTo(x + Math.cos(a) * r * (.6 + rnd() * .6), y + Math.sin(a) * r * (.6 + rnd() * .6)); }
      g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
  }),
  // Encaustic cement tile (gạch bông), 20 x 20 cm, as in Villa Ho Tram.
  encaustic: () => tex(256, 256, (g, w, h) => {
    g.fillStyle = '#e8e0cf'; g.fillRect(0, 0, w, h);
    const c = w / 2;
    g.fillStyle = '#3f5f55';
    for (let k = 0; k < 4; k++) { g.save(); g.translate(c, c); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(40, -70, 0, -118); g.quadraticCurveTo(-40, -70, 0, 0); g.fill(); g.restore(); }
    g.fillStyle = '#c0663e'; g.beginPath(); g.arc(c, c, 22, 0, 7); g.fill();
    g.fillStyle = '#d9a441';
    [[0, 0], [w, 0], [0, h], [w, h]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 38, 0, 7); g.fill(); });
    g.strokeStyle = '#3f5f55'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    speckle(g, w, h, 1500, ['rgba(0,0,0,.25)'], 1, 2, .05, .12);
  }),
  // Site board on the hoarding: white logo panel and blue information panel.
  siteBoard: () => tex(1024, 256, (g, w, h) => {
    g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, w * .48, h);
    g.fillStyle = '#1f4fa3'; g.fillRect(w * .48, 0, w * .52, h);
    g.fillRect(40, 70, 70, 70);
    g.fillStyle = '#1f4fa3'; g.font = '600 58px Arial, sans-serif'; g.fillText('AN DUONG', 128, 128);
    g.font = '500 24px Arial, sans-serif'; g.fillText('DESIGN + CONSTRUCTION', 130, 172);
    g.fillStyle = '#ffffff'; g.font = '600 38px Arial, sans-serif'; g.fillText('BIỂN BÁO CÔNG TRÌNH', w * .52, 70);
    g.globalAlpha = .7; for (let i = 0; i < 5; i++) g.fillRect(w * .52, 100 + i * 28, (.3 + rnd() * .14) * w, 8);
    g.globalAlpha = 1;
  }, 1, 1),
  // Blue safety net over scaffolding, as on ADDC sites.
  net: () => tex(128, 128, (g, w, h) => {
    g.fillStyle = 'rgba(28,70,170,.22)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,120,230,.55)'; g.lineWidth = 1;
    for (let i = 0; i <= w; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  }),
  hoarding: () => tex(128, 128, (g, w, h) => {
    g.fillStyle = '#2d58b0'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, 0, 6, h); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 10, 0, 4, h); }
  })
};

/* ---------- Materials ---------- */
function makeMats() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const concrete = T.concrete();
  const m = {
    concrete: std({ map: concrete, roughness: .92, bumpMap: concrete, bumpScale: .6 }),
    pile: std({ color: '#bdb8ad', roughness: .9 }),
    rebar: std({ color: '#5e4b3e', metalness: .65, roughness: .55 }),
    brick: std({ map: T.brickFace(), roughness: .92 }),
    brickEnd: std({ map: T.brickEnd(), roughness: .92 }),
    brickWall: std({ map: T.brickWall(), roughness: .92 }),
    mortar: std({ color: '#c3b9a2', roughness: 1 }),
    marble: new THREE.MeshPhysicalMaterial({ map: T.marble(), roughness: .14, clearcoat: .6, clearcoatRoughness: .2 }),
    granite: std({ map: tex(256, 256, (g, w, h) => { g.fillStyle = '#3c3a37'; g.fillRect(0, 0, w, h); speckle(g, w, h, 9000, ['#77736c', '#1f1e1c', '#9a948a', '#5a4f45'], 1, 3, .4, .9); }), roughness: .3 }),
    oak: std({ map: T.wood('#b88c5c', '#6f4a28'), roughness: .62 }),
    walnut: std({ map: T.wood('#6c4930', '#2f1d11'), roughness: .55 }),
    laminate: std({ color: '#e3ddcf', roughness: .5 }),
    floorWood: std({ map: T.wood('#b48a5f', '#6a4526', true), roughness: .5 }),
    tile: std({ map: T.tile(), roughness: .32 }),
    cement: std({ color: '#8d897f', roughness: 1 }),
    // Plain transparent glass: physical transmission re-rendered the whole scene every frame and stalled scrolling.
    glass: std({ color: '#cfe0dc', metalness: .2, roughness: .06, transparent: true, opacity: .32, depthWrite: false, envMapIntensity: 1.4 }),
    alu: std({ color: '#2f3133', metalness: .75, roughness: .35 }),
    plaster: std({ map: T.plaster('#efe9da'), roughness: .95 }),
    membrane: std({ color: '#3f3d38', roughness: .7 }),
    soil: std({ color: '#b6a684', roughness: 1 }),
    grass: std({ color: '#55704f', roughness: 1 }),
    leaf: std({ color: '#4d6b4b', roughness: .85, flatShading: true }),
    trunk: std({ color: '#5a4636', roughness: .9 }),
    warm: new THREE.MeshBasicMaterial({ color: '#ffd896' }),
    fabric: std({ color: '#8b8576', roughness: 1 }),
    fabricMoss: std({ color: '#3d5a47', roughness: 1 }),
    brass: std({ color: '#b08d57', metalness: .85, roughness: .3 }),
    rug: std({ color: '#cdbf9f', roughness: 1 }),
    microcement: std({ map: T.microcement(), roughness: .7 }),
    paintCream: std({ map: T.plaster('#ece5d2'), roughness: .95 }),
    paintMoss: std({ map: T.plaster('#4f6a57'), roughness: .95 }),
    clay: std({ color: '#f1ece0', roughness: .9 }),
    terrazzo: std({ map: T.terrazzo(), roughness: .35 }),
    encaustic: std({ map: T.encaustic(), roughness: .55 }),
    pressRed: std({ color: '#a8432c', metalness: .5, roughness: .55 }),
    weight: std({ color: '#7d5a3c', roughness: .95 }),
    spunPile: std({ color: '#a9a69e', roughness: .85 }),
    tube: std({ color: '#9aa0a4', metalness: .7, roughness: .4 }),
    net: std({ map: T.net(), transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 1 }),
    hoarding: std({ map: T.hoarding(), roughness: .6, metalness: .2 }),
    siteBoard: std({ map: T.siteBoard(), roughness: .8 })
  };
  m.net.map.repeat.set(6, 3); m.hoarding.map.repeat.set(4, 1);
  m.marbleFloor = m.marble.clone(); m.marbleFloor.map = T.marble(); m.marbleFloor.map.repeat.set(2, 2);
  m.microcement.map.repeat.set(2, 2);
  m.floorWood.map.repeat.set(2, 2);
  Object.entries(m).forEach(([k, v]) => { v.name = k; });
  return m;
}

/* ---------- Helpers ---------- */
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  return o;
}
/* Box whose origin sits at its base, so scale.y "grows" it out of the ground like real construction. */
function block(w, h, d, mat, x, yBase, z, uv) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  if (uv) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * uv[0], a.getY(i) * uv[1]); }
  return mesh(g, mat, x, yBase, z);
}
function fitTo(obj, size) {
  const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const k = size / Math.max(s.x, s.y, s.z);
  obj.scale.setScalar(k);
  obj.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  obj.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return obj;
}
const loader = new GLTFLoader();
const { load: rawLoadGLB, prioritize: prioritizeModel } = createModelLoader(loader);
const loadGLB = (url, opts) => rawLoadGLB(url, opts).then(prepareModel);

/* A newly loaded model's textures go to the graphics card a few at a time, a few milliseconds per frame, and its
   shaders are compiled in parallel, all before it is first drawn. Uploading a hundred textures in the one frame a
   model appeared froze the scroll for up to a quarter of a second. */
const gpuJobs = [];
let pumping = false;
function pump() {
  const end = performance.now() + 3;
  do { const job = gpuJobs.shift(); if (job) job(); } while (gpuJobs.length && performance.now() < end);
  if (gpuJobs.length) requestAnimationFrame(pump); else pumping = false;
}
// Run fn over items a few milliseconds per frame, so a long job never becomes one long freeze.
async function inFrames(items, fn, budget = 4) {
  for (let i = 0; i < items.length;) {
    const end = performance.now() + budget;
    do fn(items[i++]); while (i < items.length && performance.now() < end);
    if (i < items.length) await new Promise(r => requestAnimationFrame(r));
  }
}
function warmModel(st, model) {
  const textures = new Set();
  model.traverse(o => {
    if (o.isMesh) [].concat(o.material).forEach(m => { if (m) for (const k in m) { const v = m[k]; if (v && v.isTexture) textures.add(v); } });
  });
  return new Promise(resolve => {
    textures.forEach(t => gpuJobs.push(() => { try { st.renderer.initTexture(t); } catch (e) {} }));
    gpuJobs.push(() => {
      const compiled = st.renderer.compileAsync ? st.renderer.compileAsync(model, st.camera, st.scene) : Promise.resolve();
      compiled.catch(() => {}).then(() => resolve(model));
    });
    if (!pumping) { pumping = true; requestAnimationFrame(pump); }
  });
}

/* ---------- Stage: renderer, camera, light, render-on-visible ---------- */
// Heavy one-off work (building a model, compiling its shaders) waits for a pause in scrolling, so it never
// lands in the middle of a scroll. A stage that is about to be seen is still built at once by the lazy observer.
let lastScroll = 0;
addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
const whenQuiet = f => { const check = () => (performance.now() - lastScroll > 300 ? f() : setTimeout(check, 150)); check(); };

function makeStage(el, { paper = false, cam = [4, 3, 5], target = [0, .8, 0], auto = true, exposure = 1 } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    fail(el, 'Trình duyệt hoặc thiết bị này không hỗ trợ WebGL nên không hiển thị được mô hình 3D.');
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Shadows are redrawn on every second rendered frame, not every frame: the light never follows the camera,
  // and the shadow pass (six passes for the room's lamp) was the largest share of each frame on laptop graphics.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const _render = renderer.render.bind(renderer);
  let shadowTick = 0;
  renderer.render = (sc, cam) => { if (shadowTick++ % 2 === 0) renderer.shadowMap.needsUpdate = true; _render(sc, cam); };
  el.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;

  const camera = new THREE.PerspectiveCamera(32, 1, .1, 300);
  camera.position.set(...cam);

  const sun = new THREE.DirectionalLight('#fff3df', 2.4);
  sun.position.set(6, 11, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = .02;
  const sc = sun.shadow.camera; sc.left = sc.bottom = -14; sc.right = sc.top = 14; sc.near = 1; sc.far = 60;
  const hemi = new THREE.HemisphereLight('#f2eddd', '#4a4436', .55);
  scene.add(sun, hemi);

  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: paper ? .18 : .45 }));
  catcher.rotation.x = -Math.PI / 2; catcher.receiveShadow = true;
  scene.add(catcher);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...target);
  controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
  controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2.08;
  controls.autoRotate = auto && !reduced; controls.autoRotateSpeed = .7;
  const orbitView = installStageOrbit(el, renderer.domElement, camera, controls);
  controls.update();

  const ticks = [];
  const clock = new THREE.Clock();
  // Drawn every frame, so a model tied to the scroll moves exactly with the page on 120 and 240 Hz screens too.
  const tick = () => {
    const dt = Math.min(clock.getDelta(), .05);
    ticks.forEach(f => f(dt));
    controls.update();
    renderer.render(scene, camera);
  };
  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    // Pixel budget: a full-width stage on a large screen is drawn at about two million pixels at most.
    renderer.setPixelRatio(Math.max(.6, Math.min(devicePixelRatio, 1.5, Math.sqrt(2.1e6 / (w * h)))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);
  resize();
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { clock.getDelta(); renderer.setAnimationLoop(tick); }
    else renderer.setAnimationLoop(null);
  }, { rootMargin: '120px' }).observe(el);

  // Compile shaders and upload textures before the stage is seen, so its first visible frame is cheap.
  setTimeout(() => whenQuiet(() => {
    const warm = () => { renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); };
    // A real frame (textures, shadow map, environment) is drawn now, on a timer: waiting for an idle moment
    // never came while another stage was animating, and the first visible frame then froze the scroll.
    (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()).then(warm).catch(warm);
  }), 600);

  const fade = installFade(el, renderer, scene, camera);
  const st = { renderer, scene, camera, controls, orbitView, fade, sun, hemi, catcher, ticks, ready: () => { el.classList.add('ready'); warmModel(st, scene); } };
  // Every model a stage asks for is counted for its loading screen and warmed on the graphics card before it is shown.
  const urls = [];
  st.load = (url, opts) => { urls.push(url); return loadGLB(url, opts).then(m => warmModel(st, m)); };
  const status = el.querySelector('.stage-status');
  const pct = status && status.querySelector('[data-pct]');
  if (pct) {
    const show = () => {
      if (el.classList.contains('ready') || !el.isConnected) return;
      pct.textContent = String(Math.round((urls.length ? downloaded(urls) : 0) * 100)).padStart(2, '0');
      setTimeout(show, 120);
    };
    show();
  }
  return st;
}
function fail(el, msg) {
  el.classList.add('failed');
  const s = el.querySelector('.stage-status');
  if (s) s.textContent = msg;
}

/* ---------- Material samples ---------- */
function rebar(len, r, mat) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r, len, 12), mat));
  const n = Math.floor(len / (r * 2.4));
  const ribs = new THREE.InstancedMesh(new THREE.TorusGeometry(r * .98, r * .16, 4, 14), mat, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    o.position.set(0, -len / 2 + (i + .5) * (len / n), 0);
    o.rotation.set(Math.PI / 2 + (i % 2 ? .25 : -.25), 0, 0);
    o.updateMatrix(); ribs.setMatrixAt(i, o.matrix);
  }
  ribs.castShadow = true;
  g.add(ribs);
  return g;
}

const SAMPLES = {
  'be-tong': M => {
    const g = new THREE.Group();
    const col = mesh(new RoundedBoxGeometry(1.1, 1.7, 1.1, 3, .025), M.concrete, 0, .85, 0);
    g.add(col);
    [[-.38, -.38], [.38, -.38], [-.38, .38], [.38, .38]].forEach(([x, z]) => {
      const b = rebar(.9, .045, M.rebar); b.position.set(x, 2.1, z); g.add(b);
    });
    const cube = mesh(new RoundedBoxGeometry(.5, .5, .5, 2, .02), M.concrete, 1.05, .25, .45);
    cube.rotation.y = .5; g.add(cube);
    return g;
  },
  thep: M => {
    const g = new THREE.Group();
    const bars = new THREE.Group();
    const pos = [[0, 0], [.15, 0], [-.15, 0], [.075, .13], [-.075, .13], [.075, -.13], [-.075, -.13]];
    pos.forEach(([y, z]) => { const b = rebar(3, .06, M.rebar); b.position.set(0, y, z); bars.add(b); });
    bars.rotation.z = Math.PI / 2; bars.position.y = .42;
    [-1, 0, 1].forEach(x => { const t = mesh(new THREE.TorusGeometry(.25, .012, 6, 24), M.rebar, x, .42, 0); t.rotation.y = Math.PI / 2; g.add(t); });
    [-1.1, 1.1].forEach(x => g.add(block(.18, .18, .8, M.walnut, x, 0, 0)));
    g.add(bars);
    return g;
  },
  gach: M => {
    const g = new THREE.Group();
    const L = .36, Hb = .16, D = .16, m = .02, rows = 6, per = 5;
    const geo = new THREE.BoxGeometry(L, Hb, D);
    const tones = ['#b4613a', '#a9552f', '#bf6d44'].map(c => { const a = M.brick.clone(); a.color.set(c).multiplyScalar(1.35); return a; });
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? (L + m) / 2 : 0;
      for (let i = 0; i < per; i++) {
        const x = -((per - 1) * (L + m)) / 2 + i * (L + m) + off - (L + m) / 4;
        const face = pick(tones);
        const b = mesh(geo, [M.brickEnd, M.brickEnd, face, face, face, face], x, Hb / 2 + r * (Hb + m), 0);
        g.add(b);
      }
    }
    g.add(block(per * (L + m) - .1, rows * (Hb + m) - m, D - .04, M.mortar, 0, 0, 0));
    return g;
  },
  da: M => {
    const g = new THREE.Group();
    const s1 = mesh(new RoundedBoxGeometry(1.9, .04, 1.1, 2, .01), M.marble, 0, .32, .1);
    s1.rotation.set(-.08, .35, 0); g.add(s1);
    const s2 = mesh(new RoundedBoxGeometry(1.5, .04, 1.0, 2, .01), M.granite, -.2, .75, -.55);
    s2.rotation.set(-1.15, .35, 0); g.add(s2);
    g.add(block(1.5, .3, .9, M.walnut, 0, 0, .1));
    return g;
  },
  go: M => {
    const g = new THREE.Group();
    const p1 = block(2.3, .08, .34, M.oak, 0, 0, 0);
    const p2 = block(2.3, .08, .34, M.walnut, .1, .08, .05); p2.rotation.y = .18;
    const p3 = block(2.1, .06, .5, M.laminate, -.05, .16, -.05); p3.rotation.y = -.12;
    const edge = block(2.1, .061, .51, M.oak, -.05, .16, -.05); edge.rotation.y = -.12; edge.scale.set(1.001, 1, .985);
    const beam = block(.24, .24, 1.6, M.oak, .9, 0, .9); beam.rotation.y = .9;
    g.add(p1, p2, edge, p3, beam);
    return g;
  },
  'gach-op': M => {
    const g = new THREE.Group();
    g.add(block(1.5, .05, 1.5, M.cement, 0, 0, 0));
    const s = .6, gap = .03;
    [[-1, -1], [1, -1], [-1, 1]].forEach(([i, j]) => g.add(block(s, .025, s, M.tile, i * (s + gap) / 2, .05, j * (s + gap) / 2)));
    const lifted = block(s, .025, s, M.tile, (s + gap) / 2, .2, (s + gap) / 2);
    lifted.rotation.set(-.35, .25, .12); g.add(lifted);
    return g;
  },
  kinh: M => {
    const g = new THREE.Group();
    const W = 1.5, H = 2, p = .07, d = .09;
    g.add(block(W, p, d, M.alu, 0, 0, 0), block(W, p, d, M.alu, 0, H - p, 0),
      block(p, H, d, M.alu, -W / 2 + p / 2, 0, 0), block(p, H, d, M.alu, W / 2 - p / 2, 0, 0), block(p * .7, H, d, M.alu, 0, 0, 0));
    g.add(block(W - p * 2, H - p * 2, .02, M.glass, 0, p, 0));
    g.add(block(.5, .5, .5, M.concrete, .45, 0, -.7));
    return g;
  },
  terrazzo: M => {
    const g = new THREE.Group();
    const slab = mesh(new RoundedBoxGeometry(1.8, .06, 1.1, 2, .012), M.terrazzo, 0, .03, 0); slab.rotation.y = .3; g.add(slab);
    const top = mesh(new RoundedBoxGeometry(1.2, .05, .7, 2, .012), M.terrazzo, -.15, .55, -.25); top.rotation.set(-.95, .3, 0); g.add(top);
    const s = .4, gap = .015;
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j]) => g.add(block(s, .03, s, M.encaustic, .55 + i * (s + gap), .06, .2 + j * (s + gap))));
    const lifted = block(s, .03, s, M.encaustic, .1, .32, .75); lifted.rotation.set(-.4, -.3, .1); g.add(lifted);
    return g;
  }
};

/* ---------- Furniture (nội thất): procedural pieces, one per catalogue entry ---------- */
const rbox = (w, h, d, r, mat, x, yBase, z) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, yBase + h / 2, z);
function diningChair(M) {
  const g = new THREE.Group();
  [[-.19, -.19], [.19, -.19], [-.19, .19], [.19, .19]].forEach(([x, z]) => g.add(block(.035, .45, .035, M.walnut, x, 0, z)));
  g.add(rbox(.46, .045, .46, .012, M.oak, 0, .45, 0));
  g.add(rbox(.42, .05, .4, .02, M.fabricMoss, 0, .495, .01));
  [-.19, .19].forEach(x => g.add(block(.035, .42, .035, M.walnut, x, .45, -.2)));
  const back = rbox(.44, .2, .03, .012, M.oak, 0, .7, -.21); back.rotation.x = -.08; g.add(back);
  return g;
}
const FURNITURE = {
  sofa: M => {
    const g = new THREE.Group();
    [[-1.0, -.38], [1.0, -.38], [-1.0, .38], [1.0, .38]].forEach(([x, z]) => g.add(block(.05, .1, .05, M.walnut, x, 0, z)));
    g.add(rbox(2.2, .32, .95, .04, M.fabric, 0, .1, 0));
    g.add(rbox(2.2, .5, .2, .06, M.fabric, 0, .38, -.38));
    [-1.0, 1.0].forEach(x => g.add(rbox(.2, .42, .95, .06, M.fabric, x, .38, 0)));
    [-.46, .46].forEach(x => {
      g.add(rbox(.9, .14, .7, .06, M.fabric, x, .42, .08));
      const b = rbox(.86, .42, .16, .07, M.fabric, x, .52, -.22); b.rotation.x = -.14; g.add(b);
    });
    g.add(rbox(.4, .36, .12, .05, M.fabricMoss, .62, .55, -.08));
    return g;
  },
  'ban-tra': M => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(.55, .55, .045, 64), M.walnut, 0, .42, 0));
    g.add(mesh(new THREE.CylinderGeometry(.12, .22, .4, 32), M.walnut, 0, .2, 0));
    g.add(mesh(new THREE.CylinderGeometry(.26, .26, .02, 48), M.marble, 0, .01, 0));
    g.add(mesh(new THREE.CylinderGeometry(.07, .05, .16, 24), M.concrete, .2, .52, -.1));
    g.add(block(.24, .03, .17, M.laminate, -.15, .445, .1));
    return g;
  },
  'ban-an': M => {
    const g = new THREE.Group();
    g.add(rbox(1.8, .04, .9, .01, M.oak, 0, .71, 0));
    [[-.8, -.36], [.8, -.36], [-.8, .36], [.8, .36]].forEach(([x, z]) => g.add(block(.06, .71, .06, M.walnut, x, 0, z)));
    [[-.45, -.62, 0], [.45, -.62, 0], [-.45, .62, Math.PI], [.45, .62, Math.PI], [-1.15, 0, -Math.PI / 2], [1.15, 0, Math.PI / 2]].forEach(([x, z, r]) => {
      const c = diningChair(M); c.position.set(x, 0, z); c.rotation.y = r + Math.PI; g.add(c);
    });
    g.add(mesh(new THREE.CylinderGeometry(.09, .07, .22, 24), M.concrete, 0, .86, 0));
    return g;
  },
  'ghe-an': M => diningChair(M),
  'ban-lam-viec': M => {
    const g = new THREE.Group();
    g.add(rbox(1.4, .035, .7, .008, M.oak, 0, .72, 0));
    [[-.66, -.3], [-.66, .3], [.66, -.3], [.66, .3]].forEach(([x, z]) => g.add(block(.035, .72, .035, M.alu, x, 0, z)));
    g.add(block(.42, .58, .55, M.laminate, .42, .06, 0));
    [.2, .4].forEach(y => g.add(block(.14, .015, .01, M.brass, .42, .06 + y, .28)));
    g.add(block(.32, .012, .22, M.alu, -.25, .755, .05));
    const screen = block(.32, .2, .01, M.alu, -.25, .767, -.06); screen.rotation.x = -.25; g.add(screen);
    g.add(mesh(new THREE.CylinderGeometry(.07, .08, .02, 24), M.brass, .45, .765, -.2));
    const arm = mesh(new THREE.CylinderGeometry(.008, .008, .42, 8), M.brass, .45, .97, -.2); arm.rotation.z = .25; g.add(arm);
    const shade = mesh(new THREE.ConeGeometry(.09, .12, 24, 1, true), M.brass, .4, 1.15, -.2); g.add(shade);
    const chair = diningChair(M); chair.position.set(-.2, 0, .6); chair.rotation.y = Math.PI; g.add(chair);
    return g;
  },
  'tu-ao': M => {
    const g = new THREE.Group();
    g.add(block(1.8, .08, .58, M.walnut, 0, 0, 0));
    g.add(block(1.8, 2.12, .6, M.laminate, 0, .08, 0));
    [-.6, 0, .6].forEach((x, i) => {
      g.add(block(.585, 2.08, .02, M.oak, x, .1, .31));
      g.add(block(.014, .5, .02, M.brass, x + (i === 2 ? -.25 : .25), 1.0, .33));
    });
    return g;
  },
  giuong: M => {
    const g = new THREE.Group();
    g.add(block(1.9, .28, 2.1, M.walnut, 0, .06, 0));
    g.add(rbox(1.8, .22, 2.0, .06, M.laminate, 0, .34, .02));
    g.add(rbox(2.0, 1.0, .1, .04, M.fabric, 0, .1, -1.05));
    [-.45, .45].forEach(x => g.add(rbox(.62, .14, .38, .06, M.paintCream, x, .56, -.75)));
    g.add(rbox(1.84, .05, .7, .02, M.fabricMoss, 0, .56, .62));
    [-1.28, 1.28].forEach(x => {
      g.add(block(.46, .5, .4, M.oak, x, 0, -.82));
      g.add(mesh(new THREE.SphereGeometry(.09, 24, 16), M.paintCream, x, .64, -.85));
      g.add(mesh(new THREE.CylinderGeometry(.04, .05, .08, 16), M.brass, x, .54, -.85));
    });
    return g;
  },
  'ke-sach': M => {
    const g = new THREE.Group();
    [-.9, -.3, .3, .9].forEach(x => g.add(block(.03, 2.0, .35, M.oak, x, 0, 0)));
    [0, .42, .84, 1.26, 1.68, 1.97].forEach(y => g.add(block(1.83, .03, .35, M.oak, 0, y, 0)));
    const books = [M.walnut, M.fabricMoss, M.paintCream, M.fabric, M.laminate];
    [.03, .45, .87, 1.29].forEach((y, row) => {
      for (let i = 0; i < 9; i++) {
        if ((i + row) % 4 === 3) continue;
        const h = .22 + ((i * 7 + row * 3) % 5) * .03;
        g.add(block(.045, h, .24, books[(i + row) % books.length], -.84 + i * .065 + (row % 2) * .6, y, .02));
      }
    });
    g.add(mesh(new THREE.CylinderGeometry(.08, .06, .26, 24), M.concrete, .62, 1.42, 0));
    g.add(block(.28, .2, .02, M.brass, -.6, 1.71, -.1));
    return g;
  },
  'tu-bep': M => {
    const g = new THREE.Group();
    g.add(block(2.4, .1, .56, M.walnut, 0, 0, -.02));
    g.add(block(2.4, .72, .58, M.laminate, 0, .1, 0));
    [-.9, -.3, .3, .9].forEach(x => {
      g.add(block(.59, .7, .02, M.oak, x, .11, .3));
      g.add(block(.3, .012, .02, M.brass, x, .74, .32));
    });
    g.add(rbox(2.44, .04, .64, .006, M.marble, 0, .82, 0));
    g.add(block(.5, .015, .38, M.alu, .5, .861, .02));
    const tap = mesh(new THREE.TorusGeometry(.1, .012, 8, 24, Math.PI), M.alu, .5, .98, -.2); g.add(tap);
    g.add(block(2.4, .58, .02, M.tile, 0, .86, -.31));
    g.add(block(2.4, .7, .35, M.laminate, 0, 1.44, -.14));
    [-.9, -.3, .3, .9].forEach(x => g.add(block(.59, .68, .02, M.oak, x, 1.45, .04)));
    g.add(block(.6, .12, .4, M.alu, -.6, 1.32, -.1));
    return g;
  }
};

/* ---------- Structure details (thi công): each assembles step by step ---------- */
function detailKit() {
  const g = new THREE.Group(), parts = [];
  const add = (obj, step, mode = 'drop', until = null) => {
    obj.userData.base = obj.position.y;
    parts.push({ obj, step, mode, until, k: parts.filter(p => p.step === step).length });
    g.add(obj); return obj;
  };
  return { g, parts, add };
}
const ghost = (mat, op, color) => { const m = mat.clone(); m.transparent = true; m.opacity = op; m.depthWrite = false; if (color) m.color.set(color); return m; };
function bar(len, r, mat, axis = 'y') {
  const b = rebar(len, r, mat);
  if (axis === 'x') b.rotation.z = Math.PI / 2;
  if (axis === 'z') b.rotation.x = Math.PI / 2;
  return b;
}
function stirrup(w, d, r, mat) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, r, r), mat, 0, 0, d / 2), mesh(new THREE.BoxGeometry(w, r, r), mat, 0, 0, -d / 2),
    mesh(new THREE.BoxGeometry(r, r, d), mat, w / 2, 0, 0), mesh(new THREE.BoxGeometry(r, r, d), mat, -w / 2, 0, 0));
  return g;
}
const DETAILS = {
  'coc-mong': M => {
    const { g, parts, add } = detailKit();
    g.add(block(3, .04, 3, M.soil, 0, -.04, 0));
    [[-.45, -.45], [.45, -.45], [-.45, .45], [.45, .45]].forEach(([x, z]) => add(mesh(new THREE.BoxGeometry(.28, .5, .28).translate(0, .25, 0), M.pile, x, 0, z), 0, 'grow'));
    add(block(1.7, .06, 1.7, M.cement, 0, .4, 0), 1, 'grow');
    for (let i = 0; i < 7; i++) { const b = bar(1.5, .016, M.rebar, 'x'); b.position.set(0, .52, -.6 + i * .2); add(b, 2); }
    for (let i = 0; i < 7; i++) { const b = bar(1.5, .016, M.rebar, 'z'); b.position.set(-.6 + i * .2, .555, 0); add(b, 2); }
    [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12], [0, -.12], [0, .12], [-.12, 0], [.12, 0]].forEach(([x, z]) => { const b = bar(1.4, .02, M.rebar); b.position.set(x, 1.2, z); add(b, 3); });
    [.95, 1.2, 1.45, 1.7].forEach(y => { const s = stirrup(.27, .27, .012, M.rebar); s.position.y = y; add(s, 3); });
    add(block(1.7, .7, 1.7, ghost(M.concrete, .5), 0, .44, 0), 4, 'grow');
    return { g, parts };
  },
  'cot': M => {
    const { g, parts, add } = detailKit();
    g.add(block(1.6, .1, 1.6, M.concrete, 0, -.1, 0));
    [[-.13, -.13], [.13, -.13], [-.13, .13], [.13, .13], [0, -.13], [0, .13], [-.13, 0], [.13, 0]].forEach(([x, z]) => { const b = bar(2.5, .022, M.rebar); b.position.set(x, 1.25, z); add(b, 0); });
    const ys = []; for (let y = .08; y < 2.45; ) { ys.push(y); y += (y < .55 || y > 1.9) ? .1 : .2; }
    ys.forEach(y => { const s = stirrup(.29, .29, .012, M.rebar); s.position.y = y; add(s, 1); });
    [.4, 1.2, 2.0].forEach(y => [[.165, 0], [-.165, 0], [0, .165], [0, -.165]].forEach(([x, z]) => add(mesh(new THREE.BoxGeometry(.04, .04, .04), M.cement, x, y, z), 2, 'pop')));
    add(block(.42, 2.4, .02, M.oak, 0, 0, -.2), 3, 'grow');
    add(block(.02, 2.4, .42, M.oak, -.2, 0, 0), 3, 'grow');
    add(block(.02, 2.4, .42, M.oak, .2, 0, 0), 3, 'grow');
    [-1, 1].forEach(s => { const p = mesh(new THREE.CylinderGeometry(.025, .025, 1.9, 8), M.alu, s * .6, .95, -.5); p.rotation.x = -.35 * s; p.rotation.z = .3 * s; add(p, 3, 'grow'); });
    add(block(.38, 2.36, .38, ghost(M.concrete, .55), 0, 0, 0), 4, 'grow');
    return { g, parts };
  },
  'dam-san': M => {
    const { g, parts, add } = detailKit();
    [[-1, -.6], [0, -.6], [1, -.6], [-1, .6], [0, .6], [1, .6]].forEach(([x, z]) => add(mesh(new THREE.CylinderGeometry(.03, .03, 1.0, 8).translate(0, .5, 0), M.alu, x, 0, z), 0, 'grow'));
    add(block(2.6, .02, 1.7, M.oak, 0, 1.0, 0), 0, 'grow');
    add(block(2.6, .3, .02, M.oak, 0, 1.0, -.86), 0, 'grow');
    [[1.02, -.75], [1.32, -.75], [1.02, -.95], [1.32, -.95]].forEach(([y, z]) => { const b = bar(2.5, .02, M.rebar, 'x'); b.position.set(0, y, z); add(b, 1); });
    for (let x = -1.15; x <= 1.16; x += .2) { const s = stirrup(.36, .24, .01, M.rebar); s.rotation.z = Math.PI / 2; s.position.set(x, 1.17, -.85); add(s, 1); }
    for (let i = 0; i < 7; i++) { const b = bar(2.4, .012, M.rebar, 'x'); b.position.set(0, 1.05, -.6 + i * .2); add(b, 2); }
    for (let i = 0; i < 12; i++) { const b = bar(1.4, .012, M.rebar, 'z'); b.position.set(-1.1 + i * .2, 1.07, 0); add(b, 2); }
    for (let i = 0; i < 6; i++) add(block(.04, .07, .04, M.rebar, -1 + i * .4, 1.08, i % 2 ? .3 : -.3), 3, 'pop');
    for (let i = 0; i < 7; i++) { const b = bar(2.4, .012, M.rebar, 'x'); b.position.set(0, 1.16, -.6 + i * .2); add(b, 3); }
    add(block(2.6, .14, 1.7, ghost(M.concrete, .5), 0, 1.02, 0), 4, 'grow');
    add(block(2.6, .3, .26, ghost(M.concrete, .5), 0, .86, -.86), 4, 'grow');
    return { g, parts };
  },
  'tuong': M => {
    const { g, parts, add } = detailKit();
    g.add(block(3, .06, 1, M.concrete, 0, -.06, 0));
    [-1.12, 1.12].forEach(x => add(block(.22, 2.4, .22, M.concrete, x, 0, 0), 0, 'grow'));
    for (let y = .3; y < 2.3; y += .5) [-1, 1].forEach(s => { const b = bar(.36, .006, M.rebar, 'x'); b.position.set(s * .86, y, 0); add(b, 1, 'pop'); });
    const L = .2, H = .085, gap = .015;
    const row = (r, opening) => {
      const rg = new THREE.Group();
      const off = r % 2 ? (L + gap) / 2 : 0;
      for (let x = -1.0 + off; x < .98; x += L + gap) {
        const w = Math.min(L, .99 - x);
        if (w < .05) continue;
        if (opening && x > -.42 && x < .32) continue;
        rg.add(block(w, H, .1, M.brick, x + w / 2, 0, 0));
      }
      rg.position.y = r * (H + gap);
      return rg;
    };
    for (let r = 0; r < 8; r++) add(row(r, false), 2, 'pop');
    add(block(2.0, .12, .12, M.concrete, 0, 8 * (H + gap), 0), 3, 'grow');
    for (let r = 9; r < 18; r++) add(row(r, r >= 10 && r <= 15), 4, 'pop');
    add(block(1.1, .1, .12, M.concrete, -.05, 16 * (H + gap) - .02, 0), 5, 'grow');
    for (let r = 18; r < 23; r++) add(row(r, false), 5, 'pop');
    return { g, parts };
  },
  'chong-tham': M => {
    const { g, parts, add } = detailKit();
    add(block(2.4, .15, 1.6, M.concrete, 0, 0, 0), 0, 'grow');
    add(block(2.4, .7, .12, M.plaster, 0, .15, -.86), 0, 'grow');
    const slope = add(block(2.3, .04, 1.5, M.cement, 0, .16, .02), 1); slope.rotation.x = .015;
    add(block(2.3, .012, 1.5, M.membrane, 0, .21, .02), 2);
    add(block(2.3, .3, .012, M.membrane, 0, .21, -.79), 2, 'grow');
    add(block(2.28, .05, 1.48, ghost(M.glass, .5, '#7fb6c9'), 0, .222, .02), 3, 'grow', 4);
    add(block(2.3, .03, 1.5, M.cement, 0, .223, .02), 4);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) add(block(.55, .02, .48, M.tile, -.86 + i * .575, .255, -.47 + j * .5), 5);
    return { g, parts };
  }
};

async function initDetails(el) {
  const st = makeStage(el, { cam: [3.6, 2.8, 4.4], target: [0, .9, 0] });
  if (!st) return;
  const M = makeMats();
  const INFO = window.ADDC_DETAILS || {};
  const holder = new THREE.Group(); st.scene.add(holder);
  const cache = {};
  let cur = null, t = 0, playing = false;
  const STEP = reduced ? 0.001 : 1.25;
  const apply = () => {
    if (!cur) return;
    cur.parts.forEach(p => {
      const a = reduced ? 1 : clamp((t - p.step * STEP - p.k * .03) / .55, 0, 1);
      const o = p.obj;
      const gone = p.until != null && t > p.until * STEP + .6;
      o.visible = a > 0 && !gone;
      if (!o.visible) return;
      const e = easeOut(a);
      if (p.mode === 'grow') o.scale.y = Math.max(e, .001);
      else if (p.mode === 'pop') o.scale.setScalar(Math.max(e, .001));
      else o.position.y = o.userData.base + (1 - e) * 1.2;
    });
    const stepNow = Math.min(Math.floor(t / STEP), (INFO[cur.id]?.steps || []).length - 1);
    stepsEl?.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i <= stepNow));
  };
  const stepsEl = document.querySelector('[data-detail-steps]');
  const keysEl = document.querySelector('[data-detail-keys]');
  const titleEl = document.querySelector('[data-detail-title]');
  let selection = 0;
  const show = async id => {
    const request = ++selection;
    el.classList.remove('ready');
    if (!cache[id]) cache[id] = buildDetail(id);
    const next = await cache[id];
    if (request !== selection) return;
    const swapDetail = () => { if (cur) holder.remove(cur.wrap); cur = next; holder.add(cur.wrap); };
    if (cur) st.fade(swapDetail); else swapDetail();
    const d = INFO[id] || { steps: [], keys: [] };
    if (titleEl) titleEl.textContent = d.title || '';
    if (stepsEl) stepsEl.innerHTML = d.steps.map(s => `<li>${s}</li>`).join('');
    if (keysEl) keysEl.innerHTML = d.keys.map(s => `<li>${s}</li>`).join('');
    t = 0; playing = true; apply();
    st.ready();
  };
  const buildDetail = async id => {
    const original = DETAILS[id](M);
    try {
      const model = await st.load(MODELS.details[id]);
      const parts = [];
      [...model.children].forEach(obj => {
        const match = /^step(\d+)_(\d+)$/.exec(obj.name);
        if (!match) return;
        const step = Number(match[1]);
        const { mode = 'drop', until = null, k = 0 } = original.parts[Number(match[2])] || {};
        // GLB vertices are baked in model space. A pivot at the foot lets a form grow from its base.
        const pivot = new THREE.Group();
        if (mode !== 'drop') {
          const bounds = new THREE.Box3().setFromObject(obj);
          bounds.getCenter(pivot.position);
          if (mode === 'grow') pivot.position.y = bounds.min.y;
        }
        obj.position.sub(pivot.position);
        pivot.add(obj);
        model.add(pivot);
        pivot.userData.base = pivot.position.y;
        parts.push({ obj: pivot, step, k, mode, until });
        obj.traverse(child => {
          if (child.material?.name !== 'ConcreteFinal') return;
          child.material.transparent = true;
          child.material.opacity = .56;
          child.material.depthWrite = false;
        });
      });
      if (!parts.length) throw new Error('No assembly steps in ' + id);
      return { id, wrap: fitTo(model, 2.6), parts };
    } catch (e) {
      delete cache[id];
      console.warn('Using procedural detail', id, e);
    }
    const d = original;
    const wrap = new THREE.Group(); wrap.add(fitTo(d.g, 2.6));
    d.parts.forEach(p => { p.obj.userData.base = p.obj.position.y; });
    return { id, wrap, parts: d.parts };
  };
  st.ticks.push(dt => {
    if (!playing || !cur) return;
    t += dt;
    apply();
    if (t > cur.parts.reduce((m, p) => Math.max(m, p.step), 0) * STEP + 1.5) playing = false;
  });
  const list = [...document.querySelectorAll('[data-detail]')];
  list.forEach(b => b.addEventListener('click', () => {
    list.forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
    show(b.dataset.detail);
  }));
  const replay = document.querySelector('[data-detail-replay]');
  if (replay) replay.addEventListener('click', () => { t = 0; playing = true; });
  if (list[0]) {
    list[0].classList.add('active');
    list[0].setAttribute('aria-pressed', 'true');
    await show(list[0].dataset.detail);
  } else st.ready();
}

/* A catalogue viewer: a list of buttons, one model at a time, specs filled from window data. Used for materials and furniture. */
async function initCatalog(el, { builders, attr, info, specSel, size = 2.4, cam = [3.7, 2.7, 4.5], target = [0, 1, 0] }) {
  const dark = el.classList.contains('dark');
  const st = makeStage(el, { paper: !dark, cam, target });
  if (!st) return;
  const M = makeMats();
  const holder = new THREE.Group();
  st.scene.add(holder);
  let current = null, enterT = 1, selection = 0;
  const cache = {};

  const wrapModel = model => {
    const wrap = new THREE.Group(); wrap.add(fitTo(model, size));
    return wrap;
  };
  const build = id => {
    if (!MODELS[id]) return wrapModel(builders[id](M));
    if (!cache[id]) {
      cache[id] = st.load(MODELS[id]).then(wrapModel).catch(error => {
        delete cache[id];
        console.warn('Using procedural catalogue model', id, error);
        return wrapModel(builders[id](M));
      });
    }
    return cache[id];
  };
  const show = async id => {
    const request = ++selection;
    el.classList.remove('ready');
    const obj = await build(id);
    if (request !== selection) return;
    const swap = () => { if (current) holder.remove(current); current = obj; holder.add(obj); };
    if (current) st.fade(swap); else swap();
    enterT = reduced ? 1 : 0;
    st.ready();
  };
  st.ticks.push(dt => {
    if (enterT < 1) {
      enterT = Math.min(1, enterT + dt * 1.8);
      const e = easeOut(enterT);
      holder.scale.setScalar(.94 + .06 * e);
      holder.rotation.y = (1 - e) * -.35;
      holder.position.y = (1 - e) * -.12;
    }
  });

  const list = [...document.querySelectorAll(`[data-${attr}]`)];
  const spec = document.querySelector(specSel);
  const select = btn => {
    list.forEach(b => { b.setAttribute('aria-pressed', b === btn); b.classList.toggle('active', b === btn); });
    const id = btn.dataset[attr], d = info[id];
    if (spec && d) {
      const name = spec.querySelector('.mat-name');
      if (name) name.textContent = d.name;
      spec.querySelectorAll('[data-k]').forEach(n => { if (d[n.dataset.k] != null) n.textContent = d[n.dataset.k]; });
    }
    show(id);
  };
  list.forEach(b => b.addEventListener('click', () => select(b)));
  if (list[0]) select(list[0]);
  else st.ready();
}

const initMaterials = el => initCatalog(el, { builders: SAMPLES, attr: 'mat', info: window.ADDC_MATERIALS || {}, specSel: '[data-mat-spec]' });
const initFurniture = el => initCatalog(el, { builders: FURNITURE, attr: 'item', info: window.ADDC_FURNITURE || {}, specSel: '[data-item-spec]', size: 2.6, cam: [3.6, 2.6, 4.4], target: [0, .8, 0] });

/* ---------- House: shared by the blueprint view and the build sequence ---------- */
const W = 7.2, D = 10, H = 3.3, FLOORS = 3, L0 = .6;
const XS = [-3.45, 0, 3.45], ZS = [-4.85, -1.6, 1.6, 4.85];

function buildHouse(M) {
  const g = new THREE.Group();
  const parts = [];
  const add = (obj, phase, t, mode = 'grow') => { obj.userData.base = obj.position.y; parts.push({ obj, phase, t, mode }); g.add(obj); return obj; };
  const lvl = f => L0 + f * H;

  g.add(block(W + 3, .04, D + 4, M.soil, 0, -.04, .6));

  // 0: piles
  XS.forEach((x, i) => ZS.forEach((z, j) => {
    [-.22, .22].forEach((dx, k) => add(mesh(new THREE.CylinderGeometry(.11, .11, .5, 10).translate(0, .25, 0), M.pile, x + dx, 0, z), 0, (i * 4 + j) / 12 * .8 + k * .05));
  }));
  // 1: footings, ground beams, ground slab
  XS.forEach((x, i) => ZS.forEach((z, j) => add(block(1.1, .45, 1.1, M.concrete, x, 0, z), 1, (i * 4 + j) / 12 * .4)));
  XS.forEach(x => add(block(.3, .4, D - .2, M.concrete, x, .2, 0), 1, .5));
  ZS.forEach(z => add(block(W - .2, .4, .3, M.concrete, 0, .2, z), 1, .6));
  add(block(W, .1, D, M.concrete, 0, L0 - .1, 0, [W / 4, D / 4]), 1, .85, 'drop');

  // 2: frame per floor
  for (let f = 0; f < FLOORS; f++) {
    const y = lvl(f), t0 = f / FLOORS;
    XS.forEach(x => ZS.forEach(z => add(block(.28, H - .12, .28, M.concrete, x, y, z), 2, t0)));
    XS.forEach(x => add(block(.24, .35, D, M.concrete, x, y + H - .47, 0), 2, t0 + .1));
    ZS.forEach(z => add(block(W, .35, .24, M.concrete, 0, y + H - .47, z), 2, t0 + .12));
    add(block(W + (f ? .5 : 0), .14, D + (f ? .5 : 0), M.concrete, 0, y + H - .14, f ? .25 : 0, [W / 4, D / 4]), 2, t0 + .2, 'drop');
  }

  // 3: brick walls (back, left, right full; front with openings)
  const wallH = H - .14, th = .2;
  for (let f = 0; f < FLOORS; f++) {
    const y = lvl(f), t0 = f / FLOORS * .9;
    const segs = [];
    [[-3.2, -1.6], [-1.6, 1.6], [1.6, 3.2]].forEach(([za, zb]) => {
      segs.push([-W / 2 + th / 2, (za + zb) / 2, th, zb - za]);
      segs.push([W / 2 - th / 2, (za + zb) / 2, th, zb - za]);
    });
    segs.push([-W / 2 + th / 2, -4.1, th, 1.5], [W / 2 - th / 2, -4.1, th, 1.5], [-W / 2 + th / 2, 4.1, th, 1.5], [W / 2 - th / 2, 4.1, th, 1.5]);
    segs.push([-1.72, -D / 2 + th / 2, 3.2, th], [1.72, -D / 2 + th / 2, 3.2, th]);
    segs.forEach(([x, z, w, d], i) => {
      const len = Math.max(w, d);
      add(block(w, wallH, d, M.brickWall, x, y, z, [len / .8, wallH / .7]), 3, t0 + i / segs.length * .25);
    });
    if (f > 0) {
      add(block(1.4, 1.0, th, M.brickWall, -2.6, y, D / 2 - th / 2, [1.4 / .8, 1 / .7]), 3, t0 + .3);
    }
    add(block(.9, wallH, th, M.brickWall, 2.95, y, D / 2 - th / 2, [.9 / .8, wallH / .7]), 3, t0 + .3);
  }

  // 4: roof
  const top = lvl(FLOORS);
  [[0, -D / 2 + .1, W, .2], [-W / 2 + .1, 0, .2, D], [W / 2 - .1, 0, .2, D], [0, D / 2 + .15, W + .5, .2]].forEach(([x, z, w, d], i) =>
    add(block(w, .95, d, M.brickWall, x, top, z, [Math.max(w, d) / .8, .95 / .7]), 4, i * .08));
  add(block(W - .4, .04, D - .4, M.membrane, 0, top, 0), 4, .3, 'drop');
  add(block(2.6, 2.8, 3.2, M.brickWall, -1.9, top, -3.1, [3.2 / .8, 2.8 / .7]), 4, .4);
  const lid = add(block(3.2, .14, 3.8, M.concrete, -1.9, top + 2.8, -3.1), 4, .55, 'drop');
  lid.rotation.x = .08;
  for (let i = 0; i < 9; i++) add(block(.08, .14, 3.6, M.alu, -.2 + i * .42, top + 2.4, 1.6), 4, .65 + i * .03, 'drop');
  [[-.2, 0], [3.16, 0], [-.2, 3.2], [3.16, 3.2]].forEach(([x, dz], i) => add(block(.1, 2.4, .1, M.alu, x, top, -.2 + dz), 4, .62 + i * .02));

  // 5: finishes: render over brick, glazing, door, timber screen
  parts.filter(p => p.obj.material === M.brickWall).forEach((p, i) => {
    const b = p.obj, s = b.geometry.parameters;
    const sh = block(s.width + .04, s.height, s.depth + .04, M.plaster, b.position.x, b.userData.base, b.position.z);
    sh.rotation.copy(b.rotation);
    add(sh, 5, (i % 40) / 40 * .45);
  });
  for (let f = 0; f < FLOORS; f++) {
    const y = lvl(f);
    if (f === 0) {
      add(block(2.2, 2.6, .05, M.walnut, -2.3, y, D / 2 - .1), 5, .5);
      add(block(2.4, 2.9, .04, M.glass, .6, y, D / 2 - .1), 5, .55);
    } else {
      add(block(4.6, H - 1.3, .04, M.glass, -.3, y + 1.0, D / 2 - .1), 5, .5 + f * .05);
      add(block(5.2, 1.0, .03, M.glass, -.6, y, D / 2 + .22), 5, .6 + f * .05);
      add(block(5.2, .05, .06, M.alu, -.6, y + 1.0, D / 2 + .22), 5, .62 + f * .05);
    }
    for (let k = 0; k < 7; k++) add(block(.07, H - .14, .12, M.oak, 2.62 + k * .12, y, D / 2 + .02), 5, .7 + f * .05 + k * .01);
  }

  // 6: landscape, lights on
  add(block(W + 2.6, .03, 3.2, M.grass, 0, 0, D / 2 + 2.1), 6, 0, 'drop');
  add(block(W + 2.6, .9, .2, M.plaster, 0, 0, D / 2 + 3.6), 6, .15);
  add(block(3.2, 1.6, .06, M.alu, -1.6, 0, D / 2 + 3.6), 6, .25);
  [[3.9, D / 2 + 2.5, 1.1], [-4.7, D / 2 + 1.6, .9], [-4.6, -2, 1.3]].forEach(([x, z, s], i) => {
    const tr = new THREE.Group();
    tr.add(block(.14, 1.6 * s, .14, M.trunk, 0, 0, 0));
    const c = mesh(new THREE.IcosahedronGeometry(1.1 * s, 1), M.leaf, 0, 2.2 * s, 0); tr.add(c);
    tr.position.set(x, 0, z);
    add(tr, 6, .3 + i * .12, 'pop');
  });
  for (let f = 0; f < FLOORS; f++) add(block(f ? 4.5 : 2.3, f ? H - 1.4 : 2.8, .02, M.warm, f ? -.3 : .6, lvl(f) + (f ? 1.05 : 0), D / 2 - .3), 6, .7 + f * .08, 'pop');

  // Temporary works seen on ADDC sites, removed before handover:
  // pile press with stacked counterweight blocks and spun piles (phase 0), blue hoarding with site board, blue-net scaffolding.
  const temp = (obj, phase, t, until, mode = 'grow') => { add(obj, phase, t, mode); parts[parts.length - 1].until = until; return obj; };
  const press = new THREE.Group();
  press.add(block(2.8, .28, 1.5, M.pressRed, 0, 0, 0));
  [-.38, .38].forEach(x => press.add(block(.2, 5.6, .2, M.pressRed, x, .28, 0)));
  press.add(block(1, .3, .5, M.pressRed, 0, 5.6, 0), block(.9, .5, .6, M.pressRed, 0, 3.2, 0));
  press.add(mesh(new THREE.CylinderGeometry(.15, .15, 3.6, 14).translate(0, 1.8, 0), M.spunPile, 0, .2, 0));
  [-1.05, 1.05].forEach(x => { for (let r = 0; r < 5; r++) press.add(block(.62, .4, 1.4, M.weight, x + (r % 2 ? .03 : -.03), .28 + r * .41, 0)); });
  press.position.set(-1.6, 0, -1.2);
  temp(press, 0, 0, 1.45);
  const pileStack = new THREE.Group();
  [[0, 0], [.32, 0], [.64, 0], [.16, .28], [.48, .28]].forEach(([x, y]) => { const c = mesh(new THREE.CylinderGeometry(.15, .15, 4.2, 14), M.spunPile, x, .15 + y, 0); c.rotation.x = Math.PI / 2; pileStack.add(c); });
  pileStack.position.set(4.3, 0, 1);
  temp(pileStack, 0, .1, .9, 'pop');
  const gate = new THREE.Group(), fz = D / 2 + 3.6;
  [[-3.25, 3.7], [3.25, 3.7]].forEach(([x, w]) => gate.add(block(w, 2.2, .06, M.hoarding, x, 0, 0)));
  [-1.4, 1.4].forEach(x => gate.add(block(.14, 3.3, .14, M.tube, x, 0, 0)));
  gate.add(block(3.6, .9, .08, M.siteBoard, 0, 3.0, 0));
  gate.position.set(0, 0, fz);
  temp(gate, 0, .05, 6.05);
  for (let f = 0; f < FLOORS + 1; f++) {
    const sc = new THREE.Group(), y = lvl(f), hh = f < FLOORS ? H : 1.4, z0 = D / 2 + .55, z1 = D / 2 + 1.25;
    for (let i = 0; i < 7; i++) [z0, z1].forEach(z => sc.add(block(.05, hh, .05, M.tube, -3.6 + i * 1.2, 0, z)));
    [hh * .5, hh - .05].forEach(yy => [z0, z1].forEach(z => sc.add(block(7.3, .05, .05, M.tube, 0, yy, z))));
    sc.add(block(7.4, .04, .75, M.oak, 0, hh - .1, (z0 + z1) / 2));
    sc.add(block(7.5, hh, .02, M.net, 0, 0, z1 + .04));
    sc.traverse(o => { if (o.isMesh) o.castShadow = false; });
    sc.position.y = y;
    temp(sc, 2, f / FLOORS * .95, 5.55);
  }

  return { group: g, parts };
}

function applyParts(parts, pf) {
  parts.forEach(p => {
    // Temporary works (`until`) shrink away again once their phase is over.
    const a = Math.min(clamp((pf - p.phase - p.t * .7) / .3, 0, 1), p.until === undefined ? 1 : clamp((p.until - pf) / .3, 0, 1));
    const o = p.obj;
    o.visible = a > 0;
    if (!o.visible) return;
    const e = easeOut(a);
    if (p.mode === 'grow') o.scale.y = Math.max(e, .001);
    else if (p.mode === 'drop') o.position.y = o.userData.base + (1 - e) * 2.4;
    else o.scale.setScalar(Math.max(e, .001));
  });
}

/* ---------- Thi công: scroll drives the build ---------- */
async function initBuild(el) {
  const section = el.closest('.build');
  const st = makeStage(el, { cam: [16, 11, 19], target: [0, 4, 0], auto: false, exposure: 1.05 });
  if (!st) return;
  const M = makeMats();
  const PH = window.ADDC_PHASES || [];
  const N = PH.length || 7;
  let house;
  const phases = createPhasePlayer(st.scene, MODELS.phases, st.load, prioritizeModel);
  const first = await phases.first;
  if (!first && !(await phases.loaded).some(Boolean)) {
    house = buildHouse(M);
    st.scene.add(house.group);
  }
  st.sun.position.set(10, 18, 12);

  const ui = {
    count: document.querySelector('[data-phase-count]'),
    bar: document.querySelector('[data-phase-bar]'),
    title: document.querySelector('[data-phase-title]'),
    desc: document.querySelector('[data-phase-desc]'),
    mats: document.querySelector('[data-phase-mats]'),
    steps: [...document.querySelectorAll('[data-phase-go]')]
  };
  let shown = -1, pf = 0, target = 0, ang = .75;
  const viewPosition = new THREE.Vector3(), viewTarget = new THREE.Vector3();
  const setPhase = i => {
    if (i === shown || !PH[i]) return;
    shown = i;
    ui.count.textContent = `Giai đoạn ${i + 1} trên ${N}`;
    ui.title.textContent = PH[i].title;
    ui.desc.textContent = PH[i].desc;
    ui.mats.innerHTML = PH[i].mats.map(([a, b]) => `<li><span>${a}</span><small>${b}</small></li>`).join('');
    ui.steps.forEach((b, k) => k === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'));

  };
  const read = () => {
    const r = section.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    target = p * N;
    ui.bar.style.width = (p * 100).toFixed(1) + '%';
    setPhase(Math.min(N - 1, Math.floor(target)));
  };
  addEventListener('scroll', read, { passive: true });
  addEventListener('resize', read);
  ui.steps.forEach((b, k) => b.addEventListener('click', () => {
    const r = section.getBoundingClientRect();
    const top = scrollY + r.top + ((k + .55) / N) * (r.height - innerHeight);
    if (window.__lenis) window.__lenis.scrollTo(top, { duration: 1.6 });
    else scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }));
  read();
  pf = target;
  phases.draw(pf, { reduced });

  // Visitor options: day or night light, and whether the temporary works (hoarding, pile press, scaffolding) show.
  let hideTemp = false;
  const env0 = st.scene.environment;
  const opts = {
    temp: v => { hideTemp = v === 'an'; },
    light: v => {
      const night = v === 'toi';
      st.sun.intensity = night ? .18 : 2.4; st.hemi.intensity = night ? .08 : .55;
      st.scene.environment = night ? null : env0; st.renderer.toneMappingExposure = night ? 1.3 : 1.05;
    }
  };
  document.querySelectorAll('[data-build-opt]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.buildOpt;
    document.querySelectorAll(`[data-build-opt="${k}"]`).forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
    st.fade(() => opts[k](b.dataset.v));
  }));
  st.ticks.push(dt => {
    pf += (target - pf) * Math.min(1, dt * (reduced ? 60 : 5));
    phases.draw(pf, { hideTemporary: hideTemp, reduced });
    if (house) { applyParts(house.parts, pf); if (hideTemp) house.parts.forEach(pt => { if (pt.until !== undefined) pt.obj.visible = false; }); }
    const k = pf / N;
    const goal = .75 - k * 1.2;
    ang += (goal - ang) * Math.min(1, dt * 3);
    // Start close on the piles, pull back as the house rises.
    const narrow = el.clientWidth < el.clientHeight * 1.15 ? 1.75 : 1;
    const R = (15 + k * 16) * narrow, h = (8 + k * 5) * (narrow > 1 ? 1.3 : 1);
    st.orbitView.follow(viewPosition.set(Math.sin(ang) * R, h, Math.cos(ang) * R), viewTarget.set(0, .8 + k * 4.2, 0));
  });
  st.ready();
}

/* ---------- Kiến trúc: line / clay / material views of the same house ---------- */
async function initBlueprint(el) {
  const wideView = el.clientWidth > el.clientHeight;
  const st = makeStage(el, { paper: true, cam: wideView ? [22, 12, 24] : [34, 17, 36], target: [0, 4.2, 0], exposure: 1.05 });
  if (!st) return;
  const M = makeMats();
  let house, glb = null;
  if (MODELS.house) { try { glb = fitTo(await st.load(MODELS.house), 14); } catch (e) { console.warn('GLB lỗi', e); } }
  if (!glb) house = buildHouse(M);
  const model = glb || house.group;

  const ink = new THREE.LineBasicMaterial({ color: '#161512', transparent: true, opacity: .85 });
  const paperFill = new THREE.MeshBasicMaterial({ color: '#F6F2E6', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const clay = M.clay.clone(); clay.polygonOffset = true; clay.polygonOffsetFactor = 1; clay.polygonOffsetUnits = 1;
  const meshes = [];
  model.traverse(o => { if (o.isMesh) meshes.push(o); });
  // Tracing the outline of every part of the detailed house took a third of a second in one go, landing in the
  // middle of a scroll when the model arrived late. It is done a few parts per frame, before the house is shown.
  await inFrames(meshes, o => {
    o.userData.mat = o.material;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 28), ink);
    edges.raycast = () => {};
    o.add(edges); o.userData.edges = edges;
  });
  st.scene.add(model);
  const setMode = mode => {
    meshes.forEach(o => {
      o.material = mode === 'line' ? paperFill : mode === 'clay' ? clay : o.userData.mat;
      o.userData.edges.visible = mode !== 'real';
      o.castShadow = mode !== 'line';
    });
    st.catcher.visible = mode !== 'line';
    ink.opacity = mode === 'clay' ? .45 : .85;
  };
  const btns = document.querySelectorAll('[data-bp-mode]');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => { x.setAttribute('aria-pressed', x === b); x.classList.toggle('active', x === b); });
    st.fade(() => setMode(b.dataset.bpMode));
  }));
  setMode('line');

  // Views: perspective, floor plan (cut at 1.5 m above the ground floor), section (cut through the middle).
  const planCut = new THREE.Plane(new THREE.Vector3(0, -1, 0), L0 + 1.5);
  const secCut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.4);
  const V = {
    persp: { pos: st.camera.position.clone(), tgt: st.controls.target.clone(), clip: [] },
    plan: { pos: new THREE.Vector3(0.01, 34, 3.5), tgt: new THREE.Vector3(0, 0, .2), clip: [planCut] },
    section: { pos: new THREE.Vector3(4, 7.5, 30), tgt: new THREE.Vector3(0, 5, 0), clip: [secCut] }
  };
  let tw = 1, from = null, to = null;
  const setView = v => {
    st.orbitView.leave(false);
    to = V[v];
    st.orbitView.setBase(to.pos, to.tgt); from = { pos: st.camera.position.clone(), tgt: st.controls.target.clone() }; tw = reduced ? 1 : 0;
    if (reduced) { st.camera.position.copy(to.pos); st.controls.target.copy(to.tgt); }
    st.renderer.clippingPlanes = to.clip;
    st.controls.autoRotate = false; sway = v === 'persp' && !reduced && !touched;
    st.controls.minPolarAngle = v === 'plan' ? 0 : .25;
    const cap = document.querySelector('[data-bp-caption]');
    if (cap) cap.textContent = { persp: 'Phối cảnh tổng thể', plan: 'Mặt bằng tầng trệt, cắt ở cao độ 1,5 m', section: 'Mặt cắt dọc qua giữa nhà' }[v];
  };
  st.ticks.push(dt => {
    if (st.orbitView.active) { tw = 1; return; }
    if (tw >= 1 || !to) return;
    tw = Math.min(1, tw + dt / 1.3);
    const e = 1 - Math.pow(1 - tw, 3);
    st.camera.position.lerpVectors(from.pos, to.pos, e);
    st.controls.target.lerpVectors(from.tgt, to.tgt, e);
  });
  st.controls.autoRotate = false;
  let sway = !reduced, touched = false, swayT = 0;
  st.controls.addEventListener('start', () => { touched = true; sway = false; });
  const sph = new THREE.Spherical().setFromVector3(st.camera.position.clone().sub(st.controls.target));
  st.ticks.push(dt => {
    if (st.orbitView.active || !sway || tw < 1) return;
    swayT += dt;
    sph.setFromVector3(st.camera.position.clone().sub(st.controls.target));
    sph.theta = .55 + Math.sin(swayT * .25) * .6;
    st.camera.position.setFromSpherical(sph).add(st.controls.target);
  });
  const vbtns = document.querySelectorAll('[data-bp-view]');
  vbtns.forEach(b => b.addEventListener('click', () => {
    vbtns.forEach(x => { x.setAttribute('aria-pressed', x === b); x.classList.toggle('active', x === b); });
    st.fade(() => setView(b.dataset.bpView));
  }));

  // Facade finish: changes the render coat in the "Vật liệu" view (and switches to it).
  const FACADE = { trang: ['#efe9da'], kem: ['#e6d9bf'], xam: ['#a8a49b'], 'dat-nung': ['#c07a55'] };
  const plasterMaps = {};
  const renderCoat = new Set(meshes.map(o => o.userData.mat).filter(m => m?.name === 'Render'));
  document.querySelectorAll('[data-bp-facade]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-bp-facade]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
    const k = b.dataset.bpFacade;
    st.fade(() => {
      renderCoat.forEach(m => m.color.set(FACADE[k][0]));
      M.plaster.map = plasterMaps[k] || (plasterMaps[k] = T.plaster(FACADE[k][0])); M.plaster.needsUpdate = true;
    });
    const real = document.querySelector('[data-bp-mode="real"]'); if (real && !real.classList.contains('active')) real.click();
  }));
  // Sun study: the hour of day moves the sun along its arc, so the shadows show how the house sits in the light.
  const sun = document.querySelector('[data-bp-sun]'), sunOut = document.querySelector('[data-bp-sun-out]');
  const setSun = h => {
    const a = (h - 6) / 12 * Math.PI, up = Math.sin(a);
    st.sun.position.set(Math.cos(a) * -18, Math.max(.6, up * 20), 9);
    st.sun.intensity = .35 + up * 2.3;
    st.sun.color.setHSL(.09, .55 - up * .35, .62 + up * .3);
    st.hemi.intensity = .2 + up * .4;
    if (sunOut) sunOut.textContent = String(Math.floor(h)).padStart(2, '0') + ':' + (h % 1 ? '30' : '00');
  };
  if (sun) {
    // The slider moves in half hours; the sun glides between them instead of jumping.
    let hour = +sun.value, goal = hour;
    const label = () => { if (sunOut) sunOut.textContent = String(Math.floor(goal)).padStart(2, '0') + ':' + (goal % 1 ? '30' : '00'); };
    setSun(hour); label();
    sun.addEventListener('input', () => { goal = +sun.value; label(); });
    st.ticks.push(dt => {
      if (Math.abs(goal - hour) < .002) return;
      hour += (goal - hour) * Math.min(1, dt * (reduced ? 60 : 5));
      setSun(hour); label();
    });
  }

  {
    const apply = glb ? assembleHouse(glb) : progress => applyParts(house.parts, progress);
    let pf = reduced ? 7 : 0, playing = false;
    apply(pf);
    new IntersectionObserver(([e], io) => { if (e.isIntersecting) { playing = true; io.disconnect(); } }, { threshold: .05 }).observe(el);
    st.ticks.push(dt => { if (playing && pf < 7) { pf = Math.min(7, pf + dt * 2.2); apply(pf); } });
    const replay = document.querySelector('[data-bp-replay]');
    if (replay) replay.addEventListener('click', () => { pf = reduced ? 7 : 0; apply(pf); playing = true; });
  }
  st.ready();
}

/* ---------- Nội thất: interior configurator ---------- */
// Space, floor, wall colour, battens, furniture wood, sofa fabric and light are all chosen by the visitor;
// the summary of the choices can be sent with the contact form.
async function initRoom(el) {
  const st = makeStage(el, { paper: true, cam: [6.2, 3.8, 7.2], target: [0, 1.1, -.6], auto: false, exposure: 1 });
  if (!st) return;
  const env = st.scene.environment;
  const M = makeMats();
  const tl = new THREE.TextureLoader();
  const photo = (url, rep, mat) => tl.load(url, t => {
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8;
    mat.map = t; mat.color.set('#ffffff'); mat.needsUpdate = true;
  });
  photo('img/materials/da-marble.jpg', 2, M.marbleFloor);
  const R = buildRoom(M);
  const extras = st.load(MODELS.extras).catch(e => { console.warn('ADDC room props unavailable', e); return null; });
  let roomFloor, roomWalls, backShell = [], sideShell = [];
  const roomWood = new Map(), roomFabric = new Set();
  const registerFinishes = model => model.traverse(obj => {
    if (!obj.isMesh) return;
    obj.castShadow = obj.receiveShadow = true;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach(m => {
      if (/^(Oak|Walnut)$/.test(m.name) && !roomWood.has(m)) roomWood.set(m, { map: m.map, color: m.color.clone() });
      if (m.name === 'Fabric') roomFabric.add(m);
    });
  });
  try {
    const model = await st.load(MODELS.room);
    const objects = model.children.slice();
    const named = name => objects.find(obj => obj.name === name);
    const floor = named('Floor');
    const walls = objects.filter(obj => /^Wall_/.test(obj.name));
    if (!floor?.isMesh || !walls.length) throw new Error('Missing room surfaces');
    roomFloor = floor.material;
    roomWalls = walls.map(obj => obj.material);
    backShell = [walls[0], named('Artwork'), named('ArtFrame')].filter(Boolean);
    sideShell = [...walls.slice(1), ...objects.filter(obj => /^(Window|Curtain)/.test(obj.name))];
    registerFinishes(model);
    R.group.clear();
    R.group.add(...objects, R.slats, R.bulb);
    R.floor = floor;
    R.walls = walls;
    R.art = named('Artwork') || R.art;
    R.shade = named('Pendant')?.children.find(obj => obj.isMesh) || R.shade;
    R.living = objects.filter(obj => /^(Rug|Sofa_|Armchair_|Sideboard|CoffeeTable|Book|Vase|Ceramic_)/.test(obj.name));
  } catch (e) { console.warn('Using procedural room', e); }
  const g = R.group; st.scene.add(g);
  const upgradedSlats = (await extras)?.getObjectByName('WallSlats');
  if (upgradedSlats) {
    R.slats.removeFromParent();
    registerFinishes(upgradedSlats);
    upgradedSlats.visible = false;
    g.add(upgradedSlats);
    R.slats = upgradedSlats;
  }
  const { slats, art, shade, bulb } = R;
  let showSlats = false;

  // Floors
  const terr = M.terrazzo.clone(); terr.map = T.terrazzo(); terr.map.repeat.set(3, 2.5);
  const tiles = M.encaustic.clone(); tiles.map = T.encaustic(); tiles.map.repeat.set(30, 25);
  const FLOORS = { go: M.floorWood, da: M.marbleFloor, 'xi-mang': M.microcement, terrazzo: terr, 'gach-bong': tiles };
  // Walls
  const wallMat = {};
  const WALLS = { kem: '#ece5d2', trang: '#f4f2ec', reu: '#4f6a57', 'dat-nung': '#b06a4a', xam: '#9a968e' };
  const wall = k => wallMat[k] || (wallMat[k] = new THREE.MeshStandardMaterial({ map: T.plaster(WALLS[k]), roughness: .95 }));
  // Furniture wood: oak, walnut or white lacquer, applied to the shared materials so every piece follows.
  const woods = { oakMap: M.oak.map, walnutMap: M.walnut.map };
  const WOOD = {
    soi: () => { M.oak.map = woods.oakMap; M.walnut.map = woods.walnutMap; M.oak.color.set('#ffffff'); M.walnut.color.set('#ffffff'); },
    'oc-cho': () => { M.oak.map = woods.walnutMap; M.walnut.map = woods.walnutMap; M.oak.color.set('#ffffff'); M.walnut.color.set('#cfc6bd'); },
    trang: () => { M.oak.map = null; M.walnut.map = null; M.oak.color.set('#ebe8e1'); M.walnut.color.set('#d9d5cc'); }
  };
  const FABRIC = { be: '#bdb3a0', reu: '#5c7462', 'dat-nung': '#a6654a', than: '#45433f' };

  // Furniture sets for three kinds of room; living is the set already in the room.
  const sets = { 'phong-khach': new THREE.Group(), 'phong-ngu': new THREE.Group(), 'lam-viec': new THREE.Group() };
  R.living.forEach(o => { g.remove(o); sets['phong-khach'].add(o); });
  const bed = FURNITURE.giuong(M); bed.position.set(.3, 0, -1.3); sets['phong-ngu'].add(bed);
  const ward = FURNITURE['tu-ao'](M); ward.position.set(-2.55, 0, .7); ward.rotation.y = Math.PI / 2; sets['phong-ngu'].add(ward);
  sets['phong-ngu'].add(block(2.6, .02, 1.9, M.rug, .3, 0, .4));
  const desk = FURNITURE['ban-lam-viec'](M); desk.position.set(.4, 0, -1.6); sets['lam-viec'].add(desk);
  const shelf = FURNITURE['ke-sach'](M); shelf.position.set(-2.6, 0, -.4); shelf.rotation.y = Math.PI / 2; sets['lam-viec'].add(shelf);
  const reading = new THREE.Group();
  reading.add(mesh(new RoundedBoxGeometry(.8, .38, .8, 2, .08), M.fabric, 0, .38, 0), mesh(new RoundedBoxGeometry(.8, .6, .14, 2, .06), M.fabric, 0, .8, -.36));
  reading.position.set(2.1, 0, .5); reading.rotation.y = -1.1; sets['lam-viec'].add(reading);
  Object.values(sets).forEach(x => g.add(x));
  let pop = null;

  const set = {
    space: v => { Object.entries(sets).forEach(([k, grp]) => { grp.visible = k === v; }); pop = { grp: sets[v], t: 0 }; },
    floor: v => { R.floor.material = v === 'go' && roomFloor ? roomFloor : FLOORS[v]; },
    wall: v => {
      R.walls.forEach((o, i) => { o.material = v === 'kem' && roomWalls ? roomWalls[i] : wall(v); });
      if (!roomWalls) art.material = v === 'reu' ? M.paintCream : M.paintMoss;
    },
    lam: v => { showSlats = v === 'co'; },
    wood: v => {
      WOOD[v](); [M.oak, M.walnut].forEach(m => { m.needsUpdate = true; });
      roomWood.forEach(({ map, color }, m) => {
        m.map = v === 'trang' ? null : map;
        m.color.copy(color);
        if (v === 'trang') m.color.set('#ebe8e1');
        if (v === 'oc-cho') m.color.multiply(new THREE.Color('#b88f70'));
        m.needsUpdate = true;
      });
    },
    fabric: v => { [M.fabric, ...roomFabric].forEach(m => m.color.set(FABRIC[v])); },
    light: v => {
      const L = { ngay: [2.6, [-9, 9, 2], '#fff3df', .55, 0, 1], chieu: [2.1, [-10, 3.2, 5], '#ffb070', .32, 5, 1.08], toi: [.12, [-8, 4, 1], '#9bb0ff', .06, 14, 1.25] }[v];
      st.sun.intensity = L[0]; st.sun.position.set(...L[1]); st.sun.color.set(L[2]); st.hemi.intensity = L[3];
      bulb.intensity = L[4]; st.renderer.toneMappingExposure = L[5];
      st.scene.environment = v === 'toi' ? null : env;
      shade.material.emissive = new THREE.Color(v === 'ngay' ? '#000000' : '#5a3d14');
    }
  };
  st.ticks.push(dt => {
    const { x, z } = st.camera.position;
    const hideBack = st.orbitView.active && z < -2.45;
    const hideSide = st.orbitView.active && x < -2.92;
    backShell.forEach(part => { part.visible = !hideBack; });
    sideShell.forEach(part => { part.visible = !hideSide; });
    slats.visible = showSlats && !hideBack;
    if (!pop) return;
    pop.t = Math.min(1, pop.t + dt * 2.2);
    const e = easeOut(pop.t); pop.grp.position.y = (1 - e) * .5; pop.grp.scale.setScalar(.92 + .08 * e);
    if (pop.t >= 1) pop = null;
  });

  const summary = document.querySelector('[data-room-summary]');
  const order = ['space', 'floor', 'wall', 'lam', 'wood', 'fabric', 'light'];
  const describe = () => order.map(k => {
    const b = document.querySelector(`[data-room="${k}"].active`);
    return b ? (b.getAttribute('title') || b.textContent.trim()) : '';
  }).filter(Boolean);
  const choose = (b, animate) => {
    const k = b.dataset.room;
    document.querySelectorAll(`[data-room="${k}"]`).forEach(x => { x.setAttribute('aria-pressed', x === b); x.classList.toggle('active', x === b); });
    if (animate) st.fade(() => set[k](b.dataset.v)); else set[k](b.dataset.v);
    if (summary) summary.innerHTML = '<b>Cấu hình đang xem:</b> ' + describe().join(', ');
  };
  document.querySelectorAll('[data-room]').forEach(b => b.addEventListener('click', () => choose(b, true)));
  // Start from whatever the page marks as active in each group.
  order.forEach(k => { const b = document.querySelector(`[data-room="${k}"].active`) || document.querySelector(`[data-room="${k}"]`); if (b) choose(b); });
  const presets = [
    [sets['phong-ngu'], bed, 'giuong'],
    [sets['phong-ngu'], ward, 'tu-ao'],
    [sets['lam-viec'], desk, 'ban-lam-viec'],
    [sets['lam-viec'], shelf, 'ke-sach'],
  ];
  const refreshFinishes = () => ['wood', 'fabric'].forEach(key => {
    const active = document.querySelector(`[data-room="${key}"].active`);
    if (active) set[key](active.dataset.v);
  });
  presets.forEach(async ([group, original, id]) => {
    try {
      const model = await st.load(MODELS[id]);
      registerFinishes(model);
      const { x, y, z } = original.position;
      group.add(mountedModel(model, { x, y, z, angle: original.rotation.y }));
      original.removeFromParent();
      refreshFinishes();
    } catch (e) { console.warn('ADDC preset piece unavailable', id, e); }
  });
  const extraModel = await extras;
  const bedroomRug = extraModel?.getObjectByName('BedroomRug');
  if (bedroomRug) {
    sets['phong-ngu'].children.find(obj => obj.material === M.rug)?.removeFromParent();
    registerFinishes(bedroomRug);
    sets['phong-ngu'].add(bedroomRug);
  }
  const readingChair = extraModel?.getObjectByName('ReadingChair');
  if (readingChair) {
    registerFinishes(readingChair);
    sets['lam-viec'].add(mountedModel(readingChair, { x: 2.1, z: .5, angle: -1.1 }));
    reading.removeFromParent();
    refreshFinishes();
  }
  const send = document.querySelector('[data-room-send]');
  if (send) send.addEventListener('click', () => {
    const msg = document.getElementById('contactMessage'), svc = document.getElementById('contactService');
    if (msg) msg.value = 'Tôi muốn tư vấn nội thất theo cấu hình: ' + describe().join(', ') + '.';
    if (svc) [...svc.options].forEach((o, i) => { if (/nội thất/i.test(o.text)) svc.selectedIndex = i; });
  });
  st.ready();
}

function buildRoom(M) {
  const g = new THREE.Group();
  const floor = block(6, .1, 5, M.floorWood, 0, -.1, 0);
  const back = block(6, 3, .15, M.paintCream, 0, 0, -2.5);
  const leftParts = [block(.15, .9, 5, M.paintCream, -3, 0, 0), block(.15, .6, 5, M.paintCream, -3, 2.4, 0),
    block(.15, 1.5, 1.4, M.paintCream, -3, .9, -1.8), block(.15, 1.5, 1.8, M.paintCream, -3, .9, 1.6)];
  const glassPane = block(.03, 1.5, 2.0, M.glass, -3, .9, -.1);
  const frame = [block(.08, .05, 2.0, M.alu, -3, .9, -.1), block(.08, .05, 2.0, M.alu, -3, 2.35, -.1), block(.08, 1.5, .05, M.alu, -3, .9, -.1)];
  const slats = new THREE.Group();
  for (let i = 0; i < 26; i++) slats.add(block(.05, 3, .06, M.walnut, -2.9 + i * .22 + .1, 0, -2.38));
  slats.visible = false;
  const rug = block(2.8, .02, 2, M.rug, .3, 0, .1);
  const sofa = new THREE.Group();
  sofa.add(block(2.5, .42, .95, M.fabric, 0, 0, 0), block(2.5, .55, .22, M.fabric, 0, .42, -.36),
    block(.22, .6, .95, M.fabric, -1.14, 0, 0), block(.22, .6, .95, M.fabric, 1.14, 0, 0));
  [-.55, .55].forEach(x => sofa.add(mesh(new RoundedBoxGeometry(1.0, .16, .7, 2, .06), M.fabric, x, .5, .06)));
  sofa.position.set(.3, 0, -1.65);
  const table = new THREE.Group();
  table.add(mesh(new THREE.CylinderGeometry(.55, .55, .05, 48), M.walnut, 0, .42, 0), mesh(new THREE.CylinderGeometry(.12, .2, .4, 24), M.walnut, 0, .2, 0));
  table.position.set(.3, 0, .15);
  const chair = new THREE.Group();
  chair.add(mesh(new RoundedBoxGeometry(.8, .38, .8, 2, .08), M.fabricMoss, 0, .38, 0), mesh(new RoundedBoxGeometry(.8, .6, .14, 2, .06), M.fabricMoss, 0, .8, -.36));
  [[-.34, -.34], [.34, -.34], [-.34, .34], [.34, .34]].forEach(([x, z]) => chair.add(block(.05, .2, .05, M.oak, x, 0, z)));
  chair.position.set(2.2, 0, .4); chair.rotation.y = -1.25;
  const sideboard = block(.45, .62, 1.7, M.walnut, -2.7, 0, -.1);
  const cord = mesh(new THREE.CylinderGeometry(.006, .006, .9, 6), M.alu, .3, 2.55, .15);
  const shade = mesh(new THREE.ConeGeometry(.32, .3, 40, 1, true), M.brass, .3, 1.98, .15);
  shade.material = M.brass.clone(); shade.material.side = THREE.DoubleSide;
  const bulb = new THREE.PointLight('#ffcf8a', 0, 7, 1.6); bulb.position.set(.3, 1.8, .15); bulb.castShadow = true; bulb.shadow.mapSize.set(1024, 1024);
  const pot = new THREE.Group();
  pot.add(mesh(new THREE.CylinderGeometry(.2, .16, .45, 24), M.concrete, 0, .225, 0));
  [[0, .9, 0, .38], [.15, 1.2, .05, .28], [-.12, 1.15, -.06, .3]].forEach(([x, y, z, r]) => pot.add(mesh(new THREE.IcosahedronGeometry(r, 1), M.leaf, x, y, z)));
  pot.position.set(-2.45, 0, -2.0);
  const art = block(1.0, .7, .03, M.paintMoss, -.9, 1.5, -2.4);
  const artFrame = block(1.06, .76, .02, M.oak, -.9, 1.47, -2.415);
  [floor, back, ...leftParts, glassPane, ...frame, slats, rug, sofa, table, chair, sideboard, cord, shade, pot, artFrame, art].forEach(o => g.add(o));
  g.add(bulb);
  return { group: g, floor, walls: [back, ...leftParts], slats, art, shade, bulb, living: [rug, sofa, table, chair, sideboard] };
}


/* ---------- Home: one camera from the empty plot to the finished living room ---------- */
// Scroll through the six steps drives everything: survey stakes, the house drawn as blueprint lines, piles and frame
// rising, finishes and lights, then the camera flies through the front glass into the furnished ground floor.
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
async function initJourney(el) {
  const section = el.closest('.build');
  const st = makeStage(el, { cam: [24, 30, 30], target: [0, 0, 0], auto: false, exposure: 1.05 });
  if (!st) return;
  const M = makeMats();
  const house = buildHouse(M);
  st.scene.add(house.group);
  const phases = createPhasePlayer(st.scene, MODELS.phases, st.load, prioritizeModel);
  st.sun.position.set(10, 18, 12);
  st.scene.background = null;

  // Blueprint: edges of the permanent structure, one merged line set per phase so each draws in on its own.
  const lineMat = k => new THREE.LineBasicMaterial({ color: '#9cc3ff', transparent: true, opacity: 0, depthWrite: false });
  const wire = [1, 2, 3, 4, 5].map(ph => {
    const geos = [];
    house.parts.forEach(pt => {
      const o = pt.obj;
      if (pt.phase !== ph || pt.until !== undefined || !o.isMesh || o.material === M.warm) return;
      o.updateMatrix();
      const m = o.matrix.clone();
      m.setPosition(o.position.x, o.userData.base, o.position.z);
      const e = new THREE.EdgesGeometry(o.geometry, 25); e.applyMatrix4(m); geos.push(e);
    });
    const ls = new THREE.LineSegments(mergeGeometries(geos), lineMat());
    ls.renderOrder = 2; st.scene.add(ls); return ls;
  });
  // Survey: a drawing grid on the ground and stakes at each column axis.
  const grid = new THREE.GridHelper(36, 72, '#5d7fb3', '#3a4f70');
  grid.material.transparent = true; grid.material.opacity = 0; grid.position.y = .02; st.scene.add(grid);
  const stakes = new THREE.Group();
  XS.forEach(x => ZS.forEach(z => { const s = mesh(new THREE.CylinderGeometry(.04, .04, .7, 8), M.pressRed, x, .35, z); stakes.add(s); }));
  const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-W / 2, D / 2], [W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]].map(([x, z]) => new THREE.Vector3(x, .05, z))), new THREE.LineBasicMaterial({ color: '#e9a47f', transparent: true }));
  stakes.add(outline); st.scene.add(stakes);
  const survey = st.load(MODELS.extras).then(extras => {
    const stake = extras.getObjectByName('SurveyStake');
    if (!stake) return;
    stakes.clear();
    XS.forEach(x => ZS.forEach(z => {
      const placed = stake.clone(true);
      placed.position.set(x, 0, z);
      placed.traverse(obj => { if (obj.isMesh) obj.castShadow = true; });
      stakes.add(placed);
    }));
    stakes.add(outline);
  }).catch(e => console.warn('ADDC survey props unavailable', e));

  // Furnished ground floor, seen at the end of the flight.
  const room = new THREE.Group(), y0 = L0;
  const sofa = FURNITURE.sofa(M); sofa.position.set(1.7, y0, -.9); room.add(sofa);
  const tbl = FURNITURE['ban-tra'](M); tbl.position.set(1.7, y0, .35); room.add(tbl);
  room.add(block(W - .7, .02, D - .7, M.floorWood, 0, y0, 0));
  room.add(block(3.2, .02, 2.4, M.rug, 1.7, y0 + .02, .1));
  const dining = FURNITURE['ban-an'](M); dining.position.set(-1.8, y0, -3.2); room.add(dining);
  const shelf = FURNITURE['tu-ao'](M); shelf.position.set(3.25, y0, -2.6); shelf.rotation.y = -Math.PI / 2; room.add(shelf);
  const plant = new THREE.Group();
  plant.add(mesh(new THREE.CylinderGeometry(.2, .16, .45, 24), M.concrete, 0, .225, 0));
  [[0, .9, 0, .38], [.15, 1.2, .05, .28], [-.12, 1.15, -.06, .3]].forEach(([x, y, z, r]) => plant.add(mesh(new THREE.IcosahedronGeometry(r, 1), M.leaf, x, y, z)));
  plant.position.set(3.1, y0, 1.2); room.add(plant);
  const shade = mesh(new THREE.ConeGeometry(.3, .28, 40, 1, true), M.brass, 1.7, y0 + 2.2, .35); room.add(shade);
  const lamp = new THREE.PointLight('#ffcf8a', 0, 9, 1.4); lamp.position.set(1.7, y0 + 2.0, .35);
  // The lamp stays in the scene at all times (intensity 0 until inside): a light that comes and goes changes the
  // light count, and every material in the scene is then recompiled mid-scroll.
  st.scene.add(lamp);
  room.add(block(1.1, .75, .03, M.paintMoss, -1.8, y0 + 1.5, -D / 2 + .25));
  room.visible = false; st.scene.add(room);
  const rebuiltRoom = new THREE.Group();
  rebuiltRoom.name = 'ADDC rebuilt walkthrough interior';
  rebuiltRoom.visible = false;
  st.scene.add(rebuiltRoom);
  st.load(MODELS.room).then(async model => {
    const decor = model.children.filter(obj => /^(Sofa_|CoffeeTable|Book$|Vase$|PlantPot$|Fig|Pendant|ArtFrame$|Artwork$|Rug$)/.test(obj.name));
    if (!decor.length) return;
    const living = new THREE.Group();
    decor.forEach(obj => {
      obj.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true; });
      living.add(obj);
    });
    living.position.set(1.35, L0, -.15);
    const floor = model.getObjectByName('Floor');
    if (floor) {
      const thickness = new THREE.Box3().setFromObject(floor).getSize(new THREE.Vector3()).y;
      rebuiltRoom.add(mountedModel(floor, { y: L0 + .006 - thickness, width: W - .7, depth: D - .7 }));
    }
    rebuiltRoom.add(living);
    const furnishings = [
      ['ban-an', { x: -1.8, y: L0, z: -3.2 }],
      ['tu-ao', { x: 3.25, y: L0, z: -2.6, angle: -Math.PI / 2 }],
    ];
    await Promise.all(furnishings.map(async ([id, placement]) => {
      try { rebuiltRoom.add(mountedModel(await st.load(MODELS[id]), placement)); }
      catch (e) { console.warn('ADDC walkthrough furniture unavailable', id, e); }
    }));
  }).catch(e => console.warn('ADDC walkthrough interior unavailable', e));
  const glows = house.parts.filter(pt => pt.obj.material === M.warm).map(pt => pt.obj);

  // Camera path: [step, position, target, field of view].
  const K = [
    [0, [26, 34, 32], [0, 0, 0], 32], [1, [22, 26, 28], [0, 1, 0], 32], [2.2, [24, 19, 30], [0, 5, 0], 32],
    [3.4, [22, 14, 28], [0, 4, 0], 32], [4.6, [24, 16, 28], [0, 5, 0], 32], [5.05, [22, 12, 27], [0, 5, 0], 32],
    [5.45, [1.6, 3.4, 21], [.8, 2.6, 4], 34], [5.75, [.9, 1.8, 7.5], [.9, 1.6, 0], 46], [6, [.6, 1.7, 3.4], [1.5, 1.3, -1.4], 58]
  ];
  const v = new THREE.Vector3(), tg = new THREE.Vector3(), pos = new THREE.Vector3(...K[0][1]), look = new THREE.Vector3(...K[0][2]);
  const sample = t => {
    let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const [a, pa, ta, fa] = K[i], [b, pb, tb, fb] = K[i + 1];
    const u = smooth(a, b, t);
    v.set(...pa).lerp(tg.set(...pb), u);
    const p = v.clone();
    v.set(...ta).lerp(tg.set(...tb), u);
    return [p, v.clone(), fa + (fb - fa) * u];
  };

  let target = 0, t = 0;
  const read = () => {
    const r = section.getBoundingClientRect();
    target = clamp(-r.top / (r.height - innerHeight), 0, 1) * 6;
  };
  addEventListener('scroll', read, { passive: true });
  addEventListener('resize', read);
  read(); t = target;

  st.ticks.push(dt => {
    t += (target - t) * Math.min(1, dt * (reduced ? 60 : 4));
    // Build: nothing until the contract step, piles at step 4, structure through step 5, finishes and lights in step 6.
    const pf = t < 3 ? 0 : t < 4 ? (t - 3) * 1.2 : t < 5 ? 1.2 + (t - 4) * 3.8 : Math.min(7.2, 5 + (t - 5) * 5.5);
    if (t < 3) phases.hide();
    const interior = t > 5.78 && rebuiltRoom.children.length > 0;
    house.group.visible = t >= 3 && !phases.draw(pf, { reduced, interior });
    if (house.group.visible) applyParts(house.parts, pf);
    const show = smooth(1, 1.5, t) * (1 - smooth(4.4, 5.1, t));
    wire.forEach((ls, i) => { const d = smooth(1.1 + i * .22, 1.5 + i * .22, t); ls.material.opacity = .9 * show * d; ls.visible = ls.material.opacity > .01; ls.scale.y = Math.max(d, .001); });
    grid.material.opacity = .45 * (1 - smooth(3, 3.6, t)); grid.visible = grid.material.opacity > .01;
    const sv = smooth(0, .5, t) * (1 - smooth(3.2, 3.8, t)); stakes.visible = sv > .01; stakes.scale.setScalar(Math.max(sv, .001));
    const inside = smooth(5.55, 5.85, t);
    rebuiltRoom.visible = inside > .01 && rebuiltRoom.children.length > 0;
    room.visible = inside > .01 && !rebuiltRoom.visible;
    lamp.intensity = 6 * inside;
    glows.forEach(g => { g.visible = g.visible && t < 5.38; });
    const [p, l, f] = sample(t);
    pos.lerp(p, Math.min(1, dt * 6)); look.lerp(l, Math.min(1, dt * 6));
    st.orbitView.follow(pos, look, f);
  });
  await survey;
  st.ready();
}

/* Builders exposed for export-3d.html, which turns the procedural models into GLB files for the 3D tool. */
export { makeMats, SAMPLES, FURNITURE, DETAILS, buildHouse, applyParts, buildRoom, fitTo };

/* ---------- Boot ---------- */
const boot = { journey: initJourney, materials: initMaterials, furniture: initFurniture, details: initDetails, build: initBuild, blueprint: initBlueprint, room: initRoom };
// Each stage is built only when it comes near the screen, so shader compiling never lands on a frame the visitor is watching.
const built = new Set();
const build = el => {
  if (built.has(el)) return;
  built.add(el); lazy.unobserve(el);
  const f = boot[el.dataset['3d']];
  const lbl = el.querySelector('.bm-stage-say'); if (lbl && lbl.firstChild) lbl.firstChild.textContent = 'Đang dựng mô hình ';
  // The home loader waits for this before lifting, so the stage setup happens behind it.
  if (f) f(el).then(() => document.dispatchEvent(new Event('addc:stage-built')))
    .catch(err => { console.error(err); fail(el, 'Không dựng được mô hình 3D trên thiết bị này.'); document.dispatchEvent(new Event('addc:stage-built')); });
};
const lazy = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && build(e.target)), { rootMargin: '1600px 0px' });
const stages = [...document.querySelectorAll('[data-3d]')];
// On the home page the loader decides when stages are built (behind its still final photo).
const loaderUp = !!document.getElementById('loader') && !document.documentElement.classList.contains('loaded') && !document.documentElement.dataset.formed;
if (!loaderUp) stages.forEach(el => lazy.observe(el)); else document.addEventListener('addc:formed', () => stages.forEach(el => lazy.observe(el)), { once: true });
// Every model this page shows is downloaded in the background from the start, nearest stage first, so it is already on
// the machine when the visitor scrolls to it. Downloading never blocks the page; only parsing does, and that waits.
const STAGE_MODELS = {
  journey: () => [...MODELS.phases, MODELS.room, MODELS.extras, MODELS['ban-an'], MODELS['tu-ao']],
  build: () => MODELS.phases,
  blueprint: () => [MODELS.house],
  details: () => Object.values(MODELS.details || {}),
  materials: () => ['be-tong', 'thep', 'gach', 'da', 'go', 'gach-op', 'kinh', 'terrazzo'].map(k => MODELS[k]),
  furniture: () => ['sofa', 'ban-tra', 'ban-an', 'ghe-an', 'tu-bep', 'giuong', 'tu-ao', 'ban-lam-viec', 'ke-sach'].map(k => MODELS[k]),
  room: () => [MODELS.room, MODELS.extras, MODELS.giuong, MODELS['tu-ao'], MODELS['ban-lam-viec'], MODELS['ke-sach']]
};
const saveData = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
// The background downloads wait until the first screen is ready (the home loader has opened, or the page has loaded),
// so they never take bandwidth from the pictures the visitor is looking at first.
const preloadAll = () => { if (!saveData) preloadModels(stages.flatMap(el => (STAGE_MODELS[el.dataset['3d']] || (() => []))())); };
if (document.getElementById('loader') && !document.documentElement.classList.contains('loaded')) document.addEventListener('addc:loaded', preloadAll, { once: true });
else if (document.readyState === 'complete') setTimeout(preloadAll, 200);
else addEventListener('load', () => setTimeout(preloadAll, 200), { once: true });
// Every stage is built as soon as this module arrives, while the visitor is still on the first screen
// (on the home page the module itself is only fetched after the intro, at an idle moment).
// Building later meant shader compiles landing in the middle of a scroll.
// On the home page the loader says when: stages are built behind its still final photo, never under its animation.
const buildAll = () => stages.forEach((el, i) => setTimeout(() => whenQuiet(() => build(el)), i * 120));
if (loaderUp) document.addEventListener('addc:formed', buildAll, { once: true }); else buildAll();
// Stages further down are built ahead of time, but only in a truly idle moment (no scrolling or animation running).
if ('requestIdleCallback' in window) {
  const next = () => requestIdleCallback(d => {
    const el = stages.find(x => !built.has(x));
    if (!el) return;
    if (d.timeRemaining() > 40) build(el);
    next();
  }, { timeout: 0 });
  setTimeout(next, 1500);
}
