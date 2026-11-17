import type { Me } from '@/types/me'

export type CharacterGender = 'MALE' | 'FEMALE'

// 소감 칸 캐릭터는 가입 때 고른 성별을 따른다 (운전자 · 동승자 구분 없음).
// 서버가 연인의 성별은 주지 않아 내 성별의 반대로 보고, 성별을 고르지 않았으면 두 칸이 겹치지 않게 나눈다
// TODO: 커플 멤버 · 소감 작성자에 gender가 오면 연인 성별을 그대로 쓴다
export function reflectionCharacters(myGender: Me['gender']): { mine: CharacterGender; partner: CharacterGender } {
  return myGender === 'FEMALE' ? { mine: 'FEMALE', partner: 'MALE' } : { mine: 'MALE', partner: 'FEMALE' }
}
