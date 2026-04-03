import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import type { JSX } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

function Thrower(): JSX.Element {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  let root: Root | null = null
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    root = null
    consoleErrorSpy.mockRestore()
  })

  it('separates reload from destructive saved-data reset', () => {
    const container = document.createElement('div')
    const reloadSpy = vi.fn()
    const clearSavedDataSpy = vi.fn()

    root = createRoot(container)

    act(() => {
      root?.render(
        <ErrorBoundary onReload={reloadSpy} onClearSavedData={clearSavedDataSpy}>
          <Thrower />
        </ErrorBoundary>,
      )
    })

    const buttons = Array.from(container.querySelectorAll('button'))

    expect(container.textContent).toContain('문제가 발생했습니다')
    expect(buttons).toHaveLength(2)

    act(() => {
      buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(clearSavedDataSpy).not.toHaveBeenCalled()

    const refreshedButtons = Array.from(container.querySelectorAll('button'))

    act(() => {
      refreshedButtons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(clearSavedDataSpy).toHaveBeenCalledTimes(1)
    expect(reloadSpy).toHaveBeenCalledTimes(2)
  })
})
