import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNotifications, markNotificationRead } from '@/api/notifications'
import { createMockNotifications } from '@/mocks/notifications'
import type { ApiResponse } from '@/types/api'
import type { Notification, NotificationPage } from '@/types/notification'
import useNotifications from './useNotifications'

vi.mock('@/api/notifications')

const SERVER_TIME = '2026-11-10T12:00:00.000Z'
const [FIRST, SECOND, THIRD] = createMockNotifications(new Date(SERVER_TIME).getTime())

const page = (items: Notification[], nextCursor: string | null = null): ApiResponse<NotificationPage> => ({
  data: { items, nextCursor, hasMore: nextCursor !== null },
  meta: { requestId: 'req_test', serverTime: SERVER_TIME },
})

const read = (item: Notification): ApiResponse<Notification> => ({
  data: { ...item, readAt: SERVER_TIME },
  meta: { requestId: 'req_test', serverTime: SERVER_TIME },
})

beforeEach(() => {
  vi.mocked(fetchNotifications).mockReset()
  vi.mocked(markNotificationRead).mockReset()
})

describe('useNotifications', () => {
  it('처음에는 불러오는 중이고, 응답이 오면 목록과 서버 시각을 제공한다', async () => {
    vi.mocked(fetchNotifications).mockResolvedValue(page([FIRST, SECOND]))

    const { result } = renderHook(() => useNotifications())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.notifications).toEqual([FIRST, SECOND])
    expect(result.current.serverTime).toBe(SERVER_TIME)
    expect(result.current.hasMore).toBe(false)
  })

  it('요청이 실패하면 오류 상태가 되고, 다시 시도하면 다시 불러온다', async () => {
    vi.mocked(fetchNotifications).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(page([FIRST]))

    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.notifications).toEqual([FIRST])
  })

  it('더 보기는 nextCursor로 다음 페이지를 불러와 뒤에 붙인다', async () => {
    vi.mocked(fetchNotifications).mockResolvedValueOnce(page([FIRST, SECOND], 'cursor_2')).mockResolvedValueOnce(page([THIRD]))

    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.hasMore).toBe(true))

    await act(() => result.current.loadMore())

    expect(fetchNotifications).toHaveBeenLastCalledWith({ cursor: 'cursor_2' })
    expect(result.current.notifications).toEqual([FIRST, SECOND, THIRD])
    expect(result.current.hasMore).toBe(false)
  })

  it('읽음 처리는 화면에 바로 반영하고 서버에 요청한다', async () => {
    vi.mocked(fetchNotifications).mockResolvedValue(page([FIRST, SECOND]))
    vi.mocked(markNotificationRead).mockResolvedValue(read(FIRST))

    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(() => result.current.markRead(FIRST.id))

    expect(markNotificationRead).toHaveBeenCalledWith(FIRST.id)
    expect(result.current.notifications[0].readAt).toBe(SERVER_TIME)
  })

  it('이미 읽은 알림은 서버에 다시 요청하지 않는다', async () => {
    vi.mocked(fetchNotifications).mockResolvedValue(page([SECOND]))

    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(() => result.current.markRead(SECOND.id))

    expect(markNotificationRead).not.toHaveBeenCalled()
  })

  it('읽음 처리 요청이 실패하면 읽지 않음으로 되돌린다', async () => {
    vi.mocked(fetchNotifications).mockResolvedValue(page([FIRST]))
    vi.mocked(markNotificationRead).mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(() => result.current.markRead(FIRST.id))

    expect(result.current.notifications[0].readAt).toBeNull()
  })
})
