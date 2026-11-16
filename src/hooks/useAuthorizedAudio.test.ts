import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 실서버 모드에서 음성 파일을 토큰을 붙여 받아 blob URL로 재생한다
async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  const client = await import('@/api/client')
  const { default: useAuthorizedAudio } = await import('./useAuthorizedAudio')
  return { ...client, useAuthorizedAudio }
}

const AUDIO_URL = 'https://api.test/api/v1/radio/episodes/rep_1/audio?expires=1&signature=s'
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  URL.createObjectURL = vi.fn(() => 'blob:audio-1')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('useAuthorizedAudio', () => {
  it('Authorization 헤더를 붙여 음성을 받고 blob URL을 돌려준다', async () => {
    fetchMock.mockResolvedValue(new Response('mp3', { status: 200 }))
    const { useAuthorizedAudio, setAccessToken } = await loadWithBackend()
    setAccessToken('access_1')

    const { result, unmount } = renderHook(() => useAuthorizedAudio(AUDIO_URL))

    await waitFor(() => expect(result.current).toBe('blob:audio-1'))
    expect(fetchMock.mock.calls[0][0]).toBe(AUDIO_URL)
    expect(new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers).get('Authorization')).toBe('Bearer access_1')

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audio-1')
  })

  it('받지 못하면 null을 돌려준다 (재생 버튼을 막는다)', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: '', details: [], retryable: false }, meta: {} }), {
        status: 404,
      }),
    )
    const { useAuthorizedAudio, setAccessToken } = await loadWithBackend()
    setAccessToken('access_1')

    const { result } = renderHook(() => useAuthorizedAudio(AUDIO_URL))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(result.current).toBeNull()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('목 모드에서는 받은 주소를 그대로 쓴다', async () => {
    vi.resetModules()
    const { default: useAuthorizedAudio } = await import('./useAuthorizedAudio')

    const { result } = renderHook(() => useAuthorizedAudio('/mocks/radio/sample.mp3'))

    expect(result.current).toBe('/mocks/radio/sample.mp3')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
