import { useState } from 'react'
import { completeOnboarding } from '@/api/auth'
import { ApiError } from '@/api/client'
import { fetchLegalDocument } from '@/api/legal'
import type { Me } from '@/types/me'
import { todayString, toIsoDate } from '@/utils/coupleDate'

// 가입 질문 답변. 날짜는 화면에 보이는 'YYYY.MM.DD' 그대로 둔다 (뒤로 돌아왔을 때 그대로 보이게)
export interface OnboardingDraft {
  agreed: boolean
  nickname: string
  birthDate: string
  gender: 'MALE' | 'FEMALE' | null
  coupleStartDate: string // 빈 값이면 건너뛰기 → 연결한 날부터 센다
  mascotName: string
}

const STORAGE_KEY = 'bbus.onboarding'
const EMPTY: OnboardingDraft = { agreed: false, nickname: '', birthDate: '', gender: null, coupleStartDate: '', mascotName: '' }

// PUT /me/onboarding 오류별 안내 (API 명세 422)
const ERRORS: Record<string, string> = {
  REQUIRED_CONSENT_MISSING: '약관에 동의해 주세요.',
  INVALID_BIRTH_DATE: '생일을 다시 확인해 주세요.',
  VALIDATION_FAILED: '입력한 내용을 다시 확인해 주세요.',
}
const FALLBACK = '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'

// 가입 도중 새로고침해도 이어서 할 수 있게 탭이 열려 있는 동안 보관한다
function loadDraft(): OnboardingDraft {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    return saved ? { ...EMPTY, ...(JSON.parse(saved) as Partial<OnboardingDraft>) } : EMPTY
  } catch {
    return EMPTY
  }
}

function saveDraft(draft: OnboardingDraft | null) {
  try {
    if (draft) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장하지 못해도 화면 안의 답변으로 계속 진행한다
  }
}

// 가입 질문(기능명세서 L2~L8)의 답을 모았다가 마지막 붕붕이 이름 단계에서 한 번에 저장한다
function useOnboarding() {
  const [draft, setDraft] = useState<OnboardingDraft>(loadDraft)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (patch: Partial<OnboardingDraft>) => {
    const next = { ...draft, ...patch }
    saveDraft(next)
    setDraft(next)
    setError(null)
  }

  // 성공하면 가입을 마친 내 계정, 실패하면 null (error에 안내 문구)
  const submit = async (mascotName: string): Promise<Me | null> => {
    const answers = { ...draft, mascotName }
    update({ mascotName })
    setSubmitting(true)

    try {
      // 동의한 약관은 현재 시행 중인 버전으로 보낸다
      const [terms, privacy] = await Promise.all([fetchLegalDocument('TERMS'), fetchLegalDocument('PRIVACY')])
      const today = todayString()
      const { data } = await completeOnboarding({
        nickname: answers.nickname.trim(),
        birthDate: toIsoDate(answers.birthDate, today),
        gender: answers.gender,
        coupleStartDate: toIsoDate(answers.coupleStartDate, today),
        mascotName: answers.mascotName.trim(),
        consents: [
          { type: 'TERMS', version: terms.data.version, agreed: answers.agreed },
          { type: 'PRIVACY', version: privacy.data.version, agreed: answers.agreed },
        ],
      })
      saveDraft(null)
      setDraft(EMPTY)
      return data
    } catch (caught) {
      setError((caught instanceof ApiError && ERRORS[caught.code]) || FALLBACK)
      return null
    } finally {
      setSubmitting(false)
    }
  }

  return { draft, update, submit, submitting, error }
}

export type Onboarding = ReturnType<typeof useOnboarding>

export default useOnboarding
