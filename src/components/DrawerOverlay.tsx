import { useCallback, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSeatStore } from '../store/seatStore'
import { formatHistoryOptions, formatTimestamp } from '../utils/format'
import { AdvancedSettingsContent } from './AdvancedSettingsPanel'
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

export function DrawerOverlay() {
  const {
    isTemplateDrawerOpen,
    isHistoryDrawerOpen,
    isSettingsDrawerOpen,
    templates,
    history,
    onCloseDrawers,
    onSaveTemplate,
    onLoadTemplate,
    onRenameTemplate,
    onDeleteTemplate,
    onLoadHistory,
  } = useSeatStore(
    useShallow((s) => ({
      isTemplateDrawerOpen: s.isTemplateDrawerOpen,
      isHistoryDrawerOpen: s.isHistoryDrawerOpen,
      isSettingsDrawerOpen: s.isSettingsDrawerOpen,
      templates: s.templates,
      history: s.history,
      onCloseDrawers: s.onCloseDrawers,
      onSaveTemplate: s.onSaveTemplate,
      onLoadTemplate: s.onLoadTemplate,
      onRenameTemplate: s.onRenameTemplate,
      onDeleteTemplate: s.onDeleteTemplate,
      onLoadHistory: s.onLoadHistory,
    })),
  )

  const panelRef = useRef<HTMLElement>(null)

  const handleClose = useCallback(() => onCloseDrawers(), [onCloseDrawers])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose])

  if (!isTemplateDrawerOpen && !isHistoryDrawerOpen && !isSettingsDrawerOpen) {
    return null
  }

  const drawerLabel = isSettingsDrawerOpen ? '고급 설정' : isTemplateDrawerOpen ? '저장된 템플릿' : '최근 이력'

  return (
    <div className={drawerBackdropClass} onClick={handleClose}>
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
            <p className={sectionKickerClass}>{isSettingsDrawerOpen ? '설정' : isTemplateDrawerOpen ? '템플릿' : '이력'}</p>
            <h2 className={panelTitleClass}>{drawerLabel}</h2>
          </div>
          <button type="button" className={ghostButtonClass} onClick={handleClose}>
            닫기
          </button>
        </div>

        {isSettingsDrawerOpen ? (
          <div className={drawerBodyClass}>
            <AdvancedSettingsContent />
          </div>
        ) : isTemplateDrawerOpen ? (
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
}
