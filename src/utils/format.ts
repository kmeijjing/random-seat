import type { DrawOptions } from '../types'

export function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return '아직 배정되지 않았습니다.'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

export function formatHistoryOptions(options: DrawOptions) {
  const labels = [options.redrawMode === 'selected' ? '일부만 다시 뽑기' : '전체 배정']

  if (options.avoidPreviousSeat) {
    labels.push('지난 자리 피하기')
  }

  if (options.balanceZones) {
    labels.push('자리 편중 줄이기')
  }

  return labels.join(' · ')
}
