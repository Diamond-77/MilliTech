import { useCallback, useEffect, useState } from 'react'
import Intro from './Intro.jsx'
import Page from './Page.jsx'

const reduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const [intro, setIntro] = useState(() => !reduced() && !/[?&]skip\b/.test(location.search))
  const [runs, setRuns] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('locked', intro)
    if (intro) window.scrollTo(0, 0)
  }, [intro])

  const done = useCallback(() => setIntro(false), [])
  const replay = useCallback(() => {
    setRuns((n) => n + 1)
    setIntro(true)
  }, [])

  return (
    <>
      <Page arrived={!intro} onReplay={replay} />
      {intro && <Intro key={runs} onDone={done} />}
    </>
  )
}
