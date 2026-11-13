import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as legalApi from '@/api/legal'
import useLegalDocument from './useLegalDocument'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useLegalDocument', () => {
  it.each([
    ['PRIVACY', '개인정보 처리방침', '붕붕어스(이하 “서비스”)는 이용자의 개인정보를'],
    ['TERMS', '이용 약관', '제1조 목적'],
    ['OPEN_SOURCE', '오픈소스 라이선스', '오픈소스 소프트웨어를 사용하고 있습니다.'],
  ] as const)('%s 문서를 불러온다', async (type, title, text) => {
    const { result } = renderHook(() => useLegalDocument(type))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.document?.title).toBe(title)
    expect(result.current.document?.content).toContain(text)
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const spy = vi.spyOn(legalApi, 'fetchLegalDocument').mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useLegalDocument('TERMS'))
    await waitFor(() => expect(result.current.status).toBe('error'))

    spy.mockRestore()
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('ready'))
  })
})
