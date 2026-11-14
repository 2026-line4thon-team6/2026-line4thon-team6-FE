// 서비스 워커 등록 (배포 빌드에서만). 개발 서버에서는 캐시가 수정 사항을 가리지 않게 등록하지 않는다
export function registerServiceWorker(container: ServiceWorkerContainer | undefined = navigator.serviceWorker) {
  if (!import.meta.env.PROD || !container) return
  window.addEventListener('load', () => {
    container.register('/sw.js').catch(() => {
      // 등록에 실패해도 앱은 그대로 쓸 수 있다 (오프라인 화면만 없음)
    })
  })
}
