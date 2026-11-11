import type { FetchNotificationsParams } from '@/api/notifications'
import type { ApiMeta, ApiResponse } from '@/types/api'
import type { Notification, NotificationPage, NotificationSender } from '@/types/notification'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 알림 목 응답. 실제 API와 같은 { data, meta } 형식으로 돌려준다
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const PARTNER: NotificationSender = {
  id: 'usr_partner',
  nickname: '민지',
  birthDate: '2003-05-06',
  profileImageUrl: null,
  provider: 'KAKAO',
}

// 지금 시각 기준으로 만들어, 언제 열어도 '17시간 전 / 1일 전 / 8일 전'으로 보이게 한다
export function createMockNotifications(now: number = Date.now()): Notification[] {
  const at = (ago: number) => new Date(now - ago).toISOString()
  const expires = (ago: number) => new Date(now - ago + 30 * DAY).toISOString()

  return [
    {
      id: 'ntf_01',
      type: 'PLACE_SHARED',
      sender: PARTNER,
      title: '민지님이 드라이브 장소를 공유했어요. 💌',
      body: '이번 주말, 함께 떠나보는 건 어떨까요?',
      targetType: 'PLACE',
      targetId: '1', // 목 장소(시흥 오이도)의 id
      createdAt: at(17 * HOUR),
      expiresAt: expires(17 * HOUR),
      readAt: null,
    },
    {
      id: 'ntf_02',
      type: 'REFLECTION_SUBMITTED',
      sender: PARTNER,
      title: '민지님이 드라이브 소감을 남겼어요.',
      body: '함께한 드라이브 카드를 확인해 보세요.',
      targetType: 'CARD',
      targetId: 'crd_01',
      createdAt: at(1 * DAY + 2 * HOUR),
      expiresAt: expires(1 * DAY + 2 * HOUR),
      readAt: at(1 * DAY),
    },
    {
      id: 'ntf_03',
      type: 'COUPLE_CONNECTED',
      sender: PARTNER,
      title: '민지님과 연결되었어요.',
      body: '이제 드라이브 기록을 함께 볼 수 있어요.',
      targetType: 'COUPLE',
      targetId: 'cpl_01',
      createdAt: at(8 * DAY + 3 * HOUR),
      expiresAt: expires(8 * DAY + 3 * HOUR),
      readAt: at(8 * DAY),
    },
  ]
}

let store: Notification[] | null = null
let requestCount = 0

const meta = (): ApiMeta => ({ requestId: `req_mock_${++requestCount}`, serverTime: new Date().toISOString() })

const getStore = () => (store ??= createMockNotifications())

export async function mockFetchNotifications({
  cursor,
  limit = 20,
  unreadOnly = false,
}: FetchNotificationsParams = {}): Promise<ApiResponse<NotificationPage>> {
  const all = getStore().filter((item) => !unreadOnly || item.readAt === null)
  const start = cursor ? Number(cursor) : 0
  const items = all.slice(start, start + limit)
  const hasMore = start + limit < all.length

  return { data: { items, nextCursor: hasMore ? String(start + limit) : null, hasMore }, meta: meta() }
}

export async function mockMarkNotificationRead(notificationId: string): Promise<ApiResponse<Notification>> {
  const items = getStore()
  const index = items.findIndex((item) => item.id === notificationId)
  if (index < 0) throw new Error(`알림을 찾을 수 없어요: ${notificationId}`)

  const response = meta()
  // 이미 읽은 알림은 최초 readAt을 유지한다 (API와 같은 동작)
  items[index] = { ...items[index], readAt: items[index].readAt ?? response.serverTime }
  return { data: items[index], meta: response }
}
