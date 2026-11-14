import { useEffect, useState } from 'react'
import { hasStoredSession, logout, restoreSession } from '@/api/auth'
import type { Me } from '@/types/me'
import { createIdempotencyKey } from '@/utils/share'

interface AuthState {
  status: 'signedIn' | 'signedOut'
  // 로그인 상태인데 null이면 내 계정을 불러오는 중
  user: Me | null
}

// 앱 전체의 로그인 상태. 기기에 세션이 있으면 바로 로그인 상태로 그리고, 내 계정(가입 완료 여부)은 뒤이어 불러온다
function useAuth() {
  const [state, setState] = useState<AuthState>(() => ({
    status: hasStoredSession() ? 'signedIn' : 'signedOut',
    user: null,
  }))
  const needsUser = state.status === 'signedIn' && !state.user

  useEffect(() => {
    if (!needsUser) return
    let ignore = false

    restoreSession()
      .then((user) => {
        if (!ignore) setState(user ? { status: 'signedIn', user } : { status: 'signedOut', user: null })
      })
      // 네트워크 오류 등은 로그인 상태를 유지한다 (각 화면이 다시 시도를 보여 준다)
      .catch(() => undefined)

    return () => {
      ignore = true
    }
  }, [needsUser])

  // 로그인 · 가입 프로필 저장을 마쳤을 때 받은 내 계정으로 바꾼다
  const signIn = (user: Me) => setState({ status: 'signedIn', user })

  const signOut = async () => {
    await logout(createIdempotencyKey()).catch(() => undefined)
    setState({ status: 'signedOut', user: null })
  }

  return { ...state, signIn, signOut }
}

export type Auth = ReturnType<typeof useAuth>

export default useAuth
