// 붕붕어스 서비스 워커. 설치(홈 화면 추가)와 오프라인일 때 앱 화면을 여는 용도만 한다.
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
