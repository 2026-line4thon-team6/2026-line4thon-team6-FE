import { useCallback, useEffect, useState } from 'react'
import { registerWebPush } from '@/api/push'

// unsupported: 브라우저가 못 받음(카카오톡 인앱 등) · 개발 서버 · 공개키 없음 → 안내하지 않는다
// needs-install: 아이폰은 홈 화면에 추가한 앱에서만 받을 수 있다 (iOS 16.4+)
export type PushStatus = 'unsupported' | 'needs-install' | 'default' | 'working' | 'enabled' | 'denied' | 'failed'

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const isStandalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia?.('(display-mode: standalone)').matches === true

function publicKey(): string {
  return import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? ''
}

function initialStatus(): PushStatus {
  // 서비스 워커는 배포 빌드에서만 등록된다 (registerServiceWorker)
  if (!import.meta.env.PROD || !publicKey()) return 'unsupported'
  if (isIos() && !isStandalone()) return 'needs-install'
  if (!('serviceWorker' in navigator) || typeof PushManager === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  return Notification.permission === 'granted' ? 'working' : 'default'
}

// VAPID 공개키(base64url) → applicationServerKey
function decodeKey(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

// 이 기기의 구독을 만들거나 그대로 쓰고, 서버에 이 계정의 기기로 등록한다
async function subscribe() {
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey()) }))
  await registerWebPush(subscription)
}

// 휴대폰 알림(Web Push) 켜기. 커플 연결 · 해제, 장소 공유, 카드 완성 알림을 앱을 닫아도 받는다
// sync: 이미 허용한 기기면 서버 등록을 맞춘다. 로그인한 동안 앱 전체에서 한 번만 켠다
function usePushNotifications({ sync = false }: { sync?: boolean } = {}) {
  const [status, setStatus] = useState<PushStatus>(() => {
    const initial = initialStatus()
    // 등록 맞추기를 맡지 않은 화면에서는 허용한 기기를 켜진 것으로 본다
    return initial === 'working' && !sync ? 'enabled' : initial
  })

  // 이미 허용한 기기는 로그인할 때마다 서버 등록을 맞춘다 (구독 주소가 바뀌었거나 다른 계정으로 로그인한 경우)
  useEffect(() => {
    if (!sync || initialStatus() !== 'working') return
    let ignore = false
    subscribe()
      .then(() => !ignore && setStatus('enabled'))
      .catch(() => !ignore && setStatus('failed'))
    return () => {
      ignore = true
    }
  }, [sync])

  // 권한 요청은 버튼을 누른 순간에만 할 수 있다 (사파리)
  const enable = useCallback(async () => {
    setStatus('working')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default')
        return
      }
      await subscribe()
      setStatus('enabled')
    } catch {
      setStatus('failed')
    }
  }, [])

  return { status, enable }
}

export default usePushNotifications
