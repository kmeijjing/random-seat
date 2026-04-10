import type { DrawHistoryEntry } from '../types'
import { saveState } from '../utils/storage'
import type { BrowserApi } from './browserApi'
import { createSeatStore } from './seatStore'

describe('seatStore', () => {
  let store: ReturnType<typeof createSeatStore>
  let mockBrowser: BrowserApi

  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()

    mockBrowser = {
      copyText: vi.fn().mockResolvedValue(undefined),
      print: vi.fn(),
      reload: vi.fn(),
      startTimer: vi.fn((cb: () => void, ms: number) =>
        setTimeout(cb, ms) as unknown as number,
      ),
      clearTimer: vi.fn((id: number) => clearTimeout(id)),
      notify: vi.fn(),
    }

    store = createSeatStore(mockBrowser)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps transient search and redraw selection out of persisted state', () => {
    store.getState().onParticipantInputChange('김하나\n박둘')
    store.getState().onSearchQueryChange('김하나')
    store.getState().onToggleRedrawParticipant('김하나-1')

    // Recreate store to simulate page reload
    const store2 = createSeatStore(mockBrowser)

    expect(store2.getState().participantInput).toBe('김하나\n박둘')
    expect(store2.getState().searchQuery).toBe('')
    expect(store2.getState().selectedParticipantsForRedraw).toEqual([])
  })

  it('runs full draw and selected redraw while preserving unselected seats', () => {
    store.getState().onParticipantInputChange('김하나\n박둘\n이셋')
    store.getState().onRunDraw('all')
    vi.advanceTimersByTime(700)

    const firstDrawAssignments = store.getState().assignments.map((a) => ({
      participantId: a.participant?.id,
      cellId: a.cellId,
    }))

    expect(store.getState().assignments).toHaveLength(3)
    expect(store.getState().history).toHaveLength(1)

    const selectedParticipantId = firstDrawAssignments[0].participantId!
    const preservedAssignments = firstDrawAssignments.filter(
      (a) => a.participantId !== selectedParticipantId,
    )

    store.getState().onToggleRedrawParticipant(selectedParticipantId)
    store.getState().onRunDraw('selected')
    vi.advanceTimersByTime(700)

    expect(store.getState().history).toHaveLength(2)
    expect(store.getState().statusMessage).toBe('선택한 학생들만 다시 뽑았습니다.')

    preservedAssignments.forEach((a) => {
      const current = store.getState().assignments.find(
        (item) => item.participant?.id === a.participantId,
      )
      expect(current?.cellId).toBe(a.cellId)
    })
  })

  it('saves templates, loads history, and clears stored data', () => {
    store.getState().onParticipantInputChange('김하나\n박둘')
    store.getState().onRunDraw('all')
    vi.advanceTimersByTime(700)

    store.getState().onSaveTemplate('저장 템플릿')
    expect(store.getState().templates).toHaveLength(1)
    expect(mockBrowser.notify).toHaveBeenCalledWith('success', expect.stringContaining('저장 템플릿'))

    const historyEntry: DrawHistoryEntry = store.getState().history[0]

    store.getState().onResetCurrentDraft()
    store.getState().onLoadTemplate(store.getState().templates[0])
    expect(store.getState().participantInput).toBe('김하나\n박둘')

    store.getState().onLoadHistory(historyEntry)
    expect(store.getState().updatedAt).toBe(historyEntry.timestamp)
    expect(store.getState().assignments).toHaveLength(2)

    store.getState().onClearAllStorage()
    expect(store.getState().participantInput).toBe('')
    expect(store.getState().templates).toEqual([])
    expect(store.getState().history).toEqual([])
  })

  it('restores persisted draft data from localStorage on initial load', () => {
    window.localStorage.clear()

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

    const store2 = createSeatStore(mockBrowser)

    expect(store2.getState().participantInput).toBe('최넷')
    expect(store2.getState().seatConfig.rows).toBe(3)
    expect(store2.getState().drawSettings.avoidPreviousSeat).toBe(false)
  })
})
