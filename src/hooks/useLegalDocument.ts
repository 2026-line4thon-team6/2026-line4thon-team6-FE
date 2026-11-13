import { useEffect, useState } from 'react'
import { fetchLegalDocument } from '@/api/legal'
import type { LegalDocument, LegalDocumentType } from '@/types/legal'

interface State {
  status: 'loading' | 'ready' | 'error'
  document: LegalDocument | null
}

// 약관 · 개인정보 처리방침 · 오픈소스 라이선스 문서 (GET /legal-documents/{type})
// 문서 종류가 바뀌면 부모에서 key={type}으로 새로 마운트한다
function useLegalDocument(type: LegalDocumentType) {
  const [state, setState] = useState<State>({ status: 'loading', document: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false

    fetchLegalDocument(type)
      .then(({ data }) => {
        if (!ignore) setState({ status: 'ready', document: data })
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error', document: null })
      })

    return () => {
      ignore = true
    }
  }, [type, attempt])

  const retry = () => {
    setState({ status: 'loading', document: null })
    setAttempt((count) => count + 1)
  }

  return { ...state, retry }
}

export default useLegalDocument
