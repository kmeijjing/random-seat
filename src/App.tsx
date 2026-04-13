import { useHotkeys } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useEffect } from "react";
import { AdvancedSettingsPanel } from "./components/AdvancedSettingsPanel";
import { AppHeader } from "./components/AppHeader";
import { DrawerOverlay } from "./components/DrawerOverlay";
import { DrawActionPanel } from "./components/DrawActionPanel";
import { KeyboardShortcutsModalBody } from "./components/KeyboardShortcutsModal";
import { NameInputModalBody } from "./components/NameInputModalBody";
import { ParticipantInputPanel } from "./components/ParticipantInputPanel";
import { ResultPanel } from "./components/ResultPanel";
import { SeatConfigPanel } from "./components/SeatConfigPanel";
import {
  selectParticipants,
  selectUsableSeatCount,
} from "./store/seatSelectors";
import { useSeatStore } from "./store/seatStore";

function App() {
  useEffect(() => {
    return () => useSeatStore.getState()._clearDrawTimer();
  }, []);

  const runDrawIfPossible = () => {
    const state = useSeatStore.getState();
    const participants = selectParticipants(state);
    const usable = selectUsableSeatCount(state);
    if (state.isDrawing) return;
    if (participants.length === 0 || participants.length > usable) return;
    state.onRunDraw("all");
  };

  const focusSearchInput = () => {
    // ResultPanel의 검색 TextInput에는 placeholder 기반으로 찾기
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="학생 이름 검색"]',
    );
    input?.focus();
  };

  const openSaveTemplateShortcut = () => {
    const modalId = "save-template-shortcut";
    modals.open({
      modalId,
      title: "현재 상태를 템플릿으로 저장",
      children: (
        <NameInputModalBody
          modalId={modalId}
          initialValue="새 템플릿"
          placeholder="템플릿 이름"
          confirmLabel="저장"
          onConfirm={(name) => useSeatStore.getState().onSaveTemplate(name)}
        />
      ),
    });
  };

  const openShortcutsModal = () => {
    modals.open({
      title: "키보드 단축키",
      children: <KeyboardShortcutsModalBody />,
    });
  };

  useHotkeys([
    ["mod+Enter", runDrawIfPossible],
    ["mod+K", focusSearchInput],
    ["mod+shift+S", openSaveTemplateShortcut],
    ["shift+/", openShortcutsModal],
  ]);

  return (
    <div className="mx-auto grid h-screen overflow-hidden w-[min(1520px,calc(100%-28px))] grid-rows-[auto_1fr] antialiased max-[900px]:w-[min(calc(100%-20px),1520px)] pt-14 print:block print:h-auto print:min-h-auto print:w-full print:bg-white print:p-0 pb-4">
      <AppHeader />

      <main className="grid min-h-0 h-full items-start overflow-y-auto overflow-x-hidden gap-3 grid-cols-[minmax(360px,430px)_minmax(0,1fr)] print:block print:h-auto print:min-h-auto print:w-full print:gap-0">
        <aside className="grid min-h-0 auto-rows-max gap-3 print:hidden pt-4">
          <ParticipantInputPanel />
          <SeatConfigPanel />
          <DrawActionPanel />
          <AdvancedSettingsPanel onOpenShortcuts={openShortcutsModal} />
        </aside>

        <div className="sticky top-0 self-start max-[900px]:static pt-4">
          <ResultPanel />
        </div>
      </main>

      <DrawerOverlay />
    </div>
  );
}

export default App;
