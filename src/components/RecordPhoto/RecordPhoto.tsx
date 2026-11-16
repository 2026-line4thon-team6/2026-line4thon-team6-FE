import { useState } from 'react'
import emptyPhoto from '@/assets/images/card/photo-empty.webp'
import styles from './RecordPhoto.module.scss'

interface RecordPhotoProps {
  // 대표 사진 주소. 사진이 없는 기록은 서버가 null을 준다
  src: string | null
  alt?: string
  // 크기 · 모서리는 쓰는 화면에서 정한다
  className?: string
}

// 기록 대표 사진. 사진이 없거나(D15: FE 공통 기본 일러스트) 불러오지 못하면(10분짜리 서명 링크 만료 등) 기본 일러스트를 가운데에 놓는다
function RecordPhoto({ src, alt = '', className }: RecordPhotoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const empty = !src || failedSrc === src

  return (
    <img
      className={[className, styles.photo].filter(Boolean).join(' ')}
      src={empty ? emptyPhoto : src}
      alt={alt}
      data-empty={empty}
      onError={() => setFailedSrc(src)}
    />
  )
}

export default RecordPhoto
