import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRecordCalendar } from '@/api/records'
import type { ApiResponse } from '@/types/api'
import type { RecordCalendar } from '@/types/record'
import useRecordCalendar from './useRecordCalendar'

vi.mock('@/api/records')

const calendar = (month: string, dates: string[]): ApiResponse<RecordCalendar> => ({
  data: { month, days: dates.map((date) => ({ date, count: 1 })) },
  meta: { requestId: 'req_test', serverTime: '2026-11-13T00:00:00Z' },
})

beforeEach(() => {
  vi.mocked(fetchRecordCalendar).mockReset()
})

describe('useRecordCalendar', () => {
  it('그 달에 기록이 있는 날짜를 불러온다', async () => {
    vi.mocked(fetchRecordCalendar).mockResolvedValue(calendar('2026-10', ['2026-10-03', '2026-10-24']))

    const { result } = renderHook(() => useRecordCalendar('2026-10'))
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(fetchRecordCalendar).toHaveBeenCalledWith('2026-10')
    expect([...result.current.recordDates]).toEqual(['2026-10-03', '2026-10-24'])
  })

  it('달이 바뀌면 이전 달 날짜를 비우고 새 달을 불러온다', async () => {
    vi.mocked(fetchRecordCalendar)
      .mockResolvedValueOnce(calendar('2026-10', ['2026-10-03']))
      .mockResolvedValueOnce(calendar('2026-09', ['2026-09-06']))

    const { result, rerender } = renderHook((month) => useRecordCalendar(month), { initialProps: '2026-10' })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender('2026-09')
    expect(result.current.status).toBe('loading')
    expect(result.current.recordDates.size).toBe(0)

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect([...result.current.recordDates]).toEqual(['2026-09-06'])
  })

  it('늦게 도착한 이전 달 응답은 버린다', async () => {
    let resolveOctober: (value: ApiResponse<RecordCalendar>) => void = () => {}
    vi.mocked(fetchRecordCalendar)
      .mockReturnValueOnce(new Promise((resolve) => (resolveOctober = resolve)))
      .mockResolvedValueOnce(calendar('2026-09', ['2026-09-06']))

    const { result, rerender } = renderHook((month) => useRecordCalendar(month), { initialProps: '2026-10' })
    rerender('2026-09')
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => resolveOctober(calendar('2026-10', ['2026-10-03'])))
    expect([...result.current.recordDates]).toEqual(['2026-09-06'])
  })

  it('실패하면 오류 상태가 되고, 다시 시도할 수 있다', async () => {
    vi.mocked(fetchRecordCalendar)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(calendar('2026-10', ['2026-10-03']))

    const { result } = renderHook(() => useRecordCalendar('2026-10'))
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.recordDates.has('2026-10-03')).toBe(true)
  })
})
