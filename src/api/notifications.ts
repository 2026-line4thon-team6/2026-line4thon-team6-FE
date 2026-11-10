import { mockFetchNotifications, mockMarkNotificationRead } from '@/mocks/notifications'
import type { ApiResponse } from '@/types/api'
import type { Notification, NotificationPage } from '@/types/notification'
import { apiFetch, USE_MOCK } from './client'

export interface FetchNotificationsParams {
  cursor?: string // 이전 응답의 nextCursor. 첫 요청은 생략
  limit?: number // 기본 20, 최대 100
  unreadOnly?: boolean
}

// GET /notifications — 최근 30일 인앱 알림 (최신순)
export function fetchNotifications(params: FetchNotificationsParams = {}): Promise<ApiResponse<NotificationPage>> {
  if (USE_MOCK) return mockFetchNotifications(params)

  const query = new URLSearchParams()
  if (params.cursor) query.set('cursor', params.cursor)
  if (params.limit) query.set('limit', String(params.limit))
  if (params.unreadOnly) query.set('unreadOnly', 'true')
  const search = query.toString()
  return apiFetch<NotificationPage>(`/notifications${search ? `?${search}` : ''}`)
}

// PATCH /notifications/{notificationId}/read — 멱등. 이미 읽은 알림은 최초 readAt을 유지한다
export function markNotificationRead(notificationId: string): Promise<ApiResponse<Notification>> {
  if (USE_MOCK) return mockMarkNotificationRead(notificationId)

  return apiFetch<Notification>(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH' })
}
