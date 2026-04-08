import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  DrawHistoryEntry,
  DrawOptions,
  DrawSettings,
  FixedSeat,
  SeatAssignment,
  SeatConfig,
  SeatTemplate,
} from '../types'
import { buildSeatTableText } from '../utils/export'
import { addHistoryEntry } from '../utils/history'
import {
  cycleCellType,
  getCellById,
  getUsableSeatCells,
  updateLayoutDimensions,
} from '../utils/layout'
import { parseParticipants } from '../utils/participants'
import { generateAssignments } from '../utils/seating'
import {
  clearSavedState,
  getDefaultState,
  loadSavedState,
  saveState,
} from '../utils/storage'
import { deleteTemplate, renameTemplate, upsertTemplate } from '../utils/templates'
import { type BrowserApi, defaultBrowserApi } from './browserApi'
import { selectParticipantMap, selectRedrawCandidates, selectUsableSeatCount } from './seatSelectors'

const DRAW_DURATION = 700

export type SeatStoreState = {
  participantInput: string
  seatConfig: SeatConfig
  fixedSeats: FixedSeat[]
  assignments: SeatAssignment[]
  updatedAt: string | null
  drawSettings: DrawSettings
  templates: SeatTemplate[]
  history: DrawHistoryEntry[]
  searchQuery: string
  selectedParticipantsForRedraw: string[]
  errorMessage: string
  statusMessage: string
  isDrawing: boolean
  fixedParticipantId: string
  fixedCellId: string
  isTemplateDrawerOpen: boolean
  isHistoryDrawerOpen: boolean
  isSettingsDrawerOpen: boolean
  isAdvancedOpen: boolean
  isSeatEditorOpen: boolean
  isRedrawPickerOpen: boolean
  drawTimerId: number | null
}

export type SeatStoreActions = {
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
  onOpenSettingsDrawer: () => void
  onCloseDrawers: () => void
  _clearDrawTimer: () => void
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

function persistState(state: SeatStoreState) {
  saveState({
    currentDraft: {
      participantInput: state.participantInput,
      seatConfig: state.seatConfig,
      fixedSeats: state.fixedSeats,
      assignments: state.assignments,
      updatedAt: state.updatedAt,
      drawSettings: state.drawSettings,
    },
    templates: state.templates,
    history: state.history,
  })
}

function loadInitialState(): SeatStoreState {
  const saved = loadSavedState()

  return {
    participantInput: saved.currentDraft.participantInput,
    seatConfig: saved.currentDraft.seatConfig,
    fixedSeats: saved.currentDraft.fixedSeats,
    assignments: saved.currentDraft.assignments,
    updatedAt: saved.currentDraft.updatedAt,
    drawSettings: saved.currentDraft.drawSettings,
    templates: saved.templates,
    history: saved.history,
    searchQuery: '',
    selectedParticipantsForRedraw: [],
    errorMessage: '',
    statusMessage: '',
    isDrawing: false,
    fixedParticipantId: '',
    fixedCellId: '',
    isTemplateDrawerOpen: false,
    isHistoryDrawerOpen: false,
    isSettingsDrawerOpen: false,
    isAdvancedOpen: false,
    isSeatEditorOpen: false,
    isRedrawPickerOpen: false,
    drawTimerId: null,
  }
}

export function createSeatStore(browser: BrowserApi = defaultBrowserApi) {
  const store = create<SeatStoreState & SeatStoreActions>()(
    subscribeWithSelector((set, get) => {
      function clearDrawTimer() {
        const { drawTimerId } = get()
        if (drawTimerId !== null) {
          browser.clearTimer(drawTimerId)
          set({ drawTimerId: null })
        }
      }

      function abortPendingDraw() {
        clearDrawTimer()
        set({ isDrawing: false })
      }

      function clearDraftAssignments() {
        abortPendingDraw()
        const state = get()
        if (
          state.assignments.length === 0
          && state.updatedAt === null
          && state.selectedParticipantsForRedraw.length === 0
          && !state.isRedrawPickerOpen
        ) {
          return
        }
        set({
          assignments: [],
          updatedAt: null,
          selectedParticipantsForRedraw: [],
          isRedrawPickerOpen: false,
        })
      }

      return {
        ...loadInitialState(),

        onParticipantInputChange: (value) => {
          set({ participantInput: value })
          clearDraftAssignments()
          set({ statusMessage: '', errorMessage: '' })
        },

        onDimensionChange: (field, rawValue) => {
          const parsed = Math.max(1, Number.parseInt(rawValue, 10) || 1)
          const state = get()
          const nextRows = field === 'rows' ? parsed : state.seatConfig.rows
          const nextColumns = field === 'columns' ? parsed : state.seatConfig.columns

          set({
            seatConfig: {
              rows: nextRows,
              columns: nextColumns,
              layout: updateLayoutDimensions(state.seatConfig.layout, nextRows, nextColumns),
            },
          })
          clearDraftAssignments()
          set({ statusMessage: '', errorMessage: '' })
        },

        onApplyRecommendation: (rows, columns) => {
          const state = get()
          set({
            seatConfig: {
              rows,
              columns,
              layout: updateLayoutDimensions(state.seatConfig.layout, rows, columns),
            },
          })
          clearDraftAssignments()
          set({
            statusMessage: `${rows} x ${columns} 추천 좌석판을 적용했습니다.`,
            errorMessage: '',
          })
        },

        onCycleCellType: (cellId) => {
          const state = get()
          set({
            seatConfig: {
              ...state.seatConfig,
              layout: cycleCellType(state.seatConfig.layout, cellId),
            },
          })
          clearDraftAssignments()
          set({ statusMessage: '', errorMessage: '' })
        },

        onAddFixedSeat: () => {
          const state = get()
          const participants = parseParticipants(state.participantInput)
          const participantMap = selectParticipantMap(participants)
          const participant = participantMap.get(state.fixedParticipantId)
          const seatCell = getCellById(state.seatConfig.layout, state.fixedCellId)

          if (!participant || !seatCell || seatCell.type !== 'seat') {
            set({ errorMessage: '고정할 학생과 실제 좌석을 먼저 선택해 주세요.' })
            return
          }

          const nextFixedSeat: FixedSeat = {
            participantId: participant.id,
            participantName: participant.name,
            cellId: seatCell.id,
          }

          set({
            fixedSeats: [
              ...state.fixedSeats.filter(
                (fs) => fs.participantId !== participant.id && fs.cellId !== seatCell.id,
              ),
              nextFixedSeat,
            ],
            fixedParticipantId: '',
            fixedCellId: '',
          })
          clearDraftAssignments()
          set({
            statusMessage: `${participant.name} 학생을 ${seatCell.label}에 고정했습니다.`,
            errorMessage: '',
          })
        },

        onRemoveFixedSeat: (participantId) => {
          set((state) => ({
            fixedSeats: state.fixedSeats.filter((fs) => fs.participantId !== participantId),
          }))
          clearDraftAssignments()
          set({ statusMessage: '고정석을 해제했습니다.', errorMessage: '' })
        },

        onFixedParticipantChange: (value) => set({ fixedParticipantId: value }),
        onFixedCellChange: (value) => set({ fixedCellId: value }),

        onAvoidPreviousSeatChange: (checked) =>
          set((state) => ({
            drawSettings: { ...state.drawSettings, avoidPreviousSeat: checked },
          })),

        onBalanceZonesChange: (checked) =>
          set((state) => ({
            drawSettings: { ...state.drawSettings, balanceZones: checked },
          })),

        onToggleAdvanced: () => set((state) => ({ isAdvancedOpen: !state.isAdvancedOpen })),
        onToggleSeatEditor: () => set((state) => ({ isSeatEditorOpen: !state.isSeatEditorOpen })),

        onRunDraw: (redrawMode) => {
          set({ errorMessage: '', statusMessage: '' })

          const state = get()
          const participants = parseParticipants(state.participantInput)
          const usableSeatCount = selectUsableSeatCount(state)

          if (participants.length === 0) {
            set({ errorMessage: '참여자 이름을 한 명 이상 입력해 주세요.' })
            return
          }

          if (participants.length > usableSeatCount) {
            set({ errorMessage: '참여자 수가 사용 가능한 좌석 수보다 많습니다.' })
            return
          }

          if (redrawMode === 'selected') {
            if (state.assignments.length === 0) {
              set({ errorMessage: '일부만 다시 뽑기는 먼저 전체 자리 뽑기를 완료한 뒤 사용할 수 있습���다.' })
              return
            }
            if (state.selectedParticipantsForRedraw.length === 0) {
              set({ errorMessage: '다시 뽑을 학생을 한 명 이상 선택해 주세요.' })
              return
            }
          }

          set((s) => ({
            drawSettings: { ...s.drawSettings, redrawMode },
          }))

          const drawOptions: DrawOptions = {
            ...state.drawSettings,
            redrawMode,
            selectedParticipantIds:
              redrawMode === 'selected' ? state.selectedParticipantsForRedraw : [],
          }

          let nextAssignments: SeatAssignment[]

          try {
            nextAssignments = generateAssignments({
              participants,
              layout: state.seatConfig.layout,
              fixedSeats: state.fixedSeats,
              history: state.history,
              drawOptions,
              currentAssignments: state.assignments,
            })
          } catch (error) {
            set({
              errorMessage: error instanceof Error
                ? error.message
                : '자리 뽑기 중 오류가 발생��습니다.',
            })
            return
          }

          clearDrawTimer()
          set({ isDrawing: true })

          const timerId = browser.startTimer(() => {
            const timestamp = new Date().toISOString()
            const currentState = get()
            const historyEntry: DrawHistoryEntry = {
              id: crypto.randomUUID(),
              timestamp,
              assignments: structuredClone(nextAssignments),
              participantsSnapshot: participants.map((p) => ({ ...p })),
              layoutSnapshot: {
                rows: currentState.seatConfig.layout.rows,
                columns: currentState.seatConfig.layout.columns,
                cells: currentState.seatConfig.layout.cells.map((cell) => ({ ...cell })),
              },
              fixedSeatsSnapshot: structuredClone(currentState.fixedSeats),
              optionsUsed: { ...drawOptions },
            }

            set({
              assignments: nextAssignments,
              updatedAt: timestamp,
              history: addHistoryEntry(currentState.history, historyEntry),
              isDrawing: false,
              drawTimerId: null,
              statusMessage: redrawMode === 'selected'
                ? '선택한 학생들만 다시 뽑았습니다.'
                : '자리 뽑기를 완료했습니다.',
              ...(redrawMode === 'all' ? { selectedParticipantsForRedraw: [] } : {}),
              isRedrawPickerOpen: false,
            })
          }, DRAW_DURATION)

          set({ drawTimerId: timerId })
        },

        onResetCurrentDraft: () => {
          abortPendingDraw()
          const defaults = getDefaultState()
          set({
            participantInput: defaults.currentDraft.participantInput,
            seatConfig: defaults.currentDraft.seatConfig,
            fixedSeats: defaults.currentDraft.fixedSeats,
            assignments: defaults.currentDraft.assignments,
            updatedAt: defaults.currentDraft.updatedAt,
            drawSettings: defaults.currentDraft.drawSettings,
            searchQuery: '',
            selectedParticipantsForRedraw: [],
            errorMessage: '',
            statusMessage: '',
            isDrawing: false,
            fixedParticipantId: '',
            fixedCellId: '',
            isRedrawPickerOpen: false,
          })
        },

        onClearAllStorage: () => {
          if (!browser.confirm('현재 초안, 템플릿, 이력을 모두 삭제할까요?')) return

          abortPendingDraw()
          const defaults = getDefaultState()
          set({
            participantInput: defaults.currentDraft.participantInput,
            seatConfig: defaults.currentDraft.seatConfig,
            fixedSeats: defaults.currentDraft.fixedSeats,
            assignments: defaults.currentDraft.assignments,
            updatedAt: defaults.currentDraft.updatedAt,
            drawSettings: defaults.currentDraft.drawSettings,
            templates: [],
            history: [],
            searchQuery: '',
            selectedParticipantsForRedraw: [],
            errorMessage: '',
            statusMessage: '로컬 저장 데이터를 모두 지웠습니다.',
            isDrawing: false,
            fixedParticipantId: '',
            fixedCellId: '',
            isRedrawPickerOpen: false,
          })
          clearSavedState()
        },

        onCopyResult: async () => {
          const state = get()
          if (state.assignments.length === 0) {
            set({ errorMessage: '복사할 자리표가 아직 없습니다.' })
            return
          }

          const text = buildSeatTableText(state.seatConfig.layout, state.assignments)

          try {
            await browser.copyText(text)
            set({ statusMessage: '자리표를 텍스트로 복사했습니다.', errorMessage: '' })
          } catch {
            set({ errorMessage: '클립보드 복사에 실패했습니다.' })
          }
        },

        onPrint: () => {
          const state = get()
          if (state.assignments.length === 0) {
            set({ errorMessage: '인쇄할 자��표가 아직 없습니다.' })
            return
          }
          browser.print()
        },

        onSearchQueryChange: (value) => set({ searchQuery: value }),

        onToggleRedrawPicker: () =>
          set((state) => ({ isRedrawPickerOpen: !state.isRedrawPickerOpen })),

        onToggleRedrawParticipant: (participantId) =>
          set((state) => ({
            selectedParticipantsForRedraw: state.selectedParticipantsForRedraw.includes(participantId)
              ? state.selectedParticipantsForRedraw.filter((id) => id !== participantId)
              : [...state.selectedParticipantsForRedraw, participantId],
          })),

        onSelectAllForRedraw: () => {
          const state = get()
          const candidates = selectRedrawCandidates(state)
          set({
            selectedParticipantsForRedraw: candidates
              .filter((a) => a.participant)
              .map((a) => a.participant!.id),
          })
        },

        onDeselectAllForRedraw: () => set({ selectedParticipantsForRedraw: [] }),

        onSaveTemplate: () => {
          const name = browser.prompt('저장할 템플릿 ��름을 입력해 주세요.', '새 템플릿')
          if (!name || !name.trim()) return

          const state = get()
          const now = new Date().toISOString()
          const template: SeatTemplate = {
            id: crypto.randomUUID(),
            name: name.trim(),
            participantInput: state.participantInput,
            seatConfig: cloneLayout(state.seatConfig),
            fixedSeats: structuredClone(state.fixedSeats),
            createdAt: now,
            updatedAt: now,
          }

          set({
            templates: upsertTemplate(state.templates, template),
            statusMessage: `"${template.name}" 템플릿을 저���했습니다.`,
            errorMessage: '',
          })
        },

        onLoadTemplate: (template) => {
          if (!browser.confirm(`"${template.name}" 템플릿을 현재 초안에 불러올까요?`)) return

          abortPendingDraw()
          set({
            participantInput: template.participantInput,
            seatConfig: cloneLayout(template.seatConfig),
            fixedSeats: structuredClone(template.fixedSeats),
            assignments: [],
            updatedAt: null,
            selectedParticipantsForRedraw: [],
            searchQuery: '',
            statusMessage: `"${template.name}" 템플릿을 불러왔습니다.`,
            errorMessage: '',
            isTemplateDrawerOpen: false,
            isRedrawPickerOpen: false,
          })
        },

        onRenameTemplate: (template) => {
          const nextName = browser.prompt('새 템플릿 이름을 입력해 주세��.', template.name)
          if (!nextName || !nextName.trim()) return

          set((state) => ({
            templates: renameTemplate(state.templates, template.id, nextName.trim()),
            statusMessage: '템플릿 이름을 변경했��니다.',
            errorMessage: '',
          }))
        },

        onDeleteTemplate: (template) => {
          if (!browser.confirm(`"${template.name}" ���플릿을 삭제할까요?`)) return

          set((state) => ({
            templates: deleteTemplate(state.templates, template.id),
            statusMessage: '템플릿을 삭제했습���다.',
            errorMessage: '',
          }))
        },

        onLoadHistory: (entry) => {
          if (!browser.confirm('이 이력 상태를 현재 작업 화면에 불러올까요?')) return

          abortPendingDraw()
          set({
            participantInput: entry.participantsSnapshot.map((p) => p.name).join('\n'),
            seatConfig: {
              rows: entry.layoutSnapshot.rows,
              columns: entry.layoutSnapshot.columns,
              layout: {
                rows: entry.layoutSnapshot.rows,
                columns: entry.layoutSnapshot.columns,
                cells: entry.layoutSnapshot.cells.map((cell) => ({ ...cell })),
              },
            },
            fixedSeats: structuredClone(entry.fixedSeatsSnapshot),
            assignments: structuredClone(entry.assignments),
            updatedAt: entry.timestamp,
            selectedParticipantsForRedraw: [],
            searchQuery: '',
            statusMessage: '이력 결과를 현재 화면에 불러왔습니다.',
            errorMessage: '',
            isHistoryDrawerOpen: false,
            isRedrawPickerOpen: false,
          })
        },

        onOpenTemplateDrawer: () =>
          set({ isTemplateDrawerOpen: true, isHistoryDrawerOpen: false, isSettingsDrawerOpen: false }),

        onOpenHistoryDrawer: () =>
          set({ isHistoryDrawerOpen: true, isTemplateDrawerOpen: false, isSettingsDrawerOpen: false }),

        onOpenSettingsDrawer: () =>
          set({ isSettingsDrawerOpen: true, isTemplateDrawerOpen: false, isHistoryDrawerOpen: false }),

        onCloseDrawers: () =>
          set({ isTemplateDrawerOpen: false, isHistoryDrawerOpen: false, isSettingsDrawerOpen: false }),

        _clearDrawTimer: () => clearDrawTimer(),
      }
    }),
  )

  // Auto-persist on relevant state changes
  store.subscribe(
    (state) => ({
      participantInput: state.participantInput,
      seatConfig: state.seatConfig,
      fixedSeats: state.fixedSeats,
      assignments: state.assignments,
      updatedAt: state.updatedAt,
      drawSettings: state.drawSettings,
      templates: state.templates,
      history: state.history,
    }),
    () => persistState(store.getState()),
    { equalityFn: (a, b) => Object.keys(a).every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) },
  )

  // Prune fixedSeats and selectedParticipantsForRedraw when participants or layout change
  store.subscribe(
    (state) => ({
      participantInput: state.participantInput,
      layout: state.seatConfig.layout,
    }),
    () => {
      const state = store.getState()
      const participants = parseParticipants(state.participantInput)
      const participantIds = new Set(participants.map((p) => p.id))
      const validSeatIds = new Set(getUsableSeatCells(state.seatConfig.layout).map((c) => c.id))

      const filteredFixed = state.fixedSeats.filter(
        (fs) => participantIds.has(fs.participantId) && validSeatIds.has(fs.cellId),
      )
      if (filteredFixed.length !== state.fixedSeats.length) {
        store.setState({ fixedSeats: filteredFixed })
      }

      const filteredSelected = state.selectedParticipantsForRedraw.filter(
        (id) => participantIds.has(id),
      )
      if (filteredSelected.length !== state.selectedParticipantsForRedraw.length) {
        store.setState({ selectedParticipantsForRedraw: filteredSelected })
      }
    },
    { equalityFn: (a, b) => a.participantInput === b.participantInput && a.layout === b.layout },
  )

  return store
}

export const useSeatStore = createSeatStore()
