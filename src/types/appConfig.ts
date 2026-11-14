// GET /app-config 중 DJ 플레이리스트 취향 선택에 쓰는 값
export interface AppConfig {
  moods: string[]
  weatherOptions: string[]
  genres: string[]
  limits: { moodMaxCount: number; genreMaxCount: number }
}
