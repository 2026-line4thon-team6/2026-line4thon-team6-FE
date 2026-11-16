import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import WavingMascot from './WavingMascot'

// L2 환영: 붕붕이가 한 번 점프하고 손을 흔든다. 장식 이미지라 스크린리더에는 읽히지 않는다
it('몸과 손 레이어를 장식 이미지로 그린다', () => {
  render(<WavingMascot />)

  const mascot = screen.getByTestId('waving-mascot')
  expect(mascot).toHaveAttribute('aria-hidden', 'true')
  expect(mascot.querySelectorAll('img')).toHaveLength(2)
  mascot.querySelectorAll('img').forEach((img) => expect(img).toHaveAttribute('alt', ''))
})

it('붕붕이를 누르면 인사를 처음부터 다시 한다', async () => {
  render(<WavingMascot />)

  const firstRun = screen.getByTestId('waving-mascot').firstElementChild
  await userEvent.click(screen.getByTestId('waving-mascot'))

  expect(screen.getByTestId('waving-mascot').firstElementChild).not.toBe(firstRun)
})
