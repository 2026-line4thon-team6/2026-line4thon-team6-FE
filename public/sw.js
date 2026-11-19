// 붕붕어스 서비스 워커. 설치(홈 화면 추가) · 오프라인일 때 앱 화면 열기 · 휴대폰 알림(Web Push) 표시를 맡는다.
// API · 이미지 · JS 등은 가로채지 않는다 (항상 최신을 받고, 브라우저 기본 캐시를 따른다)
const CACHE = 'bbus-shell-v1'
const SHELL = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

// 화면 이동(주소 입력 · 새로고침)만 처리: 네트워크 먼저, 끊겼으면 저장해 둔 앱 화면
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.mode !== 'navigate') return
  // 팀 QA 페이지(/qa.html)는 앱 화면이 아니라 저장하지 않는다 (앱 오프라인 화면이 QA 페이지로 바뀌지 않게)
  if (new URL(request.url).pathname === '/qa.html') return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy))
        }
        return response
      })
      .catch(() => caches.match(SHELL).then((cached) => cached ?? Response.error())),
  )
})

// 휴대폰 알림(Web Push). 서버가 보낸 JSON { title, body, targetType, targetId, notificationId } 로 알림을 띄운다
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || '붕붕어스'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      lang: 'ko',
      // 같은 알림이 두 번 오면 하나로 합친다
      tag: data.notificationId || undefined,
      data: { url: notificationUrl(data) },
    }),
  )
})

// 알림을 누르면: 장소 공유는 장소 상세, 카드 완성 · 소감은 기록 상세, 커플 알림은 알림 목록
function notificationUrl(data) {
  const id = data.targetId ? encodeURIComponent(data.targetId) : ''
  if (data.targetType === 'PLACE' && id) return `/places/${id}`
  if (data.targetType === 'CARD' && id) return `/cards/${id}`
  return '/notifications'
}

// 열려 있는 앱 창이 있으면 그 창을 앞으로 가져와 이동하고, 없으면 새로 연다
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (open) return open.focus().then((client) => (client.navigate ? client.navigate(url) : client))
      return self.clients.openWindow(url)
    }),
  )
})
