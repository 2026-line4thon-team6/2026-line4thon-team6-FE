// 미작성 카드 목록 · 배너 · 팝업에서 카드 작성 화면으로 갈 때만 쓰는 화면 전환 종류 (React addTransitionType).
// 다른 화면 이동에는 전환 효과를 걸지 않는다
export const TO_CARD = 'to-card'

// 목록의 카드 이름과 작성 화면 제목을 잇는 공유 요소 이름 (CSS 식별자로 쓸 수 있게 바꾼다)
export const cardTitleTransitionName = (driveId: string) => `card-title-${driveId.replace(/[^\w-]/g, '-')}`

// 화면별 전환 클래스 (styles/base/_view-transitions.scss)
export const CARD_PAGE_ENTER = { [TO_CARD]: 'card-page-enter', default: 'none' }
export const PAGE_RECEDE = { [TO_CARD]: 'page-recede', default: 'none' }
export const CARD_TITLE_SHARE = { [TO_CARD]: 'card-title', default: 'none' }
