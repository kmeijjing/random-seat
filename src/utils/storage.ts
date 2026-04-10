import type {
  CurrentDraft,
  DrawHistoryEntry,
  DrawOptions,
  DrawSettings,
  FixedSeat,
  Participant,
  SavedState,
  SeatAssignment,
  SeatCell,
  SeatCellType,
  SeatConfig,
  SeatLayout,
  SeatTemplate,
  SeatZone,
} from '../types'
import { createSeatLayout } from './layout'

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
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isSeatCellType(value: unknown): value is SeatCellType {
  return value === 'seat' || value === 'aisle' || value === 'blocked'
}

function normalizeInteger(value: unknown, fallback: number) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeParticipant(value: unknown): Participant | null {
  if (!isRecord(value)) {
    return null
  }

  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    displayName: typeof value.displayName === 'string' ? value.displayName : value.name,
  }
}

function normalizeSeatZone(value: unknown): SeatZone {
  if (!isRecord(value)) {
    return { vertical: 'front', horizontal: 'left' }
  }

  return {
    vertical: value.vertical === 'back' ? 'back' : 'front',
    horizontal: value.horizontal === 'right' ? 'right' : 'left',
  }
}

function normalizeSeatCell(value: unknown): SeatCell | null {
  if (!isRecord(value)) {
    return null
  }

  if (typeof value.id !== 'string' || !isSeatCellType(value.type)) {
    return null
  }

  return {
    id: value.id,
    row: Number.isInteger(value.row) ? Number(value.row) : 0,
    column: Number.isInteger(value.column) ? Number(value.column) : 0,
    label: typeof value.label === 'string' ? value.label : value.id,
    type: value.type,
  }
}

function normalizeLayout(
  layout: unknown,
  rows: number,
  columns: number,
): SeatLayout {
  if (!isRecord(layout) || !Array.isArray(layout.cells)) {
    return createSeatLayout(rows, columns)
  }

  const existingCells = layout.cells
    .map((cell) => normalizeSeatCell(cell))
    .filter((cell): cell is SeatCell => cell !== null)

  return createSeatLayout(rows, columns, existingCells)
}

function normalizeSeatConfig(seatConfig?: unknown): SeatConfig {
  const source = isRecord(seatConfig) ? seatConfig : undefined
  const rows = normalizeInteger(
    source?.rows,
    defaultState.currentDraft.seatConfig.rows,
  )
  const columns = normalizeInteger(
    source?.columns,
    defaultState.currentDraft.seatConfig.columns,
  )

  return {
    rows,
    columns,
    layout: normalizeLayout(source?.layout, rows, columns),
  }
}

function normalizeFixedSeat(value: unknown): FixedSeat | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.participantId !== 'string' ||
    typeof value.participantName !== 'string' ||
    typeof value.cellId !== 'string'
  ) {
    return null
  }

  return {
    participantId: value.participantId,
    participantName: value.participantName,
    cellId: value.cellId,
  }
}

function normalizeFixedSeats(value?: unknown): FixedSeat[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => normalizeFixedSeat(item))
    .filter((item): item is FixedSeat => item !== null)
}

function normalizeSeatAssignment(value: unknown): SeatAssignment | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    !Number.isFinite(value.seatNumber) ||
    !Number.isFinite(value.row) ||
    !Number.isFinite(value.column) ||
    typeof value.label !== 'string' ||
    typeof value.cellId !== 'string'
  ) {
    return null
  }

  return {
    seatNumber: Number(value.seatNumber),
    row: Number(value.row),
    column: Number(value.column),
    label: value.label,
    cellId: value.cellId,
    participant: value.participant === null ? null : normalizeParticipant(value.participant),
    isFixed: normalizeBoolean(value.isFixed, false),
    zone: normalizeSeatZone(value.zone),
  }
}

function normalizeAssignments(value?: unknown): SeatAssignment[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => normalizeSeatAssignment(item))
    .filter((item): item is SeatAssignment => item !== null)
}

function normalizeDrawSettings(value?: unknown): DrawSettings {
  const source = isRecord(value) ? value : undefined

  return {
    redrawMode: source?.redrawMode === 'selected' ? 'selected' : 'all',
    avoidPreviousSeat: normalizeBoolean(
      source?.avoidPreviousSeat,
      defaultDrawSettings.avoidPreviousSeat,
    ),
    balanceZones: normalizeBoolean(
      source?.balanceZones,
      defaultDrawSettings.balanceZones,
    ),
  }
}

function normalizeDrawOptions(value?: unknown): DrawOptions {
  const source = isRecord(value) ? value : undefined

  return {
    ...normalizeDrawSettings(source),
    selectedParticipantIds: Array.isArray(source?.selectedParticipantIds)
      ? source.selectedParticipantIds.filter(
        (participantId): participantId is string => typeof participantId === 'string',
      )
      : [],
  }
}

function normalizeCurrentDraft(value?: unknown): CurrentDraft {
  const source = isRecord(value) ? value : undefined

  return {
    participantInput: normalizeString(source?.participantInput),
    seatConfig: normalizeSeatConfig(source?.seatConfig),
    fixedSeats: normalizeFixedSeats(source?.fixedSeats),
    assignments: normalizeAssignments(source?.assignments),
    updatedAt: typeof source?.updatedAt === 'string' ? source.updatedAt : null,
    drawSettings: normalizeDrawSettings(source?.drawSettings),
  }
}

function normalizeTemplate(value: unknown): SeatTemplate | null {
  if (!isRecord(value)) {
    return null
  }

  if (typeof value.name !== 'string' || !('seatConfig' in value)) {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
    name: value.name,
    participantInput: normalizeString(value.participantInput),
    seatConfig: normalizeSeatConfig(value.seatConfig),
    fixedSeats: normalizeFixedSeats(value.fixedSeats),
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof value.updatedAt === 'string'
        ? value.updatedAt
        : new Date().toISOString(),
  }
}

function normalizeTemplates(value?: unknown): SeatTemplate[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((template) => normalizeTemplate(template))
    .filter((template): template is SeatTemplate => template !== null)
}

function normalizeHistoryEntry(value: unknown): DrawHistoryEntry | null {
  if (!isRecord(value)) {
    return null
  }

  if (typeof value.id !== 'string' || typeof value.timestamp !== 'string') {
    return null
  }

  const layoutSource = isRecord(value.layoutSnapshot) ? value.layoutSnapshot : undefined
  const rows = normalizeInteger(
    layoutSource?.rows,
    defaultState.currentDraft.seatConfig.rows,
  )
  const columns = normalizeInteger(
    layoutSource?.columns,
    defaultState.currentDraft.seatConfig.columns,
  )

  return {
    id: value.id,
    timestamp: value.timestamp,
    assignments: normalizeAssignments(value.assignments),
    participantsSnapshot: Array.isArray(value.participantsSnapshot)
      ? value.participantsSnapshot
        .map((participant) => normalizeParticipant(participant))
        .filter((participant): participant is Participant => participant !== null)
      : [],
    layoutSnapshot: normalizeLayout(value.layoutSnapshot, rows, columns),
    fixedSeatsSnapshot: normalizeFixedSeats(value.fixedSeatsSnapshot),
    optionsUsed: normalizeDrawOptions(value.optionsUsed),
  }
}

function normalizeHistory(value?: unknown): DrawHistoryEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => normalizeHistoryEntry(entry))
    .filter((entry): entry is DrawHistoryEntry => entry !== null)
}

function isLegacyState(value: unknown) {
  return Boolean(
    isRecord(value) &&
      'participantInput' in value &&
      'seatConfig' in value,
  )
}

function migrateLegacyState(parsed: Record<string, unknown>): SavedState {
  return {
    currentDraft: {
      ...createDefaultDraft(),
      participantInput: normalizeString(parsed.participantInput),
      seatConfig: normalizeSeatConfig(parsed.seatConfig),
      fixedSeats: normalizeFixedSeats(parsed.fixedSeats),
      assignments: normalizeAssignments(parsed.assignments),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
      drawSettings: normalizeDrawSettings(parsed.drawSettings),
    },
    templates: normalizeTemplates(parsed.templates),
    history: normalizeHistory(parsed.history),
  }
}

export function getDefaultState(): SavedState {
  return {
    currentDraft: createDefaultDraft(),
    templates: [],
    history: [],
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
    const parsed = JSON.parse(saved) as unknown

    if (!isRecord(parsed)) {
      return getDefaultState()
    }

    if (isLegacyState(parsed)) {
      return migrateLegacyState(parsed)
    }

    return {
      currentDraft: normalizeCurrentDraft(parsed.currentDraft),
      templates: normalizeTemplates(parsed.templates),
      history: normalizeHistory(parsed.history),
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
