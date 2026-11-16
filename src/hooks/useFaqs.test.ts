import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as faqApi from '@/api/faq'
import useFaqs from './useFaqs'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFaqs', () => {
  it('자주 묻는 질문을 표시 순서대로 불러온다', async () => {
    const { result } = renderHook(() => useFaqs())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.faqs.length).toBeGreaterThan(0)
    const orders = result.current.faqs.map((faq) => faq.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('서버가 순서를 섞어 보내도 order 순으로 정렬한다', async () => {
    vi.spyOn(faqApi, 'fetchFaqs').mockResolvedValueOnce({
      data: [
        { id: 'faq-b', question: '두 번째', answer: '답', order: 20 },
        { id: 'faq-a', question: '첫 번째', answer: '답', order: 10 },
      ],
      meta: { requestId: 'req_1', serverTime: '2026-11-16T00:00:00Z' },
    })
    const { result } = renderHook(() => useFaqs())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.faqs.map((faq) => faq.id)).toEqual(['faq-a', 'faq-b'])
  })

  it('불러오지 못하면 error, 다시 시도하면 다시 불러온다', async () => {
    const spy = vi.spyOn(faqApi, 'fetchFaqs').mockRejectedValueOnce(new Error('network'))
    const { result } = renderHook(() => useFaqs())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
