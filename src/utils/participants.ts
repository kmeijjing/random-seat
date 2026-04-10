import type { Participant } from '../types'

const cellSeparators = /[\t,;]+/

export function parseParticipants(input: string): Participant[] {
  const names = input
    .split(/\r?\n/)
    .flatMap((line) => line.split(cellSeparators))
    .map((value) => value.trim())
    .filter(Boolean)

  // First pass: count total occurrences per name.
  const totalCounter = new Map<string, number>()
  names.forEach((name) => {
    totalCounter.set(name, (totalCounter.get(name) ?? 0) + 1)
  })

  // Second pass: assign IDs and friendly displayName.
  const occurrenceCounter = new Map<string, number>()
  return names.map((name) => {
    const occurrence = (occurrenceCounter.get(name) ?? 0) + 1
    occurrenceCounter.set(name, occurrence)

    const hasDuplicates = (totalCounter.get(name) ?? 0) > 1
    const displayName = hasDuplicates ? `${name} (${occurrence})` : name

    return {
      id: `${name}-${occurrence}`,
      name,
      displayName,
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
