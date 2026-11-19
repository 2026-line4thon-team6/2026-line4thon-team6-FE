import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ContentCards from './ContentCards'

describe('콘텐츠 카드', () => {
  it('DJ 플레이리스트와 콘텐츠 4개를 보여 주고, 누르면 알린다', async () => {
    const onPlaylistClick = vi.fn()
    const onContentClick = vi.fn()
    render(<ContentCards onPlaylistClick={onPlaylistClick} onContentClick={onContentClick} />)

    await userEvent.click(screen.getByRole('button', { name: /DJ 플레이리스트/ }))
    expect(onPlaylistClick).toHaveBeenCalledTimes(1)

    const names = ['라디오', '밸런스 게임', '넌센스 퀴즈', '추억 게임']
    for (const name of names) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /넌센스 퀴즈/ }))
    expect(onContentClick).toHaveBeenCalledWith('nonsense')
  })

  it('운전자 화면에서는 콘텐츠를 누를 수 없다', async () => {
    const onPlaylistClick = vi.fn()
    const onContentClick = vi.fn()
    render(
      <ContentCards
        onPlaylistClick={onPlaylistClick}
        onContentClick={onContentClick}
        locked
      />,
    )

    for (const name of [/DJ 플레이리스트/, /라디오/, /밸런스 게임/, /넌센스 퀴즈/, /추억 게임/]) {
      const button = screen.getByRole('button', { name })
      expect(button).toBeDisabled()
      await userEvent.click(button)
    }
    expect(onPlaylistClick).not.toHaveBeenCalled()
    expect(onContentClick).not.toHaveBeenCalled()
  })
})
