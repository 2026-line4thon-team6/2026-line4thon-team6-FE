import { useEffect, useState } from 'react'
import { fetchBlob, USE_MOCK } from '@/api/client'

interface Loaded {
  url: string
  src: string | null
}

// 라디오 음성 URL은 서명이 있어도 서버가 Bearer 토큰을 요구한다. <audio>는 헤더를 붙일 수 없으므로
// 토큰을 붙여 미리 받아 blob URL로 바꾼다. 받지 못했거나 받는 중이면 null (재생 버튼을 막는다)
// 재생을 누른 뒤에 받으면 iOS 등에서 사용자 동작이 끊겨 재생이 막히므로 화면을 열 때 받는다
function useAuthorizedAudio(audioUrl: string | null): string | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!audioUrl || USE_MOCK) return
    let objectUrl: string | null = null
    let ignore = false

    fetchBlob(audioUrl)
      .then((blob) => {
        if (ignore) return
        objectUrl = URL.createObjectURL(blob)
        setLoaded({ url: audioUrl, src: objectUrl })
      })
      .catch(() => {
        if (!ignore) setLoaded({ url: audioUrl, src: null })
      })

    return () => {
      ignore = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [audioUrl])

  if (!audioUrl) return null
  if (USE_MOCK) return audioUrl
  return loaded?.url === audioUrl ? loaded.src : null
}

export default useAuthorizedAudio
