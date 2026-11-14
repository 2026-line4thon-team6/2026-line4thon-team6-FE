import { useEffect, useRef, useState } from 'react'
import { completeCard, fetchDriveCard, saveCardDraft, saveMyReflection, uploadCardPhoto } from '@/api/cards'
import { ApiError } from '@/api/client'
import type { Card, Reflection } from '@/types/card'
import { createIdempotencyKey } from '@/utils/share'

// API 명세 정책 수치 (사진 2장 · 10MiB · JPEG/PNG/WebP · 소감 70자)
export const MAX_PHOTOS = 2
export const MAX_REFLECTION_LENGTH = 70
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const PHOTO_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

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
        setMyTextState(findMine(data, myUserId)?.text ?? '')
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
        const ids = await Promise.all(
          selected.map((file) =>
            uploadCardPhoto(file, { coupleId: current.coupleId, idempotencyKey: createIdempotencyKey() }),
          ),
        )
        await savePhotos(current, [...current.photos.map((photo) => photo.mediaId), ...ids])
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

  const setMyText = (text: string) => setMyTextState(text.slice(0, MAX_REFLECTION_LENGTH))

  const putMyReflection = async (card: Card, submitted: boolean) => {
    const mine = findMine(card, myUserId)
    const { data } = await saveMyReflection(
      card.id,
      { text: myText.trim(), submitted, expectedVersion: mine?.version ?? 0 },
      { coupleId: card.coupleId },
    )
    const reflections: Reflection[] = [...card.reflections.filter((item) => item.author.id !== myUserId), data]
    const next: Card = { ...card, status: card.status === 'UNWRITTEN' ? 'DRAFT' : card.status, reflections }
    setCard(next)
    return next
  }

  // 내 소감을 제출하고 카드를 완료한다. 성공하면 true
  const save = () => {
    setError(null)
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
    })
  }

  // 화면을 나갈 때 쓰던 소감을 나만 보이는 초안으로 남긴다. 실패해도 나가는 것을 막지 않는다
  const saveDraft = async () => {
    const card = cardRef.current
    if (!card || card.status === 'COMPLETED') return
    const mine = findMine(card, myUserId)
    if (mine?.submitted || myText.trim() === (mine?.text ?? '')) return
    await putMyReflection(card, false).catch(() => undefined)
  }

  const card = state.card
  const partner = card?.reflections.find((reflection) => reflection.author.id !== myUserId && reflection.submitted)
  const partnerText = partner?.text ?? null
  const myRole: DriveRole | null = card?.driverUserId
    ? card.driverUserId === myUserId
      ? 'DRIVER'
      : 'PASSENGER'
    : null
  const canSave =
    !!card && card.canEdit && ((card.photos.length ?? 0) > 0 || myText.trim().length > 0 || partnerText !== null)

  return {
    ...state,
    myText,
    setMyText,
    partnerText,
    myRole,
    canSave,
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
