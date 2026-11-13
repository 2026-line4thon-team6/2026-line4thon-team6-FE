import { ApiError } from '@/api/client'
import type { ApiMeta, ApiResponse } from '@/types/api'
import type { Couple, CoupleConnection, CoupleInvite } from '@/types/couple'
import type { Me, UpdateMeRequest } from '@/types/me'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 커플 · 내 정보 목 서버. 홈 목 데이터(민준 · 민지, D+23)와 맞춘다.
// API 명세 규칙(이름 1~20자, 미래 날짜 불가, 버전 충돌)을 같이 흉내 낸다
const MAX_NAME = 20

let requestCount = 0
const meta = (): ApiMeta => ({ requestId: `req_mock_couple_${++requestCount}`, serverTime: new Date().toISOString() })

const fail = (status: number, code: string, message: string) =>
  new ApiError(status, { error: { code, message, details: [], retryable: false }, meta: meta() })

export const MOCK_ME: Me = {
  id: 'usr_minjun',
  nickname: '민준',
  birthDate: '2003-05-06',
  profileImageUrl: null,
  provider: 'KAKAO',
  onboardingCompleted: true,
  gender: null,
}

export const MOCK_COUPLE: CoupleConnection = {
  connectionStatus: 'CONNECTED',
  couple: {
    id: 'cpl_01',
    status: 'CONNECTED',
    members: [
      { id: 'usr_minjun', nickname: '민준', birthDate: '2003-05-06', profileImageUrl: null, provider: 'KAKAO' },
      { id: 'usr_minji', nickname: '민지', birthDate: '2003-05-06', profileImageUrl: null, provider: 'KAKAO' },
    ],
    startDate: '2026-10-20',
    daysTogether: 23,
    cumulativeDistanceMeters: 330000,
    completedCardCount: 12,
    version: 1,
    mascotName: '붕붕이',
  },
}

const MOCK_INVITE: CoupleInvite = {
  inviteId: 'inv_01',
  code: 'jsd82nk9',
  expiresAt: '2026-11-14T00:00:00Z',
  status: 'CONSUMED',
}

let connection: CoupleConnection = structuredClone(MOCK_COUPLE)
let me: Me = structuredClone(MOCK_ME)

// 테스트 · 스토리에서 처음 상태로 되돌린다
export function resetMockCouple() {
  connection = structuredClone(MOCK_COUPLE)
  me = structuredClone(MOCK_ME)
}

// 'YYYY-MM-DD'를 기기 날짜(한국 시간) 기준 자정으로 읽는다
function toLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// 실제로 있는 날짜이고 오늘 이전인지
function isValidPastDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [year, month, day] = date.split('-').map(Number)
  const value = toLocalDate(date)
  const real = value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === day
  return real && value.getTime() <= startOfToday().getTime()
}

// 시작일 당일이 1일
function countDays(startDate: string) {
  return Math.round((startOfToday().getTime() - toLocalDate(startDate).getTime()) / 86_400_000) + 1
}

function getCouple(): Couple {
  if (!connection.couple) throw fail(404, 'COUPLE_NOT_FOUND', '연결된 커플이 없어요.')
  return connection.couple
}

function checkVersion(expected: number, actual: number) {
  if (expected !== actual) throw fail(409, 'VERSION_CONFLICT', '연인이 먼저 정보를 바꿨어요.')
}

function saveCouple(next: Couple): ApiResponse<Couple> {
  connection = { connectionStatus: 'CONNECTED', couple: next }
  return { data: structuredClone(next), meta: meta() }
}

export async function mockFetchMyCouple(): Promise<ApiResponse<CoupleConnection>> {
  return { data: structuredClone(connection), meta: meta() }
}

export async function mockFetchMe(): Promise<ApiResponse<Me>> {
  return { data: structuredClone(me), meta: meta() }
}

export async function mockFetchMyInvite(): Promise<ApiResponse<CoupleInvite>> {
  return { data: { ...MOCK_INVITE }, meta: meta() }
}

export async function mockUpdateStartDate(body: { startDate: string; expectedVersion: number }): Promise<ApiResponse<Couple>> {
  const couple = getCouple()
  checkVersion(body.expectedVersion, couple.version)
  if (!isValidPastDate(body.startDate)) throw fail(422, 'VALIDATION_FAILED', '오늘 이후 날짜는 고를 수 없어요.')

  return saveCouple({
    ...couple,
    startDate: body.startDate,
    daysTogether: countDays(body.startDate),
    version: couple.version + 1,
  })
}

export async function mockRenameMascot(body: { name: string; expectedVersion: number }): Promise<ApiResponse<Couple>> {
  const couple = getCouple()
  checkVersion(body.expectedVersion, couple.version)
  const name = body.name.trim()
  if (!name || name.length > MAX_NAME) throw fail(422, 'VALIDATION_FAILED', '붕붕이명은 1~20자로 입력해 주세요.')

  return saveCouple({ ...couple, mascotName: name, version: couple.version + 1 })
}

export async function mockUpdateMe(body: UpdateMeRequest): Promise<ApiResponse<Me>> {
  const next = { ...me }
  if (body.nickname !== undefined) {
    const nickname = body.nickname.trim()
    if (!nickname || nickname.length > MAX_NAME) throw fail(422, 'VALIDATION_FAILED', '닉네임은 1~20자로 입력해 주세요.')
    next.nickname = nickname
  }
  if (body.birthDate !== undefined) {
    if (body.birthDate !== null && !isValidPastDate(body.birthDate)) {
      throw fail(422, 'VALIDATION_FAILED', '생년월일을 다시 확인해 주세요.')
    }
    next.birthDate = body.birthDate
  }
  me = next

  // 다음 조회부터 커플 멤버 정보에도 반영된다
  if (connection.couple) {
    connection = {
      ...connection,
      couple: {
        ...connection.couple,
        members: connection.couple.members.map((member) =>
          member.id === me.id ? { ...member, nickname: me.nickname, birthDate: me.birthDate } : member,
        ),
      },
    }
  }
  return { data: structuredClone(me), meta: meta() }
}

export async function mockDisconnectCouple(): Promise<void> {
  getCouple()
  connection = { couple: null, connectionStatus: 'DISCONNECTED' }
}
