import { memo } from 'react'
import type { DrawSettings, FixedSeat, SeatAssignment, SeatConfig } from '../types'
import {
  badgeClass,
  buttonRowClass,
  checkboxChipClass,
  emptyResultClass,
  emptyTitleClass,
  fieldLabelClass,
  ghostButtonClass,
  headRowClass,
  helperTextClass,
  panelTitleClass,
  primaryButtonClass,
  resultMetaClass,
  resultPanelClass,
  resultSeatGridClass,
  resultToolbarClass,
  searchFieldClass,
  seatBoardClass,
  seatCardClass,
  seatCardFixedClass,
  seatCardHighlightClass,
  seatCardInactiveClass,
  seatGridClass,
  seatGridDrawingClass,
  seatLabelClass,
  sectionKickerClass,
  subsectionClass,
} from './ui'

type ResultPanelProps = {
  assignments: SeatAssignment[]
  updatedAtLabel: string
  drawSettings: DrawSettings
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onCopyResult: () => void
  onPrint: () => void
  isDrawing: boolean
  onRunDrawAll: () => void
  onToggleRedrawPicker: () => void
  redrawCandidates: SeatAssignment[]
  isRedrawPickerOpen: boolean
  selectedParticipantsForRedraw: string[]
  onToggleRedrawParticipant: (participantId: string) => void
  onSelectAllForRedraw: () => void
  onDeselectAllForRedraw: () => void
  onRunDrawSelected: () => void
  showNoSearchResults: boolean
  seatConfig: SeatConfig
  assignmentMap: Map<string, SeatAssignment>
  matchingCellIds: Set<string>
  fixedSeats: FixedSeat[]
  seatNumberMap: Map<string, number>
}

export const ResultPanel = memo(function ResultPanel({
  assignments,
  updatedAtLabel,
  drawSettings,
  searchQuery,
  onSearchQueryChange,
  onCopyResult,
  onPrint,
  isDrawing,
  onRunDrawAll,
  onToggleRedrawPicker,
  redrawCandidates,
  isRedrawPickerOpen,
  selectedParticipantsForRedraw,
  onToggleRedrawParticipant,
  onSelectAllForRedraw,
  onDeselectAllForRedraw,
  onRunDrawSelected,
  showNoSearchResults,
  seatConfig,
  assignmentMap,
  matchingCellIds,
  fixedSeats,
  seatNumberMap,
}: ResultPanelProps) {
  const hasAssignments = assignments.length > 0

  return (
    <section className={resultPanelClass}>
      <div className={headRowClass}>
        <div>
          <p className={sectionKickerClass}>결과</p>
          <h2 className={panelTitleClass}>자리표</h2>
        </div>
        <span className={badgeClass}>{hasAssignments ? `${assignments.length}명 배정` : '결과 대기'}</span>
      </div>

      <div className={resultToolbarClass}>
        <label className={searchFieldClass}>
          <span className={fieldLabelClass}>이름 검색</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="학생 이름 입력"
            disabled={!hasAssignments}
          />
        </label>

        <div className={buttonRowClass}>
          <button type="button" className={ghostButtonClass} onClick={onCopyResult} disabled={!hasAssignments}>
            복사
          </button>
          <button type="button" className={ghostButtonClass} onClick={onPrint} disabled={!hasAssignments}>
            인쇄
          </button>
        </div>
      </div>

      {hasAssignments ? (
        <>
          <div className={resultMetaClass}>
            <span>마지막 결과: {updatedAtLabel}</span>
            <span>
              {drawSettings.avoidPreviousSeat ? '지난 자리 피하기' : '완전 랜덤'}
              {' · '}
              {drawSettings.balanceZones ? '자리 편중 줄이기' : '균형 옵션 꺼짐'}
            </span>
          </div>

          <div className={`${buttonRowClass} print:hidden`}>
            <button type="button" className={ghostButtonClass} onClick={onRunDrawAll} disabled={isDrawing}>
              전체 다시 뽑기
            </button>
            <button
              type="button"
              className={ghostButtonClass}
              onClick={onToggleRedrawPicker}
              disabled={isDrawing || redrawCandidates.length === 0}
            >
              일부만 다시 뽑기
            </button>
          </div>

          {isRedrawPickerOpen ? (
            <div className={`${subsectionClass} print:hidden`}>
              <div className={headRowClass}>
                <strong>다시 뽑을 학생 선택</strong>
                <div className={buttonRowClass}>
                  <button type="button" className={ghostButtonClass} onClick={onSelectAllForRedraw}>
                    전체 선택
                  </button>
                  <button type="button" className={ghostButtonClass} onClick={onDeselectAllForRedraw}>
                    전체 해제
                  </button>
                  <span className="text-[0.76rem] text-slate-500">{selectedParticipantsForRedraw.length}명 선택</span>
                </div>
              </div>
              <div className={buttonRowClass} role="group" aria-label="다시 뽑을 학생 목록">
                {redrawCandidates.map((assignment) => (
                  <label key={assignment.participant!.id} className={checkboxChipClass}>
                    <input
                      type="checkbox"
                      checked={selectedParticipantsForRedraw.includes(assignment.participant!.id)}
                      onChange={() => onToggleRedrawParticipant(assignment.participant!.id)}
                    />
                    {assignment.participant!.name}
                  </label>
                ))}
              </div>
              <div className={buttonRowClass}>
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={onRunDrawSelected}
                  disabled={isDrawing}
                >
                  선택한 학생만 다시 뽑기
                </button>
              </div>
            </div>
          ) : null}

          {showNoSearchResults ? <p className={helperTextClass}>검색 결과가 없습니다.</p> : null}

          <div className={seatBoardClass}>
            <div
              className={`${seatGridClass} ${resultSeatGridClass} ${isDrawing ? seatGridDrawingClass : ''}`}
              style={{
                gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(118px, 1fr))`,
              }}
            >
              {seatConfig.layout.cells.map((cell) => {
                const assignment = assignmentMap.get(cell.id)
                const isSearchMatch = matchingCellIds.has(cell.id)
                const fixedSeat = fixedSeats.find((item) => item.cellId === cell.id)
                const seatNumber = seatNumberMap.get(cell.id)

                if (cell.type !== 'seat') {
                  return (
                    <article key={cell.id} className={`${seatCardClass} ${seatCardInactiveClass}`}>
                      <span className={seatLabelClass}>{cell.label}</span>
                      <strong>{cell.type === 'aisle' ? '통로' : '비활성'}</strong>
                      <small className="text-[0.76rem] text-slate-500">배정 제외</small>
                    </article>
                  )
                }

                return (
                  <article
                    key={cell.id}
                    className={`${seatCardClass} ${assignment?.isFixed ? seatCardFixedClass : ''} ${
                      isSearchMatch ? seatCardHighlightClass : ''
                    }`}
                  >
                    <span className={seatLabelClass}>{cell.label}</span>
                    <strong>{assignment?.participant?.name ?? '빈자리'}</strong>
                    <small className="text-[0.76rem] text-slate-500">
                      {seatNumber}번 자리
                      {fixedSeat ? ' · 고정석' : ''}
                    </small>
                  </article>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className={emptyResultClass}>
          <p className={sectionKickerClass}>Ready</p>
          <h3 className={emptyTitleClass}>자리표가 아직 없습니다</h3>
          <p>
            왼쪽에서 명단을 입력하고 좌석만 확인한 뒤, <strong>자리 뽑기</strong>를 누르면
            결과가 이 영역에 표시됩니다.
          </p>
        </div>
      )}
    </section>
  )
})
