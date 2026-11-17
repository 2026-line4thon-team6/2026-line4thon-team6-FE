import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockRecordDeletions } from '@/mocks/records'

// USE_MOCK은 모듈을 불러올 때 정해지므로, 백엔드 주소를 넣은 뒤 모듈을 새로 불러온다
async function loadWithBackend() {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/api/v1')
  vi.resetModules()
  return import('./cards')
}

async function loadWithMock() {
  vi.resetModules()
  return import('./cards')
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {}, meta: {} }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  resetMockRecordDeletions()
})

describe('fetchCard', () => {
  it('GET /cards/{cardId} 를 요청한다', async () => {
    const { fetchCard } = await loadWithBackend()

    await fetchCard('crd_01')

    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe('/api/v1/cards/crd_01')
  })

  it('백엔드 주소가 없으면 기록 목록과 같은 내용의 목 카드를 돌려준다', async () => {
    const { fetchCard } = await loadWithMock()

    const { data } = await fetchCard('crd_02')

    expect(data).toMatchObject({ id: 'crd_02', status: 'COMPLETED', canDelete: true })
    expect(data.destination?.name).toBe('시흥 오이도')
    expect(data.photos.length).toBeGreaterThan(0)
  })

  it('목 카드가 없으면 RESOURCE_NOT_FOUND 오류를 던진다', async () => {
    const { fetchCard } = await loadWithMock()

    await expect(fetchCard('crd_none')).rejects.toMatchObject({ status: 404, code: 'RESOURCE_NOT_FOUND' })
  })
})

describe('deleteCard', () => {
  it('커플 id와 카드 버전을 헤더에 담아 DELETE /cards/{cardId} 를 요청한다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { deleteCard } = await loadWithBackend()

    await deleteCard({ id: 'crd_01', coupleId: 'cpl_01', version: 3 })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/api/v1/cards/crd_01')
    expect(init.method).toBe('DELETE')
    const headers = new Headers(init.headers)
    expect(headers.get('X-Couple-Id')).toBe('cpl_01')
    expect(headers.get('X-Expected-Version')).toBe('3')
  })

  it('목 서버에서 지우면 기록 목록에서도 빠진다', async () => {
    const { deleteCard } = await loadWithMock()
    const { fetchRecords } = await import('./records')

    await deleteCard({ id: 'crd_02', coupleId: 'cpl_mock', version: 1 })

    const { data } = await fetchRecords()
    expect(data.totalCount).toBe(11)
    expect(data.items.some((item) => item.cardId === 'crd_02')).toBe(false)
  })
})

describe('discardCard', () => {
  it('커플 id · 요청 키를 헤더에, 카드 버전을 본문에 담아 POST /cards/{cardId}/discard 를 요청한다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { discardCard } = await loadWithBackend()

    await discardCard({ id: 'crd_01', coupleId: 'cpl_01', version: 2 }, 'key_discard_0000001')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/api/v1/cards/crd_01/discard')
    expect(init.method).toBe('POST')
    const headers = new Headers(init.headers)
    expect(headers.get('X-Couple-Id')).toBe('cpl_01')
    expect(headers.get('Idempotency-Key')).toBe('key_discard_0000001')
    expect(JSON.parse(String(init.body))).toEqual({ expectedVersion: 2 })
  })
})

describe('fetchCardShare', () => {
  it('GET /cards/{cardId}/share 를 요청한다', async () => {
    const { fetchCardShare } = await loadWithBackend()

    await fetchCardShare('crd_01')

    expect(new URL(fetchMock.mock.calls[0][0] as string).pathname).toBe('/api/v1/cards/crd_01/share')
  })

  it('백엔드 주소가 없으면 커플 전용 목 링크를 돌려준다', async () => {
    const { fetchCardShare } = await loadWithMock()

    const { data } = await fetchCardShare('crd_01')

    expect(data).toEqual({ url: 'https://bunbungus.app/cards/crd_01', access: 'COUPLE_ONLY', expiresAt: null })
  })
})

describe('uploadCardPhoto', () => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const ticket = {
    mediaId: 'med_01',
    uploadUrl: 'https://api.test/api/v1/media/med_01/content?token=t',
    method: 'PUT',
    requiredHeaders: { 'Content-Type': 'image/jpeg' },
    expiresAt: '',
    maxBytes: 10485760,
  }

  it('파일 이름이 200자를 넘으면 확장자를 살려 200자로 줄여 보낸다 (서버 제한)', async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, { data: ticket, meta: {} }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json(200, { data: { id: 'med_01', status: 'READY' }, meta: {} }))
    const { uploadCardPhoto } = await loadWithBackend()

    await uploadCardPhoto(new File(['abc'], `${'가'.repeat(250)}.jpeg`, { type: 'image/jpeg' }), {
      coupleId: 'cpl_01',
      idempotencyKey: 'upload-key-0000001',
    })

    const { fileName } = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)) as { fileName: string }
    expect(fileName).toHaveLength(200)
    expect(fileName.endsWith('.jpeg')).toBe(true)
  })

  it('업로드 주소로 올린 뒤 파일 해시로 업로드 완료를 알려야 카드에 붙일 수 있는 mediaId를 돌려준다', async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, { data: ticket, meta: {} }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json(200, { data: { id: 'med_01', status: 'READY' }, meta: {} }))
    const { uploadCardPhoto } = await loadWithBackend()

    const mediaId = await uploadCardPhoto(new File(['abc'], 'a.jpg', { type: 'image/jpeg' }), {
      coupleId: 'cpl_01',
      idempotencyKey: 'upload-key-0000001',
    })

    expect(mediaId).toBe('med_01')
    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(putUrl).toBe(ticket.uploadUrl)
    expect(new Headers(putInit.headers).get('Authorization')).toBeNull()

    const [completeUrl, completeInit] = fetchMock.mock.calls[2] as [string, RequestInit]
    expect(new URL(completeUrl).pathname).toBe('/api/v1/media/med_01/complete')
    expect(completeInit.method).toBe('POST')
    const headers = new Headers(completeInit.headers)
    expect(headers.get('X-Couple-Id')).toBe('cpl_01')
    expect(headers.get('Idempotency-Key')).not.toBe('upload-key-0000001')
    // 'abc'의 SHA-256 (소문자 16진수)
    expect(JSON.parse(String(completeInit.body))).toEqual({
      sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    })
  })

  it('파일을 올리다 실패하면 서버가 준 오류 코드를 담아 던지고 완료 요청은 보내지 않는다', async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, { data: ticket, meta: {} }))
      .mockResolvedValueOnce(json(413, { error: { code: 'FILE_TOO_LARGE', message: '너무 커요', details: [], retryable: false }, meta: {} }))
    const { uploadCardPhoto } = await loadWithBackend()

    await expect(
      uploadCardPhoto(new File(['abc'], 'a.jpg', { type: 'image/jpeg' }), { coupleId: 'cpl_01', idempotencyKey: 'upload-key-0000001' }),
    ).rejects.toMatchObject({ status: 413, code: 'FILE_TOO_LARGE' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('discardUploadedPhoto', () => {
  it('카드에 붙이지 못한 사진을 커플 id와 함께 DELETE /media/{mediaId} 로 지운다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { discardUploadedPhoto } = await loadWithBackend()

    await discardUploadedPhoto('med_01', { coupleId: 'cpl_01' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/api/v1/media/med_01')
    expect(init.method).toBe('DELETE')
    expect(new Headers(init.headers).get('X-Couple-Id')).toBe('cpl_01')
  })
})
