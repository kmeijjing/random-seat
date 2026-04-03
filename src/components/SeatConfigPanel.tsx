import type { SeatConfig, SeatRecommendation } from '../types'

type SeatConfigPanelProps = {
  seatConfig: SeatConfig
  recommendedLayouts: SeatRecommendation[]
  usableSeatCount: number
  participantCount: number
  onDimensionChange: (field: 'rows' | 'columns', value: string) => void
  onApplyRecommendation: (rows: number, columns: number) => void
}

export function SeatConfigPanel({
  seatConfig,
  recommendedLayouts,
  usableSeatCount,
  participantCount,
  onDimensionChange,
  onApplyRecommendation,
}: SeatConfigPanelProps) {
  return (
    <section className="panel flow-card">
      <div className="flow-card-head">
        <div>
          <p className="section-kicker">2. 좌석</p>
          <h2>좌석 설정</h2>
        </div>
        <span className="badge">{usableSeatCount}석</span>
      </div>

      <div className="field-row">
        <label className="field">
          <span>행</span>
          <input
            type="number"
            min="1"
            value={seatConfig.rows}
            onChange={(event) => onDimensionChange('rows', event.target.value)}
          />
        </label>
        <label className="field">
          <span>열</span>
          <input
            type="number"
            min="1"
            value={seatConfig.columns}
            onChange={(event) => onDimensionChange('columns', event.target.value)}
          />
        </label>
      </div>

      <div className="recommendations">
        {recommendedLayouts.map((recommendation) => (
          <button
            key={recommendation.label}
            type="button"
            className="recommendation-chip"
            onClick={() => onApplyRecommendation(recommendation.rows, recommendation.columns)}
          >
            {recommendation.label}
            <small>{recommendation.emptyCount}칸 여유</small>
          </button>
        ))}
      </div>

      <div className="summary-card">
        <div>
          <span>사용 가능 좌석</span>
          <strong>{usableSeatCount}석</strong>
        </div>
        <div>
          <span>참여자</span>
          <strong>{participantCount}명</strong>
        </div>
        <div>
          <span>남는 좌석</span>
          <strong>{Math.max(usableSeatCount - participantCount, 0)}석</strong>
        </div>
      </div>
    </section>
  )
}
