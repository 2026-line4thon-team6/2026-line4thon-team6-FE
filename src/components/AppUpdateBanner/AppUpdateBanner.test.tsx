import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AppUpdateBanner from './AppUpdateBanner'

describe('AppUpdateBanner', () => {
  it('새 버전 안내와 업데이트 · 닫기 버튼을 보여 준다', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    const onDismiss = vi.fn()
    render(<AppUpdateBanner onUpdate={onUpdate} onDismiss={onDismiss} />)

    expect(screen.getByRole('status')).toHaveTextContent('새 버전이 있어요')
    await user.click(screen.getByRole('button', { name: '업데이트' }))
    expect(onUpdate).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '업데이트 안내 닫기' }))
    expect(onDismiss).toHaveBeenCalled()
  })
})
