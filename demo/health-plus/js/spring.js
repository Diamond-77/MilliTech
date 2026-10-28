/* Health Plus Clinic — hero "spring" scene.
   A real cut-out of the dead branch (img/branch.webp) is drawn as a textured quad.
   img/branch-data.png holds, per pixel: R = distance along the wood from the trunk cut,
   G = thickness, B = how much the surface faces up. js/leaves.js holds the points on the
   twigs where leaves, blossoms and sprouts grow. Progress P runs 0 → 1.35: a wave of life
   travels from the trunk out to every twig tip. */
(function () {
  const host = document.getElementById('spring');
  if (!host || !window.THREE || !window.HP_LEAVES) return;

  const hero = document.querySelector('.hero');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DATA = window.HP_LEAVES;
  const IW = DATA.w, IH = DATA.h;
  const BASE = host.dataset.base || '';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { hero && hero.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);

  // image space → screen pixels, shared by every layer
  const U = {
    uView: { value: new THREE.Vector2(1, 1) },
    uAnchor: { value: new THREE.Vector2(0, 0) },
    uScale: { value: 1 },
    uRot: { value: 0 },
    uP: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uImg: { value: new THREE.Vector2(IW, IH) }
  };

  const XFORM = `
    uniform vec2 uView; uniform vec2 uAnchor; uniform float uScale; uniform float uRot; uniform vec2 uImg; uniform vec2 uMouse;
    vec4 toClip(vec2 ip, float depth){
      vec2 p = (ip - vec2(uImg.x, 0.0)) * uScale;
      float c = cos(uRot), s = sin(uRot);
      p = vec2(c*p.x - s*p.y, s*p.x + c*p.y) + uAnchor + uMouse * depth;
      return vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
    }`;

  const NOISE = `
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p*=2.03; a*=0.5; } return v; }`;

  /* ---------- branch ---------- */
  const loader = new THREE.TextureLoader();
  const branchTex = loader.load(BASE + 'img/branch.webp', onTex);
  const dataTex = loader.load(BASE + 'img/branch-data.png', onTex);
  [branchTex, dataTex].forEach(t => { t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; });
  let texReady = 0;
  function onTex() { if (++texReady === 2) start(); }

  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, IW, 0, 0, IW, IH, 0, 0, IH, 0], 3));
  bGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  bGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const bMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uTex: { value: branchTex }, uData: { value: dataTex } }, U),
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: XFORM + `
      varying vec2 vUv; varying vec2 vIp;
      void main(){ vUv = uv; vIp = position.xy; gl_Position = toClip(position.xy, 0.0); }`,
    fragmentShader: NOISE + `
      uniform sampler2D uTex; uniform sampler2D uData; uniform float uP; uniform float uTime;
      varying vec2 vUv; varying vec2 vIp;
      void main(){
        vec4 c = texture2D(uTex, vUv);
        if (c.a < 0.01) discard;
        vec3 d = texture2D(uData, vUv).rgb;   // r: distance from trunk, g: thickness, b: faces up
        float geo = d.r;
        float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        // winter: cold, ashen, a little frost on the upper surfaces
        vec3 dead = mix(vec3(lum), c.rgb, 0.28) * vec3(0.86, 0.9, 0.97);
        dead = mix(dead, vec3(0.93, 0.96, 1.0), smoothstep(0.55, 0.95, d.b) * 0.35 * smoothstep(0.35, 0.9, lum + 0.2));
        // spring: warm, rich wood
        vec3 alive = pow(c.rgb, vec3(0.92)) * vec3(1.06, 1.0, 0.9);
        float a = clamp((uP - geo * 0.85) / 0.16, 0.0, 1.0);
        vec3 col = mix(dead, alive, a);
        // moss creeping over thick, upward-facing wood
        float n = fbm(vIp / 9.0);
        float n2 = fbm(vIp / 2.6 + 7.0);
        float mossMask = smoothstep(0.25, 0.75, d.g) * smoothstep(0.45, 0.85, d.b + n * 0.45);
        float mossGrow = clamp((uP - geo * 0.85 - 0.08) / 0.35, 0.0, 1.0);
        float moss = smoothstep(0.64 - mossGrow * 0.2, 0.72 - mossGrow * 0.2, n) * mossMask * mossGrow;
        vec3 mossCol = mix(vec3(0.27, 0.40, 0.10), vec3(0.58, 0.72, 0.22), n2) * (0.75 + lum * 0.6);
        col = mix(col, mossCol, moss * 0.92);
        // the wave front: a soft warm light running along the wood
        float front = exp(-pow((geo * 0.85 - uP + 0.02) / 0.025, 2.0)) * step(uP, 1.15);
        col += vec3(1.0, 0.86, 0.55) * front * 0.35;
        gl_FragColor = vec4(col, c.a);
      }`
  });
  const branch = new THREE.Mesh(bGeo, bMat);
  branch.frustumCulled = false;
  scene.add(branch);

  /* ---------- leaf atlas (drawn once on a canvas) ---------- */
  function makeAtlas() {
    const cell = 256, cv = document.createElement('canvas');
    cv.width = cell * 4; cv.height = cell;
    const g = cv.getContext('2d');
    function leaf(ox, wide, curl) {
      g.save(); g.translate(ox + 128, 0);
      const w = wide;
      const path = new Path2D();
      path.moveTo(0, 250);
      path.bezierCurveTo(w * 1.1, 200, w * 0.95 + curl, 70, curl * 0.6, 8);
      path.bezierCurveTo(-w * 0.95 + curl, 70, -w * 1.1, 200, 0, 250);
      // body: luminance only, coloured in the shader
      const lg = g.createLinearGradient(-w, 0, w, 0);
      lg.addColorStop(0, '#9a9a9a'); lg.addColorStop(0.5, '#d8d8d8'); lg.addColorStop(1, '#f4f4f4');
      g.fillStyle = lg; g.fill(path);
      g.save(); g.clip(path);
      const rg = g.createRadialGradient(w * 0.25, 120, 5, 0, 130, 150);
      rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(0,0,0,.28)');
      g.fillStyle = rg; g.fillRect(-128, 0, 256, 256);
      // veins
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3.2;
      g.beginPath(); g.moveTo(0, 250); g.quadraticCurveTo(curl * 0.3, 130, curl * 0.6, 12); g.stroke();
      g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,.45)';
      for (let i = 0; i < 8; i++) {
        const y = 225 - i * 25, x0 = curl * 0.3 * (1 - y / 250);
        for (const sd of [-1, 1]) {
          g.beginPath(); g.moveTo(x0, y);
          g.quadraticCurveTo(x0 + sd * w * 0.45, y - 18, x0 + sd * w * 0.82 * Math.sin(Math.PI * (y / 260)), y - 42);
          g.stroke();
        }
      }
      g.restore();
      g.lineWidth = 2; g.strokeStyle = 'rgba(40,40,40,.35)'; g.stroke(path);
      g.restore();
    }
    leaf(0, 62, 6);
    leaf(cell, 46, -14);
    // blossom (full colour)
    g.save(); g.translate(cell * 2 + 128, 128);
    for (let i = 0; i < 5; i++) {
      g.save(); g.rotate(i * Math.PI * 2 / 5);
      const pg = g.createRadialGradient(0, -50, 4, 0, -50, 70);
      pg.addColorStop(0, '#fffaf6'); pg.addColorStop(0.7, '#ffe1ea'); pg.addColorStop(1, '#f7b9cc');
      g.fillStyle = pg;
      g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(48, -30, 44, -104, 0, -112); g.bezierCurveTo(-44, -104, -48, -30, 0, 0); g.fill();
      g.strokeStyle = 'rgba(200,120,150,.35)'; g.lineWidth = 2; g.stroke();
      g.restore();
    }
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, r = 18 + (i % 3) * 5;
      g.fillStyle = '#e8b33a'; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 4.5, 0, 7); g.fill();
    }
    g.fillStyle = '#c9e06a'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill();
    g.restore();
    // sprout: a small pair of leaves on a stem
    g.save(); g.translate(cell * 3 + 128, 0);
    g.strokeStyle = '#bdbdbd'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 252); g.quadraticCurveTo(8, 170, 0, 110); g.stroke();
    for (const sd of [-1, 1]) {
      g.save(); g.translate(0, 120); g.rotate(sd * 0.75);
      const p = new Path2D();
      p.moveTo(0, 0); p.bezierCurveTo(44, -20, 40, -90, 0, -112); p.bezierCurveTo(-40, -90, -44, -20, 0, 0);
      const lg = g.createLinearGradient(-40, 0, 40, 0);
      lg.addColorStop(0, '#a8a8a8'); lg.addColorStop(1, '#f2f2f2');
      g.fillStyle = lg; g.fill(p);
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(0, -4); g.lineTo(0, -104); g.stroke();
      g.restore();
    }
    g.restore();
    const t = new THREE.CanvasTexture(cv);
    t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
    return t;
  }

  /* ---------- leaves (instanced quads, pivot at the leaf base) ---------- */
  const P = DATA.p, N = P.length;
  const lGeo = new THREE.InstancedBufferGeometry();
  lGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  lGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  lGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(N * 2), aInfo = new Float32Array(N * 4), aRnd = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    const p = P[i], r = Math.random();
    aPos[i * 2] = p[0]; aPos[i * 2 + 1] = p[1];
    aInfo[i * 4] = p[2]; aInfo[i * 4 + 1] = p[3]; aInfo[i * 4 + 2] = p[4];
    // cell: 0/1 leaf variants, 2 blossom, 3 sprout
    aInfo[i * 4 + 3] = p[5] === 1 ? 2 : p[5] === 2 ? (r < 0.5 ? 3 : 1) : (r < 0.62 ? 0 : 1);
    aRnd[i * 2] = Math.random(); aRnd[i * 2 + 1] = Math.random();
  }
  lGeo.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 2));
  lGeo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(aInfo, 4));
  lGeo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(aRnd, 2));
  lGeo.instanceCount = N;

  const lMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uAtlas: { value: makeAtlas() }, uLeaf: { value: 30 } }, U),
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: XFORM + `
      uniform float uP; uniform float uTime; uniform float uLeaf;
      attribute vec2 aPos; attribute vec4 aInfo; attribute vec2 aRnd;
      varying vec2 vUv; varying float vCell; varying float vT; varying float vM; varying float vR; varying float vShade;
      float easeBack(float x){ float c1=1.70158, c3=c1+1.0; return 1.0 + c3*pow(x-1.0,3.0) + c1*pow(x-1.0,2.0); }
      void main(){
        float geo = aInfo.x, ang = aInfo.y, sz = aInfo.z, cell = aInfo.w;
        float delay = geo * 0.85 + aRnd.x * 0.07 + (cell > 1.5 && cell < 2.5 ? 0.16 : 0.0);
        float t = clamp((uP - delay) / 0.24, 0.0, 1.0);
        float m = clamp((uP - delay - 0.2) / 0.45, 0.0, 1.0);
        vT = t; vM = m; vR = aRnd.y; vCell = cell; vUv = uv;
        float grow = t <= 0.0 ? 0.0 : mix(0.12, 1.0, easeBack(smoothstep(0.1, 1.0, t))) * smoothstep(0.0, 0.08, t);
        float fold = mix(0.45, 1.0, smoothstep(0.1, 0.6, t));
        // wind
        float sway = sin(uTime * 1.4 + aPos.x * 0.012 + aRnd.y * 6.0) * 0.07 + sin(uTime * 0.53 + aPos.y * 0.02) * 0.05;
        ang += sway * t + (aRnd.y - 0.5) * 0.25;
        vec2 dim = cell > 1.5 && cell < 2.5 ? vec2(1.0, 1.0) * 0.62 : cell > 2.5 ? vec2(0.8, 0.8) * 0.75 : vec2(0.56, 1.0);
        vec2 lp = position.xy * dim * vec2(fold, 1.0) * uLeaf * sz * grow;
        if (cell > 1.5 && cell < 2.5) lp.y -= 0.5 * uLeaf * sz * grow * 0.62;   // blossoms sit centred
        float s = sin(ang), c = cos(ang);
        vec2 world = aPos + lp.x * vec2(s, -c) + lp.y * vec2(c, s);
        // light from the upper left
        vShade = 0.86 + 0.24 * clamp(-s * 0.7 - c * 0.3, -1.0, 1.0);
        gl_Position = toClip(world, 2.0 + aRnd.x * 6.0);
      }`,
    fragmentShader: `
      uniform sampler2D uAtlas;
      varying vec2 vUv; varying float vCell; varying float vT; varying float vM; varying float vR; varying float vShade;
      void main(){
        if (vT <= 0.0) discard;
        vec4 tx = texture2D(uAtlas, vec2((vCell + vUv.x) / 4.0, vUv.y));
        if (tx.a < 0.02) discard;
        vec3 col;
        if (vCell > 1.5 && vCell < 2.5) {
          col = tx.rgb;
        } else {
          float l = tx.r;
          vec3 bud = vec3(0.50, 0.30, 0.20);
          vec3 young = mix(vec3(0.70, 0.86, 0.30), vec3(0.62, 0.84, 0.36), vR);
          vec3 mature = mix(vec3(0.30, 0.62, 0.22), vec3(0.40, 0.70, 0.26), vR);
          vec3 base = mix(young, mature, vM);
          base = mix(bud, base, smoothstep(0.02, 0.16, vT));
          col = base * (0.45 + l * 0.75) * vShade;
          col += vec3(0.95, 1.0, 0.6) * smoothstep(0.8, 1.0, l) * 0.08;   // backlit glow
        }
        gl_FragColor = vec4(col, tx.a);
      }`
  });
  const leaves = new THREE.Mesh(lGeo, lMat);
  leaves.frustumCulled = false;
  scene.add(leaves);

  /* ---------- snow (winter) and pollen (spring) in screen space ---------- */
  function particles(count, isSnow) {
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(count * 4);
    for (let i = 0; i < count * 4; i++) a[i] = Math.random();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aR', new THREE.Float32BufferAttribute(a, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { uView: U.uView, uTime: U.uTime, uP: U.uP, uDpr: { value: renderer.getPixelRatio() } },
      transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      blending: isSnow ? THREE.NormalBlending : THREE.AdditiveBlending,
      vertexShader: `
        uniform vec2 uView; uniform float uTime; uniform float uP; uniform float uDpr;
        attribute vec4 aR; varying float vA;
        void main(){
          float speed = ${isSnow ? '0.035 + aR.z * 0.05' : '0.008 + aR.z * 0.012'};
          float y = fract(aR.y ${isSnow ? '+' : '-'} uTime * speed);
          float x = aR.x + sin(uTime * (0.3 + aR.w * 0.5) + aR.y * 20.0) * 0.02;
          gl_Position = vec4(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
          float life = ${isSnow ? 'clamp(1.0 - uP * 3.0, 0.0, 1.0)' : 'smoothstep(0.35, 1.0, uP)'};
          vA = life * ${isSnow ? '(0.45 + aR.w * 0.5)' : '(0.25 + 0.75 * pow(sin(uTime * (0.6 + aR.w) + aR.x * 30.0) * 0.5 + 0.5, 2.0))'};
          gl_PointSize = uDpr * ${isSnow ? '(2.0 + aR.w * 4.5)' : '(2.0 + aR.w * 3.5)'};
        }`,
      fragmentShader: `
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA;
          if (a < 0.01) discard;
          gl_FragColor = vec4(${isSnow ? 'vec3(1.0)' : 'vec3(1.0, 0.88, 0.55)'}, a);
        }`
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false;
    scene.add(pts); return m;
  }
  const snowMat = particles(160, true);
  const pollenMat = particles(70, false);

  /* ---------- layout: fit the branch to the hero ---------- */
  function layout() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    U.uView.value.set(w, h);
    let scale, rot, ax, ay;
    if (w / h >= 1.15) {          // landscape: trunk enters from the right edge
      scale = Math.max(w * 1.08, h * 1.6) / IW;
      rot = -0.02;
      ax = w + IW * scale * 0.035; ay = -h * 0.01;
    } else {                      // portrait: tilt the branch into a diagonal
      scale = h * 1.08 / IW;
      rot = -0.42;
      ax = w + IW * scale * 0.05; ay = -h * 0.05;
    }
    U.uScale.value = scale; U.uRot.value = rot; U.uAnchor.value.set(ax, ay);
    lMat.uniforms.uLeaf.value = w / h < 1.15 ? 34 : 32;
    snowMat.uniforms.uDpr.value = pollenMat.uniforms.uDpr.value = renderer.getPixelRatio();
  }
  addEventListener('resize', layout);
  layout();

  /* ---------- mouse parallax ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- timeline ---------- */
  const DUR = 8, HOLD = 2.2;
  let t0 = null, visible = true, running = false, last = 0;
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  function setProgress(p) {
    U.uP.value = p;
    const s = Math.min(1, Math.max(0, p / 1.2));
    hero && hero.style.setProperty('--spring', s.toFixed(3));
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (t0 === null) t0 = now;
    const el = (now - t0) / 1000;
    U.uTime.value = el;
    const k = reduce ? 1 : Math.min(1, Math.max(0, (el - HOLD) / DUR));
    setProgress(ease(k) * 1.35);
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    U.uMouse.value.set(-mouse.x * 2.2, -mouse.y * 1.4);
    renderer.render(scene, camera);
    last = now;
  }

  function start() {
    host.classList.add('ready');
    hero && hero.classList.add('spring-on');
    running = true;
    requestAnimationFrame(frame);
  }

  // public: replay
  window.HPSpring = {
    replay() { t0 = null; setProgress(0); },
    pause(v) { visible = !v; }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(host);
  }
})();
