import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
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

  it('서버에 아직 등록되지 않은 문서(404)면 다시 시도 대신 notFound로 둔다', async () => {
    vi.spyOn(legalApi, 'fetchLegalDocument').mockRejectedValueOnce(
      new ApiError(404, {
        error: { code: 'RESOURCE_NOT_FOUND', message: '문서를 찾을 수 없어요.', details: [], retryable: false },
        meta: { requestId: 'req_1', serverTime: '2026-11-16T00:00:00Z' },
      }),
    )
    const { result } = renderHook(() => useLegalDocument('OPEN_SOURCE'))

    await waitFor(() => expect(result.current.status).toBe('notFound'))
    expect(result.current.document).toBeNull()
  })

  it('404가 아닌 서버 오류는 다시 시도할 수 있는 error로 둔다', async () => {
    vi.spyOn(legalApi, 'fetchLegalDocument').mockRejectedValueOnce(new ApiError(500, null))
    const { result } = renderHook(() => useLegalDocument('TERMS'))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })
})
