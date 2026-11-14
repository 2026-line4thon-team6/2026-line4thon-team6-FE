import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockCards } from '@/mocks/cards'
import { resetMockCouple } from '@/mocks/couples'
import { resetMockDrives } from '@/mocks/drives'
import { resetMockPlaces } from '@/mocks/places'
import { resetMockStamps } from '@/mocks/restAreas'
import { resetMockRoutes } from '@/mocks/routes'
import { MOCK_CURRENT_COORDINATE, resetMockSearchHistory } from '@/mocks/search'
import type { Position } from '@/utils/location'
import App from './App'

vi.mock('./components/DriveMap/DriveMap', () => ({ default: () => <div data-testid="drive-map" /> }))

// 위치를 테스트에서 옮기거나 권한을 끌 수 있게 한다
const listeners = new Set<{ onChange: (position: Position) => void; onDenied?: () => void }>()
const moveTo = (position: Position) => act(() => listeners.forEach(({ onChange }) => onChange(position)))
const denyLocation = () => act(() => listeners.forEach(({ onDenied }) => onDenied?.()))
const requestPosition = vi.fn<() => Promise<Position | null>>()

vi.mock('@/utils/location', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/location')>()
  return {
    ...actual,
    watchPosition: (onChange: (position: Position) => void, onDenied?: () => void) => {
      const listener = { onChange, onDenied }
      listeners.add(listener)
      onChange({ coordinate: MOCK_CURRENT_COORDINATE, accuracyMeters: 10 })
      return () => listeners.delete(listener)
    },
    requestPosition: () => requestPosition(),
  }
})

const HANGANG = { latitude: 37.5103, longitude: 126.9955 }

beforeEach(() => {
  listeners.clear()
  requestPosition.mockResolvedValue(null)
  resetMockCouple()
  resetMockPlaces()
  resetMockCards()
  resetMockDrives()
  resetMockStamps()
  resetMockRoutes()
  resetMockSearchHistory()
  localStorage.clear()
  sessionStorage.clear()
})

async function startDriving() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: '나중에' }))
  await user.click(screen.getByRole('button', { name: '드라이브 시작하기' }))
  await user.click(await screen.findByRole('button', { name: '붕붕! 붕붕이가 출발' }))
  await user.click(await screen.findByRole('button', { name: '경로 탐색' }))
  await user.type(await screen.findByRole('textbox', { name: '도착지' }), '한강 공원')
  const results = await screen.findByRole('list', { name: '검색 결과' })
  await user.click(within(results).getByRole('button', { name: /서울 반포 한강공원/ }))
  await user.click(await screen.findByRole('button', { name: '경로 설정하기' }))
  await screen.findByRole('button', { name: '드라이브 마치기' })
  return user
}

describe('목적지 도착', () => {
  it('목적지 근처에 오면 드라이브를 마치고 도착 팝업을 띄운다. 아니요를 누르면 홈으로 간다', async () => {
    const user = await startDriving()
    expect(screen.queryByRole('dialog', { name: /목적지에 도착했어요!/ })).not.toBeInTheDocument()

    moveTo({ coordinate: HANGANG, accuracyMeters: 10 })

    const prompt = await screen.findByRole('dialog', { name: /목적지에 도착했어요!/ })
    await user.click(within(prompt).getByRole('button', { name: '아니요' }))
    expect(await screen.findByRole('button', { name: '드라이브 시작하기' })).toBeInTheDocument()
  })

  it('위치가 부정확하면 목적지 근처여도 마치지 않는다', async () => {
    await startDriving()

    moveTo({ coordinate: HANGANG, accuracyMeters: 200 })

    expect(await screen.findByRole('button', { name: '드라이브 마치기' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /목적지에 도착했어요!/ })).not.toBeInTheDocument()
  })
})

describe('주행 중 위치 권한', () => {
  const locationPopup = () => screen.queryByRole('dialog', { name: '위치 권한이 꺼져있어요.' })

  it('권한이 꺼지면 팝업을 띄우고, 주행 중단하기를 누르면 기록을 멈춘다', async () => {
    const user = await startDriving()

    denyLocation()
    const popup = await screen.findByRole('dialog', { name: '위치 권한이 꺼져있어요.' })
    await user.click(within(popup).getByRole('button', { name: '주행 중단하기' }))

    expect(await screen.findByText('기록이 중단되었어요.')).toBeInTheDocument()
    expect(locationPopup()).not.toBeInTheDocument()
  })

  it('설정으로 이동하기: 다시 요청해도 막혀 있으면 설정 안내를 띄운다', async () => {
    const user = await startDriving()

    denyLocation()
    const popup = await screen.findByRole('dialog', { name: '위치 권한이 꺼져있어요.' })
    await user.click(within(popup).getByRole('button', { name: '설정으로 이동하기' }))

    expect(await screen.findByRole('status')).toHaveTextContent('브라우저 설정에서 위치 권한을 허용해 주세요.')
    expect(locationPopup()).not.toBeInTheDocument()
  })

  it('설정으로 이동하기: 허용되면 안내 없이 닫힌다', async () => {
    requestPosition.mockResolvedValue({ coordinate: MOCK_CURRENT_COORDINATE, accuracyMeters: 10 })
    const user = await startDriving()

    denyLocation()
    const popup = await screen.findByRole('dialog', { name: '위치 권한이 꺼져있어요.' })
    await user.click(within(popup).getByRole('button', { name: '설정으로 이동하기' }))

    expect(locationPopup()).not.toBeInTheDocument()
    expect(screen.queryByText('브라우저 설정에서 위치 권한을 허용해 주세요.')).not.toBeInTheDocument()
  })
})
