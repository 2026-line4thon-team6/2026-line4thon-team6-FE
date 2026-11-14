import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as couplesApi from '@/api/couples'
import { ApiError } from '@/api/client'
import { mockFetchMyCouple, mockRenameMascot, resetMockCouple } from '@/mocks/couples'
import useCouplePage from './useCouplePage'

async function renderReady() {
  const hook = renderHook(() => useCouplePage())
  await waitFor(() => expect(hook.result.current.status).not.toBe('loading'))
  return hook
}

beforeEach(() => {
  resetMockCouple()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('불러오기', () => {
  it('커플 정보 · 내 계정 · 커플 코드를 함께 불러온다', async () => {
    const { result } = await renderReady()

    expect(result.current.status).toBe('ready')
    expect(result.current.couple?.startDate).toBe('2026-10-20')
    expect(result.current.me?.id).toBe('usr_minjun')
    expect(result.current.inviteCode).toBe('jsd82nk9')
  })

  it('커플 코드를 불러오지 못해도 화면은 보여 준다', async () => {
    vi.spyOn(couplesApi, 'fetchMyInvite').mockRejectedValue(new ApiError(404, null))

    const { result } = await renderReady()

    expect(result.current.status).toBe('ready')
    expect(result.current.inviteCode).toBeNull()
  })

  it('연결된 커플이 없으면 unlinked', async () => {
    vi.spyOn(couplesApi, 'fetchMyCouple').mockResolvedValue({
      data: { couple: null, connectionStatus: 'DISCONNECTED' },
      meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
    })

    const { result } = await renderReady()

    expect(result.current.status).toBe('unlinked')
  })
})

describe('수정', () => {
  it('시작일을 바꾸면 화면의 커플 정보도 바뀐다', async () => {
    const { result } = await renderReady()

    let error: string | null = 'x'
    await act(async () => {
      error = await result.current.changeStartDate('2026-10-01')
    })

    expect(error).toBeNull()
    expect(result.current.couple?.startDate).toBe('2026-10-01')
  })

  it('붕붕이명을 바꾼다', async () => {
    const { result } = await renderReady()

    await act(async () => {
      await result.current.renameMascot('씽씽이')
    })

    expect(result.current.couple?.mascotName).toBe('씽씽이')
  })

  it('내 닉네임 · 생년월일을 바꾸면 커플 멤버에도 반영된다', async () => {
    const { result } = await renderReady()

    await act(async () => {
      await result.current.updateProfile({ nickname: '준이', birthDate: '2002-01-02' })
    })

    expect(result.current.me).toMatchObject({ nickname: '준이', birthDate: '2002-01-02' })
    expect(result.current.couple?.members.find((member) => member.id === 'usr_minjun')?.nickname).toBe('준이')
  })

  it('서버가 거절하면 안내 문구를 돌려준다', async () => {
    const { result } = await renderReady()

    let error: string | null = null
    await act(async () => {
      error = await result.current.renameMascot('   ')
    })

    expect(error).toBe('붕붕이명은 1~20자로 입력해 주세요.')
  })

  it('연인이 먼저 바꿔 버전이 다르면 다시 불러오고 안내한다', async () => {
    const { result } = await renderReady()
    const { data } = await mockFetchMyCouple()
    await mockRenameMascot({ name: '연인이바꾼이름', expectedVersion: data.couple!.version })

    let error: string | null = null
    await act(async () => {
      error = await result.current.changeStartDate('2026-10-01')
    })

    expect(error).toBe('연인이 먼저 정보를 바꿨어요. 새로 불러온 정보를 확인해 주세요.')
    expect(result.current.couple?.mascotName).toBe('연인이바꾼이름')
  })
})

describe('연결 해제', () => {
  it('연결을 해제하면 성공(null)을 돌려준다', async () => {
    const { result } = await renderReady()

    let error: string | null = 'x'
    await act(async () => {
      error = await result.current.disconnect()
    })

    expect(error).toBeNull()
    expect((await mockFetchMyCouple()).data.connectionStatus).toBe('DISCONNECTED')
  })

  it('진행 중인 드라이브가 있으면 먼저 끝내라고 안내한다', async () => {
    const { result } = await renderReady()
    vi.spyOn(couplesApi, 'disconnectCouple').mockRejectedValue(
      new ApiError(409, {
        error: { code: 'ACTIVE_DRIVE_EXISTS', message: 'active', details: [], retryable: false },
        meta: { requestId: 'req', serverTime: '' },
      }),
    )

    let error: string | null = null
    await act(async () => {
      error = await result.current.disconnect()
    })

    expect(error).toBe('진행 중인 드라이브를 먼저 끝낸 뒤 해제해 주세요.')
  })
})
