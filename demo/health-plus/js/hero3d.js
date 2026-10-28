/* Health Plus Clinic — hero scene.
   A modelled branch (procedural, shaped after the reference photo) lit by a low sun.
   It opens in winter and a wave of life runs from the trunk out to every twig:
   buds swell, leaves unfold, moss creeps over the bark, blossoms open, and the
   light, sky and air warm up. The word HOPE stands behind the branch and catches
   the leaf shadows. Progress P runs 0 → 1.35. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const host = document.getElementById('spring');
const hero = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 700;

/* ---------- seeded random so the branch is the same on every visit ---------- */
let seed = 20261028;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const rr = (a, b) => a + (b - a) * rnd();

/* ---------- renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: 'high-performance' });
} catch (e) { hero && hero.classList.add('no-webgl'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 200);
const U = { uP: { value: 0 }, uTime: { value: 0 } };

/* ---------- sky dome ---------- */
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(120, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: Object.assign({
      uSun: { value: new THREE.Vector3(0.55, 0.5, 0.65).normalize() }
    }, U),
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uP; uniform vec3 uSun; varying vec3 vDir;
      void main(){
        float s = clamp(uP / 1.1, 0.0, 1.0); s = s*s*(3.0-2.0*s);
        float h = clamp(vDir.y * 1.7 + 0.45, 0.0, 1.0);
        vec3 wTop = vec3(0.60, 0.66, 0.72), wBot = vec3(0.86, 0.88, 0.89);
        vec3 sTop = vec3(0.22, 0.55, 0.88), sBot = vec3(0.90, 0.96, 0.93);
        vec3 col = mix(mix(wBot, wTop, pow(h, 0.8)), mix(sBot, sTop, pow(h, 0.9)), s);
        float g = max(dot(normalize(vDir), uSun), 0.0);
        col += vec3(1.0, 0.86, 0.6) * (pow(g, 12.0) * 0.9 + pow(g, 3.0) * 0.18) * (0.15 + 0.85 * s);
        gl_FragColor = vec4(col, 1.0);
      }`
  })
);
scene.add(sky);
scene.fog = new THREE.Fog(0xdde3e6, 24, 70);

/* ---------- light ---------- */
const hemi = new THREE.HemisphereLight(0xdfe8ef, 0x7a6a58, 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(9, 13, 11);
sun.castShadow = true;
sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 9, bottom: -9, near: 1, far: 50 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbfd8ff, 0.25);
fill.position.set(-8, 2, 6);
scene.add(fill);

/* ---------- procedural textures ---------- */
function noiseCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }

// bark: long vertical fissures with plates between them
const barkH = noiseCanvas(512, 1024, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1900; i++) {
    const x = rnd() * w, y = rnd() * h, len = rr(30, 160), wd = rr(1.5, 6);
    const v = rnd() < 0.45 ? rr(40, 90) : rr(150, 225);
    g.strokeStyle = `rgba(${v},${v},${v},${rr(0.25, 0.7)})`; g.lineWidth = wd;
    g.beginPath(); g.moveTo(x, y);
    g.bezierCurveTo(x + rr(-8, 8), y + len * 0.33, x + rr(-10, 10), y + len * 0.66, x + rr(-6, 6), y + len);
    g.stroke();
    // wrap vertically
    if (y + len > h) { g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + rr(-6, 6), y - h + len); g.stroke(); }
  }
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 40; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
});
function normalFrom(src, strength) {
  const w = src.width, h = src.height, s = src.getContext('2d').getImageData(0, 0, w, h).data;
  return noiseCanvas(w, h, (g) => {
    const out = g.createImageData(w, h), o = out.data;
    const at = (x, y) => s[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength, dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      o[i] = (dx / l * 0.5 + 0.5) * 255; o[i + 1] = (dy / l * 0.5 + 0.5) * 255; o[i + 2] = (1 / l * 0.5 + 0.5) * 255; o[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
  });
}
const barkCol = noiseCanvas(512, 1024, (g, w, h) => {
  g.drawImage(barkH, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = '#cdbca6'; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(${rr(70, 110)},${rr(55, 80)},${rr(40, 60)},${rr(0.08, 0.2)})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, rr(10, 40), rr(30, 120), 0, 0, 7); g.fill(); }
});
const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
const barkMap = tex(barkCol, true), barkNormal = tex(normalFrom(barkH, 3.2), false);

/* ---------- branch skeleton ---------- */
const segs = [];   // each: { nodes: [{p, r, d}], depth }
function grow(p0, dir0, len, r0, r1, depth, d0) {
  const nodes = [], step = depth === 0 ? 0.16 : depth === 1 ? 0.12 : 0.07;
  const p = p0.clone(), dir = dir0.clone().normalize();
  const n = Math.max(3, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.9));
    nodes.push({ p: p.clone(), r, d: d0 + t * len });
    // wander, plus twigs leaning towards the light and limbs sagging a little
    dir.x += rr(-1, 1) * 0.07; dir.y += rr(-1, 1) * 0.07 + (depth >= 2 ? 0.022 : depth === 1 ? -0.012 : 0); dir.z += rr(-1, 1) * 0.05;
    dir.normalize();
    p.addScaledVector(dir, len / n);
  }
  const seg = { nodes, depth };
  segs.push(seg);
  if (depth >= 4) return seg;
  // children
  const count = [5, 6, 4, 2][depth];
  for (let k = 0; k < count; k++) {
    const t = depth === 0 ? rr(0.22, 0.92) : rr(0.18, 0.95);
    const i = Math.min(nodes.length - 2, Math.floor(t * (nodes.length - 1)));
    const nd = nodes[i];
    const pd = nodes[i + 1].p.clone().sub(nd.p).normalize();
    // branch off sideways, mostly in the picture plane, biased up and outward (left)
    const side = rnd() < 0.62 ? 1 : -1;
    const axis = new THREE.Vector3(rr(-0.25, 0.25), rr(-0.25, 0.25), 1).normalize();
    const cd = pd.clone().applyAxisAngle(axis, side * rr(0.45, 0.95));
    cd.z += rr(-0.35, 0.35); cd.y += depth >= 2 ? 0.12 : 0.02;
    const remaining = len * (1 - t);
    const cl = depth === 0 ? rr(2.6, 4.8) : Math.max(0.35, remaining * rr(0.55, 0.95) + rr(0.2, 0.6) / (depth + 1));
    const cr = nd.r * rr(0.5, 0.72);
    grow(nd.p, cd, cl, cr, Math.max(0.008, cr * 0.18), depth + 1, nd.d);
  }
  return seg;
}
// trunk enters from the right, fork at centre: one limb rising left, one dropping left
const trunk = grow(new THREE.Vector3(11.5, 3.9, -0.3), new THREE.Vector3(-1, -0.3, 0.03), 7.0, 0.62, 0.34, 0, 0);
const forkNode = trunk.nodes[trunk.nodes.length - 1];
grow(forkNode.p, new THREE.Vector3(-1, 0.16, 0.08), 10.5, 0.34, 0.03, 1, forkNode.d);
grow(forkNode.p, new THREE.Vector3(-1, -0.12, -0.05), 8.0, 0.26, 0.025, 1, forkNode.d);
let maxD = 0; segs.forEach(s => s.nodes.forEach(n => { maxD = Math.max(maxD, n.d); }));

/* ---------- tube geometry with taper, gnarl and a growth attribute ---------- */
function buildTubes() {
  const pos = [], nor = [], uv = [], grw = [], idx = [];
  let base = 0;
  const up = new THREE.Vector3(0, 1, 0), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  segs.forEach(seg => {
    const nodes = seg.nodes, radial = seg.depth === 0 ? 22 : seg.depth === 1 ? 14 : seg.depth === 2 ? 8 : 5;
    let prevN = null, along = 0;
    nodes.forEach((nd, i) => {
      const a = nodes[Math.max(0, i - 1)].p, b = nodes[Math.min(nodes.length - 1, i + 1)].p;
      T.subVectors(b, a).normalize();
      if (!prevN) { N.crossVectors(T, Math.abs(T.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize(); }
      else { N.copy(prevN).sub(T.clone().multiplyScalar(prevN.dot(T))).normalize(); }   // parallel transport
      prevN = N.clone();
      B.crossVectors(T, N).normalize();
      if (i > 0) along += nd.p.distanceTo(nodes[i - 1].p);
      const circ = Math.max(1, Math.round(nd.r * 2 * Math.PI / 0.9));
      for (let j = 0; j <= radial; j++) {
        const ang = j / radial * Math.PI * 2;
        const c = Math.cos(ang), s = Math.sin(ang);
        let r = nd.r;
        if (seg.depth <= 1) r *= 1 + 0.07 * Math.sin(ang * 3 + along * 2.1) + 0.05 * Math.sin(ang * 7 - along * 4.3) + 0.04 * Math.sin(along * 9.0);
        const nx = N.x * c + B.x * s, ny = N.y * c + B.y * s, nz = N.z * c + B.z * s;
        pos.push(nd.p.x + nx * r, nd.p.y + ny * r, nd.p.z + nz * r);
        nor.push(nx, ny, nz);
        uv.push(j / radial * circ, along / 0.9);
        grw.push(nd.d / maxD);
      }
      if (i > 0) {
        const r0 = base + (i - 1) * (radial + 1), r1 = base + i * (radial + 1);
        for (let j = 0; j < radial; j++) idx.push(r0 + j, r1 + j, r0 + j + 1, r1 + j, r1 + j + 1, r0 + j + 1);
      }
    });
    base += nodes.length * (radial + 1);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aGrow', new THREE.Float32BufferAttribute(grw, 1));
  g.setIndex(idx);
  return g;
}

const NOISE = `
  float hh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x), mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x), f.y),
               mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x), mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x), f.y), f.z); }
  float fb(vec3 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*vn(p); p*=2.07; a*=0.5; } return v; }
`;

const barkMat = new THREE.MeshStandardMaterial({ map: barkMap, normalMap: barkNormal, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.92, metalness: 0 });
barkMat.onBeforeCompile = (sh) => {
  sh.uniforms.uP = U.uP;
  sh.vertexShader = 'attribute float aGrow; varying float vGrow; varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vGrow = aGrow; vWP = (modelMatrix * vec4(transformed,1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
  sh.fragmentShader = 'uniform float uP; varying float vGrow; varying vec3 vWP; varying vec3 vWN;\n' + NOISE + '\n' + sh.fragmentShader
    .replace('#include <map_fragment>', `#include <map_fragment>
      float alive = clamp((uP - vGrow * 0.85) / 0.16, 0.0, 1.0);
      float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
      vec3 dead = mix(vec3(lum), diffuseColor.rgb, 0.3) * vec3(0.84, 0.88, 0.95);
      float frost = smoothstep(0.35, 0.9, vWN.y) * (1.0 - alive) * 0.45;
      dead = mix(dead, vec3(0.92, 0.95, 1.0), frost);
      vec3 live = diffuseColor.rgb * vec3(1.05, 0.96, 0.86);
      diffuseColor.rgb = mix(dead, live, alive);
      float n = fb(vWP * 3.2), n2 = fb(vWP * 11.0 + 3.0);
      float mossGrow = clamp((uP - vGrow * 0.85 - 0.06) / 0.4, 0.0, 1.0);
      float up = smoothstep(0.05, 0.75, vWN.y + (n - 0.5) * 0.7);
      float moss = smoothstep(0.62 - 0.22 * mossGrow, 0.68 - 0.22 * mossGrow, n) * up * mossGrow * smoothstep(0.55, 0.15, vGrow);
      vec3 mossCol = mix(vec3(0.16, 0.30, 0.05), vec3(0.45, 0.62, 0.12), n2);
      diffuseColor.rgb = mix(diffuseColor.rgb, mossCol, moss);
      float front = exp(-pow((vGrow * 0.85 - uP + 0.02) / 0.02, 2.0)) * step(uP, 1.15);`)
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(1.0, 0.85, 0.5) * front * 0.12;');
};
const branch = new THREE.Mesh(buildTubes(), barkMat);
branch.castShadow = true; branch.receiveShadow = true;

const group = new THREE.Group();
group.add(branch);
scene.add(group);

/* ---------- attachment points for leaves, buds, blossoms ---------- */
const leafPts = [], tipPts = [], budPts = [];
segs.forEach(seg => {
  if (seg.depth < 2) return;
  const nodes = seg.nodes;
  let acc = 0, side = 1;
  for (let i = 1; i < nodes.length; i++) {
    acc += nodes[i].p.distanceTo(nodes[i - 1].p);
    const spacing = seg.depth >= 3 ? 0.13 : 0.2;
    if (acc >= spacing) {
      acc = 0; side = -side;
      const dir = nodes[i].p.clone().sub(nodes[i - 1].p).normalize();
      leafPts.push({ p: nodes[i].p, dir, side, g: nodes[i].d / maxD, r: nodes[i].r });
      if (rnd() < 0.5) budPts.push({ p: nodes[i].p, dir, g: nodes[i].d / maxD, r: nodes[i].r });
    }
  }
  const e = nodes[nodes.length - 1], dir = e.p.clone().sub(nodes[nodes.length - 2].p).normalize();
  tipPts.push({ p: e.p, dir, g: e.d / maxD });
  budPts.push({ p: e.p, dir, g: e.d / maxD, r: e.r * 1.5, tip: true });
});

/* ---------- leaf geometry: folded along the midrib, curled at the tip ---------- */
function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.17, 0.14, 0.15, 0.62, 0, 1);
  s.bezierCurveTo(-0.15, 0.62, -0.17, 0.14, 0, 0);
  const g = new THREE.ShapeGeometry(s, 10);
  const p = g.attributes.position, uvs = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    uvs.push(x / 0.36 + 0.5, y);
    p.setZ(i, Math.abs(x) * 0.55 - y * y * 0.18);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.translate(0, 0.03, 0);
  g.computeVertexNormals();
  return g;
}
const leafTex = tex(noiseCanvas(256, 512, (g, w, h) => {
  const lg = g.createLinearGradient(0, h, 0, 0); lg.addColorStop(0, '#d9d9d9'); lg.addColorStop(1, '#ffffff');
  g.fillStyle = lg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.5;
  for (let i = 1; i < 9; i++) { const y = h - i * h / 9.5; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w / 2 + sd * w * 0.25, y - 30, w / 2 + sd * w * 0.48, y - 70); g.stroke(); } }
  g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 400; i++) { const v = rr(200, 245); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd() * w, rnd() * h, 3, 3); }
}), true);

// shared vertex injection: grow, unfold and sway each instance
function injectGrow(sh, isDepth) {
  sh.uniforms.uP = U.uP; sh.uniforms.uTime = U.uTime;
  sh.vertexShader = 'uniform float uP; uniform float uTime; attribute vec2 aG; varying float vT; varying float vR;\n' + sh.vertexShader
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      float delay = aG.x * 0.85 + aG.y * 0.07;
      float t = clamp((uP - delay) / 0.24, 0.0, 1.0);
      vT = t; vR = aG.y;
      float c1 = 1.70158; float x = smoothstep(0.08, 1.0, t) - 1.0;
      float grow = t <= 0.0 ? 0.0 : mix(0.1, 1.0, 1.0 + (c1 + 1.0) * x*x*x + c1 * x*x) * smoothstep(0.0, 0.08, t);
      float fold = mix(0.3, 1.0, smoothstep(0.1, 0.65, t));
      transformed.x *= fold;
      float sw = (sin(uTime * 1.5 + aG.y * 40.0) * 0.08 + sin(uTime * 0.6 + aG.x * 20.0) * 0.06) * t;
      float cs = cos(sw), sn = sin(sw);
      transformed.yz = mat2(cs, -sn, sn, cs) * transformed.yz;
      transformed *= grow;`);
  if (!isDepth) {
    sh.fragmentShader = 'uniform float uP; varying float vT; varying float vR;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        if (vT <= 0.0) discard;
        vec3 bud = vec3(0.42, 0.24, 0.15);
        vec3 young = mix(vec3(0.62, 0.84, 0.22), vec3(0.52, 0.80, 0.26), vR);
        vec3 mature = mix(vec3(0.20, 0.50, 0.12), vec3(0.30, 0.60, 0.16), vR);
        float m = clamp((vT - 0.5) * 1.6, 0.0, 1.0);
        diffuseColor.rgb *= mix(bud, mix(young, mature, m), smoothstep(0.02, 0.2, vT));`);
  }
}
function instanced(geo, mat, pts, place) {
  const mesh = new THREE.InstancedMesh(geo, mat, pts.length);
  const g = new Float32Array(pts.length * 2), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler();
  pts.forEach((pt, i) => { place(pt, m, q, s, e); mesh.setMatrixAt(i, m); g[i * 2] = pt.g; g[i * 2 + 1] = rnd(); });
  geo.setAttribute('aG', new THREE.InstancedBufferAttribute(g, 2));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  return mesh;
}
const Y = new THREE.Vector3(0, 1, 0);
function orient(dir, side, spread, out) {
  // leaf axis: rotate the twig direction to one side, tilt up toward the light
  const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), side * spread);
  d.y += 0.35; d.z += rr(-0.4, 0.5); d.normalize();
  out.setFromUnitVectors(Y, d);
  out.multiply(new THREE.Quaternion().setFromAxisAngle(Y, rr(-1.2, 1.2)));
  return out;
}

const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, side: THREE.DoubleSide, roughness: 0.55, metalness: 0, emissive: new THREE.Color(0x2f5a10), emissiveIntensity: 0.12 });
leafMat.onBeforeCompile = (sh) => injectGrow(sh, false);
const leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
leafDepth.onBeforeCompile = (sh) => injectGrow(sh, true);

const allLeaves = [];
leafPts.forEach(pt => allLeaves.push(Object.assign({}, pt, { spread: rr(0.6, 1.1), size: rr(0.75, 1.15) * (pt.r > 0.03 ? 1.1 : 1) })));
tipPts.forEach(pt => { for (let k = 0; k < 4; k++) allLeaves.push({ p: pt.p, dir: pt.dir, side: k % 2 ? 1 : -1, g: Math.min(1, pt.g + k * 0.01), spread: rr(0.1, 0.9), size: rr(0.85, 1.3) }); });
const LEAF = 0.34;
const leaves = instanced(leafGeometry(), leafMat, allLeaves, (pt, m, q, s) => {
  orient(pt.dir, pt.side, pt.spread, q);
  s.setScalar(LEAF * pt.size);
  m.compose(pt.p, q, s);
});
leaves.customDepthMaterial = leafDepth;
group.add(leaves);

/* ---------- blossoms ---------- */
function blossomGeometry() {
  const geos = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.bezierCurveTo(0.22, 0.12, 0.2, 0.48, 0, 0.52); s.bezierCurveTo(-0.2, 0.48, -0.22, 0.12, 0, 0);
    const g = new THREE.ShapeGeometry(s, 6);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setZ(k, Math.pow(p.getY(k), 2) * 0.5);
    g.rotateX(-0.5); g.rotateZ(i / 5 * Math.PI * 2);
    geos.push(g);
  }
  const merged = mergeGeos(geos);
  merged.rotateX(-Math.PI / 2);
  merged.computeVertexNormals();
  return merged;
}
function mergeGeos(list) {
  let n = 0; list.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = []; let o = 0;
  list.forEach(g => {
    pos.set(g.attributes.position.array, o * 3); uv.set(g.attributes.uv.array, o * 2);
    const gi = g.index.array; for (let i = 0; i < gi.length; i++) idx.push(gi[i] + o);
    o += g.attributes.position.count;
  });
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setIndex(idx);
  return m;
}
const blossomMat = new THREE.MeshStandardMaterial({ color: 0xfff1f4, side: THREE.DoubleSide, roughness: 0.5, emissive: 0xffd6e0, emissiveIntensity: 0.18 });
blossomMat.onBeforeCompile = (sh) => {
  injectGrow(sh, true);
  sh.fragmentShader = 'varying float vT;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n if (vT <= 0.0) discard;');
};
const blossomPts = tipPts.filter(() => rnd() < 0.16).map(pt => Object.assign({}, pt, { g: Math.min(1.05, pt.g + 0.12) }));
const blossoms = instanced(blossomGeometry(), blossomMat, blossomPts, (pt, m, q, s) => {
  q.setFromUnitVectors(Y, new THREE.Vector3(rr(-0.4, 0.4), 1, rr(0.2, 0.9)).normalize());
  s.setScalar(rr(0.2, 0.28));
  m.compose(pt.p.clone().addScaledVector(pt.dir, 0.03), q, s);
});
group.add(blossoms);

/* ---------- winter buds (visible first, fade as leaves open) ---------- */
const budMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.7 });
budMat.onBeforeCompile = (sh) => {
  sh.uniforms.uP = U.uP;
  sh.vertexShader = 'uniform float uP; attribute vec2 aG;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float t = clamp((uP - aG.x * 0.85) / 0.24, 0.0, 1.0);
    transformed *= (1.0 + t * 0.6) * (1.0 - smoothstep(0.25, 0.5, t));`);
};
const buds = instanced(new THREE.SphereGeometry(1, 8, 6), budMat, budPts, (pt, m, q, s) => {
  q.setFromUnitVectors(Y, pt.dir);
  const r = Math.max(0.012, Math.min(0.035, (pt.r || 0.02) * 0.9));
  s.set(r, r * 2.4, r);
  m.compose(pt.p, q, s);
});
group.add(buds);

/* ---------- HOPE, standing behind the branch and catching its shadows ---------- */
const hopeCanvas = document.createElement('canvas');
hopeCanvas.width = 2048; hopeCanvas.height = 640;
const hopeTex = new THREE.CanvasTexture(hopeCanvas);
hopeTex.colorSpace = THREE.SRGBColorSpace; hopeTex.anisotropy = 8;
function drawWord(word) {
  const g = hopeCanvas.getContext('2d'), w = hopeCanvas.width, h = hopeCanvas.height;
  g.clearRect(0, 0, w, h);
  const family = getComputedStyle(document.documentElement).getPropertyValue('--display').trim() || 'sans-serif';
  let size = 560;
  g.font = `800 ${size}px ${family}`;
  const tw = g.measureText(word).width;
  if (tw > w * 0.96) { size *= w * 0.96 / tw; g.font = `800 ${size}px ${family}`; }
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  // red: fill, green: outline (shader picks)
  g.fillStyle = '#ff0000'; g.fillText(word, w / 2, h * 0.84);
  g.globalCompositeOperation = 'lighter';
  g.lineWidth = 9; g.strokeStyle = '#00ff00'; g.strokeText(word, w / 2, h * 0.84);
  g.globalCompositeOperation = 'source-over';
  hopeTex.needsUpdate = true;
}
const hopeMat = new THREE.MeshStandardMaterial({ map: hopeTex, transparent: true, roughness: 0.35, metalness: 0, depthWrite: false });
hopeMat.onBeforeCompile = (sh) => {
  sh.uniforms.uP = U.uP;
  sh.vertexShader = 'varying vec2 vUv2;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vUv2 = uv;');
  sh.fragmentShader = 'uniform float uP; varying vec2 vUv2;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
    vec4 tx = texture2D(map, vUv2);
    float s = clamp(uP / 1.2, 0.0, 1.0);
    float fillOn = smoothstep(1.0 - s - 0.02, 1.0 - s + 0.02, vUv2.x);
    vec3 grad = mix(vec3(0.10, 0.42, 0.18), vec3(0.62, 0.86, 0.50), smoothstep(0.1, 0.9, vUv2.y));
    float a = max(tx.r * fillOn, tx.g * 0.9);
    diffuseColor.rgb = mix(vec3(1.0), grad, fillOn * tx.r);
    diffuseColor.a = a;`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.3;');
};
const hope = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), hopeMat);
hope.receiveShadow = true;
hope.position.set(0, -2.7, -2.6);
scene.add(hope);

/* ---------- air: snow in winter, sunlit dust and far bokeh in spring ---------- */
function air(count, kind) {
  const g = new THREE.BufferGeometry(), a = new Float32Array(count * 3), r = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    a[i * 3] = rr(-16, 16); a[i * 3 + 1] = rr(-9, 10);
    a[i * 3 + 2] = kind === 2 ? rr(-45, -22) : rr(-6, 7);
    for (let k = 0; k < 4; k++) r[i * 4 + k] = rnd();
  }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  g.setAttribute('aR', new THREE.BufferAttribute(r, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    blending: kind === 0 ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: Object.assign({ uPx: { value: renderer.getPixelRatio() * innerHeight } }, U),
    vertexShader: `
      uniform float uP; uniform float uTime; uniform float uPx; attribute vec4 aR; varying float vA; varying vec3 vC;
      void main(){
        vec3 p = position;
        ${kind === 0 ? 'p.y = mod(p.y + 9.0 - uTime * (0.5 + aR.x * 0.6), 19.0) - 9.0; p.x += sin(uTime * 0.7 + aR.y * 30.0) * 0.4;' : ''}
        ${kind === 1 ? 'p.y += sin(uTime * 0.25 + aR.x * 20.0) * 0.6; p.x += sin(uTime * 0.18 + aR.y * 20.0) * 0.8;' : ''}
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float s = clamp(uP / 1.1, 0.0, 1.0);
        ${kind === 0 ? 'vA = (1.0 - smoothstep(0.0, 0.35, uP)) * (0.5 + aR.z * 0.5); gl_PointSize = uPx * (0.012 + aR.w * 0.02) / -mv.z; vC = vec3(1.0);' : ''}
        ${kind === 1 ? 'vA = smoothstep(0.4, 1.0, uP) * (0.2 + 0.8 * pow(sin(uTime * (0.5 + aR.w) + aR.x * 40.0) * 0.5 + 0.5, 3.0)); gl_PointSize = uPx * (0.01 + aR.w * 0.016) / -mv.z; vC = vec3(1.0, 0.9, 0.6);' : ''}
        ${kind === 2 ? 'vA = s * (0.08 + aR.z * 0.14); gl_PointSize = uPx * (0.9 + aR.w * 1.6) / -mv.z; vC = mix(vec3(0.45, 0.75, 0.3), vec3(1.0, 0.9, 0.55), step(0.72, aR.x));' : ''}
      }`,
    fragmentShader: `
      varying float vA; varying vec3 vC;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = ${kind === 2 ? 'smoothstep(0.5, 0.42, d) * (0.75 + 0.25 * smoothstep(0.3, 0.48, d))' : 'smoothstep(0.5, 0.0, d)'} * vA;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vC, a);
      }`
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  return m;
}
const airMats = [air(small ? 160 : 260, 0), air(small ? 70 : 120, 1), air(small ? 26 : 40, 2)];

/* ---------- god rays ---------- */
const rayMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
  uniforms: U,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform float uP; uniform float uTime; varying vec2 vUv;
    void main(){
      float s = smoothstep(0.5, 1.2, uP);
      float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
      float a = edge * smoothstep(0.0, 0.9, vUv.y) * (0.06 + 0.03 * sin(uTime * 0.4 + vUv.x * 6.0)) * s;
      gl_FragColor = vec4(vec3(1.0, 0.92, 0.7), a);
    }`
});
for (let i = 0; i < 4; i++) {
  const ray = new THREE.Mesh(new THREE.PlaneGeometry(rr(1.6, 3.2), 34), rayMat);
  ray.position.set(rr(-4, 10), 4, rr(-8, -2));
  ray.rotation.set(0, 0, 0.55 + rr(-0.05, 0.05));
  scene.add(ray);
}

/* ---------- post ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.55, 0.88);
composer.addPass(bloom);
const bokeh = small ? null : new BokehPass(scene, camera, { focus: 17.5, aperture: 0.00055, maxblur: 0.0055 });
if (bokeh) composer.addPass(bokeh);
composer.addPass(new OutputPass());

/* ---------- framing ---------- */
const base = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
function layout() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  const portrait = w / h < 1;
  if (portrait) {
    group.rotation.z = -0.5; group.position.set(1.2, 1.4, 0);
    camera.fov = 44; base.pos.set(0, -0.5, 19); base.look.set(0, 0.2, 0);
    hope.position.set(0, -1.9, -2.6); hope.scale.setScalar(0.43);
  } else {
    group.rotation.z = 0; group.position.set(0, 1.5, 0);
    camera.fov = 32; base.pos.set(0, -0.6, 21); base.look.set(-0.4, -0.3, 0);
    const k = Math.min(1, (w / h) / 1.6);
    hope.position.set(0, -2.5, -2.6); hope.scale.setScalar(0.92 + 0.12 * k);
  }
  camera.updateProjectionMatrix();
  airMats.forEach(m => m.uniforms.uPx.value = renderer.getPixelRatio() * h);
}
addEventListener('resize', layout);

/* ---------- interaction + timeline ---------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

const DUR = 9, HOLD = 2.2;
// ?p=0.8 freezes the scene at one moment (used for screenshots)
const FIXED = new URLSearchParams(location.search).get('p');
let t0 = null, visible = true, running = false;
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const cWinterSun = new THREE.Color(0xdfe6f0), cSpringSun = new THREE.Color(0xfff0d6);
const cWinterFog = new THREE.Color(0xdde3e6), cSpringFog = new THREE.Color(0xe6f1ea);

function frame(now) {
  if (!running) return;
  requestAnimationFrame(frame);
  if (!visible || document.hidden) return;
  if (t0 === null) t0 = now;
  const el = (now - t0) / 1000;
  U.uTime.value = el;
  const k = reduce ? 1 : Math.min(1, Math.max(0, (el - HOLD) / DUR));
  const P = FIXED !== null ? +FIXED : ease(k) * 1.35;
  if (FIXED !== null) running = false;
  U.uP.value = P;
  const s = Math.min(1, P / 1.1);
  hero && hero.style.setProperty('--spring', s.toFixed(3));
  sun.intensity = 2.0 + s * 2.4;
  sun.color.copy(cWinterSun).lerp(cSpringSun, s);
  hemi.intensity = 1.5 + s * 0.4;
  scene.fog.color.copy(cWinterFog).lerp(cSpringFog, s);
  renderer.toneMappingExposure = 0.95 + s * 0.15;
  // slow cinematic drift: a gentle push-in while spring arrives, plus mouse parallax
  mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
  camera.position.copy(base.pos);
  camera.position.z -= ease(k) * 1.6;
  camera.position.x += Math.sin(el * 0.11) * 0.5 + mouse.x * 1.4;
  camera.position.y += Math.sin(el * 0.08) * 0.25 - mouse.y * 0.8;
  camera.lookAt(base.look);
  if (bokeh) bokeh.uniforms.focus.value = camera.position.distanceTo(new THREE.Vector3(0, 0.4, 0));
  composer.render();
}

async function start() {
  try { await document.fonts.load('800 100px ' + (getComputedStyle(document.documentElement).getPropertyValue('--display').trim() || 'sans-serif')); } catch (e) {}
  drawWord(window.HP_WORD || 'HOPE');
  layout();
  host.classList.add('ready');
  hero && hero.classList.add('spring-on');
  running = true;
  requestAnimationFrame(frame);
}

window.HPSpring = {
  replay() { t0 = null; },
  pause(v) { visible = !v; if (!v) layout(); },
  setWord(w) { window.HP_WORD = w; drawWord(w); },
  layout
};
if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
start();
