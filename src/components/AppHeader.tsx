type AppHeaderProps = {
  updatedAtLabel: string
  participantCount: number
  usableSeatCount: number
  templateCount: number
  historyCount: number
  onOpenTemplateDrawer: () => void
  onOpenHistoryDrawer: () => void
}

export function AppHeader({
  updatedAtLabel,
  participantCount,
  usableSeatCount,
  templateCount,
  historyCount,
  onOpenTemplateDrawer,
  onOpenHistoryDrawer,
}: AppHeaderProps) {
  return (
    <header className="app-header app-header-compact">
      <div className="title-block">
        <p className="eyebrow">Local Classroom Seat Tool</p>
        <h1>랜덤 자리 뽑기</h1>
        <p className="hero-text">
          명단 입력, 좌석 확인, 자리 뽑기, 결과 활용까지 한 흐름으로 정리했습니다.
        </p>
      </div>
      <div className="header-summary">
        <article className="metric-card metric-card-strong">
          <span>마지막 자리 뽑기</span>
          <strong>{updatedAtLabel}</strong>
        </article>
        <article className="metric-card">
          <span>참여자 / 사용 가능 좌석</span>
          <strong>
            {participantCount} / {usableSeatCount}
          </strong>
        </article>
        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={onOpenTemplateDrawer}>
            템플릿 {templateCount}
          </button>
          <button type="button" className="ghost-button" onClick={onOpenHistoryDrawer}>
            이력 {historyCount}
          </button>
        </div>
      </div>
    </header>
  )
}
