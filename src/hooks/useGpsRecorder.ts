import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/client'
import { uploadGpsBatch } from '@/api/drives'
import type { Drive, GpsBatchReceipt, GpsSample } from '@/types/drive'
import { distanceMeters, type Position } from '@/utils/location'

const MIN_INTERVAL_MS = 5000
const MIN_MOVE_METERS = 20
const MAX_ACCURACY = 50
const FLUSH_MS = 15_000
const FLUSH_SIZE = 20
const BATCH_LIMIT = 200

interface Saved {
  next: number
  lastSent: number
  queue: GpsSample[]
  last: Pick<GpsSample, 'recordedAt' | 'coordinate'> | null
}

const storageKey = (driveId: string) => `boongboong:gps:${driveId}`

function load(driveId: string): Saved {
  const empty: Saved = { next: 1, lastSent: 0, queue: [], last: null }
  try {
    const raw = localStorage.getItem(storageKey(driveId))
    return raw ? { ...empty, ...(JSON.parse(raw) as Saved) } : empty
  } catch {
    return empty
  }
}

function persist(driveId: string, saved: Saved) {
  try {
    localStorage.setItem(storageKey(driveId), JSON.stringify(saved))
  } catch {
    return
  }
}

interface Options {
  drive: Drive | null
  position: Position | null
  recording: boolean
  urgent?: boolean
  onReceipt: (receipt: GpsBatchReceipt) => void
}

function useGpsRecorder({ drive, position, recording, urgent = false, onReceipt }: Options) {
  const [arrival, setArrival] = useState<{ driveId: string; candidate: boolean } | null>(null)
  const driveRef = useRef(drive)
  const state = useRef<{ driveId: string; saved: Saved } | null>(null)
  const inflight = useRef<Promise<number> | null>(null)
  const batchKey = useRef<{ first: number; key: string } | null>(null)
  const receiptRef = useRef(onReceipt)
  const urgentRef = useRef(urgent)
  const flushRef = useRef<(() => Promise<number>) | null>(null)

  useEffect(() => {
    driveRef.current = drive
    receiptRef.current = onReceipt
    urgentRef.current = urgent
  })

  const saved = useCallback((driveId: string) => {
    if (state.current?.driveId !== driveId) state.current = { driveId, saved: load(driveId) }
    return state.current.saved
  }, [])

  const flush = useCallback(async (): Promise<number> => {
    const current = driveRef.current
    if (!current) return 0
    const data = saved(current.id)
    if (inflight.current) return inflight.current
    if (data.queue.length === 0) return data.lastSent

    const batch = data.queue.slice(0, BATCH_LIMIT)
    if (batchKey.current?.first !== batch[0].sequence) {
      batchKey.current = { first: batch[0].sequence, key: crypto.randomUUID() }
    }
    const request = uploadGpsBatch(
      current.id,
      { samples: batch },
      { coupleId: current.coupleId, idempotencyKey: batchKey.current.key },
    )
      .then(({ data: receipt }) => {
        const done = new Set([
          ...receipt.acceptedSequences,
          ...receipt.duplicateSequences,
          ...receipt.rejected.map(({ sequence }) => sequence),
        ])
        data.queue = data.queue.filter(({ sequence }) => !done.has(sequence))
        data.lastSent = Math.max(data.lastSent, ...receipt.acceptedSequences, ...receipt.duplicateSequences)
        batchKey.current = null
        persist(current.id, data)
        setArrival({ driveId: current.id, candidate: receipt.arrivalCandidate })
        receiptRef.current(receipt)
        return data.lastSent
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          const sent = new Set(batch.map(({ sequence }) => sequence))
          data.queue = data.queue.filter(({ sequence }) => !sent.has(sequence))
          batchKey.current = null
          persist(current.id, data)
        }
        return data.lastSent
      })
      .finally(() => {
        inflight.current = null
        if (urgentRef.current && data.queue.length > 0) void flushRef.current?.()
      })
    inflight.current = request
    return request
  }, [saved])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  useEffect(() => {
    const current = driveRef.current
    if (!recording || !current || !position) return
    const { accuracyMeters, recordedAt, coordinate, speedMetersPerSecond } = position
    if (!Number.isFinite(accuracyMeters) || accuracyMeters > MAX_ACCURACY) return
    if (current.startedAt && recordedAt <= current.startedAt) return

    const data = saved(current.id)
    const { last } = data
    if (last) {
      if (recordedAt <= last.recordedAt) return
      const elapsed = Date.parse(recordedAt) - Date.parse(last.recordedAt)
      if (elapsed < MIN_INTERVAL_MS && distanceMeters(last.coordinate, coordinate) < MIN_MOVE_METERS) return
    }

    data.queue.push({
      sequence: data.next,
      recordedAt,
      coordinate,
      accuracyMeters: Math.round(accuracyMeters * 10) / 10,
      speedMetersPerSecond: Math.max(0, speedMetersPerSecond ?? 0),
    })
    data.next += 1
    data.last = { recordedAt, coordinate }
    persist(current.id, data)
    if (urgent || data.queue.length >= FLUSH_SIZE) void flush()
  }, [position, recording, urgent, saved, flush])

  const driveId = drive?.id
  const uploading = drive?.status === 'ACTIVE' || drive?.status === 'PAUSED'
  useEffect(() => {
    if (!driveId || !uploading) return
    const timer = setInterval(() => void flush(), FLUSH_MS)
    return () => clearInterval(timer)
  }, [driveId, uploading, flush])

  return { flush, arrivalCandidate: !!arrival && arrival.driveId === drive?.id && arrival.candidate }
}

export default useGpsRecorder
