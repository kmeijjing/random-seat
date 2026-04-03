export type Participant = {
  id: string
  name: string
}

export type SeatCellType = 'seat' | 'aisle' | 'blocked'

export type SeatZone = {
  vertical: 'front' | 'back'
  horizontal: 'left' | 'right'
}

export type SeatCell = {
  id: string
  row: number
  column: number
  label: string
  type: SeatCellType
}

export type SeatLayout = {
  rows: number
  columns: number
  cells: SeatCell[]
}

export type SeatRecommendation = {
  rows: number
  columns: number
  seatCount: number
  emptyCount: number
  label: string
}

export type SeatConfig = {
  rows: number
  columns: number
  layout: SeatLayout
}

export type FixedSeat = {
  participantId: string
  participantName: string
  cellId: string
}

export type SeatAssignment = {
  seatNumber: number
  row: number
  column: number
  label: string
  cellId: string
  participant: Participant | null
  isFixed: boolean
  zone: SeatZone
}

export type DrawSettings = {
  redrawMode: 'all' | 'selected'
  avoidPreviousSeat: boolean
  balanceZones: boolean
}

export type DrawOptions = DrawSettings & {
  selectedParticipantIds: string[]
}

export type BalanceStats = {
  front: number
  back: number
  left: number
  right: number
}

export type CurrentDraft = {
  participantInput: string
  seatConfig: SeatConfig
  fixedSeats: FixedSeat[]
  assignments: SeatAssignment[]
  updatedAt: string | null
  drawSettings: DrawSettings
}

export type SeatTemplate = {
  id: string
  name: string
  participantInput: string
  seatConfig: SeatConfig
  fixedSeats: FixedSeat[]
  createdAt: string
  updatedAt: string
}

export type DrawHistoryEntry = {
  id: string
  timestamp: string
  assignments: SeatAssignment[]
  participantsSnapshot: Participant[]
  layoutSnapshot: SeatLayout
  fixedSeatsSnapshot: FixedSeat[]
  optionsUsed: DrawOptions
}

export type SavedState = {
  currentDraft: CurrentDraft
  templates: SeatTemplate[]
  history: DrawHistoryEntry[]
}
