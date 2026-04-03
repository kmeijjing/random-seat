import { useEffect, useRef, useState } from 'react'
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
            <strong>{formatTimestamp(updatedAt)}</strong>
          </article>
          <article className="metric-card">
            <span>참여자 / 사용 가능 좌석</span>
            <strong>
              {participants.length} / {usableSeatCount}
            </strong>
          </article>
          <div className="header-actions">
            <button type="button" className="ghost-button" onClick={openTemplateDrawer}>
              템플릿 {templates.length}
            </button>
            <button type="button" className="ghost-button" onClick={openHistoryDrawer}>
              이력 {history.length}
            </button>
          </div>
        </div>
      </header>

      <main className="workspace ux-workspace">
        <aside className="flow-rail">
          <section className="panel flow-card">
            <div className="flow-card-head">
              <div>
                <p className="section-kicker">1. 명단</p>
                <h2>명단 입력</h2>
              </div>
              <span className="badge">{participants.length}명</span>
            </div>

            <label className="field">
              <span>이름 입력 또는 CSV 붙여넣기</span>
              <textarea
                value={participantInput}
                onChange={(event) => handleParticipantInputChange(event.target.value)}
                placeholder={'예시\n김하나\n박둘\n이셋\n\n또는\n김하나,박둘,이셋'}
                rows={8}
              />
            </label>

            <p className="helper-text">줄바꿈, 쉼표, 탭 입력을 자동 정리합니다.</p>

            {duplicateNames.length > 0 ? (
              <p className="warning-text">
                중복 이름 감지: {duplicateNames.join(', ')}
              </p>
            ) : null}

            <div className="preview-box compact-box">
              <div className="preview-head">
                <strong>파싱 미리보기</strong>
                <span>{participants.length}명</span>
              </div>
              <div className="chip-list chip-list-scroll">
                {participants.length > 0 ? (
                  participants.map((participant) => (
                    <span key={participant.id} className="chip">
                      {participant.name}
                    </span>
                  ))
                ) : (
                  <span className="empty-copy">입력된 이름이 아직 없습니다.</span>
                )}
              </div>
            </div>
          </section>

          <section className="panel flow-card">
            <div className="flow-card-head">
              <div>
                <p className="section-kicker">2. 좌석</p>
                <h2>좌석 설정</h2>
              </div>
              <span className="badge">{usableSeatCount}석</span>
            </div>

            <div className="field-row">
              <label className="field">
                <span>행</span>
                <input
                  type="number"
                  min="1"
                  value={seatConfig.rows}
                  onChange={(event) => handleDimensionChange('rows', event.target.value)}
                />
              </label>
              <label className="field">
                <span>열</span>
                <input
                  type="number"
                  min="1"
                  value={seatConfig.columns}
                  onChange={(event) => handleDimensionChange('columns', event.target.value)}
                />
              </label>
            </div>

            <div className="recommendations">
              {recommendedLayouts.map((recommendation) => (
                <button
                  key={recommendation.label}
                  type="button"
                  className="recommendation-chip"
                  onClick={() =>
                    applyRecommendation(recommendation.rows, recommendation.columns)
                  }
                >
                  {recommendation.label}
                  <small>{recommendation.emptyCount}칸 여유</small>
                </button>
              ))}
            </div>

            <div className="summary-card">
              <div>
                <span>사용 가능 좌석</span>
                <strong>{usableSeatCount}석</strong>
              </div>
              <div>
                <span>참여자</span>
                <strong>{participants.length}명</strong>
              </div>
              <div>
                <span>남는 좌석</span>
                <strong>{Math.max(usableSeatCount - participants.length, 0)}석</strong>
              </div>
            </div>
          </section>

          <section className="panel flow-card flow-card-action">
            <div className="flow-card-head">
              <div>
                <p className="section-kicker">3. 실행</p>
                <h2>자리 뽑기</h2>
              </div>
              <span className="badge">{hasAssignments ? '결과 있음' : '대기 중'}</span>
            </div>

            <div className="action-summary">
              <div>
                <span>현재 상태</span>
                <strong>{hasAssignments ? '결과를 확인할 수 있습니다.' : '기본 설정만으로 바로 진행 가능합니다.'}</strong>
              </div>
              <div>
                <span>고급 설정</span>
                <strong>{isAdvancedOpen ? '열림' : '기본 접힘'}</strong>
              </div>
            </div>

            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
            {statusMessage ? <p className="helper-text status-text">{statusMessage}</p> : null}

            <button
              type="button"
              className="primary-button primary-button-wide"
              onClick={() => runDraw('all')}
              disabled={isDrawing}
            >
              {isDrawing ? '자리 뽑는 중...' : '자리 뽑기'}
            </button>

            <div className="inline-actions">
              <button type="button" className="ghost-button" onClick={handleResetCurrentDraft}>
                현재 초안 초기화
              </button>
            </div>
          </section>

          <section className="panel advanced-panel">
            <button
              type="button"
              className="accordion-trigger"
              onClick={() => setIsAdvancedOpen((current) => !current)}
            >
              <span>고급 설정</span>
              <strong>{isAdvancedOpen ? '접기' : '열기'}</strong>
            </button>

            {isAdvancedOpen ? (
              <div className="advanced-content">
                <div className="subsection">
                  <div className="subsection-head">
                    <strong>배정 옵션</strong>
                    <span>필요할 때만 사용</span>
                  </div>
                  <div className="option-group">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={drawSettings.avoidPreviousSeat}
                        onChange={(event) =>
                          setDrawSettings((current) => ({
                            ...current,
                            avoidPreviousSeat: event.target.checked,
                          }))
                        }
                      />
                      지난 자리 피하기
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={drawSettings.balanceZones}
                        onChange={(event) =>
                          setDrawSettings((current) => ({
                            ...current,
                            balanceZones: event.target.checked,
                          }))
                        }
                      />
                      자리 편중 줄이기
                    </label>
                  </div>
                </div>

                <div className="subsection">
                  <div className="subsection-head">
                    <strong>고정석 지정</strong>
                    <span>{fixedSeats.length}건</span>
                  </div>
                  <div className="field-row">
                    <label className="field">
                      <span>학생 선택</span>
                      <select
                        value={fixedParticipantId}
                        onChange={(event) => setFixedParticipantId(event.target.value)}
                      >
                        <option value="">학생 선택</option>
                        {participants.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>좌석 선택</span>
                      <select
                        value={fixedCellId}
                        onChange={(event) => setFixedCellId(event.target.value)}
                      >
                        <option value="">좌석 선택</option>
                        {selectableSeatCells.map((cell) => (
                          <option key={cell.id} value={cell.id}>
                            {cell.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="inline-actions">
                    <button type="button" className="ghost-button" onClick={handleAddFixedSeat}>
                      고정석 저장
                    </button>
                  </div>

                  <div className="list-stack list-stack-short">
                    {fixedSeats.length > 0 ? (
                      fixedSeats
                        .slice()
                        .sort((left, right) => left.cellId.localeCompare(right.cellId))
                        .map((fixedSeat) => (
                          <article key={fixedSeat.participantId} className="list-card">
                            <div>
                              <strong>{fixedSeat.participantName}</strong>
                              <small>{fixedSeat.cellId} 고정</small>
                            </div>
                            <div className="mini-actions">
                              <button
                                type="button"
                                onClick={() => handleRemoveFixedSeat(fixedSeat.participantId)}
                              >
                                해제
                              </button>
                            </div>
                          </article>
                        ))
                    ) : (
                      <p className="empty-copy">지정된 고정석이 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="subsection">
                  <button
                    type="button"
                    className="subsection-toggle"
                    onClick={() => setIsSeatEditorOpen((current) => !current)}
                  >
                    <span>좌석 직접 편집</span>
                    <strong>{isSeatEditorOpen ? '접기' : '열기'}</strong>
                  </button>
                  {isSeatEditorOpen ? (
                    <>
                      <p className="helper-text">
                        각 칸을 클릭하면 좌석 → 통로 → 비활성 순으로 바뀝니다.
                      </p>
                      <div
                        className="layout-grid"
                        style={{
                          gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(56px, 1fr))`,
                        }}
                      >
                        {seatConfig.layout.cells.map((cell) => (
                          <button
                            key={cell.id}
                            type="button"
                            className={`layout-cell layout-cell-${cell.type}`}
                            onClick={() => handleCycleCellType(cell.id)}
                          >
                            <strong>{cell.label}</strong>
                            <small>
                              {cell.type === 'seat'
                                ? '좌석'
                                : cell.type === 'aisle'
                                  ? '통로'
                                  : '비활성'}
                            </small>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="helper-text">
                      현재 좌석 {usableSeatCount}석, 통로/비활성은 필요할 때만 편집합니다.
                    </p>
                  )}
                </div>

                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={handleClearAllStorage}>
                    전체 저장 삭제
                  </button>
                </div>
              </div>
            ) : (
              <p className="helper-text">
                통로, 고정석, 자리 편중 옵션은 필요할 때만 펼쳐서 사용하세요.
              </p>
            )}
          </section>
        </aside>

        <section className="result-panel result-panel-focus">
          <div className="panel-head panel-head-result">
            <div>
              <p className="section-kicker">결과</p>
              <h2>자리표</h2>
            </div>
            <span className="badge">{hasAssignments ? `${assignments.length}명 배정` : '결과 대기'}</span>
          </div>

          <div className="result-toolbar result-toolbar-simple">
            <label className="field search-field">
              <span>이름 검색</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="학생 이름 입력"
                disabled={!hasAssignments}
              />
            </label>

            <div className="toolbar-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={handleCopyResult}
                disabled={!hasAssignments}
              >
                복사
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handlePrint}
                disabled={!hasAssignments}
              >
                인쇄
              </button>
            </div>
          </div>

          {hasAssignments ? (
            <>
              <div className="result-meta">
                <span>마지막 결과: {formatTimestamp(updatedAt)}</span>
                <span>
                  {drawSettings.avoidPreviousSeat ? '지난 자리 피하기' : '완전 랜덤'}
                  {' · '}
                  {drawSettings.balanceZones ? '자리 편중 줄이기' : '균형 옵션 꺼짐'}
                </span>
              </div>

              <div className="redraw-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => runDraw('all')}
                  disabled={isDrawing}
                >
                  전체 다시 뽑기
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setIsRedrawPickerOpen((current) => !current)}
                  disabled={isDrawing || redrawCandidates.length === 0}
                >
                  일부만 다시 뽑기
                </button>
              </div>

              {isRedrawPickerOpen ? (
                <div className="subsection redraw-picker">
                  <div className="subsection-head">
                    <strong>다시 뽑을 학생 선택</strong>
                    <span>{selectedParticipantsForRedraw.length}명 선택</span>
                  </div>
                  <div className="checkbox-list">
                    {redrawCandidates.map((assignment) => (
                      <label key={assignment.participant!.id} className="checkbox-chip">
                        <input
                          type="checkbox"
                          checked={selectedParticipantsForRedraw.includes(
                            assignment.participant!.id,
                          )}
                          onChange={() => toggleRedrawParticipant(assignment.participant!.id)}
                        />
                        {assignment.participant!.name}
                      </label>
                    ))}
                  </div>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => runDraw('selected')}
                      disabled={isDrawing}
                    >
                      선택한 학생만 다시 뽑기
                    </button>
                  </div>
                </div>
              ) : null}

              {normalizedSearchQuery && !hasSearchResults ? (
                <p className="helper-text">검색 결과가 없습니다.</p>
              ) : null}

              <div className="seat-board">
                <div
                  className={`seat-grid result-seat-grid ${isDrawing ? 'seat-grid-drawing' : ''}`}
                  style={{
                    gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(118px, 1fr))`,
                  }}
                >
                  {seatConfig.layout.cells.map((cell) => {
                    const assignment = assignmentMap.get(cell.id)
                    const isSearchMatch = matchingCellIds.has(cell.id)
                    const fixedSeat = fixedSeats.find((item) => item.cellId === cell.id)
                    const seatNumber = seatNumberMap.get(cell.id)

                    if (cell.type !== 'seat') {
                      return (
                        <article key={cell.id} className={`seat-card seat-card-${cell.type}`}>
                          <span className="seat-label">{cell.label}</span>
                          <strong>{cell.type === 'aisle' ? '통로' : '비활성'}</strong>
                          <small>배정 제외</small>
                        </article>
                      )
                    }

                    return (
                      <article
                        key={cell.id}
                        className={`seat-card ${
                          assignment?.isFixed ? 'seat-card-fixed' : ''
                        } ${isSearchMatch ? 'seat-card-highlight' : ''}`}
                      >
                        <span className="seat-label">{cell.label}</span>
                        <strong>{assignment?.participant?.name ?? '빈자리'}</strong>
                        <small>
                          {seatNumber}번 자리
                          {fixedSeat ? ' · 고정석' : ''}
                        </small>
                      </article>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-result">
              <p className="section-kicker">Ready</p>
              <h3>자리표가 아직 없습니다</h3>
              <p>
                왼쪽에서 명단을 입력하고 좌석만 확인한 뒤, <strong>자리 뽑기</strong>를
                누르면 결과가 이 영역에 표시됩니다.
              </p>
            </div>
          )}
        </section>
      </main>

      {(isTemplateDrawerOpen || isHistoryDrawerOpen) ? (
        <div className="drawer-backdrop" onClick={closeDrawers}>
          <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <p className="section-kicker">{isTemplateDrawerOpen ? '템플릿' : '이력'}</p>
                <h2>{isTemplateDrawerOpen ? '저장된 템플릿' : '최근 이력'}</h2>
              </div>
              <button type="button" className="ghost-button" onClick={closeDrawers}>
                닫기
              </button>
            </div>

            {isTemplateDrawerOpen ? (
              <div className="drawer-body">
                <p className="helper-text">
                  현재 명단, 좌석 배치, 고정석 상태를 템플릿으로 저장할 수 있습니다.
                </p>
                <div className="inline-actions">
                  <button type="button" className="primary-button" onClick={handleSaveTemplate}>
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
                          <button type="button" onClick={() => handleLoadTemplate(template)}>
                            불러오기
                          </button>
                          <button type="button" onClick={() => handleRenameTemplate(template)}>
                            이름 변경
                          </button>
                          <button type="button" onClick={() => handleDeleteTemplate(template)}>
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
                          <button type="button" onClick={() => handleLoadHistory(entry)}>
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
      ) : null}
    </div>
  )
}

export default App
