// 아이폰 16 기준. 화면 393 x 852 + 베젤 12 · 테두리 2 (위아래 각 14)
const DEVICE_HEIGHT = 852 + 14 * 2
// 프레임 위아래 여백
const STAGE_GAP = 24
const MIN_SCALE = 0.5

// 창 높이가 낮으면 프레임 전체를 줄여 한 화면에 보이게 한다
export function getDeviceScale(windowHeight: number) {
  const scale = (windowHeight - STAGE_GAP * 2) / DEVICE_HEIGHT
  return Math.min(1, Math.max(MIN_SCALE, scale))
}
