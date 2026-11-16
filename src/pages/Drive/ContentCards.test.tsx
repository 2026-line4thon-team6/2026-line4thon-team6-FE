import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ContentCards from './ContentCards'

describe('콘텐츠 카드', () => {
  it('DJ 플레이리스트와 콘텐츠 4개를 보여 주고, 누르면 알린다', async () => {
    const onPlaylistClick = vi.fn()
    const onContentClick = vi.fn()
    render(<ContentCards onPlaylistClick={onPlaylistClick} onContentClick={onContentClick} />)

    await userEvent.click(screen.getByText(/플레이리스트를 만들러 가볼까요/))
    expect(onPlaylistClick).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'DJ 플레이리스트 만들러 가기' }))
    expect(onPlaylistClick).toHaveBeenCalledTimes(1)

    const names = ['라디오', '밸런스 게임', '넌센스 퀴즈', '추억 게임']
    for (const name of names) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /넌센스 퀴즈/ }))
    expect(onContentClick).toHaveBeenCalledWith('nonsense')
  })
})
