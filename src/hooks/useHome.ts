import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchHome } from '@/api/home'
import type { HomeResponse } from '@/types/home'
import type { Me } from '@/types/me'
import type { Coordinate } from '@/types/route'
import { emptyHomeSummary, toHomeSummary } from '@/utils/homeSummary'
import { getCurrentCoordinate } from '@/utils/location'

// 홈 첫 화면 데이터 (GET /home). 로그인한 뒤 불러오고, 홈에 들어올 때 · 알림을 읽은 뒤 reload로 다시 받는다.
// 날씨는 좌표가 있어야 채워지므로 먼저 좌표 없이 그리고, 현재 위치를 얻으면 위치를 담아 한 번 더 받는다(위치는 앱이 켜져 있는 동안 재사용)
function useHome(user: Pick<Me, 'id' | 'nickname'> | null) {
  // 다른 계정으로 바뀌면 이전 계정의 응답을 쓰지 않도록 누구의 응답인지 같이 둔다
  const [loaded, setLoaded] = useState<{ userId: string; data: HomeResponse } | null>(null)
  // 응답을 받은 기기 시각. 미작성 카드의 남은 시간을 이 시각부터 센다
  const [receivedAt, setReceivedAt] = useState(0)
  const coordinate = useRef<Coordinate | null>(null)
  const latestRequest = useRef(0)
  const userId = user?.id ?? null

  const reload = useCallback(async () => {
    const request = ++latestRequest.current
    try {
      const { data } = await fetchHome(coordinate.current ?? undefined)
      // 늦게 도착한 이전 응답이 최신 응답을 덮지 않게 한다
      if (request !== latestRequest.current) return
      setLoaded({ userId: data.me.id, data })
      setReceivedAt(Date.now())
    } catch {
      // 홈은 비워 둔 값으로 그대로 보여 준다 (다음에 홈에 들어올 때 다시 시도)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let ignore = false
    void reload()
    if (!coordinate.current) {
      void getCurrentCoordinate().then((found) => {
        if (ignore || !found) return
        coordinate.current = found
        void reload()
      })
    }
    return () => {
      ignore = true
    }
  }, [userId, reload])

  const response = loaded && loaded.userId === userId ? loaded.data : null

  return {
    summary: response ? toHomeSummary(response, new Date(receivedAt)) : emptyHomeSummary(user),
    // 아직 불러오지 않았으면 null
    pendingCards: response?.pendingCards ?? null,
    receivedAt,
    activeDriveId: response?.activeDriveId ?? null,
    reload,
  }
}

export default useHome
