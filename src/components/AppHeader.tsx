import { useShallow } from "zustand/react/shallow";

import { useSeatStore } from "../store/seatStore";
import {
  appHeaderClass,
  ghostButtonClass,
  headerActionsClass,
  headerSummaryClass,
  heroTitleClass,
} from "./ui";
import { IoSettingsOutline } from "react-icons/io5";

export function AppHeader() {
  const { templates, history, onOpenTemplateDrawer, onOpenHistoryDrawer, onOpenSettingsDrawer } =
    useSeatStore(
      useShallow((s) => ({
        updatedAt: s.updatedAt,
        participantInput: s.participantInput,
        seatConfig: s.seatConfig,
        templates: s.templates,
        history: s.history,
        onOpenTemplateDrawer: s.onOpenTemplateDrawer,
        onOpenHistoryDrawer: s.onOpenHistoryDrawer,
        onOpenSettingsDrawer: s.onOpenSettingsDrawer,
      })),
    );

  return (
    <header className={appHeaderClass}>
      <div>
        <h1 className={heroTitleClass}>Random Seat</h1>
      </div>
      <div className={headerSummaryClass}>
        <div className={headerActionsClass}>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={onOpenTemplateDrawer}
          >
            템플릿 {templates.length}
          </button>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={onOpenHistoryDrawer}
          >
            이력 {history.length}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onOpenSettingsDrawer}>
            <IoSettingsOutline />
          </button>
        </div>
      </div>
    </header>
  );
}
