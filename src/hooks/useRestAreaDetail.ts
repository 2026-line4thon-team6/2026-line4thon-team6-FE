import { useState } from 'react'
import { getRestArea } from '@/api/restAreas'
import type { RestAreaDetail } from '@/types/restArea'

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
