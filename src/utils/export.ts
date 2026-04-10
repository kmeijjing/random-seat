import type { SeatAssignment, SeatLayout } from '../types'

export function buildSeatTableText(
  layout: SeatLayout,
  assignments: SeatAssignment[],
) {
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.cellId, assignment]))

  return layout.cells
    .filter((cell) => cell.type === 'seat')
    .map((cell) => {
      const assignment = assignmentMap.get(cell.id)

      return `${cell.label}: ${assignment?.participant?.displayName ?? '빈자리'}`
    })
    .join('\n')
}
