import type { Participant, SeatAssignment, SeatCell, SeatRecommendation } from '../types'
import {
  countUsableSeats,
  getRecommendedLayouts,
  getSeatNumberMap,
  getUsableSeatCells,
} from '../utils/layout'
import { findDuplicateNames, parseParticipants } from '../utils/participants'
import type { SeatStoreState } from './seatStore'

export function selectParticipants(state: SeatStoreState): Participant[] {
  return parseParticipants(state.participantInput)
}

export function selectDuplicateNames(participants: Participant[]): string[] {
  return findDuplicateNames(participants)
}

export function selectRecommendedLayouts(participantCount: number): SeatRecommendation[] {
  return getRecommendedLayouts(participantCount)
}

export function selectUsableSeatCount(state: SeatStoreState): number {
  return countUsableSeats(state.seatConfig.layout)
}

export function selectSeatNumberMap(state: SeatStoreState): Map<string, number> {
  return getSeatNumberMap(state.seatConfig.layout)
}

export function selectParticipantMap(participants: Participant[]): Map<string, Participant> {
  return new Map(participants.map((p) => [p.id, p]))
}

export function selectAssignmentMap(state: SeatStoreState): Map<string, SeatAssignment> {
  return new Map(state.assignments.map((a) => [a.cellId, a]))
}

export function selectSelectableSeatCells(state: SeatStoreState): SeatCell[] {
  return getUsableSeatCells(state.seatConfig.layout)
}

export function selectMatchingCellIds(state: SeatStoreState): Set<string> {
  const query = state.searchQuery.trim().toLowerCase()

  return new Set(
    state.assignments
      .filter((a) => query ? a.participant?.displayName.toLowerCase().includes(query) : false)
      .map((a) => a.cellId),
  )
}

export function selectHasAssignments(state: SeatStoreState): boolean {
  return state.assignments.length > 0
}

export function selectShowNoSearchResults(state: SeatStoreState): boolean {
  const query = state.searchQuery.trim().toLowerCase()
  if (!query) return false
  const matchingIds = selectMatchingCellIds(state)
  return matchingIds.size === 0
}

export function selectRedrawCandidates(state: SeatStoreState): SeatAssignment[] {
  return state.assignments.filter((a) => a.participant && !a.isFixed)
}
