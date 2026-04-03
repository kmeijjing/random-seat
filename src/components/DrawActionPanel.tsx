type DrawActionPanelProps = {
  hasAssignments: boolean
  isAdvancedOpen: boolean
  errorMessage: string
  statusMessage: string
  isDrawing: boolean
  onRunDraw: () => void
  onResetCurrentDraft: () => void
}

export function DrawActionPanel({
  hasAssignments,
  isAdvancedOpen,
  errorMessage,
  statusMessage,
  isDrawing,
  onRunDraw,
  onResetCurrentDraft,
}: DrawActionPanelProps) {
  return (
    <section className="panel flow-card flow-card-action">
      <div className="flow-card-head">
        <div>
          <p className="section-kicker">3. 실행</p>
          <h2>자리 뽑기</h2>
        </div>
        <span className="badge">{hasAssignments ? '결과 있음' : '대기 중'}</span>
      </div>

      <div className="action-summary">
        <div>
          <span>현재 상태</span>
          <strong>
            {hasAssignments
              ? '결과를 확인할 수 있습니다.'
              : '기본 설정만으로 바로 진행 가능합니다.'}
          </strong>
        </div>
        <div>
          <span>고급 설정</span>
          <strong>{isAdvancedOpen ? '열림' : '기본 접힘'}</strong>
        </div>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      {statusMessage ? <p className="helper-text status-text">{statusMessage}</p> : null}

      <button
        type="button"
        className="primary-button primary-button-wide"
        onClick={onRunDraw}
        disabled={isDrawing}
      >
        {isDrawing ? '자리 뽑는 중...' : '자리 뽑기'}
      </button>

      <div className="inline-actions">
        <button type="button" className="ghost-button" onClick={onResetCurrentDraft}>
          현재 초안 초기화
        </button>
      </div>
    </section>
  )
}
