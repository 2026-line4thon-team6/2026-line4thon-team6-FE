import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as radioApi from '@/api/radio'
import { ApiError } from '@/api/client'
import useRadioEpisode from './useRadioEpisode'

afterEach(() => vi.restoreAllMocks())

describe('useRadioEpisode', () => {
  it('사연 하나를 불러온다', async () => {
    const spy = vi.spyOn(radioApi, 'fetchRadioEpisode')
    const { result } = renderHook(() => useRadioEpisode('rad_01'))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(spy).toHaveBeenCalledWith('rad_01')
    expect(result.current.episode?.id).toBe('rad_01')
  })

  it('없는 사연(404)이면 notFound, 그 밖의 실패는 error', async () => {
    const { result: missing } = renderHook(() => useRadioEpisode('rad_none'))
    await waitFor(() => expect(missing.current.status).toBe('notFound'))

    vi.spyOn(radioApi, 'fetchRadioEpisode').mockRejectedValue(new ApiError(500, null))
    const { result: failed } = renderHook(() => useRadioEpisode('rad_01'))
    await waitFor(() => expect(failed.current.status).toBe('error'))
  })

  it('음성 주소를 새로 받을 때는 방송 문구를 그대로 둔 채 다시 조회한다', async () => {
    const spy = vi.spyOn(radioApi, 'fetchRadioEpisode')
    const { result } = renderHook(() => useRadioEpisode('rad_01'))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.refreshAudio())

    expect(result.current.status).toBe('ready')
    expect(result.current.episode?.id).toBe('rad_01')
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
  })
})
