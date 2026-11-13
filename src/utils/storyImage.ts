import { type ImageShareResult, shareImage } from './share'

// 인스타그램 스토리용 드라이브 기록 카드 이미지 (Figma 284:15555).
// 1080 × 1920 캔버스 가운데에 기록 지도 미리보기와 같은 폴라로이드 카드를 그린다.
// Figma 390px 화면 기준 값에 SCALE을 곱해 쓴다
const WIDTH = 1080
const HEIGHT = 1920
const SCALE = WIDTH / 390

const CARD = { width: 269 * SCALE, height: 337 * SCALE, padding: 14 * SCALE, radius: 10 * SCALE }
const PHOTO = { width: 242 * SCALE, height: 251 * SCALE, radius: 10 * SCALE }
const FONT = 'Pretendard, -apple-system, sans-serif'

interface StoryContent {
  photoUrl: string
  title: string
  date: string // 화면용 날짜 (예: 2026년 11월 3일)
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

export async function createStoryImage({ photoUrl, title, date }: StoryContent): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 사용할 수 없어요.')

  const [photo] = await Promise.all([
    loadImage(photoUrl),
    // 앱 글꼴이 아직 안 불러와졌으면 기다린다
    document.fonts?.load(`600 ${20 * SCALE}px Pretendard`).catch(() => undefined),
  ])

  // 배경: 코랄 그라데이션
  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  background.addColorStop(0, '#fffbfb')
  background.addColorStop(1, '#ffd2c6')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // 카드 (그림자 0 0 10px 20%)
  const cardX = (WIDTH - CARD.width) / 2
  const cardY = (HEIGHT - CARD.height) / 2
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
  drawCover(ctx, photo, photoX, photoY, PHOTO.width, PHOTO.height)
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
