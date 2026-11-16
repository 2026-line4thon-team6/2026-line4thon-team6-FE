import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import {
  abandonGameSession,
  completeGameSession,
  createGameSession,
  getGameSession,
  nextGameQuestion,
  revealGameAnswer,
  revealGameHint,
  saveGameResponse,
} from '@/api/games'
import { cancelJob, getJob } from '@/api/jobs'
import type { Drive } from '@/types/drive'
import type { GameResponseInput, GameSession, GameType } from '@/types/game'
import { createIdempotencyKey } from '@/utils/share'

const SYNC_MS = 3000

type Status = 'generating' | 'playing' | 'completed' | 'error'

function useGameSession(drive: Pick<Drive, 'id' | 'coupleId'> | null, type: GameType) {
  const driveId = drive?.id ?? null
  const coupleId = drive?.coupleId ?? null
  const [status, setStatus] = useState<Status>('generating')
  const [session, setSession] = useState<GameSession | null>(null)
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const jobRef = useRef<string | null>(null)

  useEffect(() => {
    if (!driveId || !coupleId) return
    let ignore = false
    let timer: ReturnType<typeof setTimeout>

    const poll = async (jobId: string) => {
      const { data: job } = await getJob(jobId)
      if (ignore) return
      if (job.status === 'SUCCEEDED' && job.resourceId) {
        const { data } = await getGameSession(job.resourceId)
        if (ignore) return
        setSession(data)
        setStatus('playing')
      } else if (job.status === 'FAILED' || job.status === 'CANCELLED') {
        setStatus('error')
      } else {
        timer = setTimeout(() => void poll(jobId).catch(() => !ignore && setStatus('error')), Math.max(1, job.retryAfterSeconds) * 1000)
      }
    }

    createGameSession({ driveId, type }, { coupleId, idempotencyKey: createIdempotencyKey() })
      .then(({ data: job }) => {
        jobRef.current = job.id
        return poll(job.id)
      })
      .catch(() => !ignore && setStatus('error'))

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [driveId, coupleId, type, attempt])

  const sessionId = session?.id
  useEffect(() => {
    if (status !== 'playing' || !sessionId) return
    const timer = setInterval(() => {
      getGameSession(sessionId)
        .then(({ data }) => setSession((prev) => (prev && data.version < prev.version ? prev : data)))
        .catch(() => {})
    }, SYNC_MS)
    return () => clearInterval(timer)
  }, [status, sessionId])

  const refresh = async () => {
    if (!session) return
    const { data } = await getGameSession(session.id).catch(() => ({ data: session }))
    setSession(data)
  }

  const respond = async (input: GameResponseInput, myUserId: string) => {
    const question = session?.currentQuestion
    if (!session || !question || !coupleId) return
    const mine = {
      authorUserId: myUserId,
      choice: input.type === 'BALANCE' ? input.choice : null,
      selectedRole: input.type === 'MEMORY' ? input.selectedRole : null,
      updatedAt: new Date().toISOString(),
    }
    setSession({ ...session, responses: [...session.responses.filter((r) => r.authorUserId !== myUserId), mine] })
    try {
      await saveGameResponse(session.id, question.id, input, { coupleId })
    } catch {
      await refresh()
    }
  }

  const reveal = async (kind: 'hint' | 'answer') => {
    const question = session?.currentQuestion
    if (!session || !question || !coupleId) return
    try {
      const { data } = await (kind === 'hint' ? revealGameHint : revealGameAnswer)(session.id, question.id, {
        coupleId,
        idempotencyKey: createIdempotencyKey(),
      })
      setSession((prev) => (prev?.currentQuestion?.id === data.id ? { ...prev, currentQuestion: data } : prev))
    } catch {
      await refresh()
    }
  }

  const advance = async () => {
    const question = session?.currentQuestion
    if (!session || !question || !coupleId || busy) return
    const last = question.number >= session.questionCount
    setBusy(true)
    try {
      const { data } = await (last ? completeGameSession : nextGameQuestion)(session.id, session.version, {
        coupleId,
        idempotencyKey: createIdempotencyKey(),
      })
      setSession(data)
      if (data.status === 'COMPLETED') setStatus('completed')
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) await refresh()
    } finally {
      setBusy(false)
    }
  }

  const abandon = async () => {
    if (session?.status === 'ACTIVE' && coupleId) {
      const options = { coupleId, idempotencyKey: createIdempotencyKey() }
      await abandonGameSession(session.id, session.version, options).catch(() => {})
    } else if (jobRef.current) {
      await cancelJob(jobRef.current).catch(() => {})
    }
  }

  const retry = () => {
    setSession(null)
    setStatus('generating')
    setAttempt((value) => value + 1)
  }

  return {
    status,
    session,
    busy,
    respond,
    revealHint: () => reveal('hint'),
    revealAnswer: () => reveal('answer'),
    advance,
    abandon,
    retry,
  }
}

export default useGameSession
