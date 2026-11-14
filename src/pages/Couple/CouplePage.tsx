import { useState } from 'react'
import chevronIcon from '@/assets/icons/chevron-gray.svg'
import Button from '@/components/Button/Button'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import Toast from '@/components/Toast/Toast'
import type { Couple } from '@/types/couple'
import type { Me, UpdateMeRequest } from '@/types/me'
import { toDotDate, todayString } from '@/utils/coupleDate'
import styles from './CouplePage.module.scss'
import DisconnectSheet from './DisconnectSheet'
import MascotNameModal from './MascotNameModal'
import ProfileEditModal from './ProfileEditModal'
import StartDateSheet from './StartDateSheet'

const PROVIDER_LABEL = { KAKAO: '카카오 로그인' } as const

type Overlay = 'startDate' | 'mascot' | 'profile' | 'disconnect' | null

interface CouplePageProps {
  // unlinked: 연결된 커플이 없음
  status: 'loading' | 'ready' | 'error' | 'unlinked'
  couple: Couple | null
  me: Me | null
  inviteCode: string | null
  today?: string // 시작일로 고를 수 있는 마지막 날짜. 기본은 기기 날짜 기준 오늘
  onBack: () => void
  onRetry: () => void
  // 아래 수정 함수는 성공하면 null, 실패하면 안내 문구로 resolve 한다
  onChangeStartDate: (startDate: string) => Promise<string | null>
  onRenameMascot: (name: string) => Promise<string | null>
  onUpdateProfile: (body: UpdateMeRequest) => Promise<string | null>
  onCopyInviteCode: (code: string) => Promise<void>
  onDisconnect: () => Promise<string | null>
  // 연결 해제가 끝났을 때 (마이 화면으로 이동)
  onDisconnected: () => void
}

// 커플 페이지 (마이 화면의 상단 프로필 카드에서 들어온다)
function CouplePage({
  status,
  couple,
  me,
  inviteCode,
  today = todayString(),
  onBack,
  onRetry,
  onChangeStartDate,
  onRenameMascot,
  onUpdateProfile,
  onCopyInviteCode,
  onDisconnect,
  onDisconnected,
}: CouplePageProps) {
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [toast, setToast] = useState<string | null>(null)
  const close = () => setOverlay(null)

  const header = (
    <header className={styles.header}>
      <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
      <h1 className={styles.title}>커플 페이지</h1>
    </header>
  )

  if (status !== 'ready' || !couple || !me) {
    return (
      <div className={styles.page}>
        {header}
        <div className={styles.message} role={status === 'loading' ? 'status' : 'alert'}>
          {status === 'loading' && <p>커플 정보를 불러오는 중이에요.</p>}
          {status === 'unlinked' && <p>연결된 연인이 없어요.</p>}
          {status === 'error' && (
            <>
              <p>커플 정보를 불러오지 못했어요.</p>
              <Button className={styles.retry} variant="secondary" size="sm" onClick={onRetry}>
                다시 시도
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // 내 정보를 먼저, 연인 정보를 다음에 보여 준다
  const members = [...couple.members].sort((a, b) => Number(b.id === me.id) - Number(a.id === me.id))

  const handleCopy = async () => {
    if (!inviteCode) return
    await onCopyInviteCode(inviteCode)
    setToast('커플 코드가 복사되었습니다.')
  }

  // 저장 함수를 실행하고, 성공하면 열린 팝업 · 시트를 닫는다
  const submit = async (save: () => Promise<string | null>) => {
    const error = await save()
    if (!error) close()
    return error
  }

  return (
    <div className={styles.page}>
      {header}

      <main className={styles.content}>
        <section aria-labelledby="couple-account-title">
          <h2 id="couple-account-title" className={styles.sectionTitle}>
            계정 정보
          </h2>
          <div className={styles.card}>
            <button type="button" className={styles.heartRow} onClick={() => setOverlay('startDate')}>
              <span className={styles.heartLabel}>
                <span className={styles.heart} aria-hidden>
                  ♥
                </span>
                우리의 시작
              </span>
              <span className={styles.rowValue}>
                {toDotDate(couple.startDate)}
                <img className={styles.chevron} src={chevronIcon} alt="" />
              </span>
            </button>

            <button type="button" className={styles.heartRow} onClick={() => setOverlay('mascot')}>
              <span className={styles.heartLabel}>
                <span className={styles.heart} aria-hidden>
                  ♥
                </span>
                <span className={styles.mascot}>{couple.mascotName}</span>
              </span>
              <span className={styles.rowValue}>
                이름 변경하기
                <img className={styles.chevron} src={chevronIcon} alt="" />
              </span>
            </button>

            <ul className={styles.members} aria-label="두 사람 정보">
              {members.map((member) => (
                <li key={member.id} className={styles.member}>
                  <span className={styles.memberText}>
                    <span className={styles.memberName}>{member.nickname}</span>
                    {member.birthDate && <span className={styles.birthDate}>{toDotDate(member.birthDate)}</span>}
                    <span className={styles.provider}>{PROVIDER_LABEL[member.provider]}</span>
                  </span>
                  {member.id === me.id && (
                    <button type="button" className={styles.editButton} onClick={() => setOverlay('profile')}>
                      편집
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="couple-connection-title">
          <h2 id="couple-connection-title" className={styles.sectionTitle}>
            커플 연결
          </h2>
          <div className={[styles.card, styles.connectionCard].join(' ')}>
            <button type="button" className={styles.row} disabled={!inviteCode} onClick={() => void handleCopy()}>
              <span>커플 코드 복사하기</span>
              <span className={styles.code}>
                {inviteCode ?? '--'}
                <img className={styles.chevron} src={chevronIcon} alt="" />
              </span>
            </button>
            <button type="button" className={styles.row} onClick={() => setOverlay('disconnect')}>
              <span>커플 연결 끊기 💔</span>
            </button>
          </div>
        </section>
      </main>

      {overlay === 'startDate' && (
        <StartDateSheet
          initial={couple.startDate}
          max={today}
          onSave={(date) => submit(() => onChangeStartDate(date))}
          onClose={close}
        />
      )}
      {overlay === 'mascot' && (
        <MascotNameModal
          initial={couple.mascotName}
          onSave={(name) => submit(() => onRenameMascot(name))}
          onClose={close}
        />
      )}
      {overlay === 'profile' && (
        <ProfileEditModal
          me={me}
          today={today}
          onSave={(body) => submit(() => onUpdateProfile(body))}
          onClose={close}
        />
      )}
      {overlay === 'disconnect' && (
        <DisconnectSheet
          onDisconnect={async () => {
            const error = await onDisconnect()
            if (!error) {
              close()
              onDisconnected()
            }
            return error
          }}
          onClose={close}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

export default CouplePage
