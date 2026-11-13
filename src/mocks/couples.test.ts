import { beforeEach, describe, expect, it } from 'vitest'
import {
  MOCK_PARTNER_INVITE_CODE,
  mockCreateInvite,
  mockDisconnectCouple,
  mockFetchMe,
  mockFetchMyCouple,
  mockFetchMyInvite,
  mockJoinCouple,
  mockRenameMascot,
  mockUpdateMe,
  mockUpdateStartDate,
  resetMockCouple,
} from './couples'

// API 명세(PATCH /couples/me · /couples/me/mascot-name · /me, DELETE /couples/me) 규칙을 목 서버가 지키는지 확인한다
async function loadCouple() {
  const { data } = await mockFetchMyCouple()
  if (!data.couple) throw new Error('연결된 커플이 없어요')
  return data.couple
}

beforeEach(() => {
  resetMockCouple()
})

describe('커플 시작일 변경', () => {
  it('시작일을 바꾸면 함께한 일수를 다시 계산하고 버전이 오른다', async () => {
    const couple = await loadCouple()
    const today = new Date()
    const tenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 9)
    const startDate = `${tenDaysAgo.getFullYear()}-${String(tenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(tenDaysAgo.getDate()).padStart(2, '0')}`

    const { data } = await mockUpdateStartDate({ startDate, expectedVersion: couple.version })

    expect(data.startDate).toBe(startDate)
    expect(data.daysTogether).toBe(10)
    expect(data.version).toBe(couple.version + 1)
  })

  it('미래 날짜는 422, 버전이 다르면 409', async () => {
    const couple = await loadCouple()

    await expect(mockUpdateStartDate({ startDate: '2999-01-01', expectedVersion: couple.version })).rejects.toMatchObject({
      status: 422,
    })
    await expect(mockUpdateStartDate({ startDate: '2026-01-01', expectedVersion: 99 })).rejects.toMatchObject({
      status: 409,
      code: 'VERSION_CONFLICT',
    })
  })
})

describe('붕붕이명 변경', () => {
  it('앞뒤 공백을 지운 1~20자 이름으로 바꾼다', async () => {
    const couple = await loadCouple()

    const { data } = await mockRenameMascot({ name: '  씽씽이  ', expectedVersion: couple.version })

    expect(data.mascotName).toBe('씽씽이')
  })

  it('비었거나 20자를 넘으면 422', async () => {
    const couple = await loadCouple()

    await expect(mockRenameMascot({ name: '   ', expectedVersion: couple.version })).rejects.toMatchObject({ status: 422 })
    await expect(mockRenameMascot({ name: '가'.repeat(21), expectedVersion: couple.version })).rejects.toMatchObject({
      status: 422,
    })
  })
})

describe('내 정보 수정', () => {
  it('닉네임 · 생년월일을 바꾸면 커플 멤버 정보에도 반영된다', async () => {
    const { data: me } = await mockUpdateMe({ nickname: '준이', birthDate: '2002-01-02' })

    expect(me).toMatchObject({ nickname: '준이', birthDate: '2002-01-02' })
    const couple = await loadCouple()
    expect(couple.members.find((member) => member.id === me.id)).toMatchObject({ nickname: '준이', birthDate: '2002-01-02' })
  })

  it('빈 닉네임 · 미래 생년월일은 422', async () => {
    await expect(mockUpdateMe({ nickname: ' ' })).rejects.toMatchObject({ status: 422 })
    await expect(mockUpdateMe({ birthDate: '2999-01-01' })).rejects.toMatchObject({ status: 422 })
  })

  it('내 계정을 조회한다', async () => {
    const { data } = await mockFetchMe()

    expect(data).toMatchObject({ id: 'usr_minjun', nickname: '민준' })
  })
})

describe('커플 코드 · 연결 해제', () => {
  it('내 커플 코드를 조회한다', async () => {
    const { data } = await mockFetchMyInvite()

    expect(data.code).toBe('jsd82nk9')
  })

  it('연결을 해제하면 커플 조회가 DISCONNECTED가 된다', async () => {
    await mockDisconnectCouple()

    const { data } = await mockFetchMyCouple()
    expect(data).toEqual({ couple: null, connectionStatus: 'DISCONNECTED' })
  })
})

describe('연인 초대 코드 발급 · 코드로 연결', () => {
  // 연결을 끊어 미연결 상태로 만든다
  async function unlink() {
    await mockDisconnectCouple()
  }

  it('미연결이면 내 코드가 없어 404, 발급하면 24시간 유효한 코드가 생기고 다시 발급해도 같은 코드', async () => {
    await unlink()
    await expect(mockFetchMyInvite()).rejects.toMatchObject({ status: 404, code: 'INVITE_NOT_FOUND' })

    const { data: created } = await mockCreateInvite()
    expect(created.status).toBe('ACTIVE')
    expect(Date.parse(created.expiresAt) - Date.now()).toBeGreaterThan(23 * 3600_000)

    const { data: again } = await mockCreateInvite()
    const { data: fetched } = await mockFetchMyInvite()
    expect(again.code).toBe(created.code)
    expect(fetched.code).toBe(created.code)
  })

  it('이미 연결돼 있으면 발급 · 연결 모두 409 ALREADY_COUPLED', async () => {
    await expect(mockCreateInvite()).rejects.toMatchObject({ status: 409, code: 'ALREADY_COUPLED' })
    await expect(mockJoinCouple({ code: MOCK_PARTNER_INVITE_CODE })).rejects.toMatchObject({
      status: 409,
      code: 'ALREADY_COUPLED',
    })
  })

  it('연인 코드로 연결하면 시작일은 오늘(D+1), 이름은 붕붕이로 연결된다 (앞뒤 공백 · 대소문자 무시)', async () => {
    await unlink()

    const { data } = await mockJoinCouple({ code: `  ${MOCK_PARTNER_INVITE_CODE.toUpperCase()} ` })

    expect(data).toMatchObject({ status: 'CONNECTED', daysTogether: 1, mascotName: '붕붕이' })
    const { data: connection } = await mockFetchMyCouple()
    expect(connection.connectionStatus).toBe('CONNECTED')
    expect(connection.couple?.members.map((member) => member.nickname)).toEqual(['민준', '민지'])
  })

  it('없는 코드는 422 INVALID_INVITE, 내 코드는 422 SELF_INVITE, 빈 코드는 422 VALIDATION_FAILED', async () => {
    await unlink()
    const { data: mine } = await mockCreateInvite()

    await expect(mockJoinCouple({ code: 'nope1234' })).rejects.toMatchObject({ status: 422, code: 'INVALID_INVITE' })
    await expect(mockJoinCouple({ code: mine.code })).rejects.toMatchObject({ status: 422, code: 'SELF_INVITE' })
    await expect(mockJoinCouple({ code: '   ' })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' })
  })
})
