import { describe, expect, it } from 'vitest'
import { recordGroupKey } from './recordGroupKey'

const place = (placeId: string | null, latitude?: number, longitude?: number) => ({
  placeId,
  name: '오이도',
  address: null,
  coordinate: latitude === undefined || longitude === undefined ? null : { latitude, longitude },
})

describe('recordGroupKey', () => {
  it('장소 id가 있으면 place:{id}', () => {
    expect(recordGroupKey(place('plc_01', 37.1, 126.1))).toBe('place:plc_01')
  })

  it('장소 id가 없으면 좌표를 소수 5자리로 반올림(HALF_UP)한 coord 키', () => {
    expect(recordGroupKey(place(null, 37.345675, 126.68))).toBe('coord:37.34568,126.68000')
    expect(recordGroupKey(place(null, 37.345674999, 126.123456))).toBe('coord:37.34567,126.12346')
    expect(recordGroupKey(place(null, 37.999995, 127))).toBe('coord:38.00000,127.00000')
  })

  it('좌표도 장소 id도 없으면 지도에 묶이지 않는다', () => {
    expect(recordGroupKey(place(null))).toBeNull()
    expect(recordGroupKey(null)).toBeNull()
  })
})
