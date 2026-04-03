import { useCallback, useReducer } from 'react'
import type {
  DrawHistoryEntry,
  DrawSettings,
  FixedSeat,
  SavedState,
  SeatAssignment,
  SeatConfig,
  SeatTemplate,
} from '../types'
import { getDefaultState, loadSavedState } from '../utils/storage'

type Update<T> = T | ((current: T) => T)

export type SeatAppStore = {
  participantInput: string
  seatConfig: SeatConfig
  fixedSeats: FixedSeat[]
  assignments: SeatAssignment[]
  updatedAt: string | null
  drawSettings: DrawSettings
  templates: SeatTemplate[]
  history: DrawHistoryEntry[]
  searchQuery: string
  selectedParticipantsForRedraw: string[]
  errorMessage: string
  statusMessage: string
  isDrawing: boolean
  fixedParticipantId: string
  fixedCellId: string
  isTemplateDrawerOpen: boolean
  isHistoryDrawerOpen: boolean
  isAdvancedOpen: boolean
  isSeatEditorOpen: boolean
  isRedrawPickerOpen: boolean
}

type SeatAppStateAction =
  | {
    type: 'apply'
    recipe: (current: SeatAppStore) => SeatAppStore
  }
  | {
    type: 'reset-current-draft'
  }
  | {
    type: 'clear-stored-data'
  }

function createStore(savedState: SavedState): SeatAppStore {
  return {
    participantInput: savedState.currentDraft.participantInput,
    seatConfig: savedState.currentDraft.seatConfig,
    fixedSeats: savedState.currentDraft.fixedSeats,
    assignments: savedState.currentDraft.assignments,
    updatedAt: savedState.currentDraft.updatedAt,
    drawSettings: savedState.currentDraft.drawSettings,
    templates: savedState.templates,
    history: savedState.history,
    searchQuery: '',
    selectedParticipantsForRedraw: [],
    errorMessage: '',
    statusMessage: '',
    isDrawing: false,
    fixedParticipantId: '',
    fixedCellId: '',
    isTemplateDrawerOpen: false,
    isHistoryDrawerOpen: false,
    isAdvancedOpen: false,
    isSeatEditorOpen: false,
    isRedrawPickerOpen: false,
  }
}

function buildPersistedState(store: SeatAppStore): SavedState {
  return {
    currentDraft: {
      participantInput: store.participantInput,
      seatConfig: store.seatConfig,
      fixedSeats: store.fixedSeats,
      assignments: store.assignments,
      updatedAt: store.updatedAt,
      drawSettings: store.drawSettings,
    },
    templates: store.templates,
    history: store.history,
  }
}

function reducer(current: SeatAppStore, action: SeatAppStateAction): SeatAppStore {
  if (action.type === 'apply') {
    return action.recipe(current)
  }

  if (action.type === 'reset-current-draft') {
    const defaults = createStore(getDefaultState())

    return {
      ...current,
      participantInput: defaults.participantInput,
      seatConfig: defaults.seatConfig,
      fixedSeats: defaults.fixedSeats,
      assignments: defaults.assignments,
      updatedAt: defaults.updatedAt,
      drawSettings: defaults.drawSettings,
      searchQuery: '',
      selectedParticipantsForRedraw: [],
      errorMessage: '',
      statusMessage: '',
      isDrawing: false,
      fixedParticipantId: '',
      fixedCellId: '',
      isRedrawPickerOpen: false,
    }
  }

  const defaults = createStore(getDefaultState())

  return {
    ...current,
    participantInput: defaults.participantInput,
    seatConfig: defaults.seatConfig,
    fixedSeats: defaults.fixedSeats,
    assignments: defaults.assignments,
    updatedAt: defaults.updatedAt,
    drawSettings: defaults.drawSettings,
    templates: [],
    history: [],
    searchQuery: '',
    selectedParticipantsForRedraw: [],
    errorMessage: '',
    statusMessage: '',
    isDrawing: false,
    fixedParticipantId: '',
    fixedCellId: '',
    isRedrawPickerOpen: false,
  }
}

function resolveUpdate<T>(current: T, update: Update<T>) {
  return typeof update === 'function'
    ? (update as (value: T) => T)(current)
    : update
}

export function useSeatAppState() {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createStore(loadSavedState()),
  )

  const apply = useCallback((recipe: (current: SeatAppStore) => SeatAppStore) => {
    dispatch({ type: 'apply', recipe })
  }, [])

  const updateField = useCallback(<Key extends keyof SeatAppStore>(
    key: Key,
    update: Update<SeatAppStore[Key]>,
  ) => {
    apply((current) => {
      const nextValue = resolveUpdate(current[key], update)

      if (Object.is(nextValue, current[key])) {
        return current
      }

      return {
        ...current,
        [key]: nextValue,
      }
    })
  }, [apply])

  const persistedState = buildPersistedState(state)

  const setFixedSeats = useCallback(
    (update: Update<FixedSeat[]>) => updateField('fixedSeats', update),
    [updateField],
  )
  const setSelectedParticipantsForRedraw = useCallback(
    (update: Update<string[]>) => updateField('selectedParticipantsForRedraw', update),
    [updateField],
  )

  return {
    state,
    persistedState,
    setParticipantInput: (value: string) => updateField('participantInput', value),
    setSeatConfig: (update: Update<SeatConfig>) => updateField('seatConfig', update),
    setFixedSeats,
    setAssignments: (update: Update<SeatAssignment[]>) => updateField('assignments', update),
    setUpdatedAt: (value: string | null) => updateField('updatedAt', value),
    setDrawSettings: (update: Update<DrawSettings>) => updateField('drawSettings', update),
    setTemplates: (update: Update<SeatTemplate[]>) => updateField('templates', update),
    setHistory: (update: Update<DrawHistoryEntry[]>) => updateField('history', update),
    setSearchQuery: (value: string) => updateField('searchQuery', value),
    setSelectedParticipantsForRedraw,
    toggleSelectedParticipantForRedraw: (participantId: string) =>
      updateField('selectedParticipantsForRedraw', (current) =>
        current.includes(participantId)
          ? current.filter((value) => value !== participantId)
          : [...current, participantId],
      ),
    setErrorMessage: (value: string) => updateField('errorMessage', value),
    setStatusMessage: (value: string) => updateField('statusMessage', value),
    setIsDrawing: (value: boolean) => updateField('isDrawing', value),
    setFixedParticipantId: (value: string) => updateField('fixedParticipantId', value),
    setFixedCellId: (value: string) => updateField('fixedCellId', value),
    setIsTemplateDrawerOpen: (update: Update<boolean>) =>
      updateField('isTemplateDrawerOpen', update),
    setIsHistoryDrawerOpen: (update: Update<boolean>) =>
      updateField('isHistoryDrawerOpen', update),
    setIsAdvancedOpen: (update: Update<boolean>) => updateField('isAdvancedOpen', update),
    setIsSeatEditorOpen: (update: Update<boolean>) =>
      updateField('isSeatEditorOpen', update),
    setIsRedrawPickerOpen: (update: Update<boolean>) =>
      updateField('isRedrawPickerOpen', update),
    clearCurrentAssignments: () =>
      apply((current) => {
        if (
          current.assignments.length === 0 &&
          current.updatedAt === null &&
          current.selectedParticipantsForRedraw.length === 0 &&
          !current.isRedrawPickerOpen
        ) {
          return current
        }

        return {
          ...current,
          assignments: [],
          updatedAt: null,
          selectedParticipantsForRedraw: [],
          isRedrawPickerOpen: false,
        }
      }),
    resetCurrentDraft: () => dispatch({ type: 'reset-current-draft' }),
    clearStoredData: () => dispatch({ type: 'clear-stored-data' }),
  }
}
