import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RestArea, RestAreaDetail } from '@/types/restArea'
import RestAreaDetailModal from './RestAreaDetailModal'

const detail = (earned: boolean): RestAreaDetail => ({
  restArea: {
    id: 'rest_01',
    name: '시흥하늘휴게소',
    highwayName: '수도권제1순환고속도로',
    direction: null,
    coordinate: { latitude: 37.38, longitude: 126.85 },
    distanceAlongRouteMeters: null,
    earned,
    earnedAt: earned ? '2026-11-17T07:00:00.000Z' : null,
    address: null,
    distanceMeters: null,
  } as RestArea,
  introduction: '하늘이 보이는 휴게소',
  menus: [{ name: '호두과자', description: null, imageUrl: null }] as RestAreaDetail['menus'],
  detailsAvailable: true,
})

describe('휴게소 상세 팝업', () => {
  it('도장을 아직 못 찍었어도 소개와 대표 메뉴를 모두 보여 주고, 도장만 잠긴 모양이다', () => {
    render(<RestAreaDetailModal detail={detail(false)} onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: '시흥하늘휴게소' })).toBeInTheDocument()
    expect(screen.getByText('하늘이 보이는 휴게소')).toBeInTheDocument()
    expect(screen.getByText('호두과자')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '도장 미획득' })).toBeInTheDocument()
  })

  it('도장을 찍으면 도장 모양만 바뀐다', () => {
    render(<RestAreaDetailModal detail={detail(true)} onClose={vi.fn()} />)

    expect(screen.getByText('호두과자')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '도장 획득' })).toBeInTheDocument()
  })
})
