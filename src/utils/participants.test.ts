import { findDuplicateNames, parseParticipants } from './participants'

describe('parseParticipants', () => {
  it('parses newline, csv, and tab-separated input into one normalized list', () => {
    const participants = parseParticipants('김하나\n박둘,이셋\t정넷')

    expect(participants.map((participant) => participant.name)).toEqual([
      '김하나',
      '박둘',
      '이셋',
      '정넷',
    ])
  })

  it('filters blank lines, empty cells, and surrounding whitespace', () => {
    const participants = parseParticipants(' 김하나 \n\n,박둘,, \n\t이셋\t')

    expect(participants.map((participant) => participant.name)).toEqual([
      '김하나',
      '박둘',
      '이셋',
    ])
  })
})

describe('findDuplicateNames', () => {
  it('returns duplicate names once', () => {
    const duplicates = findDuplicateNames(
      parseParticipants('김하나\n박둘\n김하나\n박둘\n이셋'),
    )

    expect(duplicates).toEqual(['김하나', '박둘'])
  })
})
