import { AdvancedSettingsPanel } from './components/AdvancedSettingsPanel'
import { AppHeader } from './components/AppHeader'
import { DrawerOverlay } from './components/DrawerOverlay'
import { DrawActionPanel } from './components/DrawActionPanel'
import { ParticipantInputPanel } from './components/ParticipantInputPanel'
import { ResultPanel } from './components/ResultPanel'
import { SeatConfigPanel } from './components/SeatConfigPanel'
import { flowRailClass, shellClass, workspaceClass } from './components/ui'
import { useSeatApp } from './hooks/useSeatApp'
import { formatTimestamp } from './utils/format'

function App() {
  const app = useSeatApp()

  return (
    <div className={shellClass}>
      <AppHeader
        updatedAtLabel={formatTimestamp(app.updatedAt)}
        participantCount={app.participants.length}
        usableSeatCount={app.usableSeatCount}
        templateCount={app.templates.length}
        historyCount={app.history.length}
        onOpenTemplateDrawer={app.onOpenTemplateDrawer}
        onOpenHistoryDrawer={app.onOpenHistoryDrawer}
      />

      <main className={workspaceClass}>
        <aside className={flowRailClass}>
          <ParticipantInputPanel
            participantInput={app.participantInput}
            participants={app.participants}
            duplicateNames={app.duplicateNames}
            onParticipantInputChange={app.onParticipantInputChange}
          />
          <SeatConfigPanel
            seatConfig={app.seatConfig}
            recommendedLayouts={app.recommendedLayouts}
            usableSeatCount={app.usableSeatCount}
            participantCount={app.participants.length}
            onDimensionChange={app.onDimensionChange}
            onApplyRecommendation={app.onApplyRecommendation}
          />
          <DrawActionPanel
            hasAssignments={app.hasAssignments}
            isAdvancedOpen={app.isAdvancedOpen}
            errorMessage={app.errorMessage}
            statusMessage={app.statusMessage}
            isDrawing={app.isDrawing}
            onRunDraw={() => app.onRunDraw('all')}
            onResetCurrentDraft={app.onResetCurrentDraft}
          />
          <AdvancedSettingsPanel
            isAdvancedOpen={app.isAdvancedOpen}
            onToggleAdvanced={app.onToggleAdvanced}
            drawSettings={app.drawSettings}
            onAvoidPreviousSeatChange={app.onAvoidPreviousSeatChange}
            onBalanceZonesChange={app.onBalanceZonesChange}
            fixedSeats={app.fixedSeats}
            fixedParticipantId={app.fixedParticipantId}
            fixedCellId={app.fixedCellId}
            participants={app.participants}
            selectableSeatCells={app.selectableSeatCells}
            onFixedParticipantChange={app.onFixedParticipantChange}
            onFixedCellChange={app.onFixedCellChange}
            onAddFixedSeat={app.onAddFixedSeat}
            onRemoveFixedSeat={app.onRemoveFixedSeat}
            isSeatEditorOpen={app.isSeatEditorOpen}
            onToggleSeatEditor={app.onToggleSeatEditor}
            seatConfig={app.seatConfig}
            usableSeatCount={app.usableSeatCount}
            onCycleCellType={app.onCycleCellType}
            onClearAllStorage={app.onClearAllStorage}
          />
        </aside>

        <ResultPanel
          assignments={app.assignments}
          updatedAtLabel={formatTimestamp(app.updatedAt)}
          drawSettings={app.drawSettings}
          searchQuery={app.searchQuery}
          onSearchQueryChange={app.onSearchQueryChange}
          onCopyResult={app.onCopyResult}
          onPrint={app.onPrint}
          isDrawing={app.isDrawing}
          onRunDrawAll={() => app.onRunDraw('all')}
          onToggleRedrawPicker={app.onToggleRedrawPicker}
          redrawCandidates={app.redrawCandidates}
          isRedrawPickerOpen={app.isRedrawPickerOpen}
          selectedParticipantsForRedraw={app.selectedParticipantsForRedraw}
          onToggleRedrawParticipant={app.onToggleRedrawParticipant}
          onSelectAllForRedraw={app.onSelectAllForRedraw}
          onDeselectAllForRedraw={app.onDeselectAllForRedraw}
          onRunDrawSelected={() => app.onRunDraw('selected')}
          showNoSearchResults={app.showNoSearchResults}
          seatConfig={app.seatConfig}
          assignmentMap={app.assignmentMap}
          matchingCellIds={app.matchingCellIds}
          fixedSeats={app.fixedSeats}
          seatNumberMap={app.seatNumberMap}
        />
      </main>

      <DrawerOverlay
        isTemplateDrawerOpen={app.isTemplateDrawerOpen}
        isHistoryDrawerOpen={app.isHistoryDrawerOpen}
        templates={app.templates}
        history={app.history}
        onClose={app.onCloseDrawers}
        onSaveTemplate={app.onSaveTemplate}
        onLoadTemplate={app.onLoadTemplate}
        onRenameTemplate={app.onRenameTemplate}
        onDeleteTemplate={app.onDeleteTemplate}
        onLoadHistory={app.onLoadHistory}
      />
    </div>
  )
}

export default App
