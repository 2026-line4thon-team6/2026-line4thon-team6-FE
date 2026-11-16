import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as couplesApi from '@/api/couples'
import { ApiError } from '@/api/client'
import { mockFetchMyCouple, mockRenameMascot, resetMockCouple } from '@/mocks/couples'
import type { UpdateMeRequest } from '@/types/me'
import useCouplePage from './useCouplePage'

const apiError = (status: number, code: string) =>
  new ApiError(status, {
    error: { code, message: code, details: [], retryable: false },
    meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
  })

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
  it('커플 정보 · 내 계정을 함께 불러온다 (연결하면 내 코드는 소진돼 조회하지 않는다)', async () => {
    const fetchInvite = vi.spyOn(couplesApi, 'fetchMyInvite')
    const { result } = await renderReady()

    expect(result.current.status).toBe('ready')
    expect(result.current.couple?.startDate).toBe('2026-10-20')
    expect(result.current.me?.id).toBe('usr_minjun')
    expect(fetchInvite).not.toHaveBeenCalled()
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

  it('바꿀 값이 없는 빈 요청(PATCH /me {} → 422)은 타입에서 막는다', () => {
    // @ts-expect-error 닉네임 · 생년월일 중 하나는 있어야 한다
    const empty: UpdateMeRequest = {}
    const onlyBirthDate: UpdateMeRequest = { birthDate: null }

    expect([empty, onlyBirthDate]).toHaveLength(2)
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

describe('커플 연결이 바뀐 뒤의 수정 (403)', () => {
  const disconnected = {
    data: { couple: null, connectionStatus: 'DISCONNECTED' as const },
    meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
  }

  it.each(['COUPLE_CONTEXT_CHANGED', 'COUPLE_REQUIRED'])(
    '%s면 커플 정보를 다시 불러오고, 연결이 끊겼으면 unlinked로 바꾼다',
    async (code) => {
      const { result } = await renderReady()
      vi.spyOn(couplesApi, 'renameMascot').mockRejectedValue(apiError(403, code))
      vi.spyOn(couplesApi, 'fetchMyCouple').mockResolvedValue(disconnected)

      let error: string | null = null
      await act(async () => {
        error = await result.current.renameMascot('씽씽이')
      })

      expect(error).toBe('커플 연결 상태가 바뀌었어요. 새로 불러온 정보를 확인해 주세요.')
      expect(result.current.status).toBe('unlinked')
      expect(result.current.couple).toBeNull()
    },
  )

  it('다른 커플로 바뀌었으면 새 커플 정보로 바꾼다', async () => {
    const { result } = await renderReady()
    const { data } = await mockFetchMyCouple()
    const other = { ...data.couple!, id: 'cpl_other', mascotName: '새붕이' }
    vi.spyOn(couplesApi, 'updateCoupleStartDate').mockRejectedValue(apiError(403, 'COUPLE_CONTEXT_CHANGED'))
    vi.spyOn(couplesApi, 'fetchMyCouple').mockResolvedValue({
      data: { couple: other, connectionStatus: 'CONNECTED' },
      meta: { requestId: 'req', serverTime: '2026-11-13T00:00:00Z' },
    })

    await act(async () => {
      await result.current.changeStartDate('2026-10-01')
    })

    expect(result.current.status).toBe('ready')
    expect(result.current.couple?.id).toBe('cpl_other')
  })

  it('연결 해제 중 이미 연결이 끊겼으면(COUPLE_REQUIRED) 다시 불러와 unlinked로 바꾼다', async () => {
    const { result } = await renderReady()
    vi.spyOn(couplesApi, 'disconnectCouple').mockRejectedValue(apiError(403, 'COUPLE_REQUIRED'))
    vi.spyOn(couplesApi, 'fetchMyCouple').mockResolvedValue(disconnected)

    let error: string | null = null
    await act(async () => {
      error = await result.current.disconnect()
    })

    expect(error).toBe('커플 연결 상태가 바뀌었어요. 새로 불러온 정보를 확인해 주세요.')
    expect(result.current.status).toBe('unlinked')
  })

  it('시작일이 미래면(422 INVALID_START_DATE) 날짜를 다시 고르라고 안내한다', async () => {
    const { result } = await renderReady()
    vi.spyOn(couplesApi, 'updateCoupleStartDate').mockRejectedValue(apiError(422, 'INVALID_START_DATE'))

    let error: string | null = null
    await act(async () => {
      error = await result.current.changeStartDate('2999-01-01')
    })

    expect(error).toBe('오늘 이후 날짜는 고를 수 없어요.')
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
