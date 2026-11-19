import Button from '@/components/Button/Button'
import type { PushStatus } from '@/hooks/usePushNotifications'
import styles from './PushPrompt.module.scss'

interface PushPromptProps {
  status: PushStatus
  onEnable: () => void
}

const COPY: Partial<Record<PushStatus, { title: string; body: string }>> = {
  default: {
    title: '휴대폰으로 알림 받기',
    body: '커플 연결, 장소 공유, 카드 완성 소식을 앱을 닫아도 바로 알려 드려요.',
  },
  working: {
    title: '휴대폰으로 알림 받기',
    body: '커플 연결, 장소 공유, 카드 완성 소식을 앱을 닫아도 바로 알려 드려요.',
  },
  failed: {
    title: '알림을 켜지 못했어요',
    body: '잠시 뒤 다시 시도해 주세요.',
  },
  'needs-install': {
    title: '홈 화면에 추가하면 알림을 받을 수 있어요',
    body: '사파리 공유 버튼 → 홈 화면에 추가 후, 추가한 앱에서 알림을 켜 주세요.',
  },
  denied: {
    title: '알림이 꺼져 있어요',
    body: '휴대폰 설정에서 붕붕어스 알림을 허용하면 받을 수 있어요.',
  },
}

// 알림 화면 위쪽의 휴대폰 알림(Web Push) 켜기 안내. 켰거나 받을 수 없는 브라우저면 보이지 않는다
function PushPrompt({ status, onEnable }: PushPromptProps) {
  const copy = COPY[status]
  if (!copy) return null
  const canEnable = status === 'default' || status === 'working' || status === 'failed'

  return (
    <section className={styles.prompt} aria-label="휴대폰 알림">
      <div className={styles.text}>
        <p className={styles.title}>{copy.title}</p>
        <p className={styles.body}>{copy.body}</p>
      </div>
      {canEnable && (
        <Button size="sm" className={styles.button} disabled={status === 'working'} onClick={onEnable}>
          {status === 'failed' ? '다시 시도' : '알림 켜기'}
        </Button>
      )}
    </section>
  )
}

export default PushPrompt
