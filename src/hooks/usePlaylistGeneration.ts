import { useEffect, useRef, useState } from 'react'
import { getAppConfig } from '@/api/appConfig'
import { cancelJob, getJob } from '@/api/jobs'
import { createPlaylist, editPlaylistTracks, getPlaylist, setPlaylistSaved } from '@/api/playlists'
import type { AppConfig } from '@/types/appConfig'
import type { Playlist } from '@/types/playlist'
import type { PlaylistPreference } from '@/pages/DjPlaylist/PlaylistPreferencePage'
import { createIdempotencyKey } from '@/utils/share'

export type GenerationStep = 'select' | 'generating' | 'done'

const EMPTY: PlaylistPreference = { moods: [], weather: null, genres: [] }

// 취향 선택 → 생성(작업 상태 확인) → 생성 완료
function usePlaylistGeneration(driveId: string | null) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [preference, setPreference] = useState<PlaylistPreference>(EMPTY)
  const [step, setStep] = useState<GenerationStep>('select')
  const [jobId, setJobId] = useState<string | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    getAppConfig()
      .then(({ data }) => setConfig(data))
      .catch(() => setError('취향 목록을 불러오지 못했어요.'))
  }, [])

  useEffect(() => {
    if (step !== 'generating' || !jobId) return
    let timer: ReturnType<typeof setTimeout>
    let ignore = false
    const check = async () => {
      try {
        const { data: job } = await getJob(jobId)
        if (ignore) return
        if (job.status === 'SUCCEEDED' && job.resourceId) {
          const { data } = await getPlaylist(job.resourceId)
          if (ignore) return
          setPlaylist(data)
          setStep('done')
        } else if (job.status === 'FAILED' || job.status === 'CANCELLED') {
          if (!cancelled.current) setError('플레이리스트를 만들지 못했어요. 다시 시도해 주세요.')
          setStep('select')
        } else {
          timer = setTimeout(() => void check(), Math.max(1, job.retryAfterSeconds) * 1000)
        }
      } catch {
        if (!ignore) {
          setError('플레이리스트를 만들지 못했어요. 다시 시도해 주세요.')
          setStep('select')
        }
      }
    }
    void check()
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [step, jobId])

  const submit = async () => {
    if (!preference.weather || preference.moods.length === 0) return
    setSubmitting(true)
    setError(null)
    cancelled.current = false
    try {
      const { data: job } = await createPlaylist(
        {
          ...(driveId ? { driveId } : {}),
          moods: preference.moods,
          weather: preference.weather,
          genres: preference.genres,
        },
        createIdempotencyKey(),
      )
      setJobId(job.id)
      setStep('generating')
    } catch {
      setError('지금은 플레이리스트를 만들 수 없어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const cancel = async () => {
    cancelled.current = true
    setStep('select')
    if (jobId) await cancelJob(jobId).catch(() => {})
  }

  const editTracks = async (trackIds: string[]) => {
    if (!playlist) return
    try {
      const { data } = await editPlaylistTracks(playlist.id, { trackIds, expectedVersion: playlist.version })
      setPlaylist(data)
    } catch {
      const { data } = await getPlaylist(playlist.id).catch(() => ({ data: playlist }))
      setPlaylist(data)
    }
  }

  const removeTrack = (trackId: string) =>
    editTracks(playlist?.tracks.map((track) => track.id).filter((id) => id !== trackId) ?? [])

  const toggleSave = async () => {
    if (!playlist) return
    const saved = !playlist.savedByMe
    setPlaylist({ ...playlist, savedByMe: saved })
    await setPlaylistSaved(playlist.id, saved).catch(() => setPlaylist({ ...playlist, savedByMe: !saved }))
  }

  const restart = () => {
    setPlaylist(null)
    setJobId(null)
    setStep('select')
  }

  return {
    config,
    preference,
    setPreference,
    step,
    playlist,
    submitting,
    error,
    submit,
    cancel,
    restart,
    reorder: editTracks,
    removeTrack,
    toggleSave,
  }
}

export default usePlaylistGeneration
