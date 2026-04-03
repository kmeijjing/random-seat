import type {
  SeatCell,
  SeatCellType,
  SeatLayout,
  SeatRecommendation,
  SeatZone,
} from '../types'

const cellTypeCycle: SeatCellType[] = ['seat', 'aisle', 'blocked']

export function createCellId(row: number, column: number) {
  return `${row}-${column}`
}

export function getSeatLabel(row: number, column: number) {
  return `${row}-${column}`
}

export function createSeatCell(
  row: number,
  column: number,
  type: SeatCellType = 'seat',
): SeatCell {
  return {
    id: createCellId(row, column),
    row,
    column,
    label: getSeatLabel(row, column),
    type,
  }
}

export function createSeatLayout(
  rows: number,
  columns: number,
  existingCells: SeatCell[] = [],
): SeatLayout {
  const existingMap = new Map(existingCells.map((cell) => [cell.id, cell]))
  const cells: SeatCell[] = []

  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const cellId = createCellId(row, column)
      const existing = existingMap.get(cellId)

      cells.push(
        createSeatCell(row, column, existing?.type ?? 'seat'),
      )
    }
  }

  return {
    rows,
    columns,
    cells,
  }
}

export function updateLayoutDimensions(
  layout: SeatLayout,
  rows: number,
  columns: number,
) {
  return createSeatLayout(rows, columns, layout.cells)
}

export function getCellById(layout: SeatLayout, cellId: string) {
  return layout.cells.find((cell) => cell.id === cellId) ?? null
}

export function setCellType(
  layout: SeatLayout,
  cellId: string,
  type: SeatCellType,
): SeatLayout {
  return {
    ...layout,
    cells: layout.cells.map((cell) =>
      cell.id === cellId ? { ...cell, type } : cell,
    ),
  }
}

export function cycleCellType(layout: SeatLayout, cellId: string): SeatLayout {
  const cell = getCellById(layout, cellId)

  if (!cell) {
    return layout
  }

  const currentIndex = cellTypeCycle.indexOf(cell.type)
  const nextType = cellTypeCycle[(currentIndex + 1) % cellTypeCycle.length]

  return setCellType(layout, cellId, nextType)
}

export function getUsableSeatCells(layout: SeatLayout) {
  return layout.cells.filter((cell) => cell.type === 'seat')
}

export function countUsableSeats(layout: SeatLayout) {
  return getUsableSeatCells(layout).length
}

export function getSeatNumberMap(layout: SeatLayout) {
  return new Map(
    getUsableSeatCells(layout).map((cell, index) => [cell.id, index + 1]),
  )
}

export function getSeatZone(cell: SeatCell, layout: SeatLayout): SeatZone {
  const verticalMidpoint = Math.ceil(layout.rows / 2)
  const horizontalMidpoint = Math.ceil(layout.columns / 2)

  return {
    vertical: cell.row <= verticalMidpoint ? 'front' : 'back',
    horizontal: cell.column <= horizontalMidpoint ? 'left' : 'right',
  }
}

export function getRecommendedLayouts(
  participantCount: number,
): SeatRecommendation[] {
  if (participantCount <= 0) {
    return [
      { rows: 4, columns: 5, seatCount: 20, emptyCount: 20, label: '4 x 5' },
      { rows: 5, columns: 5, seatCount: 25, emptyCount: 25, label: '5 x 5' },
      { rows: 4, columns: 6, seatCount: 24, emptyCount: 24, label: '4 x 6' },
    ]
  }

  type RecommendationCandidate = SeatRecommendation & { score: number }

  const candidates: RecommendationCandidate[] = []
  const maxSide = Math.max(2, Math.ceil(Math.sqrt(participantCount)) + 3)

  for (let rows = 2; rows <= maxSide; rows += 1) {
    for (let columns = 2; columns <= maxSide + 2; columns += 1) {
      const seatCount = rows * columns

      if (seatCount < participantCount) {
        continue
      }

      const emptyCount = seatCount - participantCount
      const ratioPenalty = Math.abs(rows - columns)
      const score = emptyCount * 3 + ratioPenalty

      candidates.push({
        rows,
        columns,
        seatCount,
        emptyCount,
        label: `${rows} x ${columns}`,
        score,
      })
    }
  }

  return candidates
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score
      }

      return left.seatCount - right.seatCount
    })
    .slice(0, 3)
    .map(({ rows, columns, seatCount, emptyCount, label }) => ({
      rows,
      columns,
      seatCount,
      emptyCount,
      label,
    }))
}
