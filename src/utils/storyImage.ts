import markerDotIcon from '@/assets/icons/record-marker-dot.svg'
import markerFrameIcon from '@/assets/icons/record-marker-frame.svg'
import mapImageUrl from '@/assets/images/record-story-map.webp'
import emptyPhotoUrl from '@/assets/images/card/photo-empty.webp'
import mascotImageUrl from '@/assets/images/record-map-mascot.webp'
import { type ImageShareResult, shareImage } from './share'

// 인스타그램 스토리용 드라이브 기록 카드 이미지 (Figma 284:15555).
// 1080 × 1920 캔버스에 기록 지도(지도 이미지 + 사진 마커)를 흐리게 깔고, 가운데에 미리보기와 같은 폴라로이드 카드를 그린다.
// 카카오 지도 화면은 캔버스로 옮길 수 없어 Figma의 기록 지도 배경 이미지를 쓴다.
// Figma 390px 화면 기준 값에 SCALE을 곱해 쓴다
const WIDTH = 1080
const HEIGHT = 1920
const SCALE = WIDTH / 390

const CARD = { width: 269 * SCALE, height: 337 * SCALE, padding: 14 * SCALE, radius: 10 * SCALE }
const PHOTO = { width: 242 * SCALE, height: 251 * SCALE, radius: 10 * SCALE }
const FONT = 'Pretendard, -apple-system, sans-serif'

// 지도 이미지(853 × 1844)를 폭에 맞춰 그리고 위아래를 같은 만큼 잘라 낸다
const MAP_IMAGE = { width: 853, height: 1844 }
const MAP_SCALE = WIDTH / MAP_IMAGE.width
const MAP_OFFSET_Y = (MAP_IMAGE.height * MAP_SCALE - HEIGHT) / 2
// 위도 · 경도 → 지도 이미지 좌표. 이미지 속 서울 · 대전 · 대구 · 부산 · 울산 위치로 맞춘 근사값이다
const toMapImage = (latitude: number, longitude: number) => ({
  x: 226.8 * longitude - 28_541,
  y: 10_874.5 - 274.3 * latitude,
})
// 사진 마커 (RecordMarker와 같은 모양): 말풍선 54 × 61, 사진 46px, 좌표는 말풍선 아래 점(27, 66)
const MARKER = { width: 54, anchorX: 27, anchorY: 66, photo: 46, photoInset: 4, photoRadius: 8, shadow: 20, dotTop: 61 }
const BACKGROUND_BLUR = 1.5 * SCALE
// 기록 지도 헤더 (RecordMapPage .header): 좌우 25 · 17px, 위 24px, 제목 아래 20px, 아래 모서리 30px, 붕붕이 117 × 78 (아래로 9px 걸침)
const HEADER = { left: 25, right: 17, top: 24, gap: 4, bottom: 20, radius: 30, countSize: 16, titleSize: 24, mascotWidth: 117, mascotHeight: 78, mascotOverhang: 9 }
const EMPTY_BACKGROUND = '#faeeed' // color('divider')

export interface StoryMarker {
  latitude: number
  longitude: number
  photoUrl: string | null // 사진이 없는 기록은 null → 기본 일러스트
}

export interface StoryContent {
  photoUrl: string | null // 사진이 없는 기록은 null → 기본 일러스트 (D15)
  title: string
  date: string // 화면용 날짜 (예: 2026년 11월 3일)
  markers?: StoryMarker[] // 배경 지도에 놓을 기록 사진 마커
  // 있으면 기록 지도 화면처럼 맨 위에 헤더를 그린다 (총 N번 · 우리 어디까지 가봤지? · 붕붕이). 기록 수를 모르면 null
  header?: { totalCount: number | null }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    // 다른 도메인 사진도 캔버스를 PNG로 내보낼 수 있게 CORS로 받는다
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`이미지를 불러오지 못했어요: ${url}`))
    image.src = url
  })
}

// 영역을 꽉 채우도록 가운데를 잘라 그린다 (object-fit: cover)
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sw = width / scale
  const sh = height / scale
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, width, height)
}

// 사진이 없거나 불러오지 못한 칸: 연한 배경에 기본 일러스트를 가운데 맞춰 그린다 (RecordPhoto와 같은 모양)
function drawEmpty(ctx: CanvasRenderingContext2D, empty: HTMLImageElement | null, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = EMPTY_BACKGROUND
  ctx.fillRect(x, y, width, height)
  if (!empty) return
  const padding = 0
  const scale = Math.min((width - padding * 2) / empty.naturalWidth, (height - padding * 2) / empty.naturalHeight)
  const w = empty.naturalWidth * scale
  const h = empty.naturalHeight * scale
  ctx.drawImage(empty, x + (width - w) / 2, y + (height - h) / 2, w, h)
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  empty: HTMLImageElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (photo) drawCover(ctx, photo, x, y, width, height)
  else drawEmpty(ctx, empty, x, y, width, height)
}

// 사진 주소가 없으면 null. 불러오지 못해도(CORS · 만료) null로 두고 기본 일러스트를 그린다
const loadPhoto = (url: string | null) => (url ? loadImage(url).catch(() => null) : Promise.resolve(null))

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

// 너비를 넘으면 뒤를 말줄임표로 줄인다
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let fitted = text
  while (fitted.length > 0 && ctx.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1)
  return `${fitted}…`
}

// 배경 지도와 사진 마커. 지도를 불러오지 못하면 코랄 그라데이션으로, 사진이 없는 마커는 기본 일러스트로 그린다
async function drawBackground(ctx: CanvasRenderingContext2D, markers: StoryMarker[], empty: HTMLImageElement | null) {
  const [map, frame, dot, ...photos] = await Promise.all([
    loadPhoto(mapImageUrl),
    loadPhoto(markerFrameIcon),
    loadPhoto(markerDotIcon),
    ...markers.map((marker) => loadPhoto(marker.photoUrl)),
  ])

  ctx.save()
  ctx.filter = `blur(${BACKGROUND_BLUR}px)`
  if (map) {
    ctx.drawImage(map, 0, -MAP_OFFSET_Y, WIDTH, MAP_IMAGE.height * MAP_SCALE)
  } else {
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
    gradient.addColorStop(0, '#fffbfb')
    gradient.addColorStop(1, '#ffd2c6')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  }

  markers.forEach((marker, index) => {
    const photo = photos[index]
    if (!frame || !dot) return
    const point = toMapImage(marker.latitude, marker.longitude)
    const left = point.x * MAP_SCALE - MARKER.anchorX * SCALE
    const top = point.y * MAP_SCALE - MAP_OFFSET_Y - MARKER.anchorY * SCALE
    const at = (value: number) => value * SCALE

    // SVG에는 그림자 여백(20px)이 포함되어 있다
    ctx.drawImage(frame, left - at(MARKER.shadow), top - at(MARKER.shadow), at(frame.naturalWidth), at(frame.naturalHeight))
    ctx.save()
    roundRect(ctx, left + at(MARKER.photoInset), top + at(MARKER.photoInset), at(MARKER.photo), at(MARKER.photo), at(MARKER.photoRadius))
    ctx.clip()
    drawPhoto(ctx, photo, empty, left + at(MARKER.photoInset), top + at(MARKER.photoInset), at(MARKER.photo), at(MARKER.photo))
    ctx.restore()
    ctx.drawImage(dot, left + at(MARKER.anchorX - 5 - MARKER.shadow), top + at(MARKER.dotTop - MARKER.shadow), at(dot.naturalWidth), at(dot.naturalHeight))
  })
  ctx.restore()
  ctx.filter = 'none'
}

// 기록 지도 헤더를 그리고 헤더 아래 끝(y)을 돌려준다
async function drawHeader(ctx: CanvasRenderingContext2D, totalCount: number | null): Promise<number> {
  const at = (value: number) => value * SCALE
  const countHeight = totalCount === null ? 0 : at(HEADER.countSize * 1.5) + at(HEADER.gap)
  const titleHeight = at(HEADER.titleSize * 1.4)
  const height = at(HEADER.top) + countHeight + titleHeight + at(HEADER.bottom)

  // 배경 (코랄 흰색, 아래 모서리 둥글게, 그림자 0 1px 10px 10%)
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
  ctx.shadowBlur = at(10)
  ctx.shadowOffsetY = at(1)
  ctx.fillStyle = '#fffbfb'
  ctx.beginPath()
  ctx.roundRect(0, 0, WIDTH, height, [0, 0, at(HEADER.radius), at(HEADER.radius)])
  ctx.fill()
  ctx.restore()

  ctx.textBaseline = 'top'
  let y = at(HEADER.top)
  if (totalCount !== null) {
    // '총 N번…'은 앱처럼 코랄 → 빨강 그라데이션 글자
    const text = `총 ${totalCount}번의 드라이브를 함께했어요`
    ctx.font = `500 ${at(HEADER.countSize)}px ${FONT}`
    const width = ctx.measureText(text).width
    const gradient = ctx.createLinearGradient(at(HEADER.left), y, at(HEADER.left) + width, y + at(HEADER.countSize))
    gradient.addColorStop(0, '#ffaa95')
    gradient.addColorStop(1, '#ff1d46')
    ctx.fillStyle = gradient
    ctx.fillText(text, at(HEADER.left), y + at(HEADER.countSize * 0.25))
    y += countHeight
  }
  ctx.fillStyle = '#492515' // color('brown')
  ctx.font = `600 ${at(HEADER.titleSize)}px ${FONT}`
  ctx.fillText('우리 어디까지 가봤지?', at(HEADER.left), y + at(HEADER.titleSize * 0.2))

  const mascot = await loadPhoto(mascotImageUrl)
  if (mascot) {
    const w = at(HEADER.mascotWidth)
    const h = at(HEADER.mascotHeight)
    ctx.drawImage(mascot, WIDTH - at(HEADER.right) - w, height + at(HEADER.mascotOverhang) - h, w, h)
  }
  return height + at(HEADER.mascotOverhang)
}

export async function createStoryImage({ photoUrl, title, date, markers = [], header }: StoryContent): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 사용할 수 없어요.')

  const [photo, empty] = await Promise.all([
    loadPhoto(photoUrl),
    loadPhoto(emptyPhotoUrl),
    // 앱 글꼴이 아직 안 불러와졌으면 기다린다
    document.fonts?.load(`600 ${20 * SCALE}px Pretendard`).catch(() => undefined),
  ])

  await drawBackground(ctx, markers, empty)
  const headerBottom = header ? await drawHeader(ctx, header.totalCount) : 0

  // 카드 (그림자 0 0 10px 20%). 헤더가 있으면 헤더 아래 남은 영역의 가운데에 둔다
  const cardX = (WIDTH - CARD.width) / 2
  const cardY = headerBottom + (HEIGHT - headerBottom - CARD.height) / 2
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 10 * SCALE
  ctx.fillStyle = '#fffbfb'
  roundRect(ctx, cardX, cardY, CARD.width, CARD.height, CARD.radius)
  ctx.fill()
  ctx.restore()

  // 사진
  const photoX = cardX + CARD.padding
  const photoY = cardY + CARD.padding
  ctx.save()
  roundRect(ctx, photoX, photoY, PHOTO.width, PHOTO.height, PHOTO.radius)
  ctx.clip()
  drawPhoto(ctx, photo, empty, photoX, photoY, PHOTO.width, PHOTO.height)
  ctx.restore()

  // 제목 (20px SemiBold) · 날짜 (12px Medium, 코랄 stroke)
  const textX = photoX + 5 * SCALE
  const textWidth = PHOTO.width - 10 * SCALE
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#000000'
  ctx.font = `600 ${20 * SCALE}px ${FONT}`
  ctx.fillText(fitText(ctx, title, textWidth), textX, photoY + PHOTO.height + 13 * SCALE)
  ctx.fillStyle = '#ffb19d'
  ctx.font = `500 ${12 * SCALE}px ${FONT}`
  ctx.fillText(date, textX, photoY + PHOTO.height + 43 * SCALE)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지를 만들지 못했어요.'))), 'image/png')
  })
}

// 스토리 이미지를 만들어 기기 공유 시트로 넘긴다. 이미지를 만들 수 없거나(사진 CORS 등) 파일 공유를 지원하지 않으면 unsupported
export async function shareStory(content: StoryContent): Promise<ImageShareResult> {
  try {
    const image = await createStoryImage(content)
    return await shareImage(image, { fileName: 'bunbungus-drive-story.png', title: content.title })
  } catch {
    return 'unsupported'
  }
}
