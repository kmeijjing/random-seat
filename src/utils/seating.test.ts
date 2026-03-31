import type { Participant } from '../types'
import { createSeatAssignments } from './seating'

const participants: Participant[] = Array.from({ length: 10 }, (_, index) => ({
  id: `participant-${index + 1}`,
  name: `학생 ${index + 1}`,
}))

describe('createSeatAssignments', () => {
  it('fills remaining seats with null when seats are greater than participants', () => {
    const assignments = createSeatAssignments(participants, { rows: 3, columns: 4 }, () => 0)

    expect(assignments).toHaveLength(12)
    expect(assignments.filter((assignment) => assignment.participant !== null)).toHaveLength(10)
    expect(assignments.filter((assignment) => assignment.participant === null)).toHaveLength(2)
  })

  it('throws when participant count exceeds seat count', () => {
    expect(() =>
      createSeatAssignments(participants, { rows: 2, columns: 4 }),
    ).toThrow('참여자 수가 좌석 수보다 많습니다.')
  })
})
