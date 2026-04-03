import { memo } from 'react'
import type { DrawSettings, FixedSeat, Participant, SeatCell, SeatConfig } from '../types'
import {
  accordionButtonClass,
  advancedPanelClass,
  buttonRowClass,
  checkboxRowClass,
  emptyCopyClass,
  fieldClass,
  fieldLabelClass,
  fieldRowClass,
  ghostButtonClass,
  headRowClass,
  helperTextClass,
  layoutCellAisleClass,
  layoutCellBaseClass,
  layoutCellBlockedClass,
  layoutCellSeatClass,
  layoutGridClass,
  listCardClass,
  listCardMetaClass,
  listCardTitleClass,
  listStackClass,
  listStackShortClass,
  optionGroupClass,
  previewMetaClass,
  subsectionClass,
} from './ui'

type AdvancedSettingsPanelProps = {
  isAdvancedOpen: boolean
  onToggleAdvanced: () => void
  drawSettings: DrawSettings
  onAvoidPreviousSeatChange: (checked: boolean) => void
  onBalanceZonesChange: (checked: boolean) => void
  fixedSeats: FixedSeat[]
  fixedParticipantId: string
  fixedCellId: string
  participants: Participant[]
  selectableSeatCells: SeatCell[]
  onFixedParticipantChange: (value: string) => void
  onFixedCellChange: (value: string) => void
  onAddFixedSeat: () => void
  onRemoveFixedSeat: (participantId: string) => void
  isSeatEditorOpen: boolean
  onToggleSeatEditor: () => void
  seatConfig: SeatConfig
  usableSeatCount: number
  onCycleCellType: (cellId: string) => void
  onClearAllStorage: () => void
}

export const AdvancedSettingsPanel = memo(function AdvancedSettingsPanel({
  isAdvancedOpen,
  onToggleAdvanced,
  drawSettings,
  onAvoidPreviousSeatChange,
  onBalanceZonesChange,
  fixedSeats,
  fixedParticipantId,
  fixedCellId,
  participants,
  selectableSeatCells,
  onFixedParticipantChange,
  onFixedCellChange,
  onAddFixedSeat,
  onRemoveFixedSeat,
  isSeatEditorOpen,
  onToggleSeatEditor,
  seatConfig,
  usableSeatCount,
  onCycleCellType,
  onClearAllStorage,
}: AdvancedSettingsPanelProps) {
  const sortedFixedSeats = fixedSeats
    .slice()
    .sort((left, right) => left.cellId.localeCompare(right.cellId))
  const getLayoutCellClass = (type: SeatCell['type']) => {
    if (type === 'aisle') {
      return `${layoutCellBaseClass} ${layoutCellAisleClass}`
    }

    if (type === 'blocked') {
      return `${layoutCellBaseClass} ${layoutCellBlockedClass}`
    }

    return `${layoutCellBaseClass} ${layoutCellSeatClass}`
  }

  return (
    <section className={advancedPanelClass}>
      <button type="button" className={accordionButtonClass} onClick={onToggleAdvanced} aria-expanded={isAdvancedOpen} aria-controls="advanced-settings-content">
        <span>고급 설정</span>
        <strong>{isAdvancedOpen ? '접기' : '열기'}</strong>
      </button>

      {isAdvancedOpen ? (
        <div id="advanced-settings-content" className="grid gap-2.5">
          <div className={subsectionClass}>
            <div className={headRowClass}>
              <strong>배정 옵션</strong>
              <span className={previewMetaClass}>필요할 때만 사용</span>
            </div>
            <div className={optionGroupClass}>
              <label className={checkboxRowClass}>
                <input
                  type="checkbox"
                  checked={drawSettings.avoidPreviousSeat}
                  onChange={(event) => onAvoidPreviousSeatChange(event.target.checked)}
                />
                지난 자리 피하기
              </label>
              <label className={checkboxRowClass}>
                <input
                  type="checkbox"
                  checked={drawSettings.balanceZones}
                  onChange={(event) => onBalanceZonesChange(event.target.checked)}
                />
                자리 편중 줄이기
              </label>
            </div>
          </div>

          <div className={subsectionClass}>
            <div className={headRowClass}>
              <strong>고정석 지정</strong>
              <span className={previewMetaClass}>{fixedSeats.length}건</span>
            </div>
            <div className={fieldRowClass}>
              <label className={fieldClass}>
                <span className={fieldLabelClass}>학생 선택</span>
                <select
                  value={fixedParticipantId}
                  onChange={(event) => onFixedParticipantChange(event.target.value)}
                >
                  <option value="">학생 선택</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={fieldClass}>
                <span className={fieldLabelClass}>좌석 선택</span>
                <select
                  value={fixedCellId}
                  onChange={(event) => onFixedCellChange(event.target.value)}
                >
                  <option value="">좌석 선택</option>
                  {selectableSeatCells.map((cell) => (
                    <option key={cell.id} value={cell.id}>
                      {cell.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={buttonRowClass}>
              <button type="button" className={ghostButtonClass} onClick={onAddFixedSeat}>
                고정석 저장
              </button>
            </div>

            <div className={`${listStackClass} ${listStackShortClass}`}>
              {sortedFixedSeats.length > 0 ? (
                sortedFixedSeats.map((fixedSeat) => (
                  <article key={fixedSeat.participantId} className={listCardClass}>
                    <div>
                      <strong className={listCardTitleClass}>{fixedSeat.participantName}</strong>
                      <small className={listCardMetaClass}>{fixedSeat.cellId} 고정</small>
                    </div>
                    <div className={buttonRowClass}>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        onClick={() => onRemoveFixedSeat(fixedSeat.participantId)}
                      >
                        해제
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className={emptyCopyClass}>지정된 고정석이 없습니다.</p>
              )}
            </div>
          </div>

          <div className={subsectionClass}>
            <button type="button" className={accordionButtonClass} onClick={onToggleSeatEditor} aria-expanded={isSeatEditorOpen} aria-controls="seat-editor-content">
              <span>좌석 직접 편집</span>
              <strong>{isSeatEditorOpen ? '접기' : '열기'}</strong>
            </button>
            {isSeatEditorOpen ? (
              <div id="seat-editor-content">
                <p className={helperTextClass}>
                  각 칸을 클릭하면 좌석 → 통로 → 비활성 순으로 바뀝니다.
                </p>
                <div
                  className={layoutGridClass}
                  style={{
                    gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(56px, 1fr))`,
                  }}
                >
                  {seatConfig.layout.cells.map((cell) => {
                    const nextType = cell.type === 'seat' ? '통로' : cell.type === 'aisle' ? '비활성' : '좌석'

                    return (
                      <button
                        key={cell.id}
                        type="button"
                        className={getLayoutCellClass(cell.type)}
                        onClick={() => onCycleCellType(cell.id)}
                        aria-label={`${cell.label} ${cell.type === 'seat' ? '좌석' : cell.type === 'aisle' ? '통로' : '비활성'}, 클릭하여 ${nextType}로 변경`}
                      >
                        <strong className="text-[0.8rem]">{cell.label}</strong>
                        <small className="text-[0.72rem] text-slate-500">
                          {cell.type === 'seat'
                            ? '좌석'
                            : cell.type === 'aisle'
                              ? '통로'
                              : '비활성'}
                        </small>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className={helperTextClass}>
                현재 좌석 {usableSeatCount}석, 통로/비활성은 필요할 때만 편집합니다.
              </p>
            )}
          </div>

          <div className={buttonRowClass}>
            <button type="button" className={ghostButtonClass} onClick={onClearAllStorage}>
              전체 저장 삭제
            </button>
          </div>
        </div>
      ) : (
        <p className={helperTextClass}>
          통로, 고정석, 자리 편중 옵션은 필요할 때만 펼쳐서 사용하세요.
        </p>
      )}
    </section>
  )
})
