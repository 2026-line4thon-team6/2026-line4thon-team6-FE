import { useContext } from 'react'
import { RadioPlayerContext } from './radioPlayerContext'

function useRadioPlayer() {
  const player = useContext(RadioPlayerContext)
  if (!player) throw new Error('RadioPlayerProvider 안에서 써야 해요.')
  return player
}

export default useRadioPlayer
