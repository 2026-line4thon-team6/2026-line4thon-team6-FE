import { useEffect, useState } from 'react'
import { fetchFaqs } from '@/api/faq'
import type { Faq } from '@/types/faq'

interface State {
  status: 'loading' | 'ready' | 'error'
  faqs: Faq[]
}

const INITIAL: State = { status: 'loading', faqs: [] }

// 마이 > 자주 묻는 질문 (GET /faqs). 화면에 들어올 때마다 새로 불러온다
function useFaqs() {
  const [state, setState] = useState<State>(INITIAL)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchFaqs()
      .then(({ data }) => {
        // 서버가 order 순으로 주지만, 설정 파일 순서가 바뀌어도 화면 순서가 흔들리지 않게 한 번 더 정렬한다
        const faqs = [...data].sort((a, b) => a.order - b.order)
        if (!ignore) setState({ status: 'ready', faqs })
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

  return { ...state, retry }
}

export default useFaqs
