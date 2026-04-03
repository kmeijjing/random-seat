import { memo } from 'react'
import {
  appHeaderClass,
  ghostButtonClass,
  headerActionsClass,
  headerSummaryClass,
  heroTextClass,
  heroTitleClass,
  metricCardClass,
  metricCardStrongClass,
  metricLabelClass,
  metricValueClass,
  sectionKickerClass,
} from './ui'

type AppHeaderProps = {
  updatedAtLabel: string
  participantCount: number
  usableSeatCount: number
  templateCount: number
  historyCount: number
  onOpenTemplateDrawer: () => void
  onOpenHistoryDrawer: () => void
}

export const AppHeader = memo(function AppHeader({
  updatedAtLabel,
  participantCount,
  usableSeatCount,
  templateCount,
  historyCount,
  onOpenTemplateDrawer,
  onOpenHistoryDrawer,
}: AppHeaderProps) {
  return (
    <header className={appHeaderClass}>
      <div>
        <p className={sectionKickerClass}>Local Classroom Seat Tool</p>
        <h1 className={heroTitleClass}>랜덤 자리 뽑기</h1>
        <p className={heroTextClass}>
          명단 입력, 좌석 확인, 자리 뽑기, 결과 활용까지 한 흐름으로 정리했습니다.
        </p>
      </div>
      <div className={headerSummaryClass}>
        <article className={`${metricCardClass} ${metricCardStrongClass}`}>
          <span className="text-[0.74rem] text-inherit/80">마지막 자리 뽑기</span>
          <strong className={`${metricValueClass} text-inherit`}>{updatedAtLabel}</strong>
        </article>
        <article className={metricCardClass}>
          <span className={metricLabelClass}>참여자 / 사용 가능 좌석</span>
          <strong className={metricValueClass}>
            {participantCount} / {usableSeatCount}
          </strong>
        </article>
        <div className={headerActionsClass}>
          <button type="button" className={ghostButtonClass} onClick={onOpenTemplateDrawer}>
            템플릿 {templateCount}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onOpenHistoryDrawer}>
            이력 {historyCount}
          </button>
        </div>
      </div>
    </header>
  )
})
