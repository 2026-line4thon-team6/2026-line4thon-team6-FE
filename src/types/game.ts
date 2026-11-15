export type GameType = 'BALANCE' | 'NONSENSE' | 'MEMORY'

export interface GameQuestion {
  id: string
  number: number
  prompt: string
  optionA: string | null
  optionB: string | null
  hint: string | null
  answer: string | null
  hintRevealed: boolean
  answerRevealed: boolean
}

export interface GameResponse {
  authorUserId: string
  choice: 'A' | 'B' | null
  selectedRole: 'DRIVER' | 'PASSENGER' | null
  updatedAt: string
}

// TODO: responses가 현재 문항의 응답만 담는지 백엔드 확인 필요
export interface GameSession {
  id: string
  driveId: string
  type: GameType
  status: 'GENERATING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'FAILED'
  questionCount: number
  currentQuestion: GameQuestion | null
  responses: GameResponse[]
  version: number
  createdAt: string
  completedAt: string | null
}

export type GameResponseInput =
  | { type: 'BALANCE'; choice: 'A' | 'B' }
  | { type: 'MEMORY'; selectedRole: 'DRIVER' | 'PASSENGER' }
