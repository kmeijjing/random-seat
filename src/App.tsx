import { useEffect } from 'react'
import { AppHeader } from './components/AppHeader'
import { DrawerOverlay } from './components/DrawerOverlay'
import { DrawActionPanel } from './components/DrawActionPanel'
import { ParticipantInputPanel } from './components/ParticipantInputPanel'
import { ResultPanel } from './components/ResultPanel'
import { SeatConfigPanel } from './components/SeatConfigPanel'
import { useSeatStore } from './store/seatStore'

function App() {
  useEffect(() => {
    return () => useSeatStore.getState()._clearDrawTimer()
  }, [])

  return (
    <div className="mx-auto grid min-h-screen w-[min(1520px,calc(100%-28px))] grid-rows-[auto_1fr] gap-3 pt-16 pb-3 antialiased max-[900px]:w-[min(calc(100%-20px),1520px)] max-[900px]:pt-40 print:block print:min-h-auto print:w-full print:bg-white print:p-0">
      <AppHeader />

      <main className="grid min-h-0 gap-3 grid-cols-[minmax(360px,430px)_minmax(0,1fr)] max-[1280px]:grid-cols-1 print:block print:min-h-auto print:w-full print:gap-0">
        <aside className="grid min-h-0 auto-rows-max gap-3 print:hidden">
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
