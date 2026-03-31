import type { Participant } from '../types'

const cellSeparators = /[\t,;]+/

function createParticipantId(name: string, index: number) {
  return `${name}-${index}`
}

export function parseParticipants(input: string): Participant[] {
  return input
    .split(/\r?\n/)
    .flatMap((line) => line.split(cellSeparators))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: createParticipantId(name, index),
      name,
    }))
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
