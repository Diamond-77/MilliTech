import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { asset } from './config.js'

// The three drawings are 1670 x 941. Everything below is measured in those pixels.
const W = 1670
const H = 941
const TAP = { x: 838, y: 690 } // the bouquet behind his back (scene 1)
const SHOP = { x: 833, y: 236 } // the shop window, where the camera ends up
const BOUQUET = { x: 795, y: 440 } // the bouquet in her arms (scene 3)

// Seconds after the tap.
const T = {
  give: [0, 0.55], // he brings the flowers round
  build: [0.15, 1.9], // the ruler lines become a pencil drawing of the shop
  hug: [1.75, 2.2], // she takes them
  color: [2.35, 5.6], // colour soaks outward from the bouquet
  line: [3.0, 6.4], // the tagline
  zoom: [6.0, 9.6], // slow push in to the shop
  wash: [8.3, 9.6], // warm paper light takes over
  end: 9.7,
}

// ?t=3.2 holds the story at that second (used for checking frames).
const FREEZE = (() => {
  const m = /[?&]t=([\d.]+)/.exec(location.search)
  return m ? parseFloat(m[1]) : null
})()

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const span = (e, [a, b]) => clamp01((e - a) / (b - a))
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smooth = (t) => t * t * (3 - 2 * t)

function fit(vw, vh) {
  let s = Math.max(vw / W, vh / H) // fill the screen...
  s = Math.min(s, vw / 620, vh / 800) // ...but never crop the two of them
  const visH = vh / s
  const fy = visH >= H ? H / 2 : Math.max(H / 2, 905 - visH / 2)
  return { s, fx: W / 2, fy }
}

function useViewport() {
  const [v, setV] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const FRAG = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uS1, uT2, uT3, uSk, uMask;
uniform float uGive, uSettle, uBuild, uHug, uColor, uLife, uTime;
uniform vec3 uPaper;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return s;
}
vec2 S(vec2 p) { return vec2(p.x, 1.0 - p.y); }

void main() {
  vec2 size = vec2(1670.0, 941.0);
  vec2 p = vec2(vUv.x, 1.0 - vUv.y);
  vec2 px = p * size;
  float n = fbm(px / 90.0);
  float n2 = fbm(px / 22.0 + 7.0);

  // Scene 1 (ruler sketch). The camera settles so its shop lands on the real one.
  float s = mix(1.0, 1.12, uSettle);
  vec2 src = vec2((px.x - mix(836.0, 830.0, uSettle)) / s + 836.0,
                  (px.y - mix(190.0, 205.0, uSettle)) / s + 190.0);
  vec2 u1 = src / size;
  float in1 = step(0.0, u1.x) * step(u1.x, 1.0) * step(0.0, u1.y) * step(u1.y, 1.0);
  vec3 c1 = mix(vec3(1.0), texture2D(uS1, S(u1)).rgb, in1);
  float m1 = texture2D(uMask, S(u1)).b * in1;
  vec4 mk = texture2D(uMask, S(p));

  // Pencil drawing of the finished street, drawn outward from the two of them.
  float skv = texture2D(uSk, S(p)).r;
  vec3 skc = mix(vec3(0.27, 0.27, 0.37), vec3(1.0), skv);
  float d = length((px - vec2(820.0, 560.0)) / 941.0);
  float front = uBuild * 1.75 - 0.25;
  float bm = 1.0 - smoothstep(front - 0.24, front, d + (n - 0.5) * 0.34);
  vec3 col = mix(mix(c1, vec3(1.0), m1), skc, bm);

  // The two of them: waiting -> giving -> hugging the bouquet.
  vec3 t2 = texture2D(uT2, S(p)).rgb;
  vec3 t3 = texture2D(uT3, S(p)).rgb;
  col = mix(col, c1, m1 * (1.0 - uGive));
  col = mix(col, t2, mk.r * uGive * (1.0 - uHug));
  col = mix(col, t3, mk.g * uHug);

  // Colour soaks out of the bouquet like watercolour on wet paper.
  float dc = length((px - vec2(795.0, 440.0)) / 941.0);
  float cf = uColor * 1.75 - 0.3;
  float cm = 1.0 - smoothstep(cf - 0.3, cf, dc + (n - 0.5) * 0.42 + (n2 - 0.5) * 0.08);
  cm *= step(0.001, uColor);

  // A little life once it is coloured: drifting leaf light and glowing lamps.
  vec3 warm = t3;
  float sh = fbm(px / 150.0 + vec2(uTime * 0.11, uTime * 0.06));
  warm *= 1.0 + (sh - 0.5) * 0.12 * uLife;
  float glow = 0.0;
  glow += exp(-dot(px - vec2(598.0, 172.0), px - vec2(598.0, 172.0)) / 1500.0) * (0.8 + 0.2 * sin(uTime * 2.3));
  glow += exp(-dot(px - vec2(733.0, 172.0), px - vec2(733.0, 172.0)) / 1500.0) * (0.8 + 0.2 * sin(uTime * 1.9 + 2.0));
  glow += exp(-dot(px - vec2(880.0, 172.0), px - vec2(880.0, 172.0)) / 1500.0) * (0.8 + 0.2 * sin(uTime * 2.7 + 4.0));
  warm += vec3(1.0, 0.72, 0.36) * glow * 0.22 * uLife;

  float rim = cm * (1.0 - cm) * 4.0;
  col = mix(col, warm, cm);
  col = mix(col, col * vec3(1.0, 0.9, 0.84), rim * 0.22);

  // Paper: the white of the sketch is the page itself.
  col *= mix(uPaper, vec3(1.0), cm * 0.9);
  col += (hash(px * 0.7) - 0.5) * 0.022;

  // Painted edge instead of a hard rectangle.
  vec2 e = min(px, size - px);
  float a = smoothstep(2.0, 64.0, min(e.x, e.y) + (n - 0.5) * 56.0);
  gl_FragColor = vec4(col * a, a);
}`

const LEAF_COLORS = ['#f3c84b', '#f6a85c', '#e9b23a', '#f7b6c2', '#f2d27a', '#ee9a52']

function leafShape() {
  const s = new THREE.Shape()
  s.moveTo(0, -1)
  s.bezierCurveTo(0.75, -0.5, 0.7, 0.55, 0, 1)
  s.bezierCurveTo(-0.7, 0.55, -0.75, -0.5, 0, -1)
  return new THREE.ShapeGeometry(s, 6)
}

function heartShape() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.9)
  s.bezierCurveTo(-1.5, 0.1, -0.7, 1.2, 0, 0.45)
  s.bezierCurveTo(0.7, 1.2, 1.5, 0.1, 0, -0.9)
  return new THREE.ShapeGeometry(s, 8)
}

function Leaves({ clock }) {
  const group = useRef()
  const geo = useMemo(leafShape, [])
  const leaves = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 7 + Math.random() * 11,
        fall: 26 + Math.random() * 40,
        sway: 18 + Math.random() * 40,
        phase: Math.random() * 6.28,
        spin: (Math.random() - 0.5) * 2.4,
        color: LEAF_COLORS[i % LEAF_COLORS.length],
      })),
    [],
  )
  useFrame(({ clock: c }) => {
    const g = group.current
    if (!g) return
    const life = clock.current.life
    const t = c.elapsedTime
    g.visible = life > 0.001
    g.children.forEach((m, i) => {
      const l = leaves[i]
      const y = (l.y + t * l.fall) % (H + 80) - 40
      const x = l.x + Math.sin(t * 0.7 + l.phase) * l.sway
      m.position.set(x - W / 2, H / 2 - y, 2)
      m.rotation.z = l.phase + t * l.spin
      m.scale.set(l.size * (0.55 + 0.45 * Math.sin(t * 1.3 + l.phase)), l.size, 1)
      m.material.opacity = 0.85 * life
    })
  })
  return (
    <group ref={group} visible={false}>
      {leaves.map((l, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial color={l.color} transparent opacity={0} depthTest={false} />
        </mesh>
      ))}
    </group>
  )
}

function Hearts({ clock }) {
  const group = useRef()
  const geo = useMemo(heartShape, [])
  const hearts = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        dx: (Math.random() - 0.5) * 190,
        delay: i * 0.16 + Math.random() * 0.1,
        size: 9 + Math.random() * 9,
        rise: 110 + Math.random() * 90,
        tilt: (Math.random() - 0.5) * 0.7,
        color: i % 2 ? '#f48a8a' : '#f6b3bf',
      })),
    [],
  )
  useFrame(() => {
    const g = group.current
    if (!g) return
    const e = clock.current.e
    g.children.forEach((m, i) => {
      const h = hearts[i]
      const t = clamp01((e - T.hug[0] - h.delay) / 1.7)
      const on = t > 0 && t < 1
      m.visible = on
      if (!on) return
      const pop = easeOut(clamp01(t * 4))
      m.position.set(BOUQUET.x + h.dx - W / 2 + Math.sin(t * 5 + i) * 8, H / 2 - (BOUQUET.y - 70 - easeOut(t) * h.rise), 3)
      m.rotation.z = h.tilt
      m.scale.setScalar(h.size * pop)
      m.material.opacity = 1 - smooth(clamp01((t - 0.55) / 0.45))
    })
  })
  return (
    <group ref={group}>
      {hearts.map((h, i) => (
        <mesh key={i} geometry={geo} visible={false}>
          <meshBasicMaterial color={h.color} transparent depthTest={false} />
        </mesh>
      ))}
    </group>
  )
}

function Stage({ clock, view, onFrame, onReady }) {
  const [s1, t2, t3, sk, mask] = useLoader(THREE.TextureLoader, [
    asset('scene/s1.webp'),
    asset('scene/t2.webp'),
    asset('scene/t3.webp'),
    asset('scene/sk.webp'),
    asset('scene/masks.png'),
  ])
  const camera = useThree((st) => st.camera)
  const material = useMemo(() => {
    for (const t of [s1, t2, t3, sk, mask]) {
      t.generateMipmaps = false
      t.minFilter = THREE.LinearFilter
      t.magFilter = THREE.LinearFilter
      t.colorSpace = THREE.NoColorSpace
      t.needsUpdate = true
    }
    const uniforms = {
      uS1: { value: s1 },
      uT2: { value: t2 },
      uT3: { value: t3 },
      uSk: { value: sk },
      uMask: { value: mask },
      uGive: { value: 0 },
      uSettle: { value: 0 },
      uBuild: { value: 0 },
      uHug: { value: 0 },
      uColor: { value: 0 },
      uLife: { value: 0 },
      uTime: { value: 0 },
      uPaper: { value: new THREE.Vector3(0.972, 0.945, 0.9) },
    }
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
    })
  }, [s1, t2, t3, sk, mask])
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    onReady()
  }, [onReady])

  useFrame(({ clock: c }) => {
    const ck = clock.current
    const e = FREEZE != null ? FREEZE : ck.start == null ? -1 : performance.now() / 1000 - ck.start
    ck.e = e
    const u = material.uniforms
    u.uTime.value = c.elapsedTime
    u.uGive.value = smooth(span(e, T.give))
    u.uSettle.value = easeInOut(span(e, [T.give[0], T.build[1] - 0.5]))
    u.uBuild.value = span(e, T.build)
    u.uHug.value = smooth(span(e, T.hug))
    const ct = span(e, T.color)
    u.uColor.value = 0.55 * ct + 0.45 * smooth(ct)
    ck.life = smooth(span(e, [T.color[0] + 0.9, T.color[1]]))
    u.uLife.value = ck.life

    // Camera: a gentle breath while waiting, a small lean-in on the tap, then the push to the shop.
    const { s, fx, fy } = fit(view.w, view.h)
    const z = easeInOut(span(e, T.zoom))
    const endS = Math.max(s * 1.6, Math.min(Math.max(view.w / 640, view.h / 340), s * 3.4))
    const breath = e < 0 ? 1 + Math.sin(c.elapsedTime * 0.9) * 0.004 : 1
    const lean = 1 + 0.035 * easeOut(span(e, [0, 2.4]))
    camera.zoom = s * breath * lean * Math.pow(endS / (s * 1.035), z)
    const cx = fx + (SHOP.x - fx) * z
    const cy = fy + (SHOP.y - fy) * z
    camera.position.set(cx - W / 2, H / 2 - cy, 10)
    camera.updateProjectionMatrix()
    onFrame(e)
  })

  return (
    <>
      <mesh>
        <planeGeometry args={[W, H]} />
        <primitive object={material} attach="material" />
      </mesh>
      <Leaves clock={clock} />
      <Hearts clock={clock} />
    </>
  )
}

class Guard extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFail?.()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    // three.js only runs on WebGL2. Older phones get the simple version instead of a blank screen.
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

export default function Intro({ onDone }) {
  const view = useViewport()
  const clock = useRef({ start: null, e: -1, life: 0 })
  const [ready, setReady] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [nudge, setNudge] = useState(0)
  const [gl] = useState(hasWebGL)
  const [flat, setFlat] = useState(!gl)
  const wash = useRef()
  const flatRef = useRef()
  const line = useRef()
  const finished = useRef(false)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    onDone()
  }

  const onFrame = (e) => {
    if (flatRef.current) {
      const f = flatRef.current
      f.style.setProperty('--give', smooth(span(e, [0, 1.2])))
      f.style.setProperty('--hug', smooth(span(e, [T.hug[0], T.hug[0] + 0.8])))
      f.style.setProperty('--zoom', easeInOut(span(e, T.zoom)))
    }
    if (wash.current) wash.current.style.opacity = smooth(span(e, T.wash))
    if (line.current) {
      const a = smooth(span(e, [T.line[0], T.line[0] + 0.9])) * (1 - smooth(span(e, [T.line[1] - 0.7, T.line[1]])))
      line.current.style.opacity = a
      line.current.style.transform = `translate(-50%, ${(1 - a) * 10}px)`
    }
    if (e >= T.end && FREEZE == null) finish()
  }

  const give = () => {
    if (tapped || !ready) return
    clock.current.start = performance.now() / 1000
    setTapped(true)
  }

  // Without WebGL the story still plays as simple fades.
  useEffect(() => {
    if (!flat || !tapped) return
    let raf
    const tick = () => {
      onFrame(performance.now() / 1000 - clock.current.start)
      if (!finished.current) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [flat, tapped])

  useEffect(() => {
    if (flat) setReady(true)
  }, [flat])

  // Watchdog: if the drawing never appears (slow GPU, blocked WebGL, stuck load), switch to the simple version.
  useEffect(() => {
    if (flat || ready) return
    const id = setTimeout(() => setFlat(true), 8000)
    return () => clearTimeout(id)
  }, [flat, ready])

  useEffect(() => {
    const key = (ev) => {
      if (ev.key === 'Escape') finish()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const { s, fx, fy } = fit(view.w, view.h)
  const sx = (x) => view.w / 2 + (x - fx) * s
  const sy = (y) => view.h / 2 + (y - fy) * s
  const narrow = view.w < 760
  const cover = { width: W * s, height: H * s, left: sx(0), top: sy(0) }

  return (
    <div
      className={`intro${tapped ? ' is-tapped' : ''}${ready ? ' is-ready' : ''}`}
      onPointerDown={(ev) => {
        if (!tapped && ev.target === ev.currentTarget.querySelector('canvas')) setNudge((n) => n + 1)
      }}
    >
      {flat ? (
        <div className="intro-flat" ref={flatRef}>
          <img src={asset('scene/s1.webp')} alt="" style={cover} />
          <img src={asset('scene/t2.webp')} alt="" style={cover} className="flat-t2" />
          <img src={asset('scene/t3.webp')} alt="" style={cover} className="flat-t3" />
        </div>
      ) : (
        <Guard onFail={() => setFlat(true)}>
          <Canvas
            orthographic
            flat
            dpr={[1, 2]}
            gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0, 10], near: 0.1, far: 100 }}
            onCreated={({ gl: r }) => {
              r.setClearColor(0x000000, 0)
              r.domElement.addEventListener('webglcontextlost', () => setFlat(true))
            }}
          >
            <Suspense fallback={null}>
              <Stage clock={clock} view={view} onFrame={onFrame} onReady={() => setReady(true)} />
            </Suspense>
          </Canvas>
        </Guard>
      )}

      {!ready && <p className="intro-loading">sharpening the pencil…</p>}

      <button
        type="button"
        className="intro-hit"
        aria-label="Give her the flowers"
        onClick={give}
        style={{ left: sx(TAP.x), top: sy(TAP.y), width: Math.max(96, 210 * s), height: Math.max(120, 280 * s) }}
      >
        <span className="intro-dot" />
      </button>

      <p
        key={nudge}
        className={`intro-hint${nudge ? ' is-nudged' : ''}${narrow ? ' is-narrow' : ''}`}
        style={narrow ? { left: '50%', top: Math.min(view.h - 96, sy(H) + 6) } : { left: sx(TAP.x + 135), top: sy(TAP.y - 62) }}
      >
        {!narrow && (
          <svg viewBox="0 0 90 50" aria-hidden="true">
            <path d="M86 40 C 60 46, 30 40, 8 14" />
            <path d="M6 28 L8 13 L22 17" />
          </svg>
        )}
        <span>
          tap his back
          <br />
          help him give her the flowers
        </span>
      </p>

      <p className="intro-line" ref={line}>
        Every flower has a feeling.
      </p>

      <button type="button" className="intro-skip" onClick={finish}>
        Skip the story
      </button>
      <div className="intro-wash" ref={wash} />
    </div>
  )
}
