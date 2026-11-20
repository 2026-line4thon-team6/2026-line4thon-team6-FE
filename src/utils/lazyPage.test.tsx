import { Suspense } from 'react'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import lazyPage, { preloadAllPages } from './lazyPage'

function Hello({ name }: { name: string }) {
  return <p>안녕 {name}</p>
}

describe('lazyPage', () => {
  it('코드를 받는 동안 대체 화면을 보여 주고, 받은 뒤 페이지를 그린다', async () => {
    const Page = lazyPage(() => Promise.resolve({ default: Hello }))

    render(
      <Suspense fallback={<p>불러오는 중</p>}>
        <Page name="붕붕" />
      </Suspense>,
    )

    expect(screen.getByText('불러오는 중')).toBeInTheDocument()
    expect(await screen.findByText('안녕 붕붕')).toBeInTheDocument()
  })

  it('한 번 받은 페이지는 다시 그릴 때 기다리지 않는다', async () => {
    const Page = lazyPage(() => Promise.resolve({ default: Hello }))
    await act(() => Page.preload())

    render(
      <Suspense fallback={<p>불러오는 중</p>}>
        <Page name="붕붕" />
      </Suspense>,
    )

    expect(screen.getByText('안녕 붕붕')).toBeInTheDocument()
    expect(screen.queryByText('불러오는 중')).not.toBeInTheDocument()
  })

  it('preloadAllPages는 만들어 둔 페이지 코드를 모두 받아, 바로 그릴 수 있게 한다', async () => {
    const First = lazyPage(() => Promise.resolve({ default: Hello }))
    const Second = lazyPage(() => Promise.resolve({ default: ({ name }: { name: string }) => <p>잘 가 {name}</p> }))
    await act(() => preloadAllPages())

    render(
      <Suspense fallback={<p>불러오는 중</p>}>
        <First name="붕붕" />
        <Second name="어스" />
      </Suspense>,
    )

    expect(screen.getByText('안녕 붕붕')).toBeInTheDocument()
    expect(screen.getByText('잘 가 어스')).toBeInTheDocument()
  })

  it('미리 받기를 여러 번 불러도 코드는 한 번만 받는다', async () => {
    const load = vi.fn(() => Promise.resolve({ default: Hello }))
    const Page = lazyPage(load)

    await Promise.all([Page.preload(), Page.preload()])
    render(
      <Suspense fallback={null}>
        <Page name="붕붕" />
      </Suspense>,
    )
    await screen.findByText('안녕 붕붕')

    expect(load).toHaveBeenCalledTimes(1)
  })
})
