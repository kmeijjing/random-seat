import { useEffect, useRef } from 'react'
import type {
  DrawHistoryEntry,
  DrawOptions,
  DrawSettings,
  FixedSeat,
  Participant,
  SeatAssignment,
  SeatCell,
  SeatConfig,
  SeatRecommendation,
  SeatTemplate,
} from '../types'
import { buildSeatTableText } from '../utils/export'
import { addHistoryEntry } from '../utils/history'
import {
  cycleCellType,
  getCellById,
  updateLayoutDimensions,
} from '../utils/layout'
import { generateAssignments } from '../utils/seating'
import { clearSavedState, saveState } from '../utils/storage'
import { deleteTemplate, renameTemplate, upsertTemplate } from '../utils/templates'
import { useSeatAppBrowser } from './useSeatAppBrowser'
import { useSeatAppSelectors } from './useSeatAppSelectors'
import { useSeatAppState } from './useSeatAppState'

const DRAW_DURATION = 700

export type SeatAppState = {
  participantInput: string
  participants: Participant[]
  duplicateNames: string[]
  seatConfig: SeatConfig
  recommendedLayouts: SeatRecommendation[]
  usableSeatCount: number
  seatNumberMap: Map<string, number>
  selectableSeatCells: SeatCell[]
  fixedSeats: FixedSeat[]
  assignments: SeatAssignment[]
  assignmentMap: Map<string, SeatAssignment>
  hasAssignments: boolean
  updatedAt: string | null
  drawSettings: DrawSettings
  templates: SeatTemplate[]
  history: DrawHistoryEntry[]
  searchQuery: string
  matchingCellIds: Set<string>
  showNoSearchResults: boolean
  selectedParticipantsForRedraw: string[]
  redrawCandidates: SeatAssignment[]
  errorMessage: string
  statusMessage: string
  isDrawing: boolean
  fixedParticipantId: string
  fixedCellId: string
  isTemplateDrawerOpen: boolean
  isHistoryDrawerOpen: boolean
  isAdvancedOpen: boolean
  isSeatEditorOpen: boolean
  isRedrawPickerOpen: boolean
}

export type SeatAppActions = {
  onParticipantInputChange: (value: string) => void
  onDimensionChange: (field: 'rows' | 'columns', value: string) => void
  onApplyRecommendation: (rows: number, columns: number) => void
  onCycleCellType: (cellId: string) => void
  onAddFixedSeat: () => void
  onRemoveFixedSeat: (participantId: string) => void
  onFixedParticipantChange: (value: string) => void
  onFixedCellChange: (value: string) => void
  onAvoidPreviousSeatChange: (checked: boolean) => void
  onBalanceZonesChange: (checked: boolean) => void
  onToggleAdvanced: () => void
  onToggleSeatEditor: () => void
  onRunDraw: (redrawMode: 'all' | 'selected') => void
  onResetCurrentDraft: () => void
  onClearAllStorage: () => void
  onCopyResult: () => Promise<void>
  onPrint: () => void
  onSearchQueryChange: (value: string) => void
  onToggleRedrawPicker: () => void
  onToggleRedrawParticipant: (participantId: string) => void
  onSelectAllForRedraw: () => void
  onDeselectAllForRedraw: () => void
  onSaveTemplate: () => void
  onLoadTemplate: (template: SeatTemplate) => void
  onRenameTemplate: (template: SeatTemplate) => void
  onDeleteTemplate: (template: SeatTemplate) => void
  onLoadHistory: (entry: DrawHistoryEntry) => void
  onOpenTemplateDrawer: () => void
  onOpenHistoryDrawer: () => void
  onCloseDrawers: () => void
}

function cloneLayout(seatConfig: SeatConfig): SeatConfig {
  return {
    rows: seatConfig.rows,
    columns: seatConfig.columns,
    layout: {
      rows: seatConfig.layout.rows,
      columns: seatConfig.layout.columns,
      cells: seatConfig.layout.cells.map((cell) => ({ ...cell })),
    },
  }
}

export function useSeatApp(): SeatAppState & SeatAppActions {
  const stateController = useSeatAppState()
  const store = stateController.state
  const selectors = useSeatAppSelectors(store)
  const browser = useSeatAppBrowser()
  const drawTimerRef = useRef<number | null>(null)
  const { setFixedSeats, setSelectedParticipantsForRedraw } = stateController

  useEffect(() => {
    saveState({
      currentDraft: {
        participantInput: store.participantInput,
        seatConfig: store.seatConfig,
        fixedSeats: store.fixedSeats,
        assignments: store.assignments,
        updatedAt: store.updatedAt,
        drawSettings: store.drawSettings,
      },
      templates: store.templates,
      history: store.history,
    })
  }, [
    store.assignments,
    store.drawSettings,
    store.fixedSeats,
    store.history,
    store.participantInput,
    store.seatConfig,
    store.templates,
    store.updatedAt,
  ])

  useEffect(() => {
    return () => {
      if (drawTimerRef.current !== null) {
        browser.clearTimer(drawTimerRef.current)
      }
    }
  }, [browser])

  useEffect(() => {
    const participantIds = new Set(
      selectors.participants.map((participant) => participant.id),
    )
    const validSeatIds = new Set(
      selectors.selectableSeatCells.map((cell) => cell.id),
    )

    setFixedSeats((current) => {
      const filtered = current.filter(
        (fixedSeat) =>
          participantIds.has(fixedSeat.participantId) && validSeatIds.has(fixedSeat.cellId),
      )

      return filtered.length === current.length ? current : filtered
    })
    setSelectedParticipantsForRedraw((current) => {
      const filtered = current.filter((participantId) => participantIds.has(participantId))

      return filtered.length === current.length ? current : filtered
    })
  }, [
    selectors.participants,
    selectors.selectableSeatCells,
    setFixedSeats,
    setSelectedParticipantsForRedraw,
  ])

  function clearDrawTimer() {
    if (drawTimerRef.current === null) {
      return
    }

    browser.clearTimer(drawTimerRef.current)
    drawTimerRef.current = null
  }

  function abortPendingDraw() {
    clearDrawTimer()
    stateController.setIsDrawing(false)
  }

  function clearDraftAssignments() {
    abortPendingDraw()
    stateController.clearCurrentAssignments()
  }

  function onParticipantInputChange(value: string) {
    stateController.setParticipantInput(value)
    clearDraftAssignments()
    stateController.setStatusMessage('')
    stateController.setErrorMessage('')
  }

  function onDimensionChange(field: 'rows' | 'columns', rawValue: string) {
    const parsed = Math.max(1, Number.parseInt(rawValue, 10) || 1)
    const nextRows = field === 'rows' ? parsed : store.seatConfig.rows
    const nextColumns = field === 'columns' ? parsed : store.seatConfig.columns

    stateController.setSeatConfig((current) => ({
      rows: nextRows,
      columns: nextColumns,
      layout: updateLayoutDimensions(current.layout, nextRows, nextColumns),
    }))
    clearDraftAssignments()
    stateController.setStatusMessage('')
    stateController.setErrorMessage('')
  }

  function onApplyRecommendation(rows: number, columns: number) {
    stateController.setSeatConfig((current) => ({
      rows,
      columns,
      layout: updateLayoutDimensions(current.layout, rows, columns),
    }))
    clearDraftAssignments()
    stateController.setStatusMessage(`${rows} x ${columns} 추천 좌석판을 적용했습니다.`)
    stateController.setErrorMessage('')
  }

  function onCycleCellType(cellId: string) {
    stateController.setSeatConfig((current) => ({
      ...current,
      layout: cycleCellType(current.layout, cellId),
    }))
    clearDraftAssignments()
    stateController.setStatusMessage('')
    stateController.setErrorMessage('')
  }

  function onAddFixedSeat() {
    const participant = selectors.participantMap.get(store.fixedParticipantId)
    const seatCell = getCellById(store.seatConfig.layout, store.fixedCellId)

    if (!participant || !seatCell || seatCell.type !== 'seat') {
      stateController.setErrorMessage('고정할 학생과 실제 좌석을 먼저 선택해 주세요.')
      return
    }

    const nextFixedSeat: FixedSeat = {
      participantId: participant.id,
      participantName: participant.name,
      cellId: seatCell.id,
    }

    stateController.setFixedSeats((current) => [
      ...current.filter(
        (fixedSeat) =>
          fixedSeat.participantId !== participant.id && fixedSeat.cellId !== seatCell.id,
      ),
      nextFixedSeat,
    ])
    stateController.setFixedParticipantId('')
    stateController.setFixedCellId('')
    clearDraftAssignments()
    stateController.setStatusMessage(`${participant.name} 학생을 ${seatCell.label}에 고정했습니다.`)
    stateController.setErrorMessage('')
  }

  function onRemoveFixedSeat(participantId: string) {
    stateController.setFixedSeats((current) =>
      current.filter((fixedSeat) => fixedSeat.participantId !== participantId),
    )
    clearDraftAssignments()
    stateController.setStatusMessage('고정석을 해제했습니다.')
    stateController.setErrorMessage('')
  }

  function onResetCurrentDraft() {
    abortPendingDraw()
    stateController.resetCurrentDraft()
  }

  function onClearAllStorage() {
    if (!browser.confirm('현재 초안, 템플릿, 이력을 모두 삭제할까요?')) {
      return
    }

    abortPendingDraw()
    stateController.clearStoredData()
    stateController.setStatusMessage('로컬 저장 데이터를 모두 지웠습니다.')
    clearSavedState()
  }

  function onRunDraw(redrawMode: 'all' | 'selected') {
    stateController.setErrorMessage('')
    stateController.setStatusMessage('')

    if (selectors.participants.length === 0) {
      stateController.setErrorMessage('참여자 이름을 한 명 이상 입력해 주세요.')
      return
    }

    if (selectors.participants.length > selectors.usableSeatCount) {
      stateController.setErrorMessage('참여자 수가 사용 가능한 좌석 수보다 많습니다.')
      return
    }

    if (redrawMode === 'selected') {
      if (!selectors.hasAssignments) {
        stateController.setErrorMessage(
          '일부만 다시 뽑기는 먼저 전체 자리 뽑기를 완료한 뒤 사용할 수 있습니다.',
        )
        return
      }

      if (store.selectedParticipantsForRedraw.length === 0) {
        stateController.setErrorMessage('다시 뽑을 학생을 한 명 이상 선택해 주세요.')
        return
      }
    }

    stateController.setDrawSettings((current) => ({
      ...current,
      redrawMode,
    }))

    const drawOptions: DrawOptions = {
      ...store.drawSettings,
      redrawMode,
      selectedParticipantIds:
        redrawMode === 'selected' ? store.selectedParticipantsForRedraw : [],
    }

    let nextAssignments: SeatAssignment[]

    try {
      nextAssignments = generateAssignments({
        participants: selectors.participants,
        layout: store.seatConfig.layout,
        fixedSeats: store.fixedSeats,
        history: store.history,
        drawOptions,
        currentAssignments: store.assignments,
      })
    } catch (error) {
      stateController.setErrorMessage(
        error instanceof Error ? error.message : '자리 뽑기 중 오류가 발생했습니다.',
      )
      return
    }

    stateController.setIsDrawing(true)
    clearDrawTimer()

    drawTimerRef.current = browser.startTimer(() => {
      const timestamp = new Date().toISOString()
      const historyEntry: DrawHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp,
        assignments: structuredClone(nextAssignments),
        participantsSnapshot: selectors.participants.map((participant) => ({ ...participant })),
        layoutSnapshot: {
          rows: store.seatConfig.layout.rows,
          columns: store.seatConfig.layout.columns,
          cells: store.seatConfig.layout.cells.map((cell) => ({ ...cell })),
        },
        fixedSeatsSnapshot: structuredClone(store.fixedSeats),
        optionsUsed: {
          ...drawOptions,
        },
      }

      drawTimerRef.current = null
      stateController.setAssignments(nextAssignments)
      stateController.setUpdatedAt(timestamp)
      stateController.setHistory((current) => addHistoryEntry(current, historyEntry))
      stateController.setIsDrawing(false)
      stateController.setStatusMessage(
        redrawMode === 'selected'
          ? '선택한 학생들만 다시 뽑았습니다.'
          : '자리 뽑기를 완료했습니다.',
      )

      if (redrawMode === 'all') {
        stateController.setSelectedParticipantsForRedraw([])
      }

      stateController.setIsRedrawPickerOpen(false)
    }, DRAW_DURATION)
  }

  async function onCopyResult() {
    if (!selectors.hasAssignments) {
      stateController.setErrorMessage('복사할 자리표가 아직 없습니다.')
      return
    }

    const text = buildSeatTableText(store.seatConfig.layout, store.assignments)

    try {
      await browser.copyText(text)
      stateController.setStatusMessage('자리표를 텍스트로 복사했습니다.')
      stateController.setErrorMessage('')
    } catch {
      stateController.setErrorMessage('클립보드 복사에 실패했습니다.')
    }
  }

  function onPrint() {
    if (!selectors.hasAssignments) {
      stateController.setErrorMessage('인쇄할 자리표가 아직 없습니다.')
      return
    }

    browser.print()
  }

  function onSaveTemplate() {
    const name = browser.prompt('저장할 템플릿 이름을 입력해 주세요.', '새 템플릿')

    if (!name || !name.trim()) {
      return
    }

    const now = new Date().toISOString()
    const template: SeatTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      participantInput: store.participantInput,
      seatConfig: cloneLayout(store.seatConfig),
      fixedSeats: structuredClone(store.fixedSeats),
      createdAt: now,
      updatedAt: now,
    }

    stateController.setTemplates((current) => upsertTemplate(current, template))
    stateController.setStatusMessage(`"${template.name}" 템플릿을 저장했습니다.`)
    stateController.setErrorMessage('')
  }

  function onLoadTemplate(template: SeatTemplate) {
    if (!browser.confirm(`"${template.name}" 템플릿을 현재 초안에 불러올까요?`)) {
      return
    }

    abortPendingDraw()
    stateController.setParticipantInput(template.participantInput)
    stateController.setSeatConfig(cloneLayout(template.seatConfig))
    stateController.setFixedSeats(structuredClone(template.fixedSeats))
    stateController.setAssignments([])
    stateController.setUpdatedAt(null)
    stateController.setSelectedParticipantsForRedraw([])
    stateController.setSearchQuery('')
    stateController.setStatusMessage(`"${template.name}" 템플릿을 불러왔습니다.`)
    stateController.setErrorMessage('')
    stateController.setIsTemplateDrawerOpen(false)
    stateController.setIsRedrawPickerOpen(false)
  }

  function onRenameTemplate(template: SeatTemplate) {
    const nextName = browser.prompt('새 템플릿 이름을 입력해 주세요.', template.name)

    if (!nextName || !nextName.trim()) {
      return
    }

    stateController.setTemplates((current) =>
      renameTemplate(current, template.id, nextName.trim()),
    )
    stateController.setStatusMessage('템플릿 이름을 변경했습니다.')
    stateController.setErrorMessage('')
  }

  function onDeleteTemplate(template: SeatTemplate) {
    if (!browser.confirm(`"${template.name}" 템플릿을 삭제할까요?`)) {
      return
    }

    stateController.setTemplates((current) => deleteTemplate(current, template.id))
    stateController.setStatusMessage('템플릿을 삭제했습니다.')
    stateController.setErrorMessage('')
  }

  function onLoadHistory(entry: DrawHistoryEntry) {
    if (!browser.confirm('이 이력 상태를 현재 작업 화면에 불러올까요?')) {
      return
    }

    abortPendingDraw()
    stateController.setParticipantInput(
      entry.participantsSnapshot.map((participant) => participant.name).join('\n'),
    )
    stateController.setSeatConfig({
      rows: entry.layoutSnapshot.rows,
      columns: entry.layoutSnapshot.columns,
      layout: {
        rows: entry.layoutSnapshot.rows,
        columns: entry.layoutSnapshot.columns,
        cells: entry.layoutSnapshot.cells.map((cell) => ({ ...cell })),
      },
    })
    stateController.setFixedSeats(structuredClone(entry.fixedSeatsSnapshot))
    stateController.setAssignments(structuredClone(entry.assignments))
    stateController.setUpdatedAt(entry.timestamp)
    stateController.setSelectedParticipantsForRedraw([])
    stateController.setSearchQuery('')
    stateController.setStatusMessage('이력 결과를 현재 화면에 불러왔습니다.')
    stateController.setErrorMessage('')
    stateController.setIsHistoryDrawerOpen(false)
    stateController.setIsRedrawPickerOpen(false)
  }

  return {
    participantInput: store.participantInput,
    participants: selectors.participants,
    duplicateNames: selectors.duplicateNames,
    seatConfig: store.seatConfig,
    recommendedLayouts: selectors.recommendedLayouts,
    usableSeatCount: selectors.usableSeatCount,
    seatNumberMap: selectors.seatNumberMap,
    selectableSeatCells: selectors.selectableSeatCells,
    fixedSeats: store.fixedSeats,
    assignments: store.assignments,
    assignmentMap: selectors.assignmentMap,
    hasAssignments: selectors.hasAssignments,
    updatedAt: store.updatedAt,
    drawSettings: store.drawSettings,
    templates: store.templates,
    history: store.history,
    searchQuery: store.searchQuery,
    matchingCellIds: selectors.matchingCellIds,
    showNoSearchResults: selectors.showNoSearchResults,
    selectedParticipantsForRedraw: store.selectedParticipantsForRedraw,
    redrawCandidates: selectors.redrawCandidates,
    errorMessage: store.errorMessage,
    statusMessage: store.statusMessage,
    isDrawing: store.isDrawing,
    fixedParticipantId: store.fixedParticipantId,
    fixedCellId: store.fixedCellId,
    isTemplateDrawerOpen: store.isTemplateDrawerOpen,
    isHistoryDrawerOpen: store.isHistoryDrawerOpen,
    isAdvancedOpen: store.isAdvancedOpen,
    isSeatEditorOpen: store.isSeatEditorOpen,
    isRedrawPickerOpen: store.isRedrawPickerOpen,
    onParticipantInputChange,
    onDimensionChange,
    onApplyRecommendation,
    onCycleCellType,
    onAddFixedSeat,
    onRemoveFixedSeat,
    onFixedParticipantChange: stateController.setFixedParticipantId,
    onFixedCellChange: stateController.setFixedCellId,
    onAvoidPreviousSeatChange: (checked: boolean) =>
      stateController.setDrawSettings((current) => ({
        ...current,
        avoidPreviousSeat: checked,
      })),
    onBalanceZonesChange: (checked: boolean) =>
      stateController.setDrawSettings((current) => ({
        ...current,
        balanceZones: checked,
      })),
    onToggleAdvanced: () => stateController.setIsAdvancedOpen((current) => !current),
    onToggleSeatEditor: () => stateController.setIsSeatEditorOpen((current) => !current),
    onRunDraw,
    onResetCurrentDraft,
    onClearAllStorage,
    onCopyResult,
    onPrint,
    onSearchQueryChange: stateController.setSearchQuery,
    onToggleRedrawPicker: () =>
      stateController.setIsRedrawPickerOpen((current) => !current),
    onToggleRedrawParticipant: stateController.toggleSelectedParticipantForRedraw,
    onSelectAllForRedraw: () =>
      stateController.setSelectedParticipantsForRedraw(
        selectors.redrawCandidates
          .filter((assignment) => assignment.participant)
          .map((assignment) => assignment.participant!.id),
      ),
    onDeselectAllForRedraw: () => stateController.setSelectedParticipantsForRedraw([]),
    onSaveTemplate,
    onLoadTemplate,
    onRenameTemplate,
    onDeleteTemplate,
    onLoadHistory,
    onOpenTemplateDrawer: () => {
      stateController.setIsTemplateDrawerOpen(true)
      stateController.setIsHistoryDrawerOpen(false)
    },
    onOpenHistoryDrawer: () => {
      stateController.setIsHistoryDrawerOpen(true)
      stateController.setIsTemplateDrawerOpen(false)
    },
    onCloseDrawers: () => {
      stateController.setIsTemplateDrawerOpen(false)
      stateController.setIsHistoryDrawerOpen(false)
    },
  }
}
