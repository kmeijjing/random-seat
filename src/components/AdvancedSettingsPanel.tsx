import type { DrawSettings, FixedSeat, Participant, SeatCell, SeatConfig } from '../types'

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

export function AdvancedSettingsPanel({
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

  return (
    <section className="panel advanced-panel">
      <button type="button" className="accordion-trigger" onClick={onToggleAdvanced}>
        <span>고급 설정</span>
        <strong>{isAdvancedOpen ? '접기' : '열기'}</strong>
      </button>

      {isAdvancedOpen ? (
        <div className="advanced-content">
          <div className="subsection">
            <div className="subsection-head">
              <strong>배정 옵션</strong>
              <span>필요할 때만 사용</span>
            </div>
            <div className="option-group">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={drawSettings.avoidPreviousSeat}
                  onChange={(event) => onAvoidPreviousSeatChange(event.target.checked)}
                />
                지난 자리 피하기
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={drawSettings.balanceZones}
                  onChange={(event) => onBalanceZonesChange(event.target.checked)}
                />
                자리 편중 줄이기
              </label>
            </div>
          </div>

          <div className="subsection">
            <div className="subsection-head">
              <strong>고정석 지정</strong>
              <span>{fixedSeats.length}건</span>
            </div>
            <div className="field-row">
              <label className="field">
                <span>학생 선택</span>
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
              <label className="field">
                <span>좌석 선택</span>
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

            <div className="inline-actions">
              <button type="button" className="ghost-button" onClick={onAddFixedSeat}>
                고정석 저장
              </button>
            </div>

            <div className="list-stack list-stack-short">
              {sortedFixedSeats.length > 0 ? (
                sortedFixedSeats.map((fixedSeat) => (
                  <article key={fixedSeat.participantId} className="list-card">
                    <div>
                      <strong>{fixedSeat.participantName}</strong>
                      <small>{fixedSeat.cellId} 고정</small>
                    </div>
                    <div className="mini-actions">
                      <button
                        type="button"
                        onClick={() => onRemoveFixedSeat(fixedSeat.participantId)}
                      >
                        해제
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-copy">지정된 고정석이 없습니다.</p>
              )}
            </div>
          </div>

          <div className="subsection">
            <button type="button" className="subsection-toggle" onClick={onToggleSeatEditor}>
              <span>좌석 직접 편집</span>
              <strong>{isSeatEditorOpen ? '접기' : '열기'}</strong>
            </button>
            {isSeatEditorOpen ? (
              <>
                <p className="helper-text">
                  각 칸을 클릭하면 좌석 → 통로 → 비활성 순으로 바뀝니다.
                </p>
                <div
                  className="layout-grid"
                  style={{
                    gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(56px, 1fr))`,
                  }}
                >
                  {seatConfig.layout.cells.map((cell) => (
                    <button
                      key={cell.id}
                      type="button"
                      className={`layout-cell layout-cell-${cell.type}`}
                      onClick={() => onCycleCellType(cell.id)}
                    >
                      <strong>{cell.label}</strong>
                      <small>
                        {cell.type === 'seat'
                          ? '좌석'
                          : cell.type === 'aisle'
                            ? '통로'
                            : '비활성'}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="helper-text">
                현재 좌석 {usableSeatCount}석, 통로/비활성은 필요할 때만 편집합니다.
              </p>
            )}
          </div>

          <div className="inline-actions">
            <button type="button" className="ghost-button" onClick={onClearAllStorage}>
              전체 저장 삭제
            </button>
          </div>
        </div>
      ) : (
        <p className="helper-text">
          통로, 고정석, 자리 편중 옵션은 필요할 때만 펼쳐서 사용하세요.
        </p>
      )}
    </section>
  )
}
