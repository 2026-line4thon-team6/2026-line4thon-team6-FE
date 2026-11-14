import { useState } from 'react'
import { searchRestAreas } from '@/api/restAreas'
import Toast from '@/components/Toast/Toast'
import useRestAreaSearch from '@/hooks/useRestAreaSearch'
import useStamps from '@/hooks/useStamps'
import RestAreaSearchPage from '@/pages/RestAreaSearch/RestAreaSearchPage'
import type { Drive } from '@/types/drive'
import type { RestArea, StampClaim } from '@/types/restArea'
import type { Coordinate } from '@/types/route'
import RestAreaDetailModal from './RestAreaDetailModal'
import StampBoard from './StampBoard'
import StampClaimModal from './StampClaimModal'

interface StampsTabProps {
  drive: Drive | null
  currentCoordinate: Coordinate | null
}

type Selected = { restArea: RestArea; method: 'GPS' | 'MANUAL' }

// Figma에 결과 화면이 없어 토스트로 알린다
const claimMessage = (claim: StampClaim | null) => {
  if (!claim) return '도장을 찍지 못했어요. 다시 시도해 주세요.'
  if (claim.status === 'VERIFIED') return claim.alreadyEarned ? '이미 찍은 도장이에요.' : '도장을 찍었어요!'
  return claim.reason ?? '방문을 확인하고 있어요.'
}

// 드라이브 하단 패널의 휴게소 스탬프 탭: 도장판 · 휴게소 상세 · 도장 찍기 · 휴게소 검색
function StampsTab({ drive, currentCoordinate }: StampsTabProps) {
  const stamps = useStamps(drive)
  const search = useRestAreaSearch(currentCoordinate)
  const [claiming, setClaiming] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [busy, setBusy] = useState<'locate' | 'submit' | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const closeClaim = () => {
    setClaiming(false)
    setSelected(null)
  }

  const locate = async () => {
    if (!currentCoordinate) {
      setToast('현재 위치를 확인할 수 없어요. 휴게소 이름으로 검색해 주세요.')
      return
    }
    setBusy('locate')
    try {
      const { data } = await searchRestAreas({ coordinate: currentCoordinate, limit: 1 })
      const nearest = data.items[0]
      if (nearest) setSelected({ restArea: nearest, method: 'GPS' })
      else setToast('근처에 휴게소가 없어요. 휴게소 이름으로 검색해 주세요.')
    } catch {
      setToast('휴게소를 찾지 못했어요. 다시 시도해 주세요.')
    } finally {
      setBusy(null)
    }
  }

  const submit = async () => {
    if (!selected) return
    setBusy('submit')
    const claim = await stamps.claim(
      selected.restArea,
      selected.method,
      selected.method === 'GPS' ? currentCoordinate : null,
    )
    setBusy(null)
    if (claim) closeClaim()
    setToast(claimMessage(claim))
  }

  return (
    <>
      <StampBoard
        book={stamps.book}
        onStampClick={(area) => void stamps.openDetail(area.id)}
        onEmptyClick={() => setClaiming(true)}
      />

      {claiming && !searching && (
        <StampClaimModal
          restAreaName={selected?.restArea.name ?? null}
          locating={busy === 'locate'}
          submitting={busy === 'submit'}
          onLocate={() => void locate()}
          onSearchOpen={() => setSearching(true)}
          onSubmit={() => void submit()}
          onClose={closeClaim}
        />
      )}

      {searching && (
        <RestAreaSearchPage
          query={search.query}
          results={search.results}
          onQueryChange={search.setQuery}
          onSelect={(restArea) => {
            setSelected({ restArea, method: 'MANUAL' })
            setSearching(false)
          }}
          onClose={() => setSearching(false)}
        />
      )}

      {stamps.detail && <RestAreaDetailModal detail={stamps.detail} onClose={stamps.closeDetail} />}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

export default StampsTab
