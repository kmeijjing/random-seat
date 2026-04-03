import { useMemo } from 'react'
import type { Participant } from '../types'
import {
  countUsableSeats,
  getRecommendedLayouts,
  getSeatNumberMap,
  getUsableSeatCells,
} from '../utils/layout'
import { findDuplicateNames, parseParticipants } from '../utils/participants'
import type { SeatAppStore } from './useSeatAppState'

export function useSeatAppSelectors(state: SeatAppStore) {
  const participants = useMemo(
    () => parseParticipants(state.participantInput),
    [state.participantInput],
  )
  const duplicateNames = useMemo(() => findDuplicateNames(participants), [participants])
  const recommendedLayouts = useMemo(
    () => getRecommendedLayouts(participants.length),
    [participants.length],
  )
  const usableSeatCount = useMemo(
    () => countUsableSeats(state.seatConfig.layout),
    [state.seatConfig.layout],
  )
  const seatNumberMap = useMemo(
    () => getSeatNumberMap(state.seatConfig.layout),
    [state.seatConfig.layout],
  )
  const participantMap = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  )
  const assignmentMap = useMemo(
    () => new Map(state.assignments.map((assignment) => [assignment.cellId, assignment])),
    [state.assignments],
  )
  const selectableSeatCells = useMemo(
    () => getUsableSeatCells(state.seatConfig.layout),
    [state.seatConfig.layout],
  )
  const normalizedSearchQuery = state.searchQuery.trim().toLowerCase()
  const matchingCellIds = useMemo(
    () =>
      new Set(
        state.assignments
          .filter((assignment) =>
            normalizedSearchQuery
              ? assignment.participant?.name.toLowerCase().includes(normalizedSearchQuery)
              : false,
          )
          .map((assignment) => assignment.cellId),
      ),
    [state.assignments, normalizedSearchQuery],
  )
  const redrawCandidates = useMemo(
    () => state.assignments.filter((assignment) => assignment.participant && !assignment.isFixed),
    [state.assignments],
  )

  return {
    participants,
    duplicateNames,
    recommendedLayouts,
    usableSeatCount,
    seatNumberMap,
    participantMap,
    assignmentMap,
    selectableSeatCells,
    hasAssignments: state.assignments.length > 0,
    matchingCellIds,
    showNoSearchResults: Boolean(normalizedSearchQuery && matchingCellIds.size === 0),
    redrawCandidates,
  }
}

export type UseSeatAppSelectorsResult = ReturnType<typeof useSeatAppSelectors> & {
  participants: Participant[]
}
