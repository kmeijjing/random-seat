import { useEffect } from 'react'
import { AppHeader } from './components/AppHeader'
import { DrawerOverlay } from './components/DrawerOverlay'
import { DrawActionPanel } from './components/DrawActionPanel'
import { ParticipantInputPanel } from './components/ParticipantInputPanel'
import { ResultPanel } from './components/ResultPanel'
import { SeatConfigPanel } from './components/SeatConfigPanel'
import { flowRailClass, shellClass, workspaceClass } from './components/ui'
import { useSeatStore } from './store/seatStore'

function App() {
  useEffect(() => {
    return () => useSeatStore.getState()._clearDrawTimer()
  }, [])

  return (
    <div className={shellClass}>
      <AppHeader />

      <main className={workspaceClass}>
        <aside className={flowRailClass}>
          <ParticipantInputPanel />
          <SeatConfigPanel />
          <DrawActionPanel />
        </aside>

        <ResultPanel />
      </main>

      <DrawerOverlay />
    </div>
  )
}

export default App
