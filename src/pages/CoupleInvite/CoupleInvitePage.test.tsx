import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import CoupleInvitePage from './CoupleInvitePage'

// 기능명세서 'L9 연인 코드 (연인 초대 · 연결)' · Figma 'Onboarding_UI > 연인 초대'(484:14329) 기준
type Props = ComponentProps<typeof CoupleInvitePage>

const connected = { status: 'connected' } as const
const failed = (message: string) => ({ status: 'failed', message }) as const

function renderPage(props: Partial<Props> = {}) {
  const handlers = {
    onBack: vi.fn(),
    onRetry: vi.fn(),
    onCopy: vi.fn().mockResolvedValue(undefined),
    onShare: vi.fn().mockResolvedValue('shared' as const),
    onConnect: vi.fn().mockResolvedValue(connected),
    onRestore: vi.fn().mockResolvedValue(null),
    onConnected: vi.fn(),
    onSkip: vi.fn(),
  }
  render(<CoupleInvitePage status="ready" code="23Wh8N" {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

it('제목 · 안내 문구를 보여 주고, 뒤로가기를 누르면 돌아간다', async () => {
  const { user, onBack } = renderPage()

  expect(screen.getByRole('heading', { level: 1, name: '연인 초대' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: '연인을 초대해보세요!' })).toBeInTheDocument()
  expect(screen.getByText('붕붕어스와 함께할 파트너는 누구인가요?')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '뒤로가기' }))
  expect(onBack).toHaveBeenCalled()
})

describe('나의 코드', () => {
  it('내 코드를 보여 주고, 복사를 누르면 코드를 복사한 뒤 복사했다고 알려 준다', async () => {
    const { user, onCopy } = renderPage()

    const section = screen.getByRole('region', { name: '나의 코드' })
    expect(within(section).getByText('23Wh8N')).toBeInTheDocument()

    await user.click(within(section).getByRole('button', { name: '내 코드 복사' }))
    expect(onCopy).toHaveBeenCalledWith('23Wh8N')
    expect(await screen.findByRole('status')).toHaveTextContent('커플 코드가 복사되었습니다.')
  })

  it('복사하지 못하면 그렇게 안내한다', async () => {
    const { user } = renderPage({ onCopy: vi.fn().mockRejectedValue(new Error('denied')) })

    await user.click(screen.getByRole('button', { name: '내 코드 복사' }))

    expect(await screen.findByRole('status')).toHaveTextContent('코드를 복사하지 못했어요. 다시 시도해 주세요.')
  })

  it('내 코드 보내기를 누르면 공유 화면을 연다', async () => {
    const { user, onShare } = renderPage()

    await user.click(screen.getByRole('button', { name: '내 코드 보내기' }))

    expect(onShare).toHaveBeenCalledWith('23Wh8N')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('공유 화면을 지원하지 않아 대신 복사했으면 그렇게 안내한다', async () => {
    const { user } = renderPage({ onShare: vi.fn().mockResolvedValue('copied') })

    await user.click(screen.getByRole('button', { name: '내 코드 보내기' }))

    expect(await screen.findByRole('status')).toHaveTextContent('코드를 복사했어요. 연인에게 보내 주세요.')
  })

  it('코드를 불러오는 중이면 버튼을 막는다', () => {
    renderPage({ status: 'loading', code: null })

    expect(screen.getByRole('button', { name: '내 코드 복사' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '내 코드 보내기' })).toBeDisabled()
  })

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    const { user, onRetry } = renderPage({ status: 'error', code: null })

    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalled()
  })
})

describe('연인 코드 입력 · 완료', () => {
  it('연인 코드를 입력하고 완료를 누르면 연결하고, 성공하면 다음 화면으로 넘어간다', async () => {
    const { user, onConnect, onConnected } = renderPage()

    await user.type(screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' }), 'minji2026')
    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(onConnect).toHaveBeenCalledWith('minji2026')
    expect(onConnected).toHaveBeenCalled()
  })

  it('입력칸에서 엔터를 눌러도 연결한다', async () => {
    const { user, onConnect } = renderPage()

    await user.type(screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' }), 'minji2026{Enter}')

    expect(onConnect).toHaveBeenCalledWith('minji2026')
  })

  it('연결에 실패하면 입력칸 아래에 안내하고, 다시 입력하면 안내를 지운다', async () => {
    const { user, onConnected } = renderPage({ onConnect: vi.fn().mockResolvedValue(failed('코드를 다시 확인해 주세요.')) })
    const input = screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' })

    await user.type(input, 'nope')
    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('코드를 다시 확인해 주세요.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(onConnected).not.toHaveBeenCalled()

    await user.type(input, '1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('건너뛰기를 누르면 연결하지 않고 넘어간다', async () => {
    const { user, onConnect, onSkip } = renderPage()

    await user.click(screen.getByRole('button', { name: '건너뛰기' }))

    expect(onConnect).not.toHaveBeenCalled()
    expect(onSkip).toHaveBeenCalled()
  })

  it('코드를 비워 두면 완료 버튼을 막는다 (건너뛰기는 따로 있다)', async () => {
    const { user, onConnect, onSkip } = renderPage()
    const input = screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' })

    expect(screen.getByRole('button', { name: '완료' })).toBeDisabled()

    await user.type(input, '   {Enter}')
    expect(screen.getByRole('button', { name: '완료' })).toBeDisabled()
    expect(onConnect).not.toHaveBeenCalled()
    expect(onSkip).not.toHaveBeenCalled()
  })

  it('연결하는 동안에는 완료 버튼을 막는다', async () => {
    const { user } = renderPage({ onConnect: vi.fn(() => new Promise<never>(() => {})) })

    await user.type(screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' }), 'minji2026')
    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(screen.getByRole('button', { name: '연결 중' })).toBeDisabled()
  })
})

describe('예전에 연결했던 연인 (연결 복구)', () => {
  const restoreRequired = { onConnect: vi.fn().mockResolvedValue({ status: 'restore' }) }

  async function openRestoreSheet(props: Partial<Props> = {}) {
    const page = renderPage({ ...restoreRequired, ...props })
    await page.user.type(screen.getByRole('textbox', { name: '연인의 코드를 알고 있다면?' }), 'minji2025')
    await page.user.click(screen.getByRole('button', { name: '완료' }))
    return { ...page, sheet: within(await screen.findByRole('dialog', { name: '예전에 연결했던 연인이에요' })) }
  }

  it('다시 연결할지 묻고, 다시 연결하기를 누르면 복구한 뒤 다음 화면으로 넘어간다', async () => {
    const { user, sheet, onRestore, onConnected } = await openRestoreSheet()

    expect(sheet.getByText(/다시 연결할까요\?/)).toBeInTheDocument()
    expect(onConnected).not.toHaveBeenCalled()

    await user.click(sheet.getByRole('button', { name: '다시 연결하기' }))

    expect(onRestore).toHaveBeenCalledWith('minji2025')
    expect(onConnected).toHaveBeenCalled()
  })

  it('복구에 실패하면 시트 안에 안내한다', async () => {
    const { user, sheet, onConnected } = await openRestoreSheet({
      onRestore: vi.fn().mockResolvedValue('다시 연결할 예전 연결 정보가 없어요. 연인의 새 코드를 확인해 주세요.'),
    })

    await user.click(sheet.getByRole('button', { name: '다시 연결하기' }))

    expect(await sheet.findByRole('alert')).toHaveTextContent('다시 연결할 예전 연결 정보가 없어요.')
    expect(onConnected).not.toHaveBeenCalled()
  })

  it('취소하면 시트를 닫고 연결하지 않는다', async () => {
    const { user, sheet, onRestore } = await openRestoreSheet()

    await user.click(sheet.getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onRestore).not.toHaveBeenCalled()
  })
})

it('이미 연인과 연결돼 있으면 코드 대신 안내를 보여 준다', () => {
  renderPage({ status: 'linked', code: null })

  expect(screen.getByText('이미 연인과 연결되어 있어요.')).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

it('이미 연결돼 있으면 건너뛰기 없이 완료로 바로 넘어간다', async () => {
  const { user, onSkip } = renderPage({ status: 'linked', code: null })

  expect(screen.queryByRole('button', { name: '건너뛰기' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '완료' }))
  expect(onSkip).toHaveBeenCalled()
})
