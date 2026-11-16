import type { ApiResponse } from '@/types/api'
import type { Faq } from '@/types/faq'
import { createMeta } from './utils'

// 백엔드 연동 전(VITE_API_BASE_URL 미설정)에 쓰는 FAQ 목 응답. 문구는 기능명세서의 정책 수치(24시간 · 사진 2장)에 맞춘다
export const MOCK_FAQS: Faq[] = [
  {
    id: 'faq-couple-connect',
    question: '연인과 어떻게 연결하나요?',
    answer:
      '마이 화면의 프로필 카드를 눌러 연인 초대 화면으로 이동해 주세요.\n내 연인 코드를 공유하거나, 연인에게 받은 코드를 입력하면 바로 연결돼요.',
    order: 10,
  },
  {
    id: 'faq-couple-disconnect',
    question: '커플 연결을 해제하면 기록은 어떻게 되나요?',
    answer:
      '연결을 해제하면 함께 쌓은 드라이브 기록과 카드는 더 이상 공유되지 않아요.\n같은 연인과 다시 연결하면 이전 기록을 다시 함께 볼 수 있어요.',
    order: 20,
  },
  {
    id: 'faq-drive-record',
    question: '드라이브 기록은 어떻게 남기나요?',
    answer:
      '홈에서 드라이브 시작하기를 누르고 드라이브명을 정하면 기록이 시작돼요.\n주행 중에는 위치 권한이 필요하며, 도착하면 이동 경로와 거리 · 시간이 기록 지도에 저장돼요.',
    order: 30,
  },
  {
    id: 'faq-card-deadline',
    question: '드라이브 카드는 언제까지 쓸 수 있나요?',
    answer:
      '드라이브를 마친 뒤 24시간 안에 작성할 수 있어요.\n24시간이 지나면 카드를 새로 쓰거나 고칠 수 없으니, 홈의 알림 팝업을 놓치지 마세요.',
    order: 40,
  },
  {
    id: 'faq-card-photos',
    question: '카드에 사진은 몇 장까지 올릴 수 있나요?',
    answer: '카드 한 장에 사진을 최대 2장까지 올릴 수 있어요.',
    order: 50,
  },
  {
    id: 'faq-install',
    question: '앱은 어떻게 설치하나요?',
    answer:
      '붕붕어스는 웹 앱이라 앱스토어 없이 홈 화면에 추가해 쓸 수 있어요.\n마이 화면의 ‘앱 설치하기’ 메뉴에서 기기별 설치 방법을 확인해 주세요.',
    order: 60,
  },
]

export async function mockFetchFaqs(): Promise<ApiResponse<Faq[]>> {
  return { data: MOCK_FAQS, meta: createMeta() }
}
