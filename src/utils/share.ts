export type ShareChannel = 'kakaotalk' | 'instagram' | 'x' | 'facebook'

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
