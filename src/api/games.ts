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
import { apiFetch, USE_MOCK } from './client'

const sessionPath = (gameSessionId: string) => `/game-sessions/${encodeURIComponent(gameSessionId)}`

export function createGameSession(
  body: { driveId: string; type: GameType },
  idempotencyKey: string,
): Promise<ApiResponse<Job>> {
  if (USE_MOCK) return mockCreateGameSession(body)

  return apiFetch<Job>('/game-sessions', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

export function getGameSession(gameSessionId: string): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK) return mockGetGameSession(gameSessionId)

  return apiFetch<GameSession>(sessionPath(gameSessionId))
}

const questionPath = (gameSessionId: string, questionId: string) =>
  `${sessionPath(gameSessionId)}/questions/${encodeURIComponent(questionId)}`

export function revealGameHint(gameSessionId: string, questionId: string): Promise<ApiResponse<GameQuestion>> {
  if (USE_MOCK) return mockRevealGameHint(gameSessionId, questionId)

  return apiFetch<GameQuestion>(`${questionPath(gameSessionId, questionId)}/hint`, { method: 'POST' })
}

export function revealGameAnswer(gameSessionId: string, questionId: string): Promise<ApiResponse<GameQuestion>> {
  if (USE_MOCK) return mockRevealGameAnswer(gameSessionId, questionId)

  return apiFetch<GameQuestion>(`${questionPath(gameSessionId, questionId)}/answer`, { method: 'POST' })
}

export function saveGameResponse(
  gameSessionId: string,
  questionId: string,
  body: GameResponseInput,
): Promise<ApiResponse<GameResponse>> {
  if (USE_MOCK) return mockSaveGameResponse(gameSessionId, questionId, body)

  return apiFetch<GameResponse>(`${questionPath(gameSessionId, questionId)}/responses/me`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function nextGameQuestion(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK) return mockNextGameQuestion(gameSessionId, expectedVersion)

  return apiFetch<GameSession>(`${sessionPath(gameSessionId)}/next`, {
    method: 'POST',
    body: JSON.stringify({ expectedVersion }),
  })
}

export function completeGameSession(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK) return mockCompleteGameSession(gameSessionId, expectedVersion)

  return apiFetch<GameSession>(`${sessionPath(gameSessionId)}/complete`, {
    method: 'POST',
    body: JSON.stringify({ expectedVersion }),
  })
}

export function abandonGameSession(gameSessionId: string, expectedVersion: number): Promise<ApiResponse<GameSession>> {
  if (USE_MOCK) return mockAbandonGameSession(gameSessionId, expectedVersion)

  return apiFetch<GameSession>(`${sessionPath(gameSessionId)}/abandon`, {
    method: 'POST',
    body: JSON.stringify({ expectedVersion }),
  })
}
