import { useEffect, useState } from 'react'
import { fetchPlaylistLibrary } from '@/api/playlists'
import type { SavedPlaylist } from '@/types/playlist'

interface State {
  status: 'loading' | 'ready' | 'error'
  playlists: SavedPlaylist[]
  totalCount: number
}

const INITIAL: State = { status: 'loading', playlists: [], totalCount: 0 }

// 플레이리스트 보관함 (GET /me/playlists). 화면에 들어올 때마다 새로 불러온다
function usePlaylistLibrary() {
  const [state, setState] = useState<State>(INITIAL)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchPlaylistLibrary()
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', playlists: data.items, totalCount: data.totalCount })
      })
      .catch(() => {
        if (!ignore) setState({ ...INITIAL, status: 'error' })
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const retry = () => {
    setState(INITIAL)
    setAttempt((count) => count + 1)
  }

  return { ...state, retry }
}

export default usePlaylistLibrary
