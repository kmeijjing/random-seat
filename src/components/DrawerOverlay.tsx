import { memo, useEffect, useRef } from 'react'
import type { DrawHistoryEntry, SeatTemplate } from '../types'
import { formatHistoryOptions, formatTimestamp } from '../utils/format'
import {
  buttonRowClass,
  drawerBackdropClass,
  drawerBodyClass,
  drawerListClass,
  drawerPanelClass,
  emptyCopyClass,
  ghostButtonClass,
  headRowClass,
  helperTextClass,
  listCardClass,
  listCardMetaClass,
  listCardTitleClass,
  listStackClass,
  panelTitleClass,
  primaryButtonClass,
  sectionKickerClass,
} from './ui'

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
}

export const DrawerOverlay = memo(function DrawerOverlay({
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
}: DrawerOverlayProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!isTemplateDrawerOpen && !isHistoryDrawerOpen) {
    return null
  }

  const drawerLabel = isTemplateDrawerOpen ? '저장된 템플릿' : '최근 이력'

  return (
    <div className={drawerBackdropClass} onClick={onClose}>
      <aside
        ref={panelRef}
        className={drawerPanelClass}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={drawerLabel}
        tabIndex={-1}
      >
        <div className={headRowClass}>
          <div>
            <p className={sectionKickerClass}>{isTemplateDrawerOpen ? '템플릿' : '이력'}</p>
            <h2 className={panelTitleClass}>{isTemplateDrawerOpen ? '저장된 템플릿' : '최근 이력'}</h2>
          </div>
          <button type="button" className={ghostButtonClass} onClick={onClose}>
            닫기
          </button>
        </div>

        {isTemplateDrawerOpen ? (
          <div className={drawerBodyClass}>
            <p className={helperTextClass}>
              현재 명단, 좌석 배치, 고정석 상태를 템플릿으로 저장할 수 있습니다.
            </p>
            <div className={buttonRowClass}>
              <button type="button" className={primaryButtonClass} onClick={onSaveTemplate}>
                현재 상태 저장
              </button>
            </div>
            <div className={`${listStackClass} ${drawerListClass}`}>
              {templates.length > 0 ? (
                templates.map((template) => (
                  <article key={template.id} className={listCardClass}>
                    <div>
                      <strong className={listCardTitleClass}>{template.name}</strong>
                      <small className={listCardMetaClass}>
                        {template.participantInput ? '명단 포함' : '빈 템플릿'}
                      </small>
                    </div>
                    <div className={buttonRowClass}>
                      <button type="button" className={ghostButtonClass} onClick={() => onLoadTemplate(template)}>
                        불러오기
                      </button>
                      <button type="button" className={ghostButtonClass} onClick={() => onRenameTemplate(template)}>
                        이름 변경
                      </button>
                      <button type="button" className={ghostButtonClass} onClick={() => onDeleteTemplate(template)}>
                        삭제
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className={emptyCopyClass}>저장된 템플릿이 없습니다.</p>
              )}
            </div>
          </div>
        ) : (
          <div className={drawerBodyClass}>
            <p className={helperTextClass}>
              최근 자리 뽑기 결과를 확인하고 현재 화면으로 다시 불러올 수 있습니다.
            </p>
            <div className={`${listStackClass} ${drawerListClass}`}>
              {history.length > 0 ? (
                history.map((entry) => (
                  <article key={entry.id} className={listCardClass}>
                    <div>
                      <strong className={listCardTitleClass}>{formatTimestamp(entry.timestamp)}</strong>
                      <small className={listCardMetaClass}>{formatHistoryOptions(entry.optionsUsed)}</small>
                    </div>
                    <div className={buttonRowClass}>
                      <button type="button" className={ghostButtonClass} onClick={() => onLoadHistory(entry)}>
                        불러오기
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className={emptyCopyClass}>저장된 이력이 아직 없습니다.</p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
})
