import { useEffect, useMemo, useRef, useState } from 'react'
import { SHOP, asset, igLink, waLink } from './config.js'

const img = (name) => asset(`img/${name}.webp`)

const FEELINGS = [
  {
    id: 'birthday',
    tag: 'Happy birthday',
    line: 'For the birthdays you almost forgot.',
    tint: 'orange',
    photos: ['a1', 'a15', 'a2'],
    alt: ['Bright gerbera bouquet in orange wrap', 'Red and yellow carnation bouquet', 'Pink rose and lily bouquet'],
  },
  {
    id: 'sorry',
    tag: 'I am sorry',
    line: 'For the apologies you couldn’t put into words.',
    tint: 'green',
    photos: ['a11', 'a10', 'a14'],
    alt: ['White lily and chrysanthemum bouquet', 'White gerbera bouquet in blue wrap', 'Pale green rose bouquet'],
  },
  {
    id: 'thanks',
    tag: 'Thank you',
    line: 'A thoughtful gesture, wrapped in petals.',
    tint: 'butter',
    photos: ['a16', 'a8', 'a5'],
    alt: ['Sunflower bouquet in peach wrap', 'Yellow dried flower bouquet', 'Two dried flower bouquets'],
  },
  {
    id: 'love',
    tag: 'I love you',
    line: 'For the people who make your world bloom.',
    tint: 'pink',
    photos: ['a13', 'a2', 'a9'],
    alt: ['Red roses in black wrap', 'Pink rose and lily bouquet', 'Peach flower bouquet in orange wrap'],
  },
  {
    id: 'because',
    tag: 'Just because',
    line: 'Make ordinary days feel extraordinary.',
    tint: 'lilac',
    photos: ['a12', 'a7', 'a15'],
    alt: ['Peach carnation and lily bouquet', 'Blue hydrangeas', 'Red and yellow carnation bouquet'],
  },
]

const OCCASIONS = ['Birthday', 'Anniversary', 'Thank you', 'Apology', 'Congratulations', 'Just because']
const COLOURS = [
  { name: 'Pinks', hex: '#f4b6c4' },
  { name: 'Reds', hex: '#d9545f' },
  { name: 'Whites', hex: '#fbf8f0' },
  { name: 'Yellows', hex: '#f3cf5b' },
  { name: 'Oranges', hex: '#f6ad6b' },
  { name: 'Blues', hex: '#9db7e6' },
  { name: 'Soft greens', hex: '#c3d9b0' },
]
const LINES = [
  'Say it with flowers.',
  'A thoughtful gesture, wrapped in petals.',
  'Because they deserve something beautiful.',
  'More than flowers. A feeling worth sharing.',
  'For the people who make your world bloom.',
  'Make ordinary days feel extraordinary.',
]

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Tape({ c = 'pink', style }) {
  return <i className={`tape tape-${c}`} style={style} aria-hidden="true" />
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1 2.1-.4 3.4a11.5 11.5 0 0 0 4.800 4.600c1.700.800 2.600.800 3.500.500.600-.200 1.500-.800 1.700-1.500.100-.400.100-.600-.100-.600Z"
      />
    </svg>
  )
}

function Hero({ arrived }) {
  return (
    <header className={`hero${arrived ? ' is-arrived' : ''}`}>
      <div className="blob blob-pink" style={{ left: '-6%', top: '8%' }} />
      <div className="blob blob-orange" style={{ right: '4%', top: '2%' }} />
      <div className="blob blob-green" style={{ right: '22%', bottom: '-4%' }} />

      <div className="hero-top">
        <img className="hero-logo" src={img('logo')} alt="Leikoi Kromatics, floral artistry, established 2019" width="800" height="780" />
      </div>

      <div className="hero-body">
        <div className="hero-copy">
          <p className="scribble hero-kicker">you just walked into our little shop</p>
          <h1>
            Every flower has <em>a feeling.</em>
            <br />
            Every bouquet tells <em>a story.</em>
          </h1>
          <p className="lede">
            Flowers for the feelings that words cannot express. Thoughtfully arranged in {SHOP.place}.
          </p>
          <div className="actions">
            <a className="btn btn-ink" href={waLink('Hi Leikoi Kromatics! I would like to enquire about a bouquet.')} target="_blank" rel="noopener">
              <WaIcon /> Order on WhatsApp
            </a>
            <a className="btn btn-line" href="#feelings">
              Pick a feeling
            </a>
          </div>
        </div>

        <div className="hero-pile" aria-hidden="false">
          <figure className="pile-a">
            <img src={img('a2-w')} alt="Pink rose and lily bouquet in pink wrap" loading="eager" />
          </figure>
          <figure className="pile-b print">
            <Tape c="green" style={{ left: '34%', top: -12, transform: 'rotate(-4deg)' }} />
            <img src={img('a13-p')} alt="Red roses wrapped in black paper" />
          </figure>
          <figure className="pile-c print">
            <Tape c="orange" style={{ right: '18%', top: -10, transform: 'rotate(6deg)' }} />
            <img src={img('a16-p')} alt="Sunflower bouquet in peach wrap" />
          </figure>
          <p className="scribble pile-note">
            for someone who
            <br />
            means everything
          </p>
        </div>
      </div>
    </header>
  )
}

function Letter() {
  const video = useRef()
  useEffect(() => {
    const v = video.current
    if (!v || !('IntersectionObserver' in window)) return
    v.muted = true
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return (
    <section className="letter-wrap" id="about">
      <div className="blob blob-butter" style={{ left: '38%', top: '10%' }} />
      <article className="letter" data-reveal>
        <Tape c="pink" style={{ left: '12%', top: -14, transform: 'rotate(-5deg)' }} />
        <p className="scribble letter-to">a note from us</p>
        <h2>
          Some feelings are difficult to put <em>into words.</em>
        </h2>
        <p>
          A little appreciation, a heartfelt apology, a birthday surprise, or simply letting someone know they are
          special. At Leikoi Kromatics, we believe flowers make those moments more meaningful.
        </p>
        <p>
          From beautiful fresh blooms to thoughtfully arranged bouquets, every creation is an opportunity to turn an
          ordinary moment into something worth remembering.
        </p>
        <p>
          Whether you’re celebrating someone special, expressing gratitude, or surprising someone just because, we’re
          here to help you find the perfect arrangement.
        </p>
        <p className="letter-end">Because sometimes, the simplest gestures leave the biggest impressions.</p>
        <p className="scribble letter-sign">Let flowers do the talking. &nbsp;— Leikoi Kromatics</p>
      </article>

      <figure className="reel" data-reveal>
        <Tape c="orange" style={{ left: '38%', top: -14, transform: 'rotate(3deg)' }} />
        <video
          ref={video}
          src={asset('media/bouquets.mp4')}
          poster={asset('media/bouquets.jpg')}
          muted
          loop
          playsInline
          preload="none"
          aria-label="Close-up of several fresh bouquets wrapped in kraft paper"
        />
        <figcaption className="scribble">a few we wrapped up</figcaption>
      </figure>
    </section>
  )
}

function Feelings() {
  const [id, setId] = useState('love')
  const f = FEELINGS.find((x) => x.id === id)
  return (
    <section className={`feelings tint-${f.tint}`} id="feelings">
      <div className="feelings-head" data-reveal>
        <p className="scribble">not every feeling needs words</p>
        <h2>
          What would you like <em>to say?</em>
        </h2>
      </div>

      <div className="string" role="tablist" aria-label="Pick a feeling" data-reveal>
        <svg className="string-line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 14 C 180 44, 330 6, 500 26 S 830 46, 1000 12" />
        </svg>
        {FEELINGS.map((x, i) => (
          <button
            key={x.id}
            role="tab"
            type="button"
            aria-selected={x.id === id}
            className={`tagcard tint-${x.tint}${x.id === id ? ' is-on' : ''}`}
            style={{ '--r': `${[-5, 3, -2, 5, -4][i]}deg`, '--drop': `${[18, 30, 12, 28, 16][i]}px` }}
            onClick={() => setId(x.id)}
          >
            <span className="tag-hole" />
            {x.tag}
          </button>
        ))}
      </div>

      <div className="table" key={f.id} role="tabpanel">
        <div className="blob blob-tint" />
        <figure className="t-main">
          <img src={img(`${f.photos[0]}-w`)} alt={f.alt[0]} />
        </figure>
        <figure className="t-side t-one print">
          <Tape c="pink" style={{ left: '30%', top: -12, transform: 'rotate(-6deg)' }} />
          <img src={img(`${f.photos[1]}-p`)} alt={f.alt[1]} loading="lazy" />
        </figure>
        <figure className="t-side t-two print">
          <Tape c="green" style={{ left: '36%', top: -12, transform: 'rotate(5deg)' }} />
          <img src={img(`${f.photos[2]}-p`)} alt={f.alt[2]} loading="lazy" />
        </figure>
        <div className="t-say">
          <p className="t-line">{f.line}</p>
          <a
            className="btn btn-ink"
            href={waLink(`Hi Leikoi Kromatics! I would like a bouquet that says "${f.tag}". Could you help me pick one?`)}
            target="_blank"
            rel="noopener"
          >
            <WaIcon /> Ask for one like this
          </a>
        </div>
      </div>
    </section>
  )
}

function OrderSlip() {
  const [occasion, setOccasion] = useState('Birthday')
  const [colours, setColours] = useState(['Pinks'])
  const [who, setWho] = useState('')
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')

  const toggle = (name) => setColours((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]))

  const message = useMemo(() => {
    const parts = [`Hi Leikoi Kromatics! I would like a custom bouquet.`, `Occasion: ${occasion}`]
    parts.push(`Colours: ${colours.length ? colours.join(', ') : 'Surprise me'}`)
    if (who.trim()) parts.push(`For: ${who.trim()}`)
    if (when) parts.push(`Needed on: ${when}`)
    if (note.trim()) parts.push(`Note: ${note.trim()}`)
    return parts.join('\n')
  }, [occasion, colours, who, when, note])

  return (
    <section className="custom" id="custom">
      <div className="custom-head" data-reveal>
        <p className="scribble">tell us what you’re celebrating</p>
        <h2>
          Your occasion. Your colours. <em>Your bouquet.</em>
        </h2>
        <p className="lede">
          A bouquet should feel as special as the person receiving it. From the choice of flowers to the colours and
          finishing touches, every little detail matters.
        </p>
      </div>

      <div className="custom-body">
        <form className="slip" data-reveal onSubmit={(e) => e.preventDefault()}>
          <p className="slip-title">Order slip</p>

          <fieldset>
            <legend>1. What’s the occasion?</legend>
            <div className="chips">
              {OCCASIONS.map((o) => (
                <button key={o} type="button" className={`chip${o === occasion ? ' is-on' : ''}`} aria-pressed={o === occasion} onClick={() => setOccasion(o)}>
                  {o}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>2. Which colours feel right?</legend>
            <div className="swatches">
              {COLOURS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`swatch${colours.includes(c.name) ? ' is-on' : ''}`}
                  aria-pressed={colours.includes(c.name)}
                  onClick={() => toggle(c.name)}
                >
                  <i style={{ background: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
            <p className="hint-small">Pick none and we’ll take it as “surprise me”.</p>
          </fieldset>

          <fieldset className="row">
            <label>
              3. Who is it for?
              <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="My sister, a friend…" maxLength={60} />
            </label>
            <label>
              4. When do you need it?
              <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
            </label>
          </fieldset>

          <label className="full">
            5. Anything else we should know?
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Her favourite flower, a message for the card…" maxLength={240} />
          </label>
        </form>

        <aside className="card" data-reveal>
          <Tape c="green" style={{ left: '40%', top: -13, transform: 'rotate(-3deg)' }} />
          <p className="card-label">Your message to us</p>
          <p className="card-text scribble">{message}</p>
          <a className="btn btn-ink" href={waLink(message)} target="_blank" rel="noopener">
            <WaIcon /> Send on WhatsApp
          </a>
          <p className="hint-small">Nothing is sent until you press send in WhatsApp.</p>
        </aside>
      </div>
    </section>
  )
}

function Bench() {
  return (
    <section className="bench" id="shop">
      <div className="ribbon" aria-hidden="true">
        <div className="ribbon-track">
          {[...LINES, ...LINES].map((l, i) => (
            <span key={i}>
              {l} <b>✿</b>
            </span>
          ))}
        </div>
      </div>

      <div className="bench-head" data-reveal>
        <p className="scribble">from the field to your hands</p>
        <h2>
          Making moments bloom <em>in Imphal.</em>
        </h2>
      </div>

      <div className="collage">
        <figure className="c1" data-reveal>
          <img src={img('a3-w')} alt="A field of yellow marigolds" loading="lazy" />
          <figcaption className="scribble">fresh blooms</figcaption>
        </figure>
        <figure className="c2 print" data-reveal>
          <Tape c="pink" style={{ left: '30%', top: -12, transform: 'rotate(-5deg)' }} />
          <img src={img('a6-p')} alt="Florist among white and green hydrangeas" loading="lazy" />
        </figure>
        <figure className="c3" data-reveal>
          <img src={img('a7-w')} alt="Blue hydrangeas" loading="lazy" />
        </figure>
        <figure className="c4 print" data-reveal>
          <Tape c="orange" style={{ left: '40%', top: -12, transform: 'rotate(4deg)' }} />
          <img src={img('a4-p')} alt="Shop shelves filled with ready bouquets" loading="lazy" />
        </figure>
        <figure className="c5 print" data-reveal>
          <Tape c="green" style={{ left: '28%', top: -12, transform: 'rotate(-3deg)' }} />
          <img src={img('a5-p')} alt="Two dried flower bouquets held by the florist" loading="lazy" />
        </figure>
        <p className="c-note scribble" data-reveal>
          thoughtfully arranged,
          <br />
          one bouquet at a time
        </p>
      </div>
    </section>
  )
}

function Footer({ onReplay }) {
  return (
    <footer className="foot">
      <div className="blob blob-pink" style={{ left: '6%', top: '12%' }} />
      <div className="blob blob-green" style={{ right: '4%', bottom: '10%' }} />
      <div className="foot-main">
        <img className="foot-logo" src={img('logo')} alt="Leikoi Kromatics" width="800" height="780" loading="lazy" />
        <div className="foot-copy">
          <h2>
            Let flowers do <em>the talking.</em>
          </h2>
          <p className="lede">Make someone’s day bloom. Get in touch to enquire about your bouquet.</p>
          <div className="actions">
            <a className="btn btn-ink" href={waLink('Hi Leikoi Kromatics! I would like to enquire about a bouquet.')} target="_blank" rel="noopener">
              <WaIcon /> Order on WhatsApp
            </a>
            <a className="btn btn-line" href={igLink()} target="_blank" rel="noopener">
              DM us on Instagram
            </a>
          </div>
          <p className="foot-place">{SHOP.place} · Estd 2019</p>
        </div>
        <button type="button" className="story" onClick={onReplay}>
          <img src={img('story')} alt="Illustration of a girl hugging a bouquet outside the shop" loading="lazy" />
          <span className="scribble">↺ watch the little story again</span>
        </button>
      </div>
      <p className="credit">
        Developed by{' '}
        <a href="https://millitech.vercel.app" target="_blank" rel="noopener">
          MILLITECH
        </a>
      </p>
    </footer>
  )
}

export default function Page({ arrived, onReplay }) {
  useReveal()
  return (
    <div className="page" aria-hidden={!arrived}>
      <Hero arrived={arrived} />
      <main>
        <Letter />
        <Feelings />
        <OrderSlip />
        <Bench />
      </main>
      <Footer onReplay={onReplay} />
      <a className={`fab${arrived ? ' is-on' : ''}`} href={waLink('Hi Leikoi Kromatics! I would like to enquire about a bouquet.')} target="_blank" rel="noopener" aria-label="Order on WhatsApp">
        <WaIcon />
      </a>
    </div>
  )
}
