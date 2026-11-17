import { useState } from 'react'
import { searchRestAreas } from '@/api/restAreas'
import Toast from '@/components/Toast/Toast'
import useRestAreaDetail from '@/hooks/useRestAreaDetail'
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

const claimMessage = (claim: StampClaim | null) => {
  if (!claim) return '도장을 찍지 못했어요. 다시 시도해 주세요.'
  if (claim.status === 'VERIFIED') return claim.alreadyEarned ? '이미 찍은 도장이에요.' : '도장을 찍었어요!'
  return claim.reason ?? '방문을 확인하고 있어요.'
}

function StampsTab({ drive, currentCoordinate }: StampsTabProps) {
  const search = useRestAreaSearch(currentCoordinate)
  const detail = useRestAreaDetail()
  const [claiming, setClaiming] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [busy, setBusy] = useState<'locate' | 'submit' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const stamps = useStamps(drive, (claim) => setToast(claimMessage(claim)))

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
        onStampClick={(area) => void detail.open(area.id)}
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

      {detail.detail && <RestAreaDetailModal detail={detail.detail} onClose={detail.close} />}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

export default StampsTab
