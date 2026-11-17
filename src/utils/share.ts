export type ShareChannel = 'kakaotalk' | 'instagram' | 'x' | 'facebook'

// 공유 링크 상태: 받아오는 중 / 받아옴 / 실패
export type ShareLink = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'error' }

interface ShareContent {
  url: string
  title: string
}

// 링크 복사. HTTPS가 아니면 clipboard API가 없어 예전 방식으로 대신한다
export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

// X · 페이스북은 웹 공유 주소로 연다.
// 카카오톡 · 인스타그램은 웹 공유 주소가 없어 기기의 공유 시트를 열고, 지원하지 않으면 링크를 복사한다.
// TODO: 카카오톡은 Kakao JavaScript SDK(앱 키 필요) 연동 시 Kakao.Share로 교체한다
export async function shareTo(channel: ShareChannel, { url, title }: ShareContent) {
  if (channel === 'x') {
    const query = new URLSearchParams({ url, text: title })
    window.open(`https://twitter.com/intent/tweet?${query}`, '_blank', 'noopener')
    return
  }
  if (channel === 'facebook') {
    const query = new URLSearchParams({ u: url })
    window.open(`https://www.facebook.com/sharer/sharer.php?${query}`, '_blank', 'noopener')
    return
  }
  if (navigator.share) {
    // 사용자가 공유 시트를 닫으면 AbortError가 난다. 오류로 다루지 않는다
    await navigator.share({ url, title }).catch(() => undefined)
    return
  }
  await copyText(url)
}

// 내 커플 코드를 연인에게 보낸다. 기기 공유 화면이 없으면 코드를 복사하고 'copied'를 돌려준다
export async function shareInviteCode(code: string): Promise<'shared' | 'copied'> {
  const text = `붕붕어스에서 같이 드라이브 기록을 남겨요! 내 커플 코드: ${code}`
  if (navigator.share) {
    // 사용자가 공유 시트를 닫으면 AbortError가 난다. 오류로 다루지 않는다
    await navigator.share({ title: '붕붕어스 커플 코드', text }).catch(() => undefined)
    return 'shared'
  }
  await copyText(code)
  return 'copied'
}

// 멱등 키. crypto.randomUUID는 HTTPS에서만 쓸 수 있어 없으면 직접 만든다
export function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

export type ImageShareResult = 'shared' | 'cancelled' | 'unsupported'

// 이미지 파일을 기기 공유 시트로 넘긴다. 인스타그램 스토리처럼 이미지를 받는 앱을 사용자가 고른다.
// 웹에서는 앱의 스토리 편집 화면을 바로 열 수 없어, 파일 공유를 지원하는 기기(모바일 사파리 · 크롬)에서만 동작한다
export async function shareImage(image: Blob, { fileName, title }: { fileName: string; title: string }): Promise<ImageShareResult> {
  const file = new File([image], fileName, { type: image.type || 'image/png' })
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) return 'unsupported'

  try {
    await navigator.share({ files: [file], title })
    return 'shared'
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

// 이미지를 클립보드에 PNG로 넣는다 (기록 공유 시트의 '이미지 복사').
// 아이폰 사파리는 누른 순간에 클립보드를 써야 해서, 만들고 있는 이미지(Promise)를 기다리지 않고 바로 넘긴다.
// 이미지 복사를 지원하지 않는 브라우저면 이미지를 만들지 않고 거절한다 (부르는 쪽이 링크 복사로 바꾼다)
export async function copyImage(createImage: () => Promise<Blob>): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('이미지 복사를 지원하지 않아요.')
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': createImage() })])
}

export type ImageSaveResult = 'shared' | 'downloaded' | 'cancelled'

// 이미지를 저장한다 (기록 공유 시트의 '이미지 저장').
// 휴대폰은 파일을 바로 사진첩에 넣을 수 없어 공유 시트를 열고(이미지 저장 선택), 그 밖에는 PNG 파일로 내려받는다
export async function saveImage(image: Blob, fileName: string): Promise<ImageSaveResult> {
  const file = new File([image], fileName, { type: image.type || 'image/png' })
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false
  if (touch && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // 공유 시트를 열지 못하면 내려받기로 바꾼다
    }
  }
  const url = URL.createObjectURL(image)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
