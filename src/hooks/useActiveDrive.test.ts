import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as drivesApi from '@/api/drives'
import type { Drive } from '@/types/drive'
import useActiveDrive from './useActiveDrive'

const active = (status: Drive['status'] | null) => ({
  data: { drive: status ? ({ id: 'drv_1', status } as Drive) : null },
  meta: { requestId: 'r', serverTime: '' },
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useActiveDrive', () => {
  it.each([
    ['ACTIVE', 'driving'],
    ['PAUSED', 'driving'],
    ['PREPARING', 'preparing'],
    ['ENDED', 'none'],
    [null, 'none'],
  ] as const)('남아 있는 드라이브 상태가 %s면 %s', async (status, expected) => {
    vi.spyOn(drivesApi, 'getActiveDrive').mockResolvedValue(active(status))

    const { result } = renderHook(() => useActiveDrive())

    await waitFor(() => expect(result.current).toBe(expected))
  })
})
