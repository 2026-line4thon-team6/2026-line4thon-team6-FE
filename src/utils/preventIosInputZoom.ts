type Device = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>

// iPadOS 13+ 사파리는 맥과 같은 UA를 쓰므로 터치 지원 여부로 구분한다
function isIos({ userAgent, platform, maxTouchPoints }: Device) {
  return /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

// iOS 사파리는 글자 크기 16px 미만인 입력칸을 누르면 화면을 확대한다 (드라이브 카드 소감 칸 14px 등).
// viewport에 maximum-scale=1을 붙이면 이 자동 확대만 막히고, iOS 10+는 손가락 확대(핀치)는 그대로 허용한다.
// 안드로이드는 같은 설정이 핀치 확대까지 막고 자동 확대도 하지 않으므로 iOS에서만 붙인다
export function preventIosInputZoom(device: Device = navigator) {
  if (!isIos(device)) return

  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta || /maximum-scale/.test(meta.content)) return
  meta.content = `${meta.content}, maximum-scale=1`
}
