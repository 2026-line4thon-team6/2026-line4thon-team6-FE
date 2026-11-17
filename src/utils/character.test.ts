import { describe, expect, it } from 'vitest'
import { reflectionCharacters } from './character'

// 소감 칸 캐릭터는 가입 때 고른 성별을 따른다. 서버가 연인의 성별은 주지 않아 내 성별의 반대로 본다
describe('reflectionCharacters', () => {
  it('내가 남자면 내 칸은 남자, 연인 칸은 여자 캐릭터', () => {
    expect(reflectionCharacters('MALE')).toEqual({ mine: 'MALE', partner: 'FEMALE' })
  })

  it('내가 여자면 내 칸은 여자, 연인 칸은 남자 캐릭터', () => {
    expect(reflectionCharacters('FEMALE')).toEqual({ mine: 'FEMALE', partner: 'MALE' })
  })

  it('성별을 고르지 않았으면 두 칸이 겹치지 않게 내 칸은 남자, 연인 칸은 여자 캐릭터', () => {
    expect(reflectionCharacters(null)).toEqual({ mine: 'MALE', partner: 'FEMALE' })
  })
})
