import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_APP_CONFIG } from '@/mocks/djPlaylists'
import { arrangeGenres, arrangeMoods, arrangeWeathers } from '@/utils/playlistKeywords'
import PlaylistPreferencePage, { type PlaylistPreference } from './PlaylistPreferencePage'

function Harness({ onSubmit }: { onSubmit: () => void }) {
  const [value, setValue] = useState<PlaylistPreference>({ moods: [], weather: null, genres: [] })
  return (
    <PlaylistPreferencePage
      moods={arrangeMoods(MOCK_APP_CONFIG.moods)}
      weathers={arrangeWeathers(MOCK_APP_CONFIG.weatherOptions)}
      genres={arrangeGenres(MOCK_APP_CONFIG.genres)}
      moodMax={2}
      genreMax={3}
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      onBack={vi.fn()}
    />
  )
}

describe('DJ 플레이리스트 취향 선택', () => {
  it('분위기는 2개, 장르는 3개까지 고르고, 분위기 · 날씨를 골라야 만들기 버튼이 켜진다', async () => {
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    const user = userEvent.setup()
    const submit = screen.getByRole('button', { name: /AI 플레이리스트 만들기/ })
    const moods = within(screen.getByRole('list', { name: '분위기' }))

    await user.click(moods.getByRole('button', { name: /신나는/ }))
    await user.click(moods.getByRole('button', { name: /감성적인/ }))
    await user.click(moods.getByRole('button', { name: /차분한/ }))
    expect(moods.getByRole('button', { name: /차분한/ })).toHaveAttribute('aria-pressed', 'false')
    expect(submit).toBeDisabled()

    await user.click(within(screen.getByRole('list', { name: '날씨' })).getByRole('button', { name: /맑음/ }))
    expect(submit).toBeEnabled()

    const genres = within(screen.getByRole('list', { name: '장르' }))
    for (const name of [/발라드/, /K-POP/, /인디/, /🎷/]) await user.click(genres.getByRole('button', { name }))
    expect(genres.getAllByRole('button', { pressed: true })).toHaveLength(3)

    await user.click(submit)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('Figma 순서와 이름으로 보여 준다 (ROCK → 밴드)', () => {
    render(<Harness onSubmit={vi.fn()} />)
    const genres = within(screen.getByRole('list', { name: '장르' })).getAllByRole('button')

    expect(genres[3]).toHaveTextContent('팝')
    expect(genres.at(-1)).toHaveTextContent('밴드')
  })
})
