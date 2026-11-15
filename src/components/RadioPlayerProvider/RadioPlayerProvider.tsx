import { type ReactNode, useEffect, useRef, useState } from 'react'
import { fetchRadioEpisode } from '@/api/radio'
import { RadioPlayerContext } from '@/hooks/radioPlayerContext'
import type { RadioEpisode } from '@/types/radio'

function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [episode, setEpisode] = useState<RadioEpisode | null>(null)
  const [playing, setPlaying] = useState(false)

  const audio = () => {
    if (!audioRef.current) {
      const element = new Audio()
      element.addEventListener('ended', () => setPlaying(false))
      audioRef.current = element
    }
    return audioRef.current
  }

  useEffect(() => () => audioRef.current?.pause(), [])

  const play = (target: RadioEpisode) => {
    setPlaying(true)
    if (!target.audioUrl) return
    const element = audio()
    if (element.src !== target.audioUrl) element.src = target.audioUrl
    element.play().catch(() => setPlaying(false))
  }

  useEffect(() => {
    const element = audioRef.current
    if (!element || !episode) return
    const retry = () => {
      fetchRadioEpisode(episode.id)
        .then(({ data }) => {
          if (data.audioUrl === episode.audioUrl) return setPlaying(false)
          setEpisode(data)
          play(data)
        })
        .catch(() => setPlaying(false))
    }
    element.addEventListener('error', retry, { once: true })
    return () => element.removeEventListener('error', retry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode])

  const pause = () => {
    audioRef.current?.pause()
    setPlaying(false)
  }

  const stop = () => {
    pause()
    if (audioRef.current) audioRef.current.currentTime = 0
  }

  const value = {
    episode,
    playing,
    start: (next: RadioEpisode) => {
      stop()
      setEpisode(next)
      play(next)
    },
    toggle: () => {
      if (!episode) return
      if (playing) pause()
      else play(episode)
    },
    stop,
    clear: () => {
      stop()
      setEpisode(null)
    },
  }

  return <RadioPlayerContext.Provider value={value}>{children}</RadioPlayerContext.Provider>
}

export default RadioPlayerProvider
