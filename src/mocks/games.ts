import type { ApiResponse } from '@/types/api'
import type { GameQuestion, GameResponse, GameResponseInput, GameSession, GameType } from '@/types/game'
import type { Job } from '@/types/job'
import { MOCK_ME_ID } from './cards'
import { mockStartJob } from './jobs'
import { createMeta, mockApiError } from './utils'

const BALANCE: [prompt: string, optionA: string, optionB: string][] = [
  ['드라이브 중 하나만 가능하다면?', '음악 없이\n드라이브 3시간', '대화 없이\n드라이브 3시간'],
  ['휴게소에서 하나만 먹는다면?', '호두과자', '알감자'],
  ['여행지를 고른다면?', '일출 보러\n동해 바다', '노을 보러\n서해 바다'],
  ['드라이브 날씨를 고른다면?', '창문 열고\n맑은 날', '빗소리 듣는\n비 오는 날'],
  ['길을 잃었다면?', '내비 끄고\n그냥 달리기', '바로 다시\n경로 찾기'],
]

interface Entry {
  session: GameSession
  questions: GameQuestion[]
  index: number
}

const sessions = new Map<string, Entry>()
let count = 0

export function resetMockGames() {
  sessions.clear()
  count = 0
}

const toQuestions = (gameId: string): GameQuestion[] =>
  BALANCE.map(([prompt, optionA, optionB], index) => ({
    id: `${gameId}_q${index + 1}`,
    number: index + 1,
    prompt,
    optionA,
    optionB,
    hint: null,
    answer: null,
    hintRevealed: false,
    answerRevealed: false,
  }))

function find(gameSessionId: string) {
  const entry = sessions.get(gameSessionId)
  if (!entry) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '게임을 찾을 수 없어요.')
  return entry
}

function checkActive(entry: Entry, expectedVersion: number) {
  if (entry.session.status !== 'ACTIVE') throw mockApiError(409, 'GAME_NOT_ACTIVE', '진행 중인 게임이 아니에요.')
  if (entry.session.version !== expectedVersion) {
    throw mockApiError(409, 'VERSION_CONFLICT', '다른 기기에서 게임이 진행됐어요.')
  }
}

const respond = (session: GameSession): Promise<ApiResponse<GameSession>> =>
  Promise.resolve({ data: structuredClone(session), meta: createMeta() })

export async function mockCreateGameSession({ driveId, type }: { driveId: string; type: GameType }): Promise<ApiResponse<Job>> {
  if (type !== 'BALANCE') throw mockApiError(422, 'GAME_TYPE_UNSUPPORTED', '아직 준비 중인 게임이에요.')
  const job = mockStartJob('GAME_GENERATION', 'GAME_SESSION', () => {
    const id = `game_mock_${++count}`
    const questions = toQuestions(id)
    sessions.set(id, {
      questions,
      index: 0,
      session: {
        id,
        driveId,
        type,
        status: 'ACTIVE',
        questionCount: questions.length,
        currentQuestion: questions[0],
        responses: [],
        version: 1,
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    })
    return id
  })
  return { data: job, meta: createMeta() }
}

export async function mockGetGameSession(gameSessionId: string): Promise<ApiResponse<GameSession>> {
  return respond(find(gameSessionId).session)
}

export async function mockSaveGameResponse(
  gameSessionId: string,
  questionId: string,
  body: GameResponseInput,
): Promise<ApiResponse<GameResponse>> {
  const entry = find(gameSessionId)
  const { session } = entry
  if (session.currentQuestion?.id !== questionId) throw mockApiError(409, 'QUESTION_NOT_CURRENT', '지금 문항이 아니에요.')
  if (body.type !== session.type) throw mockApiError(422, 'GAME_ACTION_UNSUPPORTED', '이 게임에서 할 수 없는 응답이에요.')

  const response: GameResponse = {
    authorUserId: MOCK_ME_ID,
    choice: body.type === 'BALANCE' ? body.choice : null,
    selectedRole: body.type === 'MEMORY' ? body.selectedRole : null,
    updatedAt: new Date().toISOString(),
  }
  session.responses = [...session.responses.filter(({ authorUserId }) => authorUserId !== MOCK_ME_ID), response]
  return { data: structuredClone(response), meta: createMeta() }
}

export async function mockNextGameQuestion(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  const entry = find(gameSessionId)
  checkActive(entry, expectedVersion)
  const { session } = entry
  if (session.responses.length === 0) throw mockApiError(422, 'GAME_RESPONSE_REQUIRED', '한 명 이상 골라야 넘어갈 수 있어요.')
  if (entry.index >= entry.questions.length - 1) throw mockApiError(422, 'GAME_LAST_QUESTION', '마지막 문항이에요.')

  entry.index += 1
  Object.assign(session, { currentQuestion: entry.questions[entry.index], responses: [], version: session.version + 1 })
  return respond(session)
}

export async function mockCompleteGameSession(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  const entry = find(gameSessionId)
  checkActive(entry, expectedVersion)
  if (entry.index < entry.questions.length - 1) throw mockApiError(422, 'GAME_NOT_FINISHED', '아직 남은 문항이 있어요.')
  if (entry.session.responses.length === 0) throw mockApiError(422, 'GAME_RESPONSE_REQUIRED', '한 명 이상 골라야 끝낼 수 있어요.')

  Object.assign(entry.session, { status: 'COMPLETED', completedAt: new Date().toISOString(), version: entry.session.version + 1 })
  return respond(entry.session)
}

export async function mockAbandonGameSession(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  const entry = find(gameSessionId)
  checkActive(entry, expectedVersion)
  Object.assign(entry.session, { status: 'ABANDONED', version: entry.session.version + 1 })
  return respond(entry.session)
}
