import { useEffect, useRef, useState } from 'react'
import type { SavedState, SeatAssignment } from './types'
import { findDuplicateNames, parseParticipants } from './utils/participants'
import { createSeatAssignments } from './utils/seating'
import {
  clearSavedState,
  getDefaultState,
  loadSavedState,
  saveState,
} from './utils/storage'

const DRAW_DURATION = 900

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return '아직 뽑기 기록이 없습니다.'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function App() {
  const initialState = loadSavedState()
  const [participantInput, setParticipantInput] = useState(initialState.participantInput)
  const [rows, setRows] = useState(String(initialState.seatConfig.rows))
  const [columns, setColumns] = useState(String(initialState.seatConfig.columns))
  const [assignments, setAssignments] = useState<SeatAssignment[]>(
    initialState.assignments,
  )
  const [updatedAt, setUpdatedAt] = useState(initialState.updatedAt)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const drawTimerRef = useRef<number | null>(null)

  const participants = parseParticipants(participantInput)
  const duplicateNames = findDuplicateNames(participants)
  const seatRows = Math.max(1, Number.parseInt(rows, 10) || 0)
  const seatColumns = Math.max(1, Number.parseInt(columns, 10) || 0)
  const totalSeats = seatRows * seatColumns
  const canDraw = participants.length > 0 && participants.length <= totalSeats && !isDrawing
  const visibleAssignments =
    assignments.length > 0
      ? assignments
      : Array.from({ length: totalSeats }, (_, index) => ({
          seatNumber: index + 1,
          row: Math.floor(index / seatColumns) + 1,
          column: (index % seatColumns) + 1,
          label: `${Math.floor(index / seatColumns) + 1}-${(index % seatColumns) + 1}`,
          participant: null,
        }))

  useEffect(() => {
    const stateToSave: SavedState = {
      participantInput,
      seatConfig: {
        rows: seatRows,
        columns: seatColumns,
      },
      assignments,
      updatedAt,
    }

    saveState(stateToSave)
  }, [assignments, columns, participantInput, rows, seatColumns, seatRows, updatedAt])

  useEffect(() => {
    return () => {
      if (drawTimerRef.current) {
        window.clearTimeout(drawTimerRef.current)
      }
    }
  }, [])

  function resetAll() {
    if (drawTimerRef.current) {
      window.clearTimeout(drawTimerRef.current)
      drawTimerRef.current = null
    }

    const defaultState = getDefaultState()
    setParticipantInput(defaultState.participantInput)
    setRows(String(defaultState.seatConfig.rows))
    setColumns(String(defaultState.seatConfig.columns))
    setAssignments([])
    setUpdatedAt(defaultState.updatedAt)
    setErrorMessage('')
    setIsDrawing(false)
    clearSavedState()
  }

  function handleDraw() {
    setErrorMessage('')

    if (participants.length === 0) {
      setAssignments([])
      setUpdatedAt(null)
      setErrorMessage('참여자 이름을 한 명 이상 입력해 주세요.')
      return
    }

    if (participants.length > totalSeats) {
      setAssignments([])
      setErrorMessage('좌석 수보다 참여자가 많아서 배정할 수 없습니다.')
      return
    }

    setIsDrawing(true)

    if (drawTimerRef.current) {
      window.clearTimeout(drawTimerRef.current)
    }

    const nextAssignments = createSeatAssignments(participants, {
      rows: seatRows,
      columns: seatColumns,
    })

    drawTimerRef.current = window.setTimeout(() => {
      setAssignments(nextAssignments)
      setUpdatedAt(new Date().toISOString())
      setIsDrawing(false)
    }, DRAW_DURATION)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="title-block">
          <p className="eyebrow">Local Random Seat Picker</p>
          <h1>랜덤 자리 뽑기</h1>
          <p className="hero-text">한 화면에서 바로 보는 로컬 좌석 배정</p>
        </div>
        <div className="header-metrics">
          <article className="metric-card metric-card-strong">
            <span>마지막 배정</span>
            <strong>{formatTimestamp(updatedAt)}</strong>
          </article>
          <article className="metric-card">
            <span>참여자 / 좌석</span>
            <strong>
              {participants.length} / {totalSeats}
            </strong>
          </article>
          <article className="metric-card">
            <span>남는 좌석</span>
            <strong>{Math.max(totalSeats - participants.length, 0)}석</strong>
          </article>
        </div>
      </header>

      <main className="workspace">
        <aside className="control-stack">
          <section className="panel panel-compact">
            <div className="panel-head">
              <div>
                <p className="section-kicker">입력</p>
                <h2>참여자 명단</h2>
              </div>
              <span className="badge">{participants.length}명</span>
            </div>

            <label className="field">
              <span>이름 입력 또는 CSV 붙여넣기</span>
              <textarea
                value={participantInput}
                onChange={(event) => setParticipantInput(event.target.value)}
                placeholder={
                  '예시\n김하나\n박둘\n이셋\n\n또는\n김하나,박둘,이셋'
                }
                rows={7}
              />
            </label>

            <p className="helper-text">
              줄바꿈, 쉼표, 탭 붙여넣기를 모두 자동 정리합니다.
            </p>

            {duplicateNames.length > 0 ? (
              <p className="warning-text">
                중복 이름 감지: {duplicateNames.join(', ')}
              </p>
            ) : null}

            <div className="preview-box preview-box-compact">
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

          <section className="panel panel-compact">
            <div className="panel-head">
              <div>
                <p className="section-kicker">설정</p>
                <h2>좌석 그리드</h2>
              </div>
              <span className="badge">{totalSeats}석</span>
            </div>

            <div className="field-row">
              <label className="field">
                <span>행</span>
                <input
                  type="number"
                  min="1"
                  value={rows}
                  onChange={(event) => setRows(event.target.value)}
                />
              </label>
              <label className="field">
                <span>열</span>
                <input
                  type="number"
                  min="1"
                  value={columns}
                  onChange={(event) => setColumns(event.target.value)}
                />
              </label>
            </div>

            <div className="summary-card">
              <div>
                <span>참여자</span>
                <strong>{participants.length}명</strong>
              </div>
              <div>
                <span>총 좌석</span>
                <strong>{totalSeats}석</strong>
              </div>
              <div>
                <span>빈 좌석</span>
                <strong>{Math.max(totalSeats - participants.length, 0)}석</strong>
              </div>
            </div>

            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

            <div className="action-row">
              <button type="button" className="ghost-button" onClick={resetAll}>
                초기화
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleDraw}
                disabled={!canDraw}
              >
                {isDrawing ? '섞는 중...' : '랜덤 배정'}
              </button>
            </div>
          </section>
        </aside>

        <section className="result-panel result-panel-full">
          <div className="panel-head">
            <div>
              <p className="section-kicker">결과</p>
              <h2>자리표</h2>
            </div>
            <span className="badge">
              {assignments.length > 0 ? `${assignments.length}칸` : '대기 중'}
            </span>
          </div>

          <div className="result-toolbar">
            <span>
              좌석 라벨은 <strong>{`행-열`}</strong> 형식입니다.
            </span>
            <span>{isDrawing ? '자리 배정 중...' : '전체 결과가 이 영역에서 유지됩니다.'}</span>
          </div>

          <div className="seat-board">
            <div
              className={`seat-grid ${isDrawing ? 'seat-grid-drawing' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${seatColumns}, minmax(108px, 1fr))`,
              }}
            >
              {visibleAssignments.map((assignment) => (
                <article key={assignment.label} className="seat-card">
                  <span className="seat-label">{assignment.label}</span>
                  <strong>{assignment.participant?.name ?? '빈자리'}</strong>
                  <small>{assignment.seatNumber}번 자리</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
