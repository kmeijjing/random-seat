import type { DrawHistoryEntry, DrawOptions, FixedSeat, Participant } from '../types'
import { createSeatLayout } from './layout'
import { generateAssignments } from './seating'

const participants: Participant[] = Array.from({ length: 6 }, (_, index) => ({
  id: `participant-${index + 1}`,
  name: `학생 ${index + 1}`,
}))

const baseOptions: DrawOptions = {
  redrawMode: 'all',
  avoidPreviousSeat: false,
  balanceZones: false,
  selectedParticipantIds: [],
}

describe('generateAssignments', () => {
  it('respects fixed seats and fills only usable seat cells', () => {
    const layout = createSeatLayout(2, 4)
    layout.cells.find((cell) => cell.id === '1-2')!.type = 'aisle'
    layout.cells.find((cell) => cell.id === '2-4')!.type = 'blocked'

    const fixedSeats: FixedSeat[] = [
      {
        participantId: 'participant-1',
        participantName: '학생 1',
        cellId: '1-1',
      },
    ]

    const assignments = generateAssignments({
      participants: participants.slice(0, 5),
      layout,
      fixedSeats,
      history: [],
      drawOptions: baseOptions,
      random: () => 0,
    })

    expect(assignments).toHaveLength(5)
    expect(assignments.find((assignment) => assignment.cellId === '1-1')?.participant?.name).toBe(
      '학생 1',
    )
    expect(assignments.every((assignment) => assignment.cellId !== '1-2')).toBe(true)
    expect(assignments.every((assignment) => assignment.cellId !== '2-4')).toBe(true)
  })

  it('avoids the immediate previous seat when an alternative exists', () => {
    const layout = createSeatLayout(2, 2)
    const history: DrawHistoryEntry[] = [
      {
        id: 'history-1',
        timestamp: '2026-03-31T00:00:00.000Z',
        assignments: [
          {
            seatNumber: 1,
            row: 1,
            column: 1,
            label: '1-1',
            cellId: '1-1',
            participant: participants[0],
            isFixed: false,
            zone: {
              vertical: 'front',
              horizontal: 'left',
            },
          },
        ],
        participantsSnapshot: [participants[0]],
        layoutSnapshot: layout,
        fixedSeatsSnapshot: [],
        optionsUsed: {
          ...baseOptions,
          avoidPreviousSeat: true,
        },
      },
    ]

    const assignments = generateAssignments({
      participants: [participants[0]],
      layout,
      fixedSeats: [],
      history,
      drawOptions: {
        ...baseOptions,
        avoidPreviousSeat: true,
      },
      random: () => 0,
    })

    expect(assignments[0].cellId).not.toBe('1-1')
  })

  it('preserves unselected participants during selected redraw', () => {
    const layout = createSeatLayout(2, 3)
    const currentAssignments = generateAssignments({
      participants: participants.slice(0, 4),
      layout,
      fixedSeats: [],
      history: [],
      drawOptions: baseOptions,
      random: () => 0,
    })

    const nextAssignments = generateAssignments({
      participants: participants.slice(0, 4),
      layout,
      fixedSeats: [],
      history: [],
      drawOptions: {
        ...baseOptions,
        redrawMode: 'selected',
        selectedParticipantIds: ['participant-1'],
      },
      currentAssignments,
      random: () => 0.7,
    })

    const untouchedBefore = currentAssignments.find(
      (assignment) => assignment.participant?.id === 'participant-2',
    )
    const untouchedAfter = nextAssignments.find(
      (assignment) => assignment.participant?.id === 'participant-2',
    )

    expect(untouchedAfter?.cellId).toBe(untouchedBefore?.cellId)
  })
})
