import { useMemo } from 'react'

export function useSeatAppBrowser() {
  return useMemo(
    () => ({
      confirm(message: string) {
        return window.confirm(message)
      },
      prompt(message: string, defaultValue?: string) {
        return window.prompt(message, defaultValue)
      },
      copyText(text: string) {
        return navigator.clipboard.writeText(text)
      },
      print() {
        window.print()
      },
      reload() {
        window.location.reload()
      },
      startTimer(callback: () => void, delay: number) {
        return window.setTimeout(callback, delay)
      },
      clearTimer(timerId: number) {
        window.clearTimeout(timerId)
      },
    }),
    [],
  )
}
