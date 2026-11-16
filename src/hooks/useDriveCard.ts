import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  completeCard,
  discardUploadedPhoto,
  fetchDriveCard,
  saveCardDraft,
  saveMyReflection,
  uploadCardPhoto,
} from '@/api/cards'
import { ApiError } from '@/api/client'
import type { Card, Reflection } from '@/types/card'
import { photoRefreshDelay } from '@/utils/photoRefresh'
import { createIdempotencyKey } from '@/utils/share'

// API 명세 정책 수치 (사진 2장 · 10MiB · JPEG/PNG/WebP · 소감 70자)
export const MAX_PHOTOS = 2
export const MAX_REFLECTION_LENGTH = 70
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const PHOTO_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
// 입력을 멈추고 이만큼 지나면 쓰던 소감을 초안으로 저장한다 (글자마다 요청하지 않게)
export const REFLECTION_AUTOSAVE_DELAY = 1500

const MESSAGES = {
  tooMany: '사진은 2장까지 넣을 수 있어요.',
  type: 'JPEG · PNG · WebP 사진만 올릴 수 있어요.',
  size: '사진은 10MB까지 올릴 수 있어요.',
  conflict: '연인이 카드를 수정해서 새로 불러왔어요. 다시 시도해 주세요.',
  expired: '작성 기간이 지나 카드를 저장할 수 없어요.',
  unknown: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

export type DriveRole = 'DRIVER' | 'PASSENGER'

interface State {
  // unavailable: 카드를 만들 수 없는 드라이브(404) · 작성 기간이 지난 카드(410)
  status: 'loading' | 'ready' | 'error' | 'unavailable'
  card: Card | null
}

const findMine = (card: Card | null, userId: string) =>
  card?.reflections.find((reflection) => reflection.author.id === userId) ?? null

// 서버가 준 canEdit은 불러온 시점 기준이라, 화면을 연 채 24시간이 지났는지도 함께 본다
export const isCardEditable = (card: Card, now = Date.now()) => card.canEdit && now < Date.parse(card.editableUntil)

// 드라이브 카드 작성 화면의 데이터와 동작 (불러오기 · 사진 추가/삭제/순서 변경 · 소감 · 저장)
// 드라이브가 바뀌면 부모에서 key={driveId}로 새로 마운트한다
function useDriveCard(driveId: string, myUserId: string) {
  const [state, setState] = useState<State>({ status: 'loading', card: null })
  const [attempt, setAttempt] = useState(0)
  const [myText, setMyTextState] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 연속된 요청에서 최신 버전을 쓰기 위해 화면 상태와 별도로 들고 있는다
  const cardRef = useRef<Card | null>(null)
  const completeKey = useRef<string | null>(null)
  // 타이머 · 화면 이탈 이벤트에서 지금 입력된 소감을 읽기 위해 들고 있는다
  const textRef = useRef('')
  // 진행 중인 소감 초안 저장. 소감 버전이 꼬이지 않게 다음 저장은 앞의 저장이 끝난 뒤에 보낸다
  const draftTask = useRef<Promise<void>>(Promise.resolve())
  // 저장하기가 소감을 제출하는 동안에는 초안 저장을 보내지 않는다 (같은 버전으로 겹쳐 충돌하지 않게)
  const submitting = useRef(false)

  const setCard = (card: Card) => {
    cardRef.current = card
    setState({ status: 'ready', card })
  }

  useEffect(() => {
    let ignore = false

    fetchDriveCard(driveId)
      .then(({ data }) => {
        if (ignore) return
        cardRef.current = data
        setState({ status: 'ready', card: data })
        textRef.current = findMine(data, myUserId)?.text ?? ''
        setMyTextState(textRef.current)
      })
      .catch((reason: unknown) => {
        if (ignore) return
        const gone = reason instanceof ApiError && (reason.status === 404 || reason.status === 410)
        setState({ status: gone ? 'unavailable' : 'error', card: null })
      })

    return () => {
      ignore = true
    }
  }, [driveId, myUserId, attempt])

  // 사진 링크(10분 서명 URL)가 만료되기 전에 새 링크만 받아 바꾼다.
  // 쓰는 중인 내용을 덮지 않도록 카드 버전이 그대로면 사진 목록을, 상대가 바꿔 버전이 다르면
  // 지금 보이는 사진 중 서버에 남은 사진의 링크만 바꾼다 (버전은 그대로 두어 저장할 때 충돌로 최신 카드를 받는다)
  const photos = state.card?.photos
  useEffect(() => {
    if (!photos) return
    const delay = photoRefreshDelay(photos, Date.now())
    if (delay === null) return
    let ignore = false
    const timer = setTimeout(() => {
      fetchDriveCard(driveId)
        .then(({ data }) => {
          const current = cardRef.current
          if (ignore || !current) return
          if (current.version === data.version) return setCard({ ...current, photos: data.photos })
          const fresh = new Map(data.photos.map((photo) => [photo.mediaId, photo]))
          setCard({
            ...current,
            // 상대가 지운 사진은 빼고(만료된 링크가 남아 다시 받기가 반복되지 않게) 남은 사진의 링크만 바꾼다
            photos: current.photos.flatMap((photo) => {
              const next = fresh.get(photo.mediaId)
              return next ? [{ ...photo, url: next.url, urlExpiresAt: next.urlExpiresAt }] : []
            }),
          })
        })
        .catch(() => {})
    }, delay)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [photos, driveId])

  const retry = () => {
    setState({ status: 'loading', card: null })
    setAttempt((count) => count + 1)
  }

  // 요청 하나를 실행한다. 버전 충돌이면 카드를 다시 불러오고, 실패하면 안내 문구를 남긴다. 성공 여부를 돌려준다
  const run = async (task: (card: Card) => Promise<void>) => {
    const card = cardRef.current
    if (!card || busy) return false
    setBusy(true)
    try {
      await task(card)
      return true
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'VERSION_CONFLICT') {
        const { data } = await fetchDriveCard(driveId).catch(() => ({ data: card }))
        setCard(data)
        setError(MESSAGES.conflict)
      } else if (reason instanceof ApiError && reason.status === 410) {
        setError(MESSAGES.expired)
      } else {
        setError(reason instanceof ApiError ? reason.message : MESSAGES.unknown)
      }
      return false
    } finally {
      setBusy(false)
    }
  }

  const savePhotos = async (card: Card, photoIds: string[]) => {
    const { data } = await saveCardDraft(card.id, { photoIds, expectedVersion: card.version }, { coupleId: card.coupleId })
    setCard(data)
  }

  const addPhotos = async (files: File[]) => {
    const card = cardRef.current
    if (!card) return
    setError(null)

    const invalidType = files.find((file) => !PHOTO_ACCEPT.includes(file.type))
    if (invalidType) return setError(MESSAGES.type)
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) return setError(MESSAGES.size)

    const room = MAX_PHOTOS - card.photos.length
    const selected = files.slice(0, Math.max(0, room))
    const tooMany = files.length > selected.length

    if (selected.length > 0) {
      await run(async (current) => {
        // 붙이지 못한 사진은 서버의 임시 저장 용량(200MiB)을 차지하므로 바로 지운다. 지우기 실패는 무시한다(24시간 뒤 만료)
        const discard = (ids: string[]) =>
          Promise.all(ids.map((id) => discardUploadedPhoto(id, { coupleId: current.coupleId }).catch(() => undefined)))

        const results = await Promise.allSettled(
          selected.map((file) =>
            uploadCardPhoto(file, { coupleId: current.coupleId, idempotencyKey: createIdempotencyKey() }),
          ),
        )
        const ids = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
        const failed = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
        if (failed) {
          // 한 장이라도 실패하면 먼저 올라간 사진도 붙이지 않는다
          await discard(ids)
          throw failed.reason
        }
        try {
          await savePhotos(current, [...current.photos.map((photo) => photo.mediaId), ...ids])
        } catch (reason) {
          await discard(ids)
          throw reason
        }
      })
    }
    if (tooMany) setError(MESSAGES.tooMany)
  }

  const removePhoto = async (mediaId: string) => {
    setError(null)
    await run((card) =>
      savePhotos(
        card,
        card.photos.filter((photo) => photo.mediaId !== mediaId).map((photo) => photo.mediaId),
      ),
    )
  }

  // 두 장일 때 대표 사진(첫 사진)을 바꾼다
  const swapPhotos = async () => {
    setError(null)
    await run(async (card) => {
      if (card.photos.length < 2) return
      await savePhotos(card, card.photos.map((photo) => photo.mediaId).reverse())
    })
  }

  const setMyText = (text: string) => {
    const next = text.slice(0, MAX_REFLECTION_LENGTH)
    textRef.current = next
    setMyTextState(next)
  }

  const putMyReflection = async (card: Card, submitted: boolean, text = textRef.current.trim()) => {
    const mine = findMine(card, myUserId)
    const { data } = await saveMyReflection(
      card.id,
      { text, submitted, expectedVersion: mine?.version ?? 0 },
      { coupleId: card.coupleId },
    )
    // 기다리는 사이 사진 저장 등으로 카드가 바뀌었을 수 있어, 응답이 온 시점의 카드에 내 소감만 바꿔 넣는다
    const latest = cardRef.current ?? card
    const reflections: Reflection[] = [...latest.reflections.filter((item) => item.author.id !== myUserId), data]
    const next: Card = { ...latest, status: latest.status === 'UNWRITTEN' ? 'DRAFT' : latest.status, reflections }
    setCard(next)
    return next
  }

  // 쓰던 소감을 나만 보이는 초안으로 저장한다. 이미 제출한 소감은 초안으로 되돌릴 수 없어 건너뛴다.
  // 마지막으로 저장한 내용과 같거나 고칠 수 없는 카드면 보내지 않는다. 실패해도 쓰는 것을 막지 않는다
  const saveTextDraft = async () => {
    const card = cardRef.current
    if (!card || submitting.current || !isCardEditable(card)) return
    const mine = findMine(card, myUserId)
    const text = textRef.current.trim()
    if (mine?.submitted || text === (mine?.text ?? '')) return
    try {
      await putMyReflection(card, false, text)
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'VERSION_CONFLICT') {
        // 다른 기기에서 내 소감이 바뀌었다. 최신 버전을 받아 두고 알린다 (입력 중인 글은 그대로 둔다)
        const { data } = await fetchDriveCard(driveId).catch(() => ({ data: card }))
        setCard(data)
        setError(MESSAGES.conflict)
      } else if (reason instanceof ApiError && reason.status === 410) {
        setError(MESSAGES.expired)
      }
    }
  }

  const flushDraft = () => {
    draftTask.current = draftTask.current.then(saveTextDraft)
    return draftTask.current
  }

  // 입력을 멈추면 잠시 뒤 초안으로 저장한다
  const autosave = useEffectEvent(() => void flushDraft())
  useEffect(() => {
    const card = cardRef.current
    if (!card || myText.trim() === (findMine(card, myUserId)?.text ?? '')) return
    const timer = setTimeout(autosave, REFLECTION_AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [myText, myUserId])

  // 새로고침 · 앱 종료 · 탭 전환 · 브라우저 뒤로가기로 화면을 떠날 때는 기다리지 않고 바로 저장한다
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') autosave()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', autosave)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', autosave)
      autosave()
    }
  }, [])

  // 내 소감을 제출하고 카드를 완료한다. 성공하면 true
  const save = async () => {
    setError(null)
    // 보내던 초안 저장이 끝나 소감 버전이 맞춰진 뒤에 제출한다
    await draftTask.current
    submitting.current = true
    return run(async (card) => {
      let current = card
      const mine = findMine(card, myUserId)
      if (myText.trim() && (!mine?.submitted || mine.text !== myText.trim())) {
        current = await putMyReflection(card, true)
      }
      if (current.status === 'COMPLETED') return

      completeKey.current ??= createIdempotencyKey()
      const { data } = await completeCard(current.id, current.version, {
        coupleId: current.coupleId,
        idempotencyKey: completeKey.current,
      })
      completeKey.current = null
      setCard(data)
    }).finally(() => {
      submitting.current = false
    })
  }

  // 화면을 나갈 때(작성 중단 팝업의 '나가기') 쓰던 소감을 남긴다. 실패해도 나가는 것을 막지 않는다.
  // 아직 저장 전인 카드는 나만 보이는 초안으로, 저장을 마친 카드는 저장하기처럼 연인에게 보이는 소감으로 제출한다.
  // (서버는 제출한 소감을 초안으로 되돌리지 못하게 하고, 초안으로 두면 완료된 카드에서는 연인에게 끝내 보이지 않는다)
  const saveDraft = () => {
    draftTask.current = draftTask.current.then(async () => {
      const card = cardRef.current
      const text = textRef.current.trim()
      // 빈 소감은 제출할 수 없어 초안 규칙을 따른다 (이미 제출한 소감이면 그대로 둔다)
      if (card?.status !== 'COMPLETED' || !text) return saveTextDraft()
      if (submitting.current || !isCardEditable(card)) return
      const mine = findMine(card, myUserId)
      if (mine?.submitted && mine.text === text) return
      await putMyReflection(card, true, text).catch(() => undefined)
    })
    return draftTask.current
  }

  const card = state.card
  const partner = card?.reflections.find((reflection) => reflection.author.id !== myUserId && reflection.submitted)
  const partnerText = partner?.text ?? null
  const myRole: DriveRole | null = card?.driverUserId
    ? card.driverUserId === myUserId
      ? 'DRIVER'
      : 'PASSENGER'
    : null
  const mine = findMine(card, myUserId)
  const trimmed = myText.trim()
  // 아직 서버에 남기지 못한 소감이 있는지. 저장을 마친 카드는 연인에게 보이는 소감과 다르면 남지 않은 것으로 본다
  const hasUnsavedChanges =
    !!card &&
    (card.status === 'COMPLETED'
      ? trimmed.length > 0 && (!mine?.submitted || mine.text !== trimmed)
      : trimmed !== (mine?.text ?? ''))
  const canSave =
    !!card && card.canEdit && ((card.photos.length ?? 0) > 0 || myText.trim().length > 0 || partnerText !== null)

  return {
    ...state,
    myText,
    setMyText,
    partnerText,
    myRole,
    canSave,
    hasUnsavedChanges,
    busy,
    error,
    retry,
    addPhotos,
    removePhoto,
    swapPhotos,
    save,
    saveDraft,
  }
}

export default useDriveCard
