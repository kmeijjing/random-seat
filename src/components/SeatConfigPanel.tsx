import type { SeatConfig, SeatRecommendation } from '../types'
import {
  badgeClass,
  fieldClass,
  fieldLabelClass,
  fieldRowClass,
  flowCardClass,
  headRowClass,
  panelTitleClass,
  recommendationChipClass,
  recommendationMetaClass,
  sectionKickerClass,
  summaryCardClass,
  summaryLabelClass,
  summaryValueClass,
  buttonRowClass,
} from './ui'

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
    <section className={flowCardClass}>
      <div className={headRowClass}>
        <div>
          <p className={sectionKickerClass}>2. 좌석</p>
          <h2 className={panelTitleClass}>좌석 설정</h2>
        </div>
        <span className={badgeClass}>{usableSeatCount}석</span>
      </div>

      <div className={fieldRowClass}>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>행</span>
          <input
            type="number"
            min="1"
            value={seatConfig.rows}
            onChange={(event) => onDimensionChange('rows', event.target.value)}
          />
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>열</span>
          <input
            type="number"
            min="1"
            value={seatConfig.columns}
            onChange={(event) => onDimensionChange('columns', event.target.value)}
          />
        </label>
      </div>

      <div className={buttonRowClass}>
        {recommendedLayouts.map((recommendation) => (
          <button
            key={recommendation.label}
            type="button"
            className={recommendationChipClass}
            onClick={() => onApplyRecommendation(recommendation.rows, recommendation.columns)}
          >
            {recommendation.label}
            <small className={recommendationMetaClass}>{recommendation.emptyCount}칸 여유</small>
          </button>
        ))}
      </div>

      <div className={summaryCardClass}>
        <div>
          <span className={summaryLabelClass}>사용 가능 좌석</span>
          <strong className={summaryValueClass}>{usableSeatCount}석</strong>
        </div>
        <div>
          <span className={summaryLabelClass}>참여자</span>
          <strong className={summaryValueClass}>{participantCount}명</strong>
        </div>
        <div>
          <span className={summaryLabelClass}>남는 좌석</span>
          <strong className={summaryValueClass}>{Math.max(usableSeatCount - participantCount, 0)}석</strong>
        </div>
      </div>
    </section>
  )
}
