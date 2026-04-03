import type { SeatAssignment } from '../types'
import { createSeatLayout } from './layout'
import { buildSeatTableText } from './export'

describe('buildSeatTableText', () => {
  it('builds copyable text rows for the current seat assignments', () => {
    const layout = createSeatLayout(1, 2)
    const assignments: SeatAssignment[] = [
      {
        seatNumber: 1,
        row: 1,
        column: 1,
        label: '1-1',
        cellId: '1-1',
        participant: {
          id: '김하나-0',
          name: '김하나',
        },
        isFixed: false,
        zone: {
          vertical: 'front',
          horizontal: 'left',
        },
      },
    ]

    expect(buildSeatTableText(layout, assignments)).toContain('1-1: 김하나')
    expect(buildSeatTableText(layout, assignments)).toContain('1-2: 빈자리')
  })
})
