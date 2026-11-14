import { useState } from 'react'
import { getRestArea } from '@/api/restAreas'
import type { RestAreaDetail } from '@/types/restArea'

// 휴게소 상세 팝업. 도장 여부가 바뀔 수 있어 열 때마다 새로 받는다
function useRestAreaDetail() {
  const [detail, setDetail] = useState<RestAreaDetail | null>(null)

  const open = async (restAreaId: string) => {
    try {
      setDetail((await getRestArea(restAreaId)).data)
    } catch {
      setDetail(null)
    }
  }

  return { detail, open, close: () => setDetail(null) }
}

export default useRestAreaDetail
