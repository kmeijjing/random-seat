import type {
  CurrentDraft,
  DrawHistoryEntry,
  DrawSettings,
  FixedSeat,
  SavedState,
  SeatAssignment,
  SeatConfig,
  SeatLayout,
  SeatTemplate,
} from '../types'
import { createSeatLayout, getRecommendedLayouts } from './layout'

export const STORAGE_KEY = 'random-seat-app-state-v2'

const defaultDrawSettings: DrawSettings = {
  redrawMode: 'all',
  avoidPreviousSeat: true,
  balanceZones: true,
}

function createDefaultSeatConfig(): SeatConfig {
  const rows = 4
  const columns = 5

  return {
    rows,
    columns,
    layout: createSeatLayout(rows, columns),
    recommendedLayouts: getRecommendedLayouts(0),
  }
}

function createDefaultDraft(): CurrentDraft {
  return {
    participantInput: '',
    seatConfig: createDefaultSeatConfig(),
    fixedSeats: [],
    assignments: [],
    updatedAt: null,
    drawSettings: { ...defaultDrawSettings },
  }
}

const defaultState: SavedState = {
  currentDraft: createDefaultDraft(),
  templates: [],
  history: [],
  searchQuery: '',
  selectedParticipantsForRedraw: [],
}

function normalizeSeatConfig(
  seatConfig?: Partial<SeatConfig>,
): SeatConfig {
  const rows = Number.isFinite(seatConfig?.rows)
    ? Number(seatConfig?.rows)
    : defaultState.currentDraft.seatConfig.rows
  const columns = Number.isFinite(seatConfig?.columns)
    ? Number(seatConfig?.columns)
    : defaultState.currentDraft.seatConfig.columns
  const layout = normalizeLayout(seatConfig?.layout, rows, columns)

  return {
    rows,
    columns,
    layout,
    recommendedLayouts:
      Array.isArray(seatConfig?.recommendedLayouts) &&
      seatConfig.recommendedLayouts.length > 0
        ? seatConfig.recommendedLayouts
        : getRecommendedLayouts(0),
  }
}

function normalizeLayout(
  layout: Partial<SeatLayout> | undefined,
  rows: number,
  columns: number,
) {
  if (!layout || !Array.isArray(layout.cells)) {
    return createSeatLayout(rows, columns)
  }

  return createSeatLayout(rows, columns, layout.cells as SeatLayout['cells'])
}

function normalizeAssignments(assignments?: unknown): SeatAssignment[] {
  return Array.isArray(assignments) ? (assignments as SeatAssignment[]) : []
}

function normalizeFixedSeats(fixedSeats?: unknown): FixedSeat[] {
  return Array.isArray(fixedSeats) ? (fixedSeats as FixedSeat[]) : []
}

function normalizeTemplates(templates?: unknown): SeatTemplate[] {
  if (!Array.isArray(templates)) {
    return []
  }

  return templates.map((template) => {
    const typedTemplate = template as Partial<SeatTemplate>

    return {
      id: typedTemplate.id ?? crypto.randomUUID(),
      name: typedTemplate.name ?? '새 템플릿',
      participantInput: typedTemplate.participantInput ?? '',
      seatConfig: normalizeSeatConfig(typedTemplate.seatConfig),
      fixedSeats: normalizeFixedSeats(typedTemplate.fixedSeats),
      createdAt: typedTemplate.createdAt ?? new Date().toISOString(),
      updatedAt: typedTemplate.updatedAt ?? new Date().toISOString(),
    }
  })
}

function normalizeHistory(history?: unknown): DrawHistoryEntry[] {
  return Array.isArray(history) ? (history as DrawHistoryEntry[]) : []
}

function isLegacyState(value: unknown) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'participantInput' in (value as Record<string, unknown>) &&
      'seatConfig' in (value as Record<string, unknown>),
  )
}

function migrateLegacyState(parsed: Record<string, unknown>): SavedState {
  const participantInput =
    typeof parsed.participantInput === 'string' ? parsed.participantInput : ''
  const legacySeatConfig = parsed.seatConfig as { rows?: number; columns?: number } | undefined
  const rows = Number.isFinite(legacySeatConfig?.rows)
    ? Number(legacySeatConfig?.rows)
    : defaultState.currentDraft.seatConfig.rows
  const columns = Number.isFinite(legacySeatConfig?.columns)
    ? Number(legacySeatConfig?.columns)
    : defaultState.currentDraft.seatConfig.columns

  return {
    ...getDefaultState(),
    currentDraft: {
      ...createDefaultDraft(),
      participantInput,
      seatConfig: {
        rows,
        columns,
        layout: createSeatLayout(rows, columns),
        recommendedLayouts: getRecommendedLayouts(0),
      },
      assignments: normalizeAssignments(parsed.assignments),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    },
  }
}

export function getDefaultState(): SavedState {
  return {
    currentDraft: createDefaultDraft(),
    templates: [],
    history: [],
    searchQuery: '',
    selectedParticipantsForRedraw: [],
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
    const parsed = JSON.parse(saved) as Record<string, unknown>

    if (isLegacyState(parsed)) {
      return migrateLegacyState(parsed)
    }

    const currentDraft = (parsed.currentDraft as Partial<CurrentDraft>) ?? {}

    return {
      currentDraft: {
        participantInput:
          typeof currentDraft.participantInput === 'string'
            ? currentDraft.participantInput
            : '',
        seatConfig: normalizeSeatConfig(currentDraft.seatConfig),
        fixedSeats: normalizeFixedSeats(currentDraft.fixedSeats),
        assignments: normalizeAssignments(currentDraft.assignments),
        updatedAt:
          typeof currentDraft.updatedAt === 'string' ? currentDraft.updatedAt : null,
        drawSettings: {
          redrawMode:
            currentDraft.drawSettings?.redrawMode === 'selected'
              ? 'selected'
              : 'all',
          avoidPreviousSeat:
            typeof currentDraft.drawSettings?.avoidPreviousSeat === 'boolean'
              ? currentDraft.drawSettings.avoidPreviousSeat
              : defaultDrawSettings.avoidPreviousSeat,
          balanceZones:
            typeof currentDraft.drawSettings?.balanceZones === 'boolean'
              ? currentDraft.drawSettings.balanceZones
              : defaultDrawSettings.balanceZones,
        },
      },
      templates: normalizeTemplates(parsed.templates),
      history: normalizeHistory(parsed.history),
      searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
      selectedParticipantsForRedraw: Array.isArray(parsed.selectedParticipantsForRedraw)
        ? (parsed.selectedParticipantsForRedraw as string[])
        : [],
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
