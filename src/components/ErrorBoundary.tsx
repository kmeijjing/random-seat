import { Component } from 'react'
import type { ReactNode } from 'react'
import { clearSavedState } from '../utils/storage'

type ErrorBoundaryProps = {
  children: ReactNode
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

  handleReset = () => {
    clearSavedState()
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'grid',
          placeContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          textAlign: 'center',
          padding: '24px',
        }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>문제가 발생했습니다</h1>
          <p style={{ color: '#475569', margin: 0 }}>
            앱에서 예상치 못한 오류가 발생했습니다.<br />
            아래 버튼을 누르면 저장된 데이터를 초기화하고 앱을 다시 시작합니다.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            데이터 초기화 후 다시 시작
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
