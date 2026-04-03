import type { Participant } from '../types'

const cellSeparators = /[\t,;]+/

export function parseParticipants(input: string): Participant[] {
  const names = input
    .split(/\r?\n/)
    .flatMap((line) => line.split(cellSeparators))
    .map((value) => value.trim())
    .filter(Boolean)

  const occurrenceCounter = new Map<string, number>()

  return names.map((name) => {
    const occurrence = (occurrenceCounter.get(name) ?? 0) + 1

    occurrenceCounter.set(name, occurrence)

    return {
      id: `${name}-${occurrence}`,
      name,
    }
  })
}

export function findDuplicateNames(participants: Participant[]): string[] {
  const counter = new Map<string, number>()

  participants.forEach((participant) => {
    counter.set(participant.name, (counter.get(participant.name) ?? 0) + 1)
  })

  return Array.from(counter.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
}
