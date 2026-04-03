import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import type { DrawHistoryEntry } from '../types'
import { saveState } from '../utils/storage'
import { useSeatApp } from './useSeatApp'

type HookHarnessState = ReturnType<typeof useSeatApp>

let latestApp: HookHarnessState | null = null

type HookHarnessProps = {
  onRender: (app: HookHarnessState) => void
}

function HookHarness({ onRender }: HookHarnessProps) {
  const app = useSeatApp()

  useEffect(() => {
    onRender(app)
  }, [app, onRender])

  return null
}

function renderHookHarness() {
  const container = document.createElement('div')
  const root = createRoot(container)

  act(() => {
    root.render(<HookHarness onRender={(app) => { latestApp = app }} />)
  })

  return { container, root }
}

function getApp() {
  if (!latestApp) {
    throw new Error('hook not rendered')
  }

  return latestApp
}

describe('useSeatApp', () => {
  let root: Root | null = null
  let confirmSpy: ReturnType<typeof vi.fn>
  let promptSpy: ReturnType<typeof vi.fn>
  let clipboardSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    latestApp = null
    window.localStorage.clear()
    vi.useFakeTimers()
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

    confirmSpy = vi.fn(() => true)
    promptSpy = vi.fn(() => '저장 템플릿')
    clipboardSpy = vi.fn().mockResolvedValue(undefined)

    window.confirm = confirmSpy
    window.prompt = promptSpy
    window.print = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardSpy,
      },
    })

    const rendered = renderHookHarness()
    root = rendered.root
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    root = null
    vi.useRealTimers()
  })

  it('keeps transient search and redraw selection out of persisted state', () => {
    act(() => {
      getApp().onParticipantInputChange('김하나\n박둘')
    })

    act(() => {
      getApp().onSearchQueryChange('김하나')
      getApp().onToggleRedrawParticipant('김하나-1')
    })

    act(() => {
      root?.unmount()
    })

    const rerendered = renderHookHarness()
    root = rerendered.root

    expect(getApp().participantInput).toBe('김하나\n박둘')
    expect(getApp().searchQuery).toBe('')
    expect(getApp().selectedParticipantsForRedraw).toEqual([])
  })

  it('runs full draw and selected redraw while preserving unselected seats', () => {
    act(() => {
      getApp().onParticipantInputChange('김하나\n박둘\n이셋')
    })

    act(() => {
      getApp().onRunDraw('all')
      vi.advanceTimersByTime(700)
    })

    const firstDrawAssignments = getApp().assignments.map((assignment) => ({
      participantId: assignment.participant?.id,
      cellId: assignment.cellId,
    }))

    expect(getApp().assignments).toHaveLength(3)
    expect(getApp().history).toHaveLength(1)

    const selectedParticipantId = firstDrawAssignments[0].participantId!
    const preservedAssignments = firstDrawAssignments.filter(
      (assignment) => assignment.participantId !== selectedParticipantId,
    )

    act(() => {
      getApp().onToggleRedrawParticipant(selectedParticipantId)
    })

    act(() => {
      getApp().onRunDraw('selected')
      vi.advanceTimersByTime(700)
    })

    expect(getApp().history).toHaveLength(2)
    expect(getApp().statusMessage).toBe('선택한 학생들만 다시 뽑았습니다.')

    preservedAssignments.forEach((assignment) => {
      const currentAssignment = getApp().assignments.find(
        (item) => item.participant?.id === assignment.participantId,
      )

      expect(currentAssignment?.cellId).toBe(assignment.cellId)
    })
  })

  it('saves templates, loads history, and clears stored data', () => {
    act(() => {
      getApp().onParticipantInputChange('김하나\n박둘')
    })

    act(() => {
      getApp().onRunDraw('all')
      vi.advanceTimersByTime(700)
    })

    act(() => {
      getApp().onSaveTemplate()
    })

    expect(getApp().templates).toHaveLength(1)
    expect(promptSpy).toHaveBeenCalled()

    const historyEntry: DrawHistoryEntry = getApp().history[0]

    act(() => {
      getApp().onResetCurrentDraft()
      getApp().onLoadTemplate(getApp().templates[0])
    })

    expect(getApp().participantInput).toBe('김하나\n박둘')

    act(() => {
      getApp().onLoadHistory(historyEntry)
    })

    expect(getApp().updatedAt).toBe(historyEntry.timestamp)
    expect(getApp().assignments).toHaveLength(2)

    act(() => {
      getApp().onClearAllStorage()
    })

    expect(confirmSpy).toHaveBeenCalled()
    expect(getApp().participantInput).toBe('')
    expect(getApp().templates).toEqual([])
    expect(getApp().history).toEqual([])
  })

  it('restores persisted draft data from localStorage on initial load', () => {
    act(() => {
      root?.unmount()
    })
    root = null

    saveState({
      currentDraft: {
        participantInput: '최넷',
        seatConfig: {
          rows: 3,
          columns: 3,
          layout: {
            rows: 3,
            columns: 3,
            cells: [],
          },
        },
        fixedSeats: [],
        assignments: [],
        updatedAt: null,
        drawSettings: {
          redrawMode: 'all',
          avoidPreviousSeat: false,
          balanceZones: false,
        },
      },
      templates: [],
      history: [],
    })

    const rerendered = renderHookHarness()
    root = rerendered.root

    expect(getApp().participantInput).toBe('최넷')
    expect(getApp().seatConfig.rows).toBe(3)
    expect(getApp().drawSettings.avoidPreviousSeat).toBe(false)
  })
})
