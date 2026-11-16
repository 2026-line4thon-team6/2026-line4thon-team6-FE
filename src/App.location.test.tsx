import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetMockCards } from '@/mocks/cards'
import { resetMockCouple } from '@/mocks/couples'
import { mockEndRequests, mockRecordedGps, resetMockDrives } from '@/mocks/drives'
import { resetMockPlaces } from '@/mocks/places'
import { resetMockStamps } from '@/mocks/restAreas'
import { resetMockRoutes } from '@/mocks/routes'
import { MOCK_CURRENT_COORDINATE, resetMockSearchHistory } from '@/mocks/search'
import type { Position } from '@/utils/location'
import App from './App'

vi.mock('./components/DriveMap/DriveMap', () => ({ default: () => <div data-testid="drive-map" /> }))

const listeners = new Set<{ onChange: (position: Position) => void; onDenied?: () => void }>()
const moveTo = (position: Position) => act(() => listeners.forEach(({ onChange }) => onChange(position)))
const denyLocation = () => act(() => listeners.forEach(({ onDenied }) => onDenied?.()))
const requestPosition = vi.fn<() => Promise<Position | null>>()

const at = (coordinate: Position['coordinate'], accuracyMeters: number, secondsLater = 0): Position => ({
  coordinate,
  accuracyMeters,
  recordedAt: new Date(Date.now() + secondsLater * 1000).toISOString(),
  speedMetersPerSecond: null,
})

vi.mock('@/utils/location', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/location')>()
  return {
    ...actual,
    watchPosition: (onChange: (position: Position) => void, onDenied?: () => void) => {
      const listener = { onChange, onDenied }
      listeners.add(listener)
      onChange(at(MOCK_CURRENT_COORDINATE, 10))
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
  it('목적지 100m 안에 30초 머물러 서버가 도착으로 판정하면 드라이브를 마치고 도착 팝업을 띄운다', async () => {
    const user = await startDriving()
    expect(screen.queryByRole('dialog', { name: /목적지에 도착했어요!/ })).not.toBeInTheDocument()

    for (const seconds of [1, 11, 21, 31]) moveTo(at(HANGANG, 10, seconds))

    const prompt = await screen.findByRole('dialog', { name: /목적지에 도착했어요!/ })
    await user.click(within(prompt).getByRole('button', { name: '아니요' }))
    expect(await screen.findByRole('button', { name: '드라이브 시작하기' })).toBeInTheDocument()
  })

  it('목적지에 막 들어온 것만으로는 마치지 않는다', async () => {
    await startDriving()

    moveTo(at(HANGANG, 10, 1))

    await waitFor(() => expect(mockRecordedGps('drv_mock_1').at(-1)?.coordinate).toEqual(HANGANG))
    expect(screen.queryByRole('dialog', { name: /목적지에 도착했어요!/ })).not.toBeInTheDocument()
    expect(mockEndRequests).toHaveLength(0)
  })

  it('주행 중 위치를 GPS 묶음으로 보내고, 마치기 전에 남은 묶음을 보낸 뒤 마지막 번호로 종료한다', async () => {
    const user = await startDriving()

    moveTo(at({ latitude: 37.49, longitude: 127.01 }, 10, 1))
    moveTo(at({ latitude: 37.495, longitude: 127.005 }, 10, 2))
    moveTo(at({ latitude: 37.5, longitude: 127.0 }, 300, 3))

    await user.click(screen.getByRole('button', { name: '드라이브 마치기' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '드라이브 종료' }))
    expect(await screen.findByRole('button', { name: '드라이브 시작하기' })).toBeInTheDocument()

    const recorded = mockRecordedGps('drv_mock_1')
    const [first, second] = recorded.slice(-2)
    expect(recorded.map(({ sequence }) => sequence)).toEqual(recorded.map((_, index) => index + 1))
    expect(first).toEqual({
      sequence: recorded.length - 1,
      recordedAt: expect.any(String),
      coordinate: { latitude: 37.49, longitude: 127.01 },
      accuracyMeters: 10,
      speedMetersPerSecond: 0,
    })
    expect(second.coordinate).toEqual({ latitude: 37.495, longitude: 127.005 })
    expect(mockEndRequests.at(-1)).toMatchObject({ reason: 'USER_ENDED', lastRecordedSequence: second.sequence })
  })

  it('위치가 부정확하면 목적지 근처여도 마치지 않는다', async () => {
    await startDriving()

    moveTo(at(HANGANG, 200))

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
    requestPosition.mockResolvedValue(at(MOCK_CURRENT_COORDINATE, 10))
    const user = await startDriving()

    denyLocation()
    const popup = await screen.findByRole('dialog', { name: '위치 권한이 꺼져있어요.' })
    await user.click(within(popup).getByRole('button', { name: '설정으로 이동하기' }))

    expect(locationPopup()).not.toBeInTheDocument()
    expect(screen.queryByText('브라우저 설정에서 위치 권한을 허용해 주세요.')).not.toBeInTheDocument()
  })
})
