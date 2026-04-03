import { useEffect, useRef, useState } from 'react'
import { AdvancedSettingsPanel } from './components/AdvancedSettingsPanel'
import { AppHeader } from './components/AppHeader'
import { DrawerOverlay } from './components/DrawerOverlay'
import { DrawActionPanel } from './components/DrawActionPanel'
import { ParticipantInputPanel } from './components/ParticipantInputPanel'
import { ResultPanel } from './components/ResultPanel'
import { SeatConfigPanel } from './components/SeatConfigPanel'
import type {
  CurrentDraft,
  DrawHistoryEntry,
  DrawOptions,
  DrawSettings,
  FixedSeat,
  SavedState,
  SeatAssignment,
  SeatConfig,
  SeatTemplate,
} from './types'
import { buildSeatTableText } from './utils/export'
import { addHistoryEntry } from './utils/history'
import {
  countUsableSeats,
  cycleCellType,
  getCellById,
  getRecommendedLayouts,
  getSeatNumberMap,
  getUsableSeatCells,
  updateLayoutDimensions,
} from './utils/layout'
import { findDuplicateNames, parseParticipants } from './utils/participants'
import { generateAssignments } from './utils/seating'
import {
  clearSavedState,
  getDefaultState,
  loadSavedState,
  saveState,
} from './utils/storage'
import { deleteTemplate, renameTemplate, upsertTemplate } from './utils/templates'

const DRAW_DURATION = 700

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return '아직 배정되지 않았습니다.'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function formatHistoryOptions(options: DrawOptions) {
  const labels = [options.redrawMode === 'selected' ? '일부만 다시 뽑기' : '전체 배정']

  if (options.avoidPreviousSeat) {
    labels.push('지난 자리 피하기')
  }

  if (options.balanceZones) {
    labels.push('자리 편중 줄이기')
  }

  return labels.join(' · ')
}

function cloneSeatConfig(seatConfig: SeatConfig): SeatConfig {
  return {
    rows: seatConfig.rows,
    columns: seatConfig.columns,
    layout: {
      rows: seatConfig.layout.rows,
      columns: seatConfig.layout.columns,
      cells: seatConfig.layout.cells.map((cell) => ({ ...cell })),
    },
    recommendedLayouts: seatConfig.recommendedLayouts.map((item) => ({ ...item })),
  }
}

function cloneFixedSeats(fixedSeats: FixedSeat[]) {
  return fixedSeats.map((fixedSeat) => ({ ...fixedSeat }))
}

function cloneAssignments(assignments: SeatAssignment[]) {
  return assignments.map((assignment) => ({
    ...assignment,
    participant: assignment.participant ? { ...assignment.participant } : null,
    zone: { ...assignment.zone },
  }))
}

function App() {
  const initialState = loadSavedState()
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
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery)
  const [selectedParticipantsForRedraw, setSelectedParticipantsForRedraw] = useState(
    initialState.selectedParticipantsForRedraw,
  )
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

  const participants = parseParticipants(participantInput)
  const duplicateNames = findDuplicateNames(participants)
  const recommendedLayouts = getRecommendedLayouts(participants.length)
  const usableSeatCount = countUsableSeats(seatConfig.layout)
  const seatNumberMap = getSeatNumberMap(seatConfig.layout)
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]))
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.cellId, assignment]))
  const hasAssignments = assignments.length > 0
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const matchingCellIds = new Set(
    assignments
      .filter((assignment) =>
        normalizedSearchQuery
          ? assignment.participant?.name.toLowerCase().includes(normalizedSearchQuery)
          : false,
      )
      .map((assignment) => assignment.cellId),
  )
  const selectableSeatCells = getUsableSeatCells(seatConfig.layout)
  const redrawCandidates = assignments.filter(
    (assignment) => assignment.participant && !assignment.isFixed,
  )
  const hasSearchResults = matchingCellIds.size > 0

  function openTemplateDrawer() {
    setIsTemplateDrawerOpen(true)
    setIsHistoryDrawerOpen(false)
  }

  function openHistoryDrawer() {
    setIsHistoryDrawerOpen(true)
    setIsTemplateDrawerOpen(false)
  }

  function closeDrawers() {
    setIsTemplateDrawerOpen(false)
    setIsHistoryDrawerOpen(false)
  }

  function clearCurrentAssignments() {
    setAssignments([])
    setUpdatedAt(null)
    setSelectedParticipantsForRedraw([])
    setIsRedrawPickerOpen(false)
  }

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
      searchQuery,
      selectedParticipantsForRedraw,
    }

    saveState(stateToSave)
  }, [
    assignments,
    drawSettings,
    fixedSeats,
    history,
    participantInput,
    recommendedLayouts,
    searchQuery,
    seatConfig,
    selectedParticipantsForRedraw,
    templates,
    updatedAt,
  ])

  function handleParticipantInputChange(value: string) {
    setParticipantInput(value)
    clearCurrentAssignments()
    setStatusMessage('')
    setErrorMessage('')
  }

  function handleDimensionChange(field: 'rows' | 'columns', rawValue: string) {
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

  function applyRecommendation(rows: number, columns: number) {
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

  function handleCycleCellType(cellId: string) {
    setSeatConfig((current) => ({
      ...current,
      layout: cycleCellType(current.layout, cellId),
      recommendedLayouts,
    }))
    clearCurrentAssignments()
    setStatusMessage('')
    setErrorMessage('')
  }

  function handleAddFixedSeat() {
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

  function handleRemoveFixedSeat(participantId: string) {
    setFixedSeats((current) =>
      current.filter((fixedSeat) => fixedSeat.participantId !== participantId),
    )
    clearCurrentAssignments()
    setStatusMessage('고정석을 해제했습니다.')
    setErrorMessage('')
  }

  function toggleRedrawParticipant(participantId: string) {
    setSelectedParticipantsForRedraw((current) =>
      current.includes(participantId)
        ? current.filter((value) => value !== participantId)
        : [...current, participantId],
    )
  }

  function handleResetCurrentDraft() {
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
    setSearchQuery(defaults.searchQuery)
    setSelectedParticipantsForRedraw(defaults.selectedParticipantsForRedraw)
    setFixedParticipantId('')
    setFixedCellId('')
    setErrorMessage('')
    setStatusMessage('')
    setIsDrawing(false)
    setIsRedrawPickerOpen(false)
  }

  function handleClearAllStorage() {
    if (!window.confirm('현재 초안, 템플릿, 이력을 모두 삭제할까요?')) {
      return
    }

    const defaults = getDefaultState()

    setParticipantInput(defaults.currentDraft.participantInput)
    setSeatConfig(defaults.currentDraft.seatConfig)
    setFixedSeats(defaults.currentDraft.fixedSeats)
    setAssignments(defaults.currentDraft.assignments)
    setUpdatedAt(defaults.currentDraft.updatedAt)
    setDrawSettings(defaults.currentDraft.drawSettings)
    setTemplates([])
    setHistory([])
    setSearchQuery('')
    setSelectedParticipantsForRedraw([])
    setFixedParticipantId('')
    setFixedCellId('')
    setErrorMessage('')
    setStatusMessage('로컬 저장 데이터를 모두 지웠습니다.')
    setIsDrawing(false)
    setIsRedrawPickerOpen(false)
    clearSavedState()
  }

  function runDraw(redrawMode: 'all' | 'selected') {
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
        assignments: cloneAssignments(nextAssignments),
        participantsSnapshot: participants.map((participant) => ({ ...participant })),
        layoutSnapshot: {
          rows: seatConfig.layout.rows,
          columns: seatConfig.layout.columns,
          cells: seatConfig.layout.cells.map((cell) => ({ ...cell })),
        },
        fixedSeatsSnapshot: cloneFixedSeats(fixedSeats),
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

  async function handleCopyResult() {
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

  function handlePrint() {
    if (!hasAssignments) {
      setErrorMessage('인쇄할 자리표가 아직 없습니다.')
      return
    }

    window.print()
  }

  function handleSaveTemplate() {
    const name = window.prompt('저장할 템플릿 이름을 입력해 주세요.', '새 템플릿')

    if (!name || !name.trim()) {
      return
    }

    const now = new Date().toISOString()
    const template: SeatTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      participantInput,
      seatConfig: cloneSeatConfig({
        ...seatConfig,
        recommendedLayouts,
      }),
      fixedSeats: cloneFixedSeats(fixedSeats),
      createdAt: now,
      updatedAt: now,
    }

    setTemplates((current) => upsertTemplate(current, template))
    setStatusMessage(`"${template.name}" 템플릿을 저장했습니다.`)
    setErrorMessage('')
  }

  function handleLoadTemplate(template: SeatTemplate) {
    if (!window.confirm(`"${template.name}" 템플릿을 현재 초안에 불러올까요?`)) {
      return
    }

    setParticipantInput(template.participantInput)
    setSeatConfig(cloneSeatConfig(template.seatConfig))
    setFixedSeats(cloneFixedSeats(template.fixedSeats))
    setAssignments([])
    setUpdatedAt(null)
    setSelectedParticipantsForRedraw([])
    setSearchQuery('')
    setStatusMessage(`"${template.name}" 템플릿을 불러왔습니다.`)
    setErrorMessage('')
    setIsTemplateDrawerOpen(false)
    setIsRedrawPickerOpen(false)
  }

  function handleRenameTemplate(template: SeatTemplate) {
    const nextName = window.prompt('새 템플릿 이름을 입력해 주세요.', template.name)

    if (!nextName || !nextName.trim()) {
      return
    }

    setTemplates((current) => renameTemplate(current, template.id, nextName.trim()))
    setStatusMessage('템플릿 이름을 변경했습니다.')
    setErrorMessage('')
  }

  function handleDeleteTemplate(template: SeatTemplate) {
    if (!window.confirm(`"${template.name}" 템플릿을 삭제할까요?`)) {
      return
    }

    setTemplates((current) => deleteTemplate(current, template.id))
    setStatusMessage('템플릿을 삭제했습니다.')
    setErrorMessage('')
  }

  function handleLoadHistory(entry: DrawHistoryEntry) {
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
    setFixedSeats(cloneFixedSeats(entry.fixedSeatsSnapshot))
    setAssignments(cloneAssignments(entry.assignments))
    setUpdatedAt(entry.timestamp)
    setSelectedParticipantsForRedraw([])
    setSearchQuery('')
    setStatusMessage('이력 결과를 현재 화면에 불러왔습니다.')
    setErrorMessage('')
    setIsHistoryDrawerOpen(false)
    setIsRedrawPickerOpen(false)
  }

  return (
    <div className="app-shell min-h-screen antialiased">
      <AppHeader
        updatedAtLabel={formatTimestamp(updatedAt)}
        participantCount={participants.length}
        usableSeatCount={usableSeatCount}
        templateCount={templates.length}
        historyCount={history.length}
        onOpenTemplateDrawer={openTemplateDrawer}
        onOpenHistoryDrawer={openHistoryDrawer}
      />

      <main className="workspace ux-workspace">
        <aside className="flow-rail">
          <ParticipantInputPanel
            participantInput={participantInput}
            participants={participants}
            duplicateNames={duplicateNames}
            onParticipantInputChange={handleParticipantInputChange}
          />
          <SeatConfigPanel
            seatConfig={seatConfig}
            recommendedLayouts={recommendedLayouts}
            usableSeatCount={usableSeatCount}
            participantCount={participants.length}
            onDimensionChange={handleDimensionChange}
            onApplyRecommendation={applyRecommendation}
          />
          <DrawActionPanel
            hasAssignments={hasAssignments}
            isAdvancedOpen={isAdvancedOpen}
            errorMessage={errorMessage}
            statusMessage={statusMessage}
            isDrawing={isDrawing}
            onRunDraw={() => runDraw('all')}
            onResetCurrentDraft={handleResetCurrentDraft}
          />
          <AdvancedSettingsPanel
            isAdvancedOpen={isAdvancedOpen}
            onToggleAdvanced={() => setIsAdvancedOpen((current) => !current)}
            drawSettings={drawSettings}
            onAvoidPreviousSeatChange={(checked) =>
              setDrawSettings((current) => ({
                ...current,
                avoidPreviousSeat: checked,
              }))
            }
            onBalanceZonesChange={(checked) =>
              setDrawSettings((current) => ({
                ...current,
                balanceZones: checked,
              }))
            }
            fixedSeats={fixedSeats}
            fixedParticipantId={fixedParticipantId}
            fixedCellId={fixedCellId}
            participants={participants}
            selectableSeatCells={selectableSeatCells}
            onFixedParticipantChange={setFixedParticipantId}
            onFixedCellChange={setFixedCellId}
            onAddFixedSeat={handleAddFixedSeat}
            onRemoveFixedSeat={handleRemoveFixedSeat}
            isSeatEditorOpen={isSeatEditorOpen}
            onToggleSeatEditor={() => setIsSeatEditorOpen((current) => !current)}
            seatConfig={seatConfig}
            usableSeatCount={usableSeatCount}
            onCycleCellType={handleCycleCellType}
            onClearAllStorage={handleClearAllStorage}
          />
        </aside>

        <ResultPanel
          assignments={assignments}
          updatedAtLabel={formatTimestamp(updatedAt)}
          drawSettings={drawSettings}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onCopyResult={handleCopyResult}
          onPrint={handlePrint}
          isDrawing={isDrawing}
          onRunDrawAll={() => runDraw('all')}
          onToggleRedrawPicker={() => setIsRedrawPickerOpen((current) => !current)}
          redrawCandidates={redrawCandidates}
          isRedrawPickerOpen={isRedrawPickerOpen}
          selectedParticipantsForRedraw={selectedParticipantsForRedraw}
          onToggleRedrawParticipant={toggleRedrawParticipant}
          onRunDrawSelected={() => runDraw('selected')}
          showNoSearchResults={Boolean(normalizedSearchQuery && !hasSearchResults)}
          seatConfig={seatConfig}
          assignmentMap={assignmentMap}
          matchingCellIds={matchingCellIds}
          fixedSeats={fixedSeats}
          seatNumberMap={seatNumberMap}
        />
      </main>

      <DrawerOverlay
        isTemplateDrawerOpen={isTemplateDrawerOpen}
        isHistoryDrawerOpen={isHistoryDrawerOpen}
        templates={templates}
        history={history}
        onClose={closeDrawers}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        onRenameTemplate={handleRenameTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onLoadHistory={handleLoadHistory}
        formatTimestamp={formatTimestamp}
        formatHistoryOptions={formatHistoryOptions}
      />
    </div>
  )
}

export default App
