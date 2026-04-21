import { useHotkeys } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useEffect, useState } from "react";
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
import { Accordion, Card } from "@mantine/core";

function App() {
  const [openSections, setOpenSections] = useState<string[]>([
    "명단 입력",
    "좌석 설정",
    "자리 뽑기",
  ]);

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

  const openParticipantInput = () => {
    setOpenSections((current) =>
      current.includes("명단 입력") ? current : [...current, "명단 입력"],
    );

    window.setTimeout(() => {
      const input = document.getElementById("participant-input-textarea");
      if (!input) return;
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      (input as HTMLTextAreaElement).focus();
    }, 180);
  };

  useHotkeys([
    ["mod+Enter", runDrawIfPossible],
    ["mod+K", focusSearchInput],
    ["mod+shift+S", openSaveTemplateShortcut],
    ["shift+/", openShortcutsModal],
  ]);

  return (
    <div className="mx-auto grid h-screen antialiased pt-14">
      <AppHeader />

      <main className="px-4 min-[961px]:grid min-h-0 h-full items-start overflow-y-auto overflow-x-hidden gap-3 min-[961px]:grid-cols-[minmax(360px,430px)_minmax(0,1fr)] print:block print:h-auto print:min-h-auto print:w-full print:gap-0 pb-4">
        <aside className="grid min-h-0 auto-rows-max gap-3 print:hidden pt-4 min-[961px]:pb-4">
          <Card radius="lg">
            <Accordion
              variant="contained"
              order={4}
              multiple
              radius="lg"
              value={openSections}
              onChange={setOpenSections}
            >
              <ParticipantInputPanel />
              <SeatConfigPanel />
              <DrawActionPanel />
              <AdvancedSettingsPanel onOpenShortcuts={openShortcutsModal} />
            </Accordion>
          </Card>
        </aside>

        <div className="sticky top-0 self-start max-[900px]:static pt-4">
          <ResultPanel onOpenParticipantInput={openParticipantInput} />
        </div>
      </main>

      <DrawerOverlay />
    </div>
  );
}

export default App;
