import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { login, logout } from '@/api/auth'
import { mockFetchMe, mockFetchMyCouple, mockJoinCouple, MOCK_PARTNER_INVITE_CODE, resetMockCouple } from '@/mocks/couples'
import useOnboarding from './useOnboarding'

// 가입 질문(L2~L8)의 답을 모았다가 마지막 단계에서 PUT /me/onboarding으로 한 번에 저장한다
beforeEach(async () => {
  resetMockCouple()
  sessionStorage.clear()
  await logout('key')
  await login('KAKAO') // 새 가입자
})

describe('가입 답변 모으기', () => {
  it('답한 내용은 새로고침해도 남아 있다 (탭을 닫으면 사라진다)', () => {
    const first = renderHook(() => useOnboarding())
    act(() => first.result.current.update({ agreed: true, nickname: '현우' }))
    first.unmount()

    const second = renderHook(() => useOnboarding())
    expect(second.result.current.draft).toMatchObject({ agreed: true, nickname: '현우' })
  })

  it('마지막에 저장하면 약관 버전 · 날짜를 맞춰 가입을 마치고, 모은 답을 지운다', async () => {
    const { result } = renderHook(() => useOnboarding())
    act(() =>
      result.current.update({
        agreed: true,
        nickname: '현우',
        birthDate: '2002.03.04',
        gender: 'MALE',
        coupleStartDate: '2026.01.01',
      }),
    )

    let user
    await act(async () => {
      user = await result.current.submit('쌩쌩이')
    })

    expect(user).toMatchObject({ nickname: '현우', birthDate: '2002-03-04', gender: 'MALE', onboardingCompleted: true })
    expect(sessionStorage.getItem('bbus.onboarding')).toBeNull()

    // 가입할 때 고른 시작일 · 붕붕이 이름이 연결할 때 처음 값이 된다
    const { data } = await mockJoinCouple({ code: MOCK_PARTNER_INVITE_CODE })
    expect(data).toMatchObject({ startDate: '2026-01-01', mascotName: '쌩쌩이' })
  })

  it('만난 날을 건너뛰면 시작일 없이 저장한다 (연결한 날부터 센다)', async () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => result.current.update({ agreed: true, nickname: '현우', birthDate: '2002.03.04', coupleStartDate: '' }))

    await act(async () => {
      await result.current.submit('쌩쌩이')
    })

    expect((await mockFetchMyCouple()).data.couple).toBeNull()
    const { data } = await mockJoinCouple({ code: MOCK_PARTNER_INVITE_CODE })
    expect(data.daysTogether).toBe(1)
  })

  it('저장에 실패하면 안내 문구를 남기고 답은 그대로 둔다', async () => {
    const { result } = renderHook(() => useOnboarding())
    // 약관에 동의하지 않은 채로 마지막 단계까지 온 경우
    act(() => result.current.update({ agreed: false, nickname: '현우', birthDate: '2002.03.04' }))

    let user
    await act(async () => {
      user = await result.current.submit('쌩쌩이')
    })

    expect(user).toBeNull()
    expect(result.current.error).toBe('약관에 동의해 주세요.')
    expect(result.current.draft.nickname).toBe('현우')
    expect((await mockFetchMe()).data.onboardingCompleted).toBe(false)
  })
})
