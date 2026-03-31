import type { SavedState } from '../types'

export const STORAGE_KEY = 'random-seat-app-state'

const defaultState: SavedState = {
  participantInput: '',
  seatConfig: {
    rows: 4,
    columns: 5,
  },
  assignments: [],
  updatedAt: null,
}

export function getDefaultState(): SavedState {
  return {
    participantInput: defaultState.participantInput,
    seatConfig: { ...defaultState.seatConfig },
    assignments: [],
    updatedAt: defaultState.updatedAt,
  }
}

export function loadSavedState(): SavedState {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return getDefaultState()
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SavedState>
    const rows = parsed.seatConfig?.rows ?? defaultState.seatConfig.rows
    const columns = parsed.seatConfig?.columns ?? defaultState.seatConfig.columns

    return {
      participantInput:
        typeof parsed.participantInput === 'string' ? parsed.participantInput : '',
      seatConfig: {
        rows: Number.isFinite(rows) ? rows : defaultState.seatConfig.rows,
        columns: Number.isFinite(columns)
          ? columns
          : defaultState.seatConfig.columns,
      },
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    }
  } catch {
    return getDefaultState()
  }
}

export function saveState(state: SavedState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearSavedState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
