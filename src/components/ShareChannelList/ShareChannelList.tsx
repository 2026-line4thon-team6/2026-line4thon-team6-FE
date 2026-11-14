import facebookIcon from '@/assets/images/share/facebook.webp'
import instagramIcon from '@/assets/images/share/instagram.webp'
import kakaotalkIcon from '@/assets/images/share/kakaotalk.webp'
import xIcon from '@/assets/images/share/x.webp'
import type { ShareChannel } from '@/utils/share'
import styles from './ShareChannelList.module.scss'

const CHANNELS: { channel: ShareChannel; label: string; icon: string }[] = [
  { channel: 'kakaotalk', label: '카카오톡', icon: kakaotalkIcon },
  { channel: 'instagram', label: '인스타그램', icon: instagramIcon },
  { channel: 'x', label: 'X', icon: xIcon },
  { channel: 'facebook', label: '페이스북', icon: facebookIcon },
]

interface ShareChannelListProps {
  disabled?: boolean
  onSelect: (channel: ShareChannel) => void
}

// 공유 바텀시트의 '다른 방법으로 공유하기' 채널 버튼 (카카오톡 · 인스타그램 · X · 페이스북)
function ShareChannelList({ disabled = false, onSelect }: ShareChannelListProps) {
  return (
    <ul className={styles.channels}>
      {CHANNELS.map(({ channel, label, icon }) => (
        <li key={channel}>
          <button type="button" className={styles.channel} disabled={disabled} onClick={() => onSelect(channel)}>
            <img src={icon} alt="" width={57} height={57} />
            {label}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default ShareChannelList
