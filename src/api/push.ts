import { getDeviceId } from './auth'
import { apiFetch, USE_MOCK } from './client'

const pushTokenPath = () => `/devices/${encodeURIComponent(getDeviceId())}/push-token`

// PUT /devices/{deviceId}/push-token — 이 브라우저를 휴대폰 알림(Web Push) 받을 기기로 등록한다.
// WEB은 PushSubscription을 JSON 문자열로 token에 담는다 (서버가 endpoint · keys 형식을 검사)
export async function registerWebPush(subscription: PushSubscription): Promise<void> {
  if (USE_MOCK) return
  await apiFetch(pushTokenPath(), {
    method: 'PUT',
    body: JSON.stringify({ token: JSON.stringify(subscription.toJSON()), platform: 'WEB', enabled: true }),
  })
}

// DELETE /devices/{deviceId}/push-token — 이 기기로 더는 알림을 보내지 않는다
export async function unregisterWebPush(): Promise<void> {
  if (USE_MOCK) return
  await apiFetch(pushTokenPath(), { method: 'DELETE' })
}
