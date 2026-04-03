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

  it('clears saved state from localStorage', () => {
    saveState(getDefaultState())
    clearSavedState()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
