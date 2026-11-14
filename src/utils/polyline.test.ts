import { describe, expect, it } from 'vitest'
import { encodePolyline } from '@/mocks/utils'
import { decodePolyline } from './polyline'

describe('decodePolyline', () => {
  it('Google 예시 문자열을 좌표로 푼다', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ])
  })

  it('목 서버가 인코딩한 경로를 그대로 되돌린다', () => {
    const points = [
      { latitude: 37.4837, longitude: 127.0324 },
      { latitude: 37.5103, longitude: 126.9955 },
    ]

    expect(decodePolyline(encodePolyline(points))).toEqual(points)
  })

  it('빈 문자열이면 빈 목록', () => {
    expect(decodePolyline('')).toEqual([])
  })
})
