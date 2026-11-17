import { useEffect, useState } from 'react'
import { getPlaylist } from '@/api/playlists'
import type { CardPlaylist } from '@/types/card'
import type { Drive } from '@/types/drive'

const storageKey = (driveId: string) => `boongboong:playlist:${driveId}`

export function rememberDrivePlaylist(driveId: string, playlistId: string) {
  try {
    localStorage.setItem(storageKey(driveId), playlistId)
  } catch {
    return
  }
}

function rememberedPlaylistId(driveId: string) {
  try {
    return localStorage.getItem(storageKey(driveId))
  } catch {
    return null
  }
}

// TODO: 백엔드 드라이브 응답의 playlistId가 항상 null이라 기기에 기억한 값으로 대신한다. 채워지면 기억값 제거
function useDrivePlaylist(drive: Pick<Drive, 'id' | 'playlistId'> | null) {
  const playlistId = drive ? (drive.playlistId ?? rememberedPlaylistId(drive.id)) : null
  const [loaded, setLoaded] = useState<CardPlaylist | null>(null)

  useEffect(() => {
    if (!playlistId) return
    let ignore = false
    getPlaylist(playlistId)
      .then(({ data }) => {
        if (ignore) return
        setLoaded({
          id: data.id,
          title: data.title,
          trackCount: data.trackCount,
          durationSeconds: data.durationSeconds,
          thumbnailUrl: data.tracks.find((track) => track.albumImageUrl)?.albumImageUrl ?? null,
        })
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [playlistId])

  return loaded && loaded.id === playlistId ? loaded : null
}

export default useDrivePlaylist
