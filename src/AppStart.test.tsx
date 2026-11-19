import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppStart from './AppStart'

vi.mock('./App', () => ({ default: () => <p>앱 화면</p> }))

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

const deferred = () => {
  let resolve = () => {}
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}

describe('앱 시작', () => {
  it('서버를 확인하는 동안에는 스플래시만 보여 준다', () => {
    const backend = deferred()
    render(<AppStart backend={backend.promise} />)
    expect(screen.getByRole('img', { name: '붕붕어스' })).toBeInTheDocument()
    expect(screen.queryByText('앱 화면')).not.toBeInTheDocument()
  })

  it('서버 확인이 끝나면 스플래시 뒤에 앱 화면을 그린다', async () => {
    const backend = deferred()
    render(<AppStart backend={backend.promise} />)
    await act(async () => backend.resolve())
    expect(screen.getByText('앱 화면')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '붕붕어스' })).toBeInTheDocument()
  })

  it('카카오 로그인에서 돌아오면 스플래시 없이 앱 화면으로 간다', async () => {
    window.history.replaceState(null, '', '/oauth/callback?code=abc')
    const backend = deferred()
    render(<AppStart backend={backend.promise} />)
    expect(screen.queryByRole('img', { name: '붕붕어스' })).not.toBeInTheDocument()
    await act(async () => backend.resolve())
    expect(screen.getByText('앱 화면')).toBeInTheDocument()
  })
})
