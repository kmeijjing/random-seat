import type { SavedState } from '../types'
import {
  STORAGE_KEY,
  clearSavedState,
  getDefaultState,
  loadSavedState,
  saveState,
} from './storage'

describe('storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns a default state when nothing is saved', () => {
    const state = loadSavedState()

    expect(state.currentDraft.participantInput).toBe('')
    expect(state.templates).toEqual([])
    expect(state.history).toEqual([])
  })

  it('saves and loads the extended saved state', () => {
    const state: SavedState = {
      ...getDefaultState(),
      currentDraft: {
        ...getDefaultState().currentDraft,
        participantInput: '김하나\n박둘',
      },
    }

    saveState(state)

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy()

    const loaded = loadSavedState()

    expect(loaded.currentDraft.participantInput).toBe('김하나\n박둘')
  })

  it('drops malformed assignments and repairs broken layout cells', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentDraft: {
          participantInput: '김하나',
          seatConfig: {
            rows: 2,
            columns: 2,
            layout: {
              rows: 999,
              columns: 999,
              cells: [
                { id: '1-1', type: 'blocked' },
                { id: 123, type: 'seat' },
              ],
            },
          },
          assignments: [
            {
              seatNumber: 1,
              row: 1,
              column: 1,
              label: '1-1',
              cellId: '1-1',
              participant: { id: '김하나-1', name: '김하나' },
              isFixed: false,
              zone: { vertical: 'front', horizontal: 'left' },
            },
            { broken: true },
          ],
        },
      }),
    )

    const loaded = loadSavedState()

    expect(loaded.currentDraft.assignments).toHaveLength(1)
    expect(loaded.currentDraft.seatConfig.layout.rows).toBe(2)
    expect(loaded.currentDraft.seatConfig.layout.columns).toBe(2)
    expect(
      loaded.currentDraft.seatConfig.layout.cells.find((cell) => cell.id === '1-1')?.type,
    ).toBe('blocked')
  })

  it('filters malformed templates and history entries', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentDraft: getDefaultState().currentDraft,
        templates: [
          {
            id: 'template-1',
            name: 'A반',
            participantInput: '김하나\n박둘',
            seatConfig: { rows: 3, columns: 3, layout: { rows: 3, columns: 3, cells: [] } },
            fixedSeats: [{ participantId: '김하나-1', participantName: '김하나', cellId: '1-1' }],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-02T00:00:00.000Z',
          },
          { broken: true },
        ],
        history: [
          {
            id: 'history-1',
            timestamp: '2025-01-03T00:00:00.000Z',
            assignments: [{ broken: true }],
            participantsSnapshot: [{ id: '김하나-1', name: '김하나' }, { nope: true }],
            layoutSnapshot: {
              rows: 2,
              columns: 2,
              cells: [{ id: '1-1', type: 'blocked' }],
            },
            fixedSeatsSnapshot: [{ participantId: '김하나-1', participantName: '김하나', cellId: '1-1' }],
            optionsUsed: {
              redrawMode: 'selected',
              avoidPreviousSeat: false,
              balanceZones: true,
              selectedParticipantIds: ['김하나-1', 123],
            },
          },
          { timestamp: 'missing-id' },
        ],
      }),
    )

    const loaded = loadSavedState()

    expect(loaded.templates).toHaveLength(1)
    expect(loaded.templates[0].name).toBe('A반')
    expect(loaded.history).toHaveLength(1)
    expect(loaded.history[0].participantsSnapshot).toHaveLength(1)
    expect(loaded.history[0].assignments).toEqual([])
    expect(loaded.history[0].optionsUsed.selectedParticipantIds).toEqual(['김하나-1'])
  })

  it('migrates legacy state without persisting removed seat recommendations', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        participantInput: '김하나',
        seatConfig: {
          rows: 3,
          columns: 4,
          recommendedLayouts: [{ rows: 9, columns: 9 }],
        },
        assignments: [],
        updatedAt: '2025-01-01T00:00:00.000Z',
      }),
    )

    const loaded = loadSavedState()

    expect(loaded.currentDraft.participantInput).toBe('김하나')
    expect(loaded.currentDraft.seatConfig.rows).toBe(3)
    expect('recommendedLayouts' in loaded.currentDraft.seatConfig).toBe(false)
  })

  it('clears saved state from localStorage', () => {
    saveState(getDefaultState())
    clearSavedState()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
