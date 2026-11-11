import { useEffect, useState } from 'react'
import { fetchNotifications, markNotificationRead } from '@/api/notifications'
import type { Notification } from '@/types/notification'

interface State {
  status: 'loading' | 'ready' | 'error'
  notifications: Notification[]
  serverTime: string | null
  nextCursor: string | null
  loadingMore: boolean
}

const INITIAL: State = { status: 'loading', notifications: [], serverTime: null, nextCursor: null, loadingMore: false }

// 알림 목록 불러오기 · 더 보기 · 읽음 처리 (GET /notifications, PATCH /notifications/{id}/read)
function useNotifications() {
  const [state, setState] = useState<State>(INITIAL)
  // 값을 바꾸면 첫 페이지부터 다시 불러온다
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchNotifications()
      .then(({ data, meta }) => {
        if (ignore) return
        setState({
          status: 'ready',
          notifications: data.items,
          serverTime: meta.serverTime,
          nextCursor: data.hasMore ? data.nextCursor : null,
          loadingMore: false,
        })
      })
      .catch(() => {
        if (!ignore) setState({ ...INITIAL, status: 'error' })
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const retry = () => {
    setState(INITIAL)
    setAttempt((count) => count + 1)
  }

  const loadMore = async () => {
    const cursor = state.nextCursor
    if (!cursor || state.loadingMore) return

    setState((prev) => ({ ...prev, loadingMore: true }))
    try {
      const { data, meta } = await fetchNotifications({ cursor })
      setState((prev) => ({
        ...prev,
        notifications: [...prev.notifications, ...data.items],
        serverTime: meta.serverTime,
        nextCursor: data.hasMore ? data.nextCursor : null,
        loadingMore: false,
      }))
    } catch {
      // 실패하면 버튼을 다시 누를 수 있게만 한다
      setState((prev) => ({ ...prev, loadingMore: false }))
    }
  }

  const setReadAt = (id: string, readAt: string | null) =>
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) => (item.id === id ? { ...item, readAt } : item)),
    }))

  // 화면에는 바로 읽음으로 표시하고, 요청이 실패하면 되돌린다. 요청은 멱등이라 다시 눌러도 안전하다
  const markRead = async (id: string) => {
    const target = state.notifications.find((item) => item.id === id)
    if (!target || target.readAt !== null) return

    setReadAt(id, state.serverTime ?? new Date().toISOString())
    try {
      const { data } = await markNotificationRead(id)
      setReadAt(id, data.readAt)
    } catch {
      setReadAt(id, null)
    }
  }

  return {
    status: state.status,
    notifications: state.notifications,
    serverTime: state.serverTime,
    hasMore: state.nextCursor !== null,
    loadingMore: state.loadingMore,
    retry,
    loadMore,
    markRead,
  }
}

export default useNotifications
