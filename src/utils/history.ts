import type { DrawHistoryEntry } from '../types'

export const HISTORY_LIMIT = 20

export function addHistoryEntry(
  history: DrawHistoryEntry[],
  entry: DrawHistoryEntry,
  limit = HISTORY_LIMIT,
) {
  return [entry, ...history].slice(0, limit)
}

export function getLatestHistoryEntry(history: DrawHistoryEntry[]) {
  return history[0] ?? null
}
