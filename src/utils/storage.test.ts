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
      searchQuery: '김하나',
      selectedParticipantsForRedraw: ['김하나-0'],
    }

    saveState(state)

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy()
    expect(loadSavedState().searchQuery).toBe('김하나')
    expect(loadSavedState().selectedParticipantsForRedraw).toEqual(['김하나-0'])
  })

  it('clears saved state from localStorage', () => {
    saveState(getDefaultState())
    clearSavedState()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
