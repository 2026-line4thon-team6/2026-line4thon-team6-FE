import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useArrival from './useArrival'

function setup(options: { active?: boolean; arrived?: boolean }) {
  const onArrive = vi.fn(() => Promise.resolve(true))
  const { rerender } = renderHook(
    ({ arrived }) => useArrival({ active: options.active ?? true, arrived, onArrive }),
    { initialProps: { arrived: options.arrived ?? true } },
  )
  return { onArrive, rerender }
}

describe('useArrival', () => {
  it('서버가 도착으로 판정하면 도착을 한 번 보낸다', () => {
    const { onArrive, rerender } = setup({})
    rerender({ arrived: true })
    expect(onArrive).toHaveBeenCalledTimes(1)
  })

  it('서버가 도착으로 판정하기 전에는 보내지 않는다', () => {
    expect(setup({ arrived: false }).onArrive).not.toHaveBeenCalled()
  })

  it('주행 중이 아니면(일시정지 등) 보내지 않는다', () => {
    expect(setup({ active: false }).onArrive).not.toHaveBeenCalled()
  })
})
