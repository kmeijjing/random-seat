export type BrowserApi = {
  confirm: (message: string) => boolean
  prompt: (message: string, defaultValue?: string) => string | null
  copyText: (text: string) => Promise<void>
  print: () => void
  reload: () => void
  startTimer: (callback: () => void, delay: number) => number
  clearTimer: (timerId: number) => void
}

export const defaultBrowserApi: BrowserApi = {
  confirm: (message) => window.confirm(message),
  prompt: (message, defaultValue) => window.prompt(message, defaultValue),
  copyText: (text) => navigator.clipboard.writeText(text),
  print: () => window.print(),
  reload: () => window.location.reload(),
  startTimer: (callback, delay) => window.setTimeout(callback, delay),
  clearTimer: (timerId) => window.clearTimeout(timerId),
}
