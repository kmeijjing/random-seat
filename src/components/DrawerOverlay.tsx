import type { DrawHistoryEntry, SeatTemplate } from '../types'

type DrawerOverlayProps = {
  isTemplateDrawerOpen: boolean
  isHistoryDrawerOpen: boolean
  templates: SeatTemplate[]
  history: DrawHistoryEntry[]
  onClose: () => void
  onSaveTemplate: () => void
  onLoadTemplate: (template: SeatTemplate) => void
  onRenameTemplate: (template: SeatTemplate) => void
  onDeleteTemplate: (template: SeatTemplate) => void
  onLoadHistory: (entry: DrawHistoryEntry) => void
  formatTimestamp: (timestamp: string | null) => string
  formatHistoryOptions: (options: DrawHistoryEntry['optionsUsed']) => string
}

export function DrawerOverlay({
  isTemplateDrawerOpen,
  isHistoryDrawerOpen,
  templates,
  history,
  onClose,
  onSaveTemplate,
  onLoadTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onLoadHistory,
  formatTimestamp,
  formatHistoryOptions,
}: DrawerOverlayProps) {
  if (!isTemplateDrawerOpen && !isHistoryDrawerOpen) {
    return null
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="section-kicker">{isTemplateDrawerOpen ? '템플릿' : '이력'}</p>
            <h2>{isTemplateDrawerOpen ? '저장된 템플릿' : '최근 이력'}</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            닫기
          </button>
        </div>

        {isTemplateDrawerOpen ? (
          <div className="drawer-body">
            <p className="helper-text">
              현재 명단, 좌석 배치, 고정석 상태를 템플릿으로 저장할 수 있습니다.
            </p>
            <div className="inline-actions">
              <button type="button" className="primary-button" onClick={onSaveTemplate}>
                현재 상태 저장
              </button>
            </div>
            <div className="list-stack drawer-list">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <article key={template.id} className="list-card">
                    <div>
                      <strong>{template.name}</strong>
                      <small>{template.participantInput ? '명단 포함' : '빈 템플릿'}</small>
                    </div>
                    <div className="mini-actions">
                      <button type="button" onClick={() => onLoadTemplate(template)}>
                        불러오기
                      </button>
                      <button type="button" onClick={() => onRenameTemplate(template)}>
                        이름 변경
                      </button>
                      <button type="button" onClick={() => onDeleteTemplate(template)}>
                        삭제
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-copy">저장된 템플릿이 없습니다.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="drawer-body">
            <p className="helper-text">
              최근 자리 뽑기 결과를 확인하고 현재 화면으로 다시 불러올 수 있습니다.
            </p>
            <div className="list-stack drawer-list">
              {history.length > 0 ? (
                history.map((entry) => (
                  <article key={entry.id} className="list-card">
                    <div>
                      <strong>{formatTimestamp(entry.timestamp)}</strong>
                      <small>{formatHistoryOptions(entry.optionsUsed)}</small>
                    </div>
                    <div className="mini-actions">
                      <button type="button" onClick={() => onLoadHistory(entry)}>
                        불러오기
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty-copy">저장된 이력이 아직 없습니다.</p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
