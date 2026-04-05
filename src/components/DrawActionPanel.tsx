import { useShallow } from 'zustand/react/shallow'
import { useSeatStore } from '../store/seatStore'
import {
  actionSummaryClass,
  badgeClass,
  buttonRowClass,
  errorTextClass,
  flowCardClass,
  ghostButtonClass,
  headRowClass,
  helperTextClass,
  panelTitleClass,
  primaryButtonWideClass,
  sectionKickerClass,
  summaryLabelClass,
  summaryValueClass,
} from './ui'

export function DrawActionPanel() {
  const {
    assignments,
    isAdvancedOpen,
    errorMessage,
    statusMessage,
    isDrawing,
    onRunDraw,
    onResetCurrentDraft,
  } = useSeatStore(
    useShallow((s) => ({
      assignments: s.assignments,
      isAdvancedOpen: s.isAdvancedOpen,
      errorMessage: s.errorMessage,
      statusMessage: s.statusMessage,
      isDrawing: s.isDrawing,
      onRunDraw: s.onRunDraw,
      onResetCurrentDraft: s.onResetCurrentDraft,
    })),
  )

  const hasAssignments = assignments.length > 0

  return (
    <section className={flowCardClass}>
      <div className={headRowClass}>
        <div>
          <p className={sectionKickerClass}>3. 실행</p>
          <h2 className={panelTitleClass}>자리 뽑기</h2>
        </div>
        <span className={badgeClass}>{hasAssignments ? '결과 있음' : '대기 중'}</span>
      </div>

      <div className={actionSummaryClass}>
        <div>
          <span className={summaryLabelClass}>현재 상태</span>
          <strong className={summaryValueClass}>
            {hasAssignments
              ? '결과를 확인할 수 있습니다.'
              : '기본 설정만으로 바로 진행 가능합니다.'}
          </strong>
        </div>
        <div>
          <span className={summaryLabelClass}>고급 설정</span>
          <strong className={summaryValueClass}>{isAdvancedOpen ? '열림' : '기본 접힘'}</strong>
        </div>
      </div>

      {errorMessage ? <p className={errorTextClass}>{errorMessage}</p> : null}
      {statusMessage ? <p className={helperTextClass}>{statusMessage}</p> : null}

      <button
        type="button"
        className={primaryButtonWideClass}
        onClick={() => onRunDraw('all')}
        disabled={isDrawing}
      >
        {isDrawing ? '자리 뽑는 중...' : '자리 뽑기'}
      </button>

      <div className={buttonRowClass}>
        <button type="button" className={ghostButtonClass} onClick={onResetCurrentDraft}>
          현재 초안 초기화
        </button>
      </div>
    </section>
  )
}
