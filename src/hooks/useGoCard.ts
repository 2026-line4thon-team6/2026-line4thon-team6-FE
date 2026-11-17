import { addTransitionType, startTransition } from 'react'
import { useNavigate } from 'react-router'
import { TO_CARD } from '@/utils/cardTransition'

// 카드 작성 화면 주소의 state. 카드를 불러오기 전에도 제목을 그릴 수 있게 카드 이름을 넘긴다
export interface CardNavigationState {
  cardTitle: string
}

// 미작성 카드 목록 · 배너 · 팝업에서 카드 작성 화면으로 간다.
// 'to-card' 전환으로 표시해 작성 화면이 아래에서 올라오고 누른 카드 이름이 제목 자리로 이어지게 한다
function useGoCard() {
  const navigate = useNavigate()
  // replace: 뒤로가기로 돌아오지 않을 화면(마친 드라이브 등)에서 갈 때
  return (driveId: string, title?: string, options: { replace?: boolean } = {}) =>
    startTransition(() => {
      addTransitionType(TO_CARD)
      const state: CardNavigationState | null = title ? { cardTitle: title } : null
      navigate(`/drives/${encodeURIComponent(driveId)}/card`, { state, replace: options.replace })
    })
}

export default useGoCard
