import { useEffect, useRef, useState } from 'react'
import { getJob } from '@/api/jobs'
import { createRadioEpisode, fetchRadioEpisode } from '@/api/radio'
import type { CreateRadioEpisodeRequest, RadioEpisode } from '@/types/radio'
import { createIdempotencyKey } from '@/utils/share'

type Mode = CreateRadioEpisodeRequest['mode']

const FAILED = '사연을 방송으로 만들지 못했어요. 다시 시도해 주세요.'

function useRadioGeneration(driveId: string | null) {
  const [story, setStory] = useState('')
  const [generating, setGenerating] = useState<Mode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const waitForEpisode = async (jobId: string): Promise<RadioEpisode | null> => {
    while (alive.current) {
      const { data: job } = await getJob(jobId)
      if (job.status === 'SUCCEEDED' && job.resourceId) return (await fetchRadioEpisode(job.resourceId)).data
      if (job.status === 'FAILED' || job.status === 'CANCELLED') throw new Error(job.status)
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, job.retryAfterSeconds) * 1000))
    }
    return null
  }

  const send = async (mode: Mode): Promise<RadioEpisode | null> => {
    if (generating) return null
    if (mode === 'USER_STORY' && !story.trim()) return null
    setGenerating(mode)
    setError(null)
    try {
      const { data: job } = await createRadioEpisode(
        {
          mode,
          ...(mode === 'USER_STORY' ? { story: story.trim() } : {}),
          ...(driveId ? { driveId } : {}),
        },
        createIdempotencyKey(),
      )
      const episode = await waitForEpisode(job.id)
      if (!episode || !alive.current) return null
      setStory('')
      return episode
    } catch {
      if (alive.current) setError(FAILED)
      return null
    } finally {
      if (alive.current) setGenerating(null)
    }
  }

  return { story, setStory, generating, error, send }
}

export default useRadioGeneration
