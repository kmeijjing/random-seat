export type Participant = {
  id: string
  name: string
}

export type SeatConfig = {
  rows: number
  columns: number
}

export type SeatAssignment = {
  seatNumber: number
  row: number
  column: number
  label: string
  participant: Participant | null
}

export type SavedState = {
  participantInput: string
  seatConfig: SeatConfig
  assignments: SeatAssignment[]
  updatedAt: string | null
}
