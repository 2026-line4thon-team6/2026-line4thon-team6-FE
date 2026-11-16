import type { CursorPage } from './api'

// API 명세의 Notification 스키마 그대로 (GET /notifications, PATCH /notifications/{id}/read)
export type NotificationType = 'PLACE_SHARED' | 'REFLECTION_SUBMITTED' | 'COUPLE_CONNECTED' | 'COUPLE_DISCONNECTED'

// 알림을 탭했을 때 이동할 대상
export type NotificationTargetType = 'PLACE' | 'CARD' | 'COUPLE'

export interface NotificationSender {
  id: string
  nickname: string
  birthDate: string | null
  profileImageUrl: string | null
  provider: 'KAKAO'
}

export interface Notification {
  id: string // 서버 발급 불투명 ID
  type: NotificationType
  sender: NotificationSender | null
  title: string
  body: string
  targetType: NotificationTargetType
  targetId: string
  createdAt: string // UTC RFC3339
  expiresAt: string
  readAt: string | null // null이면 읽지 않음
}

export type NotificationPage = CursorPage<Notification>
