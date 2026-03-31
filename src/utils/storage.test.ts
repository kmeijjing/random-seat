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
    expect(loadSavedState()).toEqual(getDefaultState())
  })

  it('saves and loads the last assignment state', () => {
    const state: SavedState = {
      participantInput: '김하나\n박둘',
      seatConfig: { rows: 2, columns: 2 },
      assignments: [
        {
          seatNumber: 1,
          row: 1,
          column: 1,
          label: '1-1',
          participant: { id: '김하나-0', name: '김하나' },
        },
      ],
      updatedAt: '2026-03-30T00:00:00.000Z',
    }

    saveState(state)

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy()
    expect(loadSavedState()).toEqual(state)
  })

  it('clears saved state from localStorage', () => {
    saveState(getDefaultState())
    clearSavedState()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
