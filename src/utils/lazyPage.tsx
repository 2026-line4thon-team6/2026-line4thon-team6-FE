import { type ComponentType, lazy } from 'react'

export type LazyPage<P extends object> = ComponentType<P> & {
  // 페이지 코드를 미리 받아 둔다. 같은 라우트 안에서 상태에 따라 바뀌는 화면은 미리 받아 둬야 바뀌는 순간 빈 화면이 보이지 않는다
  preload: () => Promise<void>
}

// 페이지를 처음 그릴 때 코드를 따로 받는다 (React.lazy). 받는 동안은 가장 가까운 Suspense의 대체 화면이 보인다.
// 한 번 받은 뒤에는 React.lazy를 거치지 않고 바로 그려, 상태 변경으로 다시 그려질 때 기다리지 않는다
function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>): LazyPage<P> {
  let loaded: ComponentType<P> | null = null
  let loading: Promise<{ default: ComponentType<P> }> | null = null

  const loadOnce = () => {
    loading ??= load().then((module) => {
      loaded = module.default
      return module
    })
    return loading
  }

  const Lazy = lazy(loadOnce)

  function Page(props: P) {
    const Component = loaded ?? Lazy
    return <Component {...props} />
  }

  return Object.assign(Page, { preload: () => loadOnce().then(() => undefined) })
}

export default lazyPage
