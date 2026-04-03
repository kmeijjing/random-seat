import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  CurrentDraft,
  DrawHistoryEntry,
  DrawOptions,
  DrawSettings,
  FixedSeat,
  Participant,
  SavedState,
  SeatAssignment,
  SeatCell,
  SeatConfig,
  SeatRecommendation,
  SeatTemplate,
} from '../types'
import { buildSeatTableText } from '../utils/export'
import { addHistoryEntry } from '../utils/history'
import {
  countUsableSeats,
  cycleCellType,
  getCellById,
  getRecommendedLayouts,
  getSeatNumberMap,
  getUsableSeatCells,
  updateLayoutDimensions,
} from '../utils/layout'
import { findDuplicateNames, parseParticipants } from '../utils/participants'
import { generateAssignments } from '../utils/seating'
import {
  clearSavedState,
  getDefaultState,
  loadSavedState,
  saveState,
} from '../utils/storage'
import { deleteTemplate, renameTemplate, upsertTemplate } from '../utils/templates'

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

export function useSeatApp(): SeatAppState & SeatAppActions {
  const [initialState] = useState(loadSavedState)
  const [participantInput, setParticipantInput] = useState(
    initialState.currentDraft.participantInput,
  )
  const [seatConfig, setSeatConfig] = useState(initialState.currentDraft.seatConfig)
  const [fixedSeats, setFixedSeats] = useState(initialState.currentDraft.fixedSeats)
  const [assignments, setAssignments] = useState<SeatAssignment[]>(
    initialState.currentDraft.assignments,
  )
  const [updatedAt, setUpdatedAt] = useState(initialState.currentDraft.updatedAt)
  const [drawSettings, setDrawSettings] = useState<DrawSettings>(
    initialState.currentDraft.drawSettings,
  )
  const [templates, setTemplates] = useState<SeatTemplate[]>(initialState.templates)
  const [history, setHistory] = useState<DrawHistoryEntry[]>(initialState.history)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParticipantsForRedraw, setSelectedParticipantsForRedraw] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [fixedParticipantId, setFixedParticipantId] = useState('')
  const [fixedCellId, setFixedCellId] = useState('')
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isSeatEditorOpen, setIsSeatEditorOpen] = useState(false)
  const [isRedrawPickerOpen, setIsRedrawPickerOpen] = useState(false)
  const drawTimerRef = useRef<number | null>(null)

  // --- derived values ---

  const participants = useMemo(() => parseParticipants(participantInput), [participantInput])
  const duplicateNames = useMemo(() => findDuplicateNames(participants), [participants])
  const recommendedLayouts = useMemo(
    () => getRecommendedLayouts(participants.length),
    [participants.length],
  )
  const usableSeatCount = useMemo(() => countUsableSeats(seatConfig.layout), [seatConfig.layout])
  const seatNumberMap = useMemo(() => getSeatNumberMap(seatConfig.layout), [seatConfig.layout])
  const participantMap = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  )
  const assignmentMap = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.cellId, assignment])),
    [assignments],
  )
  const hasAssignments = assignments.length > 0
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const matchingCellIds = useMemo(
    () =>
      new Set(
        assignments
          .filter((assignment) =>
            normalizedSearchQuery
              ? assignment.participant?.name.toLowerCase().includes(normalizedSearchQuery)
              : false,
          )
          .map((assignment) => assignment.cellId),
      ),
    [assignments, normalizedSearchQuery],
  )
  const selectableSeatCells = useMemo(
    () => getUsableSeatCells(seatConfig.layout),
    [seatConfig.layout],
  )
  const redrawCandidates = useMemo(
    () => assignments.filter((assignment) => assignment.participant && !assignment.isFixed),
    [assignments],
  )
  const hasSearchResults = matchingCellIds.size > 0
  const showNoSearchResults = Boolean(normalizedSearchQuery && !hasSearchResults)

  // --- effects ---

  useEffect(() => {
    return () => {
      if (drawTimerRef.current) {
        window.clearTimeout(drawTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const participantIds = new Set(participants.map((participant) => participant.id))
    const validSeatIds = new Set(selectableSeatCells.map((cell) => cell.id))

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
  }, [participants, selectableSeatCells])

  useEffect(() => {
    const draftSeatConfig: SeatConfig = {
      ...seatConfig,
      recommendedLayouts,
    }
    const draft: CurrentDraft = {
      participantInput,
      seatConfig: draftSeatConfig,
      fixedSeats,
      assignments,
      updatedAt,
      drawSettings,
    }
    const stateToSave: SavedState = {
      currentDraft: draft,
      templates,
      history,
    }

    saveState(stateToSave)
  }, [
    assignments,
    drawSettings,
    fixedSeats,
    history,
    participantInput,
    recommendedLayouts,
    seatConfig,
    templates,
    updatedAt,
  ])

  // --- internal helpers ---

  function clearCurrentAssignments() {
    setAssignments([])
    setUpdatedAt(null)
    setSelectedParticipantsForRedraw([])
    setIsRedrawPickerOpen(false)
  }

  function resetDraftState() {
    if (drawTimerRef.current) {
      window.clearTimeout(drawTimerRef.current)
      drawTimerRef.current = null
    }

    const defaults = getDefaultState()

    setParticipantInput(defaults.currentDraft.participantInput)
    setSeatConfig(defaults.currentDraft.seatConfig)
    setFixedSeats(defaults.currentDraft.fixedSeats)
    setAssignments(defaults.currentDraft.assignments)
    setUpdatedAt(defaults.currentDraft.updatedAt)
    setDrawSettings(defaults.currentDraft.drawSettings)
    setSearchQuery('')
    setSelectedParticipantsForRedraw([])
    setFixedParticipantId('')
    setFixedCellId('')
    setErrorMessage('')
    setIsDrawing(false)
    setIsRedrawPickerOpen(false)
  }

  // --- actions ---

  function onParticipantInputChange(value: string) {
    setParticipantInput(value)
    clearCurrentAssignments()
    setStatusMessage('')
    setErrorMessage('')
  }

  function onDimensionChange(field: 'rows' | 'columns', rawValue: string) {
    const parsed = Math.max(1, Number.parseInt(rawValue, 10) || 1)
    const nextRows = field === 'rows' ? parsed : seatConfig.rows
    const nextColumns = field === 'columns' ? parsed : seatConfig.columns

    setSeatConfig((current) => ({
      rows: nextRows,
      columns: nextColumns,
      layout: updateLayoutDimensions(current.layout, nextRows, nextColumns),
      recommendedLayouts,
    }))
    clearCurrentAssignments()
    setStatusMessage('')
    setErrorMessage('')
  }

  function onApplyRecommendation(rows: number, columns: number) {
    setSeatConfig((current) => ({
      rows,
      columns,
      layout: updateLayoutDimensions(current.layout, rows, columns),
      recommendedLayouts,
    }))
    clearCurrentAssignments()
    setStatusMessage(`${rows} x ${columns} 추천 좌석판을 적용했습니다.`)
    setErrorMessage('')
  }

  function onCycleCellType(cellId: string) {
    setSeatConfig((current) => ({
      ...current,
      layout: cycleCellType(current.layout, cellId),
      recommendedLayouts,
    }))
    clearCurrentAssignments()
    setStatusMessage('')
    setErrorMessage('')
  }

  function onAddFixedSeat() {
    const participant = participantMap.get(fixedParticipantId)
    const seatCell = getCellById(seatConfig.layout, fixedCellId)

    if (!participant || !seatCell || seatCell.type !== 'seat') {
      setErrorMessage('고정할 학생과 실제 좌석을 먼저 선택해 주세요.')
      return
    }

    const nextFixedSeat: FixedSeat = {
      participantId: participant.id,
      participantName: participant.name,
      cellId: seatCell.id,
    }

    setFixedSeats((current) => [
      ...current.filter(
        (fixedSeat) =>
          fixedSeat.participantId !== participant.id && fixedSeat.cellId !== seatCell.id,
      ),
      nextFixedSeat,
    ])
    setFixedParticipantId('')
    setFixedCellId('')
    clearCurrentAssignments()
    setStatusMessage(`${participant.name} 학생을 ${seatCell.label}에 고정했습니다.`)
    setErrorMessage('')
  }

  function onRemoveFixedSeat(participantId: string) {
    setFixedSeats((current) =>
      current.filter((fixedSeat) => fixedSeat.participantId !== participantId),
    )
    clearCurrentAssignments()
    setStatusMessage('고정석을 해제했습니다.')
    setErrorMessage('')
  }

  function onToggleRedrawParticipant(participantId: string) {
    setSelectedParticipantsForRedraw((current) =>
      current.includes(participantId)
        ? current.filter((value) => value !== participantId)
        : [...current, participantId],
    )
  }

  function onResetCurrentDraft() {
    resetDraftState()
    setStatusMessage('')
  }

  function onClearAllStorage() {
    if (!window.confirm('현재 초안, 템플릿, 이력을 모두 삭제할까요?')) {
      return
    }

    resetDraftState()
    setTemplates([])
    setHistory([])
    setStatusMessage('로컬 저장 데이터를 모두 지웠습니다.')
    clearSavedState()
  }

  function onRunDraw(redrawMode: 'all' | 'selected') {
    setErrorMessage('')
    setStatusMessage('')

    if (participants.length === 0) {
      setErrorMessage('참여자 이름을 한 명 이상 입력해 주세요.')
      return
    }

    if (participants.length > usableSeatCount) {
      setErrorMessage('참여자 수가 사용 가능한 좌석 수보다 많습니다.')
      return
    }

    if (redrawMode === 'selected') {
      if (!hasAssignments) {
        setErrorMessage('일부만 다시 뽑기는 먼저 전체 자리 뽑기를 완료한 뒤 사용할 수 있습니다.')
        return
      }

      if (selectedParticipantsForRedraw.length === 0) {
        setErrorMessage('다시 뽑을 학생을 한 명 이상 선택해 주세요.')
        return
      }
    }

    setDrawSettings((current) => ({
      ...current,
      redrawMode,
    }))

    const drawOptions: DrawOptions = {
      ...drawSettings,
      redrawMode,
      selectedParticipantIds:
        redrawMode === 'selected' ? selectedParticipantsForRedraw : [],
    }

    let nextAssignments: SeatAssignment[]

    try {
      nextAssignments = generateAssignments({
        participants,
        layout: seatConfig.layout,
        fixedSeats,
        history,
        drawOptions,
        currentAssignments: assignments,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '자리 뽑기 중 오류가 발생했습니다.',
      )
      return
    }

    setIsDrawing(true)

    if (drawTimerRef.current) {
      window.clearTimeout(drawTimerRef.current)
    }

    drawTimerRef.current = window.setTimeout(() => {
      const timestamp = new Date().toISOString()
      const historyEntry: DrawHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp,
        assignments: structuredClone(nextAssignments),
        participantsSnapshot: participants.map((participant) => ({ ...participant })),
        layoutSnapshot: {
          rows: seatConfig.layout.rows,
          columns: seatConfig.layout.columns,
          cells: seatConfig.layout.cells.map((cell) => ({ ...cell })),
        },
        fixedSeatsSnapshot: structuredClone(fixedSeats),
        optionsUsed: {
          ...drawOptions,
        },
      }

      setAssignments(nextAssignments)
      setUpdatedAt(timestamp)
      setHistory((current) => addHistoryEntry(current, historyEntry))
      setIsDrawing(false)
      setStatusMessage(
        redrawMode === 'selected'
          ? '선택한 학생들만 다시 뽑았습니다.'
          : '자리 뽑기를 완료했습니다.',
      )
      if (redrawMode === 'all') {
        setSelectedParticipantsForRedraw([])
      }
      setIsRedrawPickerOpen(false)
    }, DRAW_DURATION)
  }

  async function onCopyResult() {
    if (!hasAssignments) {
      setErrorMessage('복사할 자리표가 아직 없습니다.')
      return
    }

    const text = buildSeatTableText(seatConfig.layout, assignments)

    try {
      await navigator.clipboard.writeText(text)
      setStatusMessage('자리표를 텍스트로 복사했습니다.')
      setErrorMessage('')
    } catch {
      setErrorMessage('클립보드 복사에 실패했습니다.')
    }
  }

  function onPrint() {
    if (!hasAssignments) {
      setErrorMessage('인쇄할 자리표가 아직 없습니다.')
      return
    }

    window.print()
  }

  function onSaveTemplate() {
    const name = window.prompt('저장할 템플릿 이름을 입력해 주세요.', '새 템플릿')

    if (!name || !name.trim()) {
      return
    }

    const now = new Date().toISOString()
    const template: SeatTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      participantInput,
      seatConfig: structuredClone({
        ...seatConfig,
        recommendedLayouts,
      }),
      fixedSeats: structuredClone(fixedSeats),
      createdAt: now,
      updatedAt: now,
    }

    setTemplates((current) => upsertTemplate(current, template))
    setStatusMessage(`"${template.name}" 템플릿을 저장했습니다.`)
    setErrorMessage('')
  }

  function onLoadTemplate(template: SeatTemplate) {
    if (!window.confirm(`"${template.name}" 템플릿을 현재 초안에 불러올까요?`)) {
      return
    }

    setParticipantInput(template.participantInput)
    setSeatConfig(structuredClone(template.seatConfig))
    setFixedSeats(structuredClone(template.fixedSeats))
    setAssignments([])
    setUpdatedAt(null)
    setSelectedParticipantsForRedraw([])
    setSearchQuery('')
    setStatusMessage(`"${template.name}" 템플릿을 불러왔습니다.`)
    setErrorMessage('')
    setIsTemplateDrawerOpen(false)
    setIsRedrawPickerOpen(false)
  }

  function onRenameTemplate(template: SeatTemplate) {
    const nextName = window.prompt('새 템플릿 이름을 입력해 주세요.', template.name)

    if (!nextName || !nextName.trim()) {
      return
    }

    setTemplates((current) => renameTemplate(current, template.id, nextName.trim()))
    setStatusMessage('템플릿 이름을 변경했습니다.')
    setErrorMessage('')
  }

  function onDeleteTemplate(template: SeatTemplate) {
    if (!window.confirm(`"${template.name}" 템플릿을 삭제할까요?`)) {
      return
    }

    setTemplates((current) => deleteTemplate(current, template.id))
    setStatusMessage('템플릿을 삭제했습니다.')
    setErrorMessage('')
  }

  function onLoadHistory(entry: DrawHistoryEntry) {
    if (!window.confirm('이 이력 상태를 현재 작업 화면에 불러올까요?')) {
      return
    }

    setParticipantInput(
      entry.participantsSnapshot.map((participant) => participant.name).join('\n'),
    )
    setSeatConfig({
      rows: entry.layoutSnapshot.rows,
      columns: entry.layoutSnapshot.columns,
      layout: {
        rows: entry.layoutSnapshot.rows,
        columns: entry.layoutSnapshot.columns,
        cells: entry.layoutSnapshot.cells.map((cell) => ({ ...cell })),
      },
      recommendedLayouts: getRecommendedLayouts(entry.participantsSnapshot.length),
    })
    setFixedSeats(structuredClone(entry.fixedSeatsSnapshot))
    setAssignments(structuredClone(entry.assignments))
    setUpdatedAt(entry.timestamp)
    setSelectedParticipantsForRedraw([])
    setSearchQuery('')
    setStatusMessage('이력 결과를 현재 화면에 불러왔습니다.')
    setErrorMessage('')
    setIsHistoryDrawerOpen(false)
    setIsRedrawPickerOpen(false)
  }

  function onOpenTemplateDrawer() {
    setIsTemplateDrawerOpen(true)
    setIsHistoryDrawerOpen(false)
  }

  function onOpenHistoryDrawer() {
    setIsHistoryDrawerOpen(true)
    setIsTemplateDrawerOpen(false)
  }

  function onCloseDrawers() {
    setIsTemplateDrawerOpen(false)
    setIsHistoryDrawerOpen(false)
  }

  return {
    // state
    participantInput,
    participants,
    duplicateNames,
    seatConfig,
    recommendedLayouts,
    usableSeatCount,
    seatNumberMap,
    selectableSeatCells,
    fixedSeats,
    assignments,
    assignmentMap,
    hasAssignments,
    updatedAt,
    drawSettings,
    templates,
    history,
    searchQuery,
    matchingCellIds,
    showNoSearchResults,
    selectedParticipantsForRedraw,
    redrawCandidates,
    errorMessage,
    statusMessage,
    isDrawing,
    fixedParticipantId,
    fixedCellId,
    isTemplateDrawerOpen,
    isHistoryDrawerOpen,
    isAdvancedOpen,
    isSeatEditorOpen,
    isRedrawPickerOpen,

    // actions
    onParticipantInputChange,
    onDimensionChange,
    onApplyRecommendation,
    onCycleCellType,
    onAddFixedSeat,
    onRemoveFixedSeat,
    onFixedParticipantChange: setFixedParticipantId,
    onFixedCellChange: setFixedCellId,
    onAvoidPreviousSeatChange: (checked: boolean) =>
      setDrawSettings((current) => ({ ...current, avoidPreviousSeat: checked })),
    onBalanceZonesChange: (checked: boolean) =>
      setDrawSettings((current) => ({ ...current, balanceZones: checked })),
    onToggleAdvanced: () => setIsAdvancedOpen((current) => !current),
    onToggleSeatEditor: () => setIsSeatEditorOpen((current) => !current),
    onRunDraw,
    onResetCurrentDraft,
    onClearAllStorage,
    onCopyResult,
    onPrint,
    onSearchQueryChange: setSearchQuery,
    onToggleRedrawPicker: () => setIsRedrawPickerOpen((current) => !current),
    onToggleRedrawParticipant,
    onSelectAllForRedraw: () =>
      setSelectedParticipantsForRedraw(
        redrawCandidates
          .filter((assignment) => assignment.participant)
          .map((assignment) => assignment.participant!.id),
      ),
    onDeselectAllForRedraw: () => setSelectedParticipantsForRedraw([]),
    onSaveTemplate,
    onLoadTemplate,
    onRenameTemplate,
    onDeleteTemplate,
    onLoadHistory,
    onOpenTemplateDrawer,
    onOpenHistoryDrawer,
    onCloseDrawers,
  }
}
