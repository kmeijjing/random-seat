import { Component } from 'react'
import type { ReactNode } from 'react'
import { clearSavedState } from '../utils/storage'

type ErrorBoundaryProps = {
  children: ReactNode
  onReload?: () => void
  onClearSavedData?: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  handleReload = () => {
    this.setState({ hasError: false })

    if (this.props.onReload) {
      this.props.onReload()
      return
    }

    window.location.reload()
  }

  handleClearSavedData = () => {
    clearSavedState()
    if (this.props.onClearSavedData) {
      this.props.onClearSavedData()
    }
    this.setState({ hasError: false })

    if (this.props.onReload) {
      this.props.onReload()
      return
    }

    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-content-center gap-4 px-6 text-center">
          <h1 className="m-0 text-2xl font-semibold text-slate-900">문제가 발생했습니다</h1>
          <p className="m-0 text-sm leading-6 text-slate-600">
            앱에서 예상치 못한 오류가 발생했습니다.<br />
            먼저 다시 불러오고, 필요할 때만 저장 데이터를 초기화해 주세요.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              페이지 다시 불러오기
            </button>
            <button
              type="button"
              onClick={this.handleClearSavedData}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
            >
              저장 데이터 초기화 후 다시 시작
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
