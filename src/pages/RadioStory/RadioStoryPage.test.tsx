import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RadioEpisode } from '@/types/radio'
import RadioStoryPage from './RadioStoryPage'

type Props = ComponentProps<typeof RadioStoryPage>

const EPISODE: RadioEpisode = {
  id: 'rad_01',
  driveId: 'drv_01',
  mode: 'USER_STORY',
  story: '운전해줘서 고마워!',
  broadcastText: '안녕하세요, 여러분! 붕붕이 DJ입니다.\n오늘은 연인과 함께 바다로 드라이브를 떠난 한 분의 사연을 소개해 드릴게요.',
  audioUrl: 'https://cdn.example.com/radio/rad_01.mp3',
  audioUrlExpiresAt: '2099-01-01T00:00:00Z',
  durationSeconds: 60,
  status: 'READY',
  createdAt: '2026-11-12T09:00:00Z',
}

function renderPage(props: Partial<Props> = {}) {
  const handlers = { onBack: vi.fn(), onRetry: vi.fn(), onAudioError: vi.fn() }
  render(<RadioStoryPage status="ready" episode={EPISODE} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

// jsdom은 오디오를 재생하지 못하므로 재생 · 정지 호출만 확인한다
let play: ReturnType<typeof vi.spyOn>
let pause: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
})
afterEach(() => vi.restoreAllMocks())

// Figma My_UI > 보관함 상세 (812:10416)
describe('라디오 사연 상세', () => {
  it('제목 · 사연 재생 중 · 방송 문구를 보여 준다', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '라디오' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '사연 재생 중' })).toBeInTheDocument()
    // 줄바꿈을 살려 보여 준다
    const text = screen.getByText(/붕붕이 DJ입니다/)
    expect(text).toHaveTextContent('오늘은 연인과 함께 바다로 드라이브를 떠난 한 분의 사연을 소개해 드릴게요.')
  })

  it('재생을 누르면 음성을 재생하고, 정지를 누르면 멈추고 처음으로 돌린다', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('button', { name: '재생' }))
    expect(play).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '정지' }))
    expect(pause).toHaveBeenCalled()
    expect(document.querySelector('audio')!.currentTime).toBe(0)
  })

  it('음성이 아직 없으면 재생 · 정지 버튼을 누를 수 없다', () => {
    renderPage({ episode: { ...EPISODE, audioUrl: null, audioUrlExpiresAt: null } })

    expect(screen.getByRole('button', { name: '재생' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '정지' })).toBeDisabled()
  })

  it('음성 주소가 만료돼 재생에 실패하면 알린다 (다시 조회해 새 주소를 받는다)', () => {
    const { onAudioError } = renderPage()

    document.querySelector('audio')!.dispatchEvent(new Event('error'))
    expect(onAudioError).toHaveBeenCalled()
  })

  it('뒤로가기를 누르면 보관함으로 돌아간다', async () => {
    const { user, onBack } = renderPage()

    await user.click(screen.getByRole('button', { name: '뒤로가기' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', episode: null })

    expect(screen.getByRole('alert')).toHaveTextContent('사연을 불러오지 못했어요.')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('없는 사연이면 볼 수 없다고 안내한다', () => {
    renderPage({ status: 'notFound', episode: null })

    expect(screen.getByRole('alert')).toHaveTextContent('삭제되었거나 볼 수 없는 사연이에요.')
  })
})
