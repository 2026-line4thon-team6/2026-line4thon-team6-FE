import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const registerWebPush = vi.fn().mockResolvedValue(undefined)
vi.mock('@/api/push', () => ({ registerWebPush: (...args: unknown[]) => registerWebPush(...args) }))

const { default: usePushNotifications } = await import('./usePushNotifications')

// 브라우저 푸시 API 흉내
function stubBrowser({ permission = 'default' as NotificationPermission, existing = null as object | null } = {}) {
  const subscription = { endpoint: 'https://push.example.test/abc', toJSON: () => ({}) }
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(existing),
    subscribe: vi.fn().mockResolvedValue(subscription),
  }
  const notification = { permission, requestPermission: vi.fn() }
  notification.requestPermission.mockImplementation(async () => {
    notification.permission = 'granted'
    return 'granted'
  })
  vi.stubGlobal('Notification', notification)
  vi.stubGlobal('PushManager', function PushManager() {})
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager }) },
  })
  return { pushManager, notification, subscription }
}

beforeEach(() => {
  vi.stubEnv('PROD', true)
  vi.stubEnv('VITE_WEB_PUSH_PUBLIC_KEY', 'BAAB')
  registerWebPush.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('usePushNotifications', () => {
  it('알림 권한을 묻기 전이면 켤 수 있는 상태다', () => {
    stubBrowser()

    const { result } = renderHook(() => usePushNotifications())

    expect(result.current.status).toBe('default')
  })

  it('알림 켜기를 누르면 권한을 받고 구독해서 서버에 이 기기를 등록한다', async () => {
    const { pushManager, notification, subscription } = stubBrowser()
    const { result } = renderHook(() => usePushNotifications())

    await act(() => result.current.enable())

    expect(notification.requestPermission).toHaveBeenCalled()
    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) }),
    )
    expect(registerWebPush).toHaveBeenCalledWith(subscription)
    expect(result.current.status).toBe('enabled')
  })

  it('이미 허용한 기기는 화면을 열 때 구독을 서버에 다시 맞춘다 (구독 주소가 바뀌었거나 다른 계정으로 로그인한 경우)', async () => {
    const existing = { endpoint: 'https://push.example.test/old', toJSON: () => ({}) }
    const { pushManager } = stubBrowser({ permission: 'granted', existing })

    const { result } = renderHook(() => usePushNotifications({ sync: true }))

    await waitFor(() => expect(registerWebPush).toHaveBeenCalledWith(existing))
    expect(pushManager.subscribe).not.toHaveBeenCalled()
    expect(result.current.status).toBe('enabled')
  })

  it('등록 맞추기를 맡지 않은 화면에서는 허용한 기기를 켜진 상태로 보고 다시 등록하지 않는다', () => {
    stubBrowser({ permission: 'granted' })

    const { result } = renderHook(() => usePushNotifications())

    expect(result.current.status).toBe('enabled')
    expect(registerWebPush).not.toHaveBeenCalled()
  })

  it('권한을 거절하면 설정에서 켜야 한다고 알린다', async () => {
    const { notification } = stubBrowser()
    notification.requestPermission.mockImplementation(async () => {
      notification.permission = 'denied'
      return 'denied'
    })
    const { result } = renderHook(() => usePushNotifications())

    await act(() => result.current.enable())

    expect(result.current.status).toBe('denied')
    expect(registerWebPush).not.toHaveBeenCalled()
  })

  it('서버 등록에 실패하면 다시 시도할 수 있게 한다', async () => {
    stubBrowser()
    registerWebPush.mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => usePushNotifications())

    await act(() => result.current.enable())

    expect(result.current.status).toBe('failed')
  })

  it('홈 화면에 추가하지 않은 아이폰은 설치 안내 상태다', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    )

    const { result } = renderHook(() => usePushNotifications())

    expect(result.current.status).toBe('needs-install')
  })

  it('푸시를 지원하지 않는 브라우저나 공개키가 없으면 보여 주지 않는다', () => {
    vi.stubEnv('VITE_WEB_PUSH_PUBLIC_KEY', '')
    stubBrowser()

    const { result } = renderHook(() => usePushNotifications())

    expect(result.current.status).toBe('unsupported')
  })
})
