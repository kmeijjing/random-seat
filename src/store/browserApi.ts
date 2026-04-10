export type NotifyKind = 'success' | 'error' | 'info'

export type BrowserApi = {
  copyText: (text: string) => Promise<void>
  print: () => void
  reload: () => void
  startTimer: (callback: () => void, delay: number) => number
  clearTimer: (timerId: number) => void
  notify: (kind: NotifyKind, message: string) => void
}

import { notifications } from '@mantine/notifications'

export const defaultBrowserApi: BrowserApi = {
  copyText: (text) => navigator.clipboard.writeText(text),
  print: () => window.print(),
  reload: () => window.location.reload(),
  startTimer: (callback, delay) => window.setTimeout(callback, delay),
  clearTimer: (timerId) => window.clearTimeout(timerId),
  notify: (kind, message) => {
    notifications.show({
      message,
      color: kind === 'success' ? 'teal' : kind === 'error' ? 'red' : 'blue',
      autoClose: 4000,
    })
  },
}
