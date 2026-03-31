import type { Participant, SeatAssignment, SeatConfig } from '../types'

function getSeatLabel(row: number, column: number) {
  return `${row}-${column}`
}

export function createSeatAssignments(
  participants: Participant[],
  seatConfig: SeatConfig,
  random = Math.random,
): SeatAssignment[] {
  const totalSeats = seatConfig.rows * seatConfig.columns

  if (participants.length > totalSeats) {
    throw new Error('참여자 수가 좌석 수보다 많습니다.')
  }

  const shuffled = [...participants]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  const assignments: SeatAssignment[] = []

  for (let row = 1; row <= seatConfig.rows; row += 1) {
    for (let column = 1; column <= seatConfig.columns; column += 1) {
      const seatNumber = assignments.length + 1

      assignments.push({
        seatNumber,
        row,
        column,
        label: getSeatLabel(row, column),
        participant: shuffled[seatNumber - 1] ?? null,
      })
    }
  }

  return assignments
}
