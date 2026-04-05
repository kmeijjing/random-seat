import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { selectParticipants, selectUsableSeatCount } from '../store/seatSelectors'
import { useSeatStore } from '../store/seatStore'
import { formatTimestamp } from '../utils/format'
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

export function AppHeader() {
  const {
    updatedAt,
    participantInput,
    seatConfig,
    templates,
    history,
    onOpenTemplateDrawer,
    onOpenHistoryDrawer,
  } = useSeatStore(
    useShallow((s) => ({
      updatedAt: s.updatedAt,
      participantInput: s.participantInput,
      seatConfig: s.seatConfig,
      templates: s.templates,
      history: s.history,
      onOpenTemplateDrawer: s.onOpenTemplateDrawer,
      onOpenHistoryDrawer: s.onOpenHistoryDrawer,
    })),
  )

  const updatedAtLabel = formatTimestamp(updatedAt)
  const participants = useMemo(() => selectParticipants({ participantInput } as Parameters<typeof selectParticipants>[0]), [participantInput])
  const usableSeatCount = useMemo(() => selectUsableSeatCount({ seatConfig } as Parameters<typeof selectUsableSeatCount>[0]), [seatConfig])

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
            {participants.length} / {usableSeatCount}
          </strong>
        </article>
        <div className={headerActionsClass}>
          <button type="button" className={ghostButtonClass} onClick={onOpenTemplateDrawer}>
            템플릿 {templates.length}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onOpenHistoryDrawer}>
            이력 {history.length}
          </button>
        </div>
      </div>
    </header>
  )
}
