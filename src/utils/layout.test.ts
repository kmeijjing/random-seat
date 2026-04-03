import {
  countUsableSeats,
  createSeatLayout,
  getRecommendedLayouts,
  getSeatZone,
} from './layout'

describe('layout helpers', () => {
  it('counts only seat cells as usable seats', () => {
    const layout = createSeatLayout(2, 3)
    layout.cells.find((cell) => cell.id === '1-2')!.type = 'aisle'
    layout.cells.find((cell) => cell.id === '2-3')!.type = 'blocked'

    expect(countUsableSeats(layout)).toBe(4)
  })

  it('returns reasonable recommended layouts that can fit the participant count', () => {
    const recommendations = getRecommendedLayouts(17)

    expect(recommendations).toHaveLength(3)
    expect(recommendations.every((item) => item.seatCount >= 17)).toBe(true)
  })

  it('calculates front/back and left/right zones from cell position', () => {
    const layout = createSeatLayout(4, 4)
    const zone = getSeatZone(layout.cells[0], layout)
    const backZone = getSeatZone(layout.cells[15], layout)

    expect(zone).toEqual({ vertical: 'front', horizontal: 'left' })
    expect(backZone).toEqual({ vertical: 'back', horizontal: 'right' })
  })
})
