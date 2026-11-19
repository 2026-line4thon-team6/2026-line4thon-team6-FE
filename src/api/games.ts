import {
  mockAbandonGameSession,
  mockCompleteGameSession,
  mockCreateGameSession,
  mockGetGameSession,
  mockNextGameQuestion,
  mockRevealGameAnswer,
  mockRevealGameHint,
  mockSaveGameResponse,
} from '@/mocks/games'
import type { ApiResponse } from '@/types/api'
import type { GameQuestion, GameResponse, GameResponseInput, GameSession, GameType } from '@/types/game'
import type { Job } from '@/types/job'
import { apiFetch, isDemoId, USE_MOCK } from './client'
import { contentDriveId } from './drives'

interface GameRequestOptions {
  coupleId: string
}

interface IdempotentGameRequestOptions extends GameRequestOptions {
  idempotencyKey: string
}

const writeHeaders = ({ coupleId, idempotencyKey }: GameRequestOptions & { idempotencyKey?: string }) => ({
  'X-Couple-Id': coupleId,
  ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
})

const sessionPath = (gameSessionId: string) => `/game-sessions/${encodeURIComponent(gameSessionId)}`

export function createGameSession(
  body: { driveId: string; type: GameType },
  options: IdempotentGameRequestOptions,
): Promise<ApiResponse<Job>> {
  const driveId = contentDriveId(body.driveId)
  if (USE_MOCK || isDemoId(driveId)) return mockCreateGameSession(body)

  return apiFetch<Job>('/game-sessions', {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify({ ...body, driveId }),
  })
}

export function getGameSession(gameSessionId: string): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK || isDemoId(gameSessionId)) return mockGetGameSession(gameSessionId)

  return apiFetch<GameSession>(sessionPath(gameSessionId))
}

const questionPath = (gameSessionId: string, questionId: string) =>
  `${sessionPath(gameSessionId)}/questions/${encodeURIComponent(questionId)}`

export function revealGameHint(
  gameSessionId: string,
  questionId: string,
  options: IdempotentGameRequestOptions,
): Promise<ApiResponse<GameQuestion>> {
  if (USE_MOCK || isDemoId(gameSessionId)) return mockRevealGameHint(gameSessionId, questionId)

  return apiFetch<GameQuestion>(`${questionPath(gameSessionId, questionId)}/hint`, {
    method: 'POST',
    headers: writeHeaders(options),
  })
}

export function revealGameAnswer(
  gameSessionId: string,
  questionId: string,
  options: IdempotentGameRequestOptions,
): Promise<ApiResponse<GameQuestion>> {
  if (USE_MOCK || isDemoId(gameSessionId)) return mockRevealGameAnswer(gameSessionId, questionId)

  return apiFetch<GameQuestion>(`${questionPath(gameSessionId, questionId)}/answer`, {
    method: 'POST',
    headers: writeHeaders(options),
  })
}

export function saveGameResponse(
  gameSessionId: string,
  questionId: string,
  body: GameResponseInput,
  options: GameRequestOptions,
): Promise<ApiResponse<GameResponse>> {
  if (USE_MOCK || isDemoId(gameSessionId)) return mockSaveGameResponse(gameSessionId, questionId, body)

  return apiFetch<GameResponse>(`${questionPath(gameSessionId, questionId)}/responses/me`, {
    method: 'PUT',
    headers: writeHeaders(options),
    body: JSON.stringify(body),
  })
}

export function nextGameQuestion(
  gameSessionId: string,
  expectedVersion: number,
  options: IdempotentGameRequestOptions,
): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK || isDemoId(gameSessionId)) return mockNextGameQuestion(gameSessionId, expectedVersion)

  return apiFetch<GameSession>(`${sessionPath(gameSessionId)}/next`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify({ expectedVersion }),
  })
}

export function completeGameSession(
  gameSessionId: string,
  expectedVersion: number,
  options: IdempotentGameRequestOptions,
): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK || isDemoId(gameSessionId)) return mockCompleteGameSession(gameSessionId, expectedVersion)

  return apiFetch<GameSession>(`${sessionPath(gameSessionId)}/complete`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify({ expectedVersion }),
  })
}

export function abandonGameSession(
  gameSessionId: string,
  expectedVersion: number,
  options: IdempotentGameRequestOptions,
): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK || isDemoId(gameSessionId)) return mockAbandonGameSession(gameSessionId, expectedVersion)

  return apiFetch<GameSession>(`${sessionPath(gameSessionId)}/abandon`, {
    method: 'POST',
    headers: writeHeaders(options),
    body: JSON.stringify({ expectedVersion }),
  })
}
