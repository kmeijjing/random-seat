import type {
  BalanceStats,
  DrawHistoryEntry,
  DrawOptions,
  FixedSeat,
  Participant,
  SeatAssignment,
  SeatCell,
  SeatLayout,
} from '../types'
import {
  countUsableSeats,
  getCellById,
  getSeatNumberMap,
  getSeatZone,
  getUsableSeatCells,
} from './layout'

type GenerateAssignmentsParams = {
  participants: Participant[]
  layout: SeatLayout
  fixedSeats: FixedSeat[]
  history: DrawHistoryEntry[]
  drawOptions: DrawOptions
  currentAssignments?: SeatAssignment[]
  random?: () => number
}

function shuffle<T>(items: T[], random: () => number) {
  const copied = [...items]

  for (let index = copied.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]]
  }

  return copied
}

function buildAssignment(
  cell: SeatCell,
  participant: Participant,
  layout: SeatLayout,
  seatNumberMap: Map<string, number>,
  isFixed: boolean,
): SeatAssignment {
  return {
    seatNumber: seatNumberMap.get(cell.id) ?? 0,
    row: cell.row,
    column: cell.column,
    label: cell.label,
    cellId: cell.id,
    participant,
    isFixed,
    zone: getSeatZone(cell, layout),
  }
}

function getPreviousSeatMap(history: DrawHistoryEntry[]) {
  const latestEntry = history[0]

  if (!latestEntry) {
    return new Map<string, string>()
  }

  return new Map(
    latestEntry.assignments
      .filter((assignment) => assignment.participant)
      .map((assignment) => [assignment.participant!.id, assignment.cellId]),
  )
}

function getBalanceStats(
  history: DrawHistoryEntry[],
  participantId: string,
): BalanceStats {
  return history.reduce<BalanceStats>(
    (stats, entry, index) => {
      const assignment = entry.assignments.find(
        (item) => item.participant?.id === participantId,
      )

      if (!assignment) {
        return stats
      }

      const weight = Math.max(1, history.length - index)

      return {
        front: stats.front + (assignment.zone.vertical === 'front' ? weight : 0),
        back: stats.back + (assignment.zone.vertical === 'back' ? weight : 0),
        left: stats.left + (assignment.zone.horizontal === 'left' ? weight : 0),
        right: stats.right + (assignment.zone.horizontal === 'right' ? weight : 0),
      }
    },
    {
      front: 0,
      back: 0,
      left: 0,
      right: 0,
    },
  )
}

function chooseSeatForParticipant(
  participant: Participant,
  seats: SeatCell[],
  layout: SeatLayout,
  history: DrawHistoryEntry[],
  balanceZones: boolean,
  random: () => number,
) {
  if (!balanceZones) {
    return shuffle(seats, random)[0]
  }

  const stats = getBalanceStats(history, participant.id)
  const scoredSeats = seats.map((seat) => {
    const zone = getSeatZone(seat, layout)
    const penalty =
      (zone.vertical === 'front' ? stats.front : stats.back) +
      (zone.horizontal === 'left' ? stats.left : stats.right)

    return {
      seat,
      penalty,
    }
  })

  const bestPenalty = Math.min(...scoredSeats.map((item) => item.penalty))
  const bestSeats = scoredSeats
    .filter((item) => item.penalty === bestPenalty)
    .map((item) => item.seat)

  return shuffle(bestSeats, random)[0]
}

function validateFixedSeats(
  fixedSeats: FixedSeat[],
  participants: Participant[],
  layout: SeatLayout,
) {
  const participantIds = new Set(participants.map((participant) => participant.id))
  const seatIds = new Set<string>()
  const lockedParticipants = new Set<string>()

  fixedSeats.forEach((fixedSeat) => {
    if (!participantIds.has(fixedSeat.participantId)) {
      throw new Error('고정석에 지정된 학생이 현재 명단에 없습니다.')
    }

    const cell = getCellById(layout, fixedSeat.cellId)

    if (!cell || cell.type !== 'seat') {
      throw new Error('고정석은 실제 좌석에만 지정할 수 있습니다.')
    }

    if (seatIds.has(fixedSeat.cellId) || lockedParticipants.has(fixedSeat.participantId)) {
      throw new Error('고정석이 중복 지정되었습니다.')
    }

    seatIds.add(fixedSeat.cellId)
    lockedParticipants.add(fixedSeat.participantId)
  })
}

function getFixedAssignments(
  fixedSeats: FixedSeat[],
  participants: Participant[],
  layout: SeatLayout,
  seatNumberMap: Map<string, number>,
) {
  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant]),
  )

  return fixedSeats
    .map((fixedSeat) => {
      const cell = getCellById(layout, fixedSeat.cellId)
      const participant = participantMap.get(fixedSeat.participantId)

      if (!cell || !participant) {
        return null
      }

      return buildAssignment(cell, participant, layout, seatNumberMap, true)
    })
    .filter((assignment): assignment is SeatAssignment => assignment !== null)
}

function getPreservedAssignments(
  currentAssignments: SeatAssignment[] | undefined,
  participants: Participant[],
  fixedParticipantIds: Set<string>,
  selectedParticipantIds: Set<string>,
) {
  if (!currentAssignments || currentAssignments.length === 0) {
    return []
  }

  const participantIds = new Set(participants.map((participant) => participant.id))

  return currentAssignments.filter((assignment) => {
    const participantId = assignment.participant?.id

    return Boolean(
      participantId &&
        participantIds.has(participantId) &&
        !fixedParticipantIds.has(participantId) &&
        !selectedParticipantIds.has(participantId),
    )
  })
}

export function generateAssignments({
  participants,
  layout,
  fixedSeats,
  history,
  drawOptions,
  currentAssignments,
  random = Math.random,
}: GenerateAssignmentsParams): SeatAssignment[] {
  const usableSeats = getUsableSeatCells(layout)

  if (participants.length > countUsableSeats(layout)) {
    throw new Error('참여자 수가 사용 가능한 좌석 수보다 많습니다.')
  }

  validateFixedSeats(fixedSeats, participants, layout)

  const seatNumberMap = getSeatNumberMap(layout)
  const fixedAssignments = getFixedAssignments(
    fixedSeats,
    participants,
    layout,
    seatNumberMap,
  )
  const fixedParticipantIds = new Set(
    fixedAssignments.map((assignment) => assignment.participant!.id),
  )
  const selectedParticipantIds = new Set(drawOptions.selectedParticipantIds)
  const preservedAssignments =
    drawOptions.redrawMode === 'selected' && selectedParticipantIds.size > 0
      ? getPreservedAssignments(
        currentAssignments,
        participants,
        fixedParticipantIds,
        selectedParticipantIds,
      )
      : []

  const lockedSeatIds = new Set([
    ...fixedAssignments.map((assignment) => assignment.cellId),
    ...preservedAssignments.map((assignment) => assignment.cellId),
  ])
  const preservedParticipantIds = new Set(
    preservedAssignments.map((assignment) => assignment.participant!.id),
  )
  const previousSeatMap = getPreviousSeatMap(history)
  const remainingParticipants = shuffle(
    participants.filter(
      (participant) =>
        !fixedParticipantIds.has(participant.id) &&
        !preservedParticipantIds.has(participant.id),
    ),
    random,
  )
  const availableSeats = usableSeats.filter((seat) => !lockedSeatIds.has(seat.id))

  if (remainingParticipants.length > availableSeats.length) {
    throw new Error('배정 가능한 좌석이 부족합니다.')
  }

  const newAssignments: SeatAssignment[] = []
  let remainingSeats = [...availableSeats]

  remainingParticipants.forEach((participant) => {
    if (remainingSeats.length === 0) {
      throw new Error('배정 가능한 좌석이 부족합니다.')
    }

    let candidateSeats = remainingSeats
    const previousSeatId = previousSeatMap.get(participant.id)

    if (drawOptions.avoidPreviousSeat && previousSeatId) {
      const filtered = remainingSeats.filter((seat) => seat.id !== previousSeatId)

      if (filtered.length > 0) {
        candidateSeats = filtered
      }
    }

    const chosenSeat = chooseSeatForParticipant(
      participant,
      candidateSeats,
      layout,
      history,
      drawOptions.balanceZones,
      random,
    )

    newAssignments.push(
      buildAssignment(chosenSeat, participant, layout, seatNumberMap, false),
    )
    remainingSeats = remainingSeats.filter((seat) => seat.id !== chosenSeat.id)
  })

  return [...fixedAssignments, ...preservedAssignments, ...newAssignments].sort(
    (left, right) => left.seatNumber - right.seatNumber,
  )
}
