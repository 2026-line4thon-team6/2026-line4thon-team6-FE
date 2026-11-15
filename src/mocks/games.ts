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

const NONSENSE: [prompt: string, answer: string][] = [
  ['세상에서 가장 추운 바다는?', '썰렁해'],
  ['왕이 넘어지면?', '킹콩'],
  ['세상에서 가장 가난한 왕은?', '최저임금'],
  ['차가 웃으면?', '카카오'],
  ['소가 웃으면?', '우하하'],
]

const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const toInitials = (word: string) =>
  [...word]
    .map((char) => {
      const code = char.charCodeAt(0) - 0xac00
      return code >= 0 && code < 11172 ? INITIALS[Math.floor(code / 588)] : char
    })
    .join('')

interface Secret {
  hint: string | null
  answer: string | null
}

interface Entry {
  session: GameSession
  questions: GameQuestion[]
  secrets: Secret[]
  index: number
}

const sessions = new Map<string, Entry>()
let count = 0

export function resetMockGames() {
  sessions.clear()
  count = 0
}

function build(gameId: string, type: GameType): Pick<Entry, 'questions' | 'secrets'> {
  const rows =
    type === 'BALANCE'
      ? BALANCE.map(([prompt, optionA, optionB]) => ({ prompt, optionA, optionB, hint: null, answer: null }))
      : NONSENSE.map(([prompt, answer]) => ({ prompt, optionA: null, optionB: null, hint: toInitials(answer), answer }))
  return {
    questions: rows.map(({ prompt, optionA, optionB, answer }, index) => ({
      id: `${gameId}_q${index + 1}`,
      number: index + 1,
      prompt,
      optionA,
      optionB,
      hint: null,
      answer: null,
      answerLength: answer ? [...answer].length : null,
      hintRevealed: false,
      answerRevealed: false,
    })),
    secrets: rows.map(({ hint, answer }) => ({ hint, answer })),
  }
}

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

function checkCanMove(entry: Entry) {
  const { session } = entry
  if (session.type === 'BALANCE' && session.responses.length === 0) {
    throw mockApiError(422, 'GAME_RESPONSE_REQUIRED', '한 명 이상 골라야 넘어갈 수 있어요.')
  }
  if (session.type === 'NONSENSE' && !session.currentQuestion?.answerRevealed) {
    throw mockApiError(422, 'GAME_ANSWER_REQUIRED', '정답을 보고 넘어갈 수 있어요.')
  }
}

function currentNonsense(entry: Entry, questionId: string) {
  const { session } = entry
  if (session.type !== 'NONSENSE') throw mockApiError(422, 'GAME_ACTION_UNSUPPORTED', '넌센스 퀴즈에서만 할 수 있어요.')
  if (session.currentQuestion?.id !== questionId) throw mockApiError(409, 'QUESTION_NOT_CURRENT', '지금 문항이 아니에요.')
  return { question: session.currentQuestion, secret: entry.secrets[entry.index] }
}

const respond = (session: GameSession): Promise<ApiResponse<GameSession>> =>
  Promise.resolve({ data: structuredClone(session), meta: createMeta() })

export async function mockCreateGameSession({ driveId, type }: { driveId: string; type: GameType }): Promise<ApiResponse<Job>> {
  if (type === 'MEMORY') throw mockApiError(422, 'GAME_TYPE_UNSUPPORTED', '아직 준비 중인 게임이에요.')
  const job = mockStartJob('GAME_GENERATION', 'GAME_SESSION', () => {
    const id = `game_mock_${++count}`
    const { questions, secrets } = build(id, type)
    sessions.set(id, {
      questions,
      secrets,
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

export async function mockRevealGameHint(gameSessionId: string, questionId: string): Promise<ApiResponse<GameQuestion>> {
  const { question, secret } = currentNonsense(find(gameSessionId), questionId)
  Object.assign(question, { hint: secret.hint, hintRevealed: true })
  return { data: structuredClone(question), meta: createMeta() }
}

export async function mockRevealGameAnswer(gameSessionId: string, questionId: string): Promise<ApiResponse<GameQuestion>> {
  const { question, secret } = currentNonsense(find(gameSessionId), questionId)
  Object.assign(question, { answer: secret.answer, answerRevealed: true })
  return { data: structuredClone(question), meta: createMeta() }
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
  checkCanMove(entry)
  if (entry.index >= entry.questions.length - 1) throw mockApiError(422, 'GAME_LAST_QUESTION', '마지막 문항이에요.')

  entry.index += 1
  const { session } = entry
  Object.assign(session, { currentQuestion: entry.questions[entry.index], responses: [], version: session.version + 1 })
  return respond(session)
}

export async function mockCompleteGameSession(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  const entry = find(gameSessionId)
  checkActive(entry, expectedVersion)
  if (entry.index < entry.questions.length - 1) throw mockApiError(422, 'GAME_NOT_FINISHED', '아직 남은 문항이 있어요.')
  checkCanMove(entry)

  Object.assign(entry.session, { status: 'COMPLETED', completedAt: new Date().toISOString(), version: entry.session.version + 1 })
  return respond(entry.session)
}

export async function mockAbandonGameSession(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  const entry = find(gameSessionId)
  checkActive(entry, expectedVersion)
  Object.assign(entry.session, { status: 'ABANDONED', version: entry.session.version + 1 })
  return respond(entry.session)
}
