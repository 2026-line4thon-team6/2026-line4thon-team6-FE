import { createContext } from 'react'
import type { RadioEpisode } from '@/types/radio'

export interface RadioPlayer {
  episode: RadioEpisode | null
  playing: boolean
  start: (episode: RadioEpisode) => void
  toggle: () => void
  stop: () => void
  clear: () => void
}

export const RadioPlayerContext = createContext<RadioPlayer | null>(null)
