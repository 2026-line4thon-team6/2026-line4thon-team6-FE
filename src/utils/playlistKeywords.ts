export interface Keyword {
  code: string
  emoji: string
  label: string
}

// 서버(GET /app-config)는 코드만 준다. 순서와 이모지 · 이름은 Figma DJ플리 화면 기준
const MOODS: Keyword[] = [
  { code: 'EXCITING', emoji: '😆', label: '신나는' },
  { code: 'EMOTIONAL', emoji: '🌙', label: '감성적인' },
  { code: 'CALM', emoji: '🌿', label: '차분한' },
  { code: 'TRAVEL', emoji: '✈️', label: '여행' },
  { code: 'FLUTTER', emoji: '💖', label: '설레는' },
  { code: 'SUNSET', emoji: '🌅', label: '노을 감성' },
  { code: 'CITY_NIGHT', emoji: '🌃', label: '도시 야경' },
  { code: 'ROMANTIC', emoji: '☁️', label: '낭만' },
  // TODO: Figma '🔥 졸음 깨우는'은 백엔드 코드가 없다 — 백엔드 확인 필요
]

const WEATHERS: Keyword[] = [
  { code: 'SUNNY', emoji: '🌞', label: '맑음' },
  { code: 'CLOUDY', emoji: '🌫️', label: '흐림' },
  { code: 'RAIN', emoji: '🌧️', label: '비' },
  { code: 'SNOW', emoji: '❄️', label: '눈' },
  { code: 'WINDY', emoji: '💨', label: '바람' },
]

const GENRES: Keyword[] = [
  { code: 'BALLAD', emoji: '🎧', label: '발라드' },
  { code: 'K_POP', emoji: '🎤', label: 'K-POP' },
  { code: 'INDIE', emoji: '🎸', label: '인디' },
  { code: 'POP', emoji: '🎷', label: '팝' },
  { code: 'CITY_POP', emoji: '💿', label: '시티팝' },
  { code: 'JAZZ', emoji: '🎹', label: '재즈' },
  { code: 'RNB', emoji: '🎵', label: 'R&B' },
  { code: 'HIP_HOP', emoji: '👩🏻‍🎤', label: '힙합' },
  { code: 'ACOUSTIC', emoji: '🪇', label: '어쿠스틱' },
  { code: 'DANCE', emoji: '💃🏻', label: '댄스' },
  { code: 'OST', emoji: '🎬', label: 'OST' },
  { code: 'ROCK', emoji: '🥁', label: '밴드' },
]

const ALL = [...MOODS, ...WEATHERS, ...GENRES]

export const keywordOf = (code: string): Keyword =>
  ALL.find((keyword) => keyword.code === code) ?? { code, emoji: '', label: code }

// 서버가 준 코드만, Figma 순서대로. 모르는 코드는 뒤에 붙인다
function arrange(known: Keyword[], codes: string[]) {
  const ordered = known.filter((keyword) => codes.includes(keyword.code))
  const extra = codes.filter((code) => !known.some((keyword) => keyword.code === code)).map(keywordOf)
  return [...ordered, ...extra]
}

export const arrangeMoods = (codes: string[]) => arrange(MOODS, codes)
export const arrangeWeathers = (codes: string[]) => arrange(WEATHERS, codes)
export const arrangeGenres = (codes: string[]) => arrange(GENRES, codes)
