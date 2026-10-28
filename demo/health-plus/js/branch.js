/* Health Plus Clinic — hero branch, drawn like the MilliTech machine: toon shading with a
   3-step ramp, flat colours and an ink outline. On load it plays once (about 4 s): bare wood
   with a few brown and orange leaves that let go, then green leaves grow out along the wood
   from the trunk to the tips, then small blossoms open. After that it sways slowly.
   Add ?p=0..1 to the URL to hold one moment (for screenshots). */
(function () {
  const host = document.getElementById('spring');
  if (!host || !window.THREE) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FREEZE = parseFloat(new URLSearchParams(location.search).get('p'));

  /* seeded random, so the branch is the same on every visit */
  let seed = 7012026;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const rr = (a, b) => a + (b - a) * rnd();

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50);
  camera.position.z = 10;

  const C = { ink: 0x14301f, barkDead: 0x8a7d70, barkAlive: 0x7a4e2c };
  // same 3-step toon ramp as the MilliTech machine
  const ramp = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.LuminanceFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(-4, 7, 9); scene.add(sun);

  const group = new THREE.Group();
  scene.add(group);

  /* ---------- skeleton: trunk enters along -x, then the group is tilted down-left ---------- */
  const segs = [];
  function grow(p0, dir0, len, r0, r1, depth, d0) {
    const nodes = [], n = Math.max(4, Math.round(len / (depth === 0 ? 0.22 : 0.14)));
    const p = p0.clone(), dir = dir0.clone().normalize();
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      nodes.push({ p: p.clone(), r: THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.85)), d: d0 + t * len, dir: dir.clone() });
      dir.x += rr(-1, 1) * 0.08; dir.y += rr(-1, 1) * 0.08 + (depth >= 2 ? 0.03 : 0); dir.z += rr(-1, 1) * 0.03;
      dir.normalize();
      p.addScaledVector(dir, len / n);
    }
    segs.push({ nodes, depth });
    if (depth >= 3) return nodes;
    const count = [6, 5, 3][depth];
    for (let k = 0; k < count; k++) {
      const t = rr(0.2, 0.92), i = Math.min(nodes.length - 2, Math.floor(t * (nodes.length - 1)));
      const nd = nodes[i];
      const side = (k % 2 ? 1 : -1) * (rnd() < 0.8 ? 1 : -1);
      const cd = nd.dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), side * rr(0.5, 1.0));
      cd.y += depth >= 1 ? 0.15 : 0.05; cd.z = rr(-0.15, 0.15);
      const cl = depth === 0 ? rr(2.2, 3.8) : Math.max(0.5, len * (1 - t) * rr(0.5, 0.85) + 0.3);
      const cr = nd.r * rr(0.5, 0.68);
      grow(nd.p, cd, cl, cr, Math.max(0.012, cr * 0.25), depth + 1, nd.d);
    }
    return nodes;
  }
  const trunk = grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-1, 0.05, 0), 6.2, 0.5, 0.3, 0, 0);
  const fork = trunk[trunk.length - 1];
  grow(fork.p, new THREE.Vector3(-1, 0.28, 0), 7.5, 0.3, 0.03, 1, fork.d);
  grow(fork.p, new THREE.Vector3(-1, -0.2, 0), 6.0, 0.24, 0.03, 1, fork.d);
  let maxD = 0; segs.forEach(s => s.nodes.forEach(n => { maxD = Math.max(maxD, n.d); }));

  /* ---------- wood: tapered tubes with toon shading and an inverted-hull ink line ---------- */
  function tubes() {
    const pos = [], nor = [], idx = [];
    let base = 0;
    const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
    segs.forEach(seg => {
      const radial = seg.depth === 0 ? 14 : seg.depth === 1 ? 10 : 6;
      seg.nodes.forEach((nd, i) => {
        const a = seg.nodes[Math.max(0, i - 1)].p, b = seg.nodes[Math.min(seg.nodes.length - 1, i + 1)].p;
        T.subVectors(b, a).normalize();
        N.crossVectors(T, Z).normalize(); B.crossVectors(T, N).normalize();
        for (let j = 0; j <= radial; j++) {
          const ang = j / radial * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
          const nx = N.x * c + B.x * s, ny = N.y * c + B.y * s, nz = N.z * c + B.z * s;
          pos.push(nd.p.x + nx * nd.r, nd.p.y + ny * nd.r, nd.p.z + nz * nd.r);
          nor.push(nx, ny, nz);
        }
        if (i > 0) {
          const r0 = base + (i - 1) * (radial + 1), r1 = base + i * (radial + 1);
          for (let j = 0; j < radial; j++) idx.push(r0 + j, r0 + j + 1, r1 + j, r1 + j, r0 + j + 1, r1 + j + 1);
        }
      });
      base += seg.nodes.length * (radial + 1);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return g;
  }
  const woodGeo = tubes();
  const woodMat = new THREE.MeshToonMaterial({ color: C.barkDead, gradientMap: ramp });
  group.add(new THREE.Mesh(woodGeo, woodMat));
  const U = { uOutline: { value: 0.035 }, uTime: { value: 0 }, uP: { value: 0 } };
  const inkMat = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide });
  inkMat.onBeforeCompile = sh => {
    sh.uniforms.uOutline = U.uOutline;
    sh.vertexShader = 'uniform float uOutline;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * uOutline;');
  };
  group.add(new THREE.Mesh(woodGeo, inkMat));

  /* ---------- leaf atlas: anime leaf (masks, coloured in the shader) + blossom (full colour) ---------- */
  function atlas() {
    const S = 256, cv = document.createElement('canvas'); cv.width = S * 2; cv.height = S;
    const g = cv.getContext('2d');
    // cell 0 · leaf. R = body, G = shadow side, B = ink line
    const leaf = new Path2D();
    leaf.moveTo(128, 248); leaf.bezierCurveTo(214, 196, 206, 70, 128, 8); leaf.bezierCurveTo(50, 70, 42, 196, 128, 248);
    g.fillStyle = 'rgb(255,0,0)'; g.fill(leaf);
    g.save(); g.clip(leaf); g.fillStyle = 'rgb(255,255,0)';
    g.beginPath(); g.moveTo(128, 248); g.bezierCurveTo(140, 170, 136, 80, 128, 8); g.lineTo(220, 0); g.lineTo(220, 256); g.fill();
    g.restore();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgb(0,0,255)'; g.lineWidth = 11; g.lineJoin = 'round'; g.stroke(leaf);
    g.lineWidth = 6; g.beginPath(); g.moveTo(128, 244); g.quadraticCurveTo(132, 140, 128, 40); g.stroke();
    g.globalCompositeOperation = 'source-over';
    // cell 1 · blossom
    g.save(); g.translate(S + 128, 128);
    for (let i = 0; i < 5; i++) {
      g.save(); g.rotate(i * Math.PI * 2 / 5);
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(52, -30, 46, -104, 0, -112); g.bezierCurveTo(-46, -104, -52, -30, 0, 0);
      g.fillStyle = '#ffffff'; g.fill();
      g.lineWidth = 9; g.strokeStyle = '#14301f'; g.stroke();
      g.restore();
    }
    g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill();
    g.lineWidth = 7; g.strokeStyle = '#14301f'; g.stroke();
    g.restore();
    const t = new THREE.CanvasTexture(cv); t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
    return t;
  }

  /* ---------- leaves, dead leaves and blossoms as instanced cards ---------- */
  const items = [];
  segs.forEach(seg => {
    if (seg.depth === 0) return;
    const step = seg.depth === 1 ? 3 : 2;
    seg.nodes.forEach((nd, i) => {
      if (i < 2 || i % step) return;
      const g = nd.d / maxD, a0 = Math.atan2(nd.dir.y, nd.dir.x);
      [1, -1].forEach(side => {
        const ang = a0 + side * rr(0.55, 1.15) - Math.PI / 2;
        items.push({ p: nd.p, ang, size: rr(0.38, 0.52) * (seg.depth === 1 ? 1.1 : 1), g, kind: 0 });
      });
      if (rnd() < 0.22) items.push({ p: nd.p, ang: a0 + rr(-1, 1), size: rr(0.38, 0.48), g, kind: 1 });
      if (seg.depth >= 2 && rnd() < 0.16) items.push({ p: nd.p, ang: rr(0, 6.28), size: rr(0.24, 0.32), g, kind: 2 });
    });
    // a tuft at every tip
    const tip = seg.nodes[seg.nodes.length - 1], ta = Math.atan2(tip.dir.y, tip.dir.x) - Math.PI / 2;
    items.push({ p: tip.p, ang: ta, size: 0.46, g: tip.d / maxD, kind: 0 });
  });
  const N = items.length;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const aP = new Float32Array(N * 3), aI = new Float32Array(N * 4), aR = new Float32Array(N * 2);
  items.forEach((it, i) => {
    aP.set([it.p.x, it.p.y, it.p.z + 0.4 + rnd() * 0.3], i * 3);
    aI.set([it.ang, it.size, it.g, it.kind], i * 4);
    aR.set([rnd(), rnd()], i * 2);
  });
  geo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 3));
  geo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
  geo.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 2));
  geo.instanceCount = N;

  const leafMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: atlas() }, uP: U.uP, uTime: U.uTime },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `
      uniform float uP; uniform float uTime;
      attribute vec3 aP; attribute vec4 aI; attribute vec2 aR;
      varying vec2 vUv; varying float vKind; varying float vT; varying float vR;
      float back(float x){ float c1 = 1.9, c3 = c1 + 1.0; return 1.0 + c3*pow(x-1.0,3.0) + c1*pow(x-1.0,2.0); }
      void main(){
        float ang = aI.x, sz = aI.y, g = aI.z, kind = aI.w;
        vec3 p = aP; float scale = 1.0; float t = 1.0;
        float sway = sin(uTime * 1.3 + aP.x * 0.9 + aR.y * 6.0) * 0.08 + sin(uTime * 0.6 + aP.y) * 0.05;
        if (kind < 0.5) {            // green leaf grows in along the wood
          float d = 0.22 + g * 0.5 + aR.x * 0.08;
          t = clamp((uP - d) / 0.2, 0.0, 1.0);
          scale = t <= 0.0 ? 0.0 : back(t);
        } else if (kind < 1.5) {     // dead leaf lets go and falls
          float d = 0.02 + aR.x * 0.3;
          t = clamp((uP - d) / 0.28, 0.0, 1.0);
          p.y -= t * t * 3.2; p.x -= t * (0.6 + aR.y);
          ang += t * (2.0 + aR.y * 3.0);
          scale = 1.0 - smoothstep(0.55, 1.0, t);
        } else {                     // blossom opens last
          float d = 0.72 + aR.x * 0.18;
          t = clamp((uP - d) / 0.16, 0.0, 1.0);
          scale = t <= 0.0 ? 0.0 : back(t);
        }
        ang += sway * (kind > 1.5 ? 0.3 : 1.0);
        vec2 q = position.xy * vec2(kind > 1.5 ? 1.0 : 0.62, 1.0) * sz * scale;
        if (kind > 1.5) q.y -= 0.5 * sz * scale;
        float s = sin(ang), c = cos(ang);
        p.xy += vec2(c * q.x - s * q.y, s * q.x + c * q.y);
        vUv = uv; vKind = kind; vT = t; vR = aR.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform float uP;
      varying vec2 vUv; varying float vKind; varying float vT; varying float vR;
      void main(){
        vec2 uv = vec2((vUv.x + (vKind > 1.5 ? 1.0 : 0.0)) * 0.5, vUv.y);
        vec4 tx = texture2D(uTex, uv);
        vec3 ink = vec3(0.078, 0.188, 0.122);
        vec3 col; float a;
        if (vKind > 1.5) { col = tx.rgb; a = tx.a; }
        else {
          vec3 base;
          if (vKind > 0.5) base = mix(vec3(0.85, 0.47, 0.16), vec3(0.55, 0.33, 0.17), step(0.5, vR));   // orange / brown
          else {
            vec3 young = vec3(0.62, 0.84, 0.22), green = mix(vec3(0.20, 0.60, 0.25), vec3(0.25, 0.68, 0.24), vR);
            base = mix(young, green, smoothstep(0.4, 1.0, vT));
          }
          col = mix(base, base * vec3(0.70, 0.78, 0.74), tx.g);
          col = mix(col, ink, tx.b);
          a = max(tx.r, tx.b);
        }
        if (a < 0.4) discard;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const leaves = new THREE.Mesh(geo, leafMat);
  leaves.frustumCulled = false;
  group.add(leaves);

  /* ---------- tilt: the branch runs from the top-right corner down to the left ---------- */
  group.rotation.z = 0.52;
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group.children[0]).expandByScalar(0.5);

  function layout() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    const portrait = w / h < 0.9;
    // where the wood's bounding box lands on screen (fractions of the viewport)
    const L = portrait ? -0.3 : 0.36, R = portrait ? 1.18 : 1.12, T = portrait ? -0.2 : -0.08;
    const k = (box.max.x - box.min.x) / ((R - L) * w);
    const x0 = box.max.x - R * w * k, y0 = box.max.y - T * h * k;
    camera.left = x0; camera.right = x0 + w * k; camera.top = y0; camera.bottom = y0 - h * k;
    camera.updateProjectionMatrix();
    U.uOutline.value = 1.6 * k;   // about 1.6 screen px of ink
  }
  addEventListener('resize', layout);
  layout();

  /* ---------- timeline: once, about 4 s, then idle sway ---------- */
  const HOLD = 0.4, DUR = 4.0;
  const dead = new THREE.Color(C.barkDead), alive = new THREE.Color(C.barkAlive);
  let t0 = null, visible = true;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (t0 === null) t0 = now;
    const el = (now - t0) / 1000;
    const P = !isNaN(FREEZE) ? FREEZE : reduce ? 1 : Math.min(1, Math.max(0, (el - HOLD) / DUR));
    U.uP.value = P; U.uTime.value = el;
    woodMat.color.copy(dead).lerp(alive, Math.min(1, P * 1.6));
    group.rotation.z = 0.52 + Math.sin(el * 0.5) * 0.006 * P;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  window.HPSpring = {
    replay() { t0 = null; },
    pause(v) { visible = !v; },
    setWord() {}
  };
})();
