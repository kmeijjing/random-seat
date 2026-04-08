import { useShallow } from "zustand/react/shallow";
import { useSeatStore } from "../store/seatStore";
import {
  badgeClass,
  buttonRowClass,
  errorTextClass,
  flowCardClass,
  ghostButtonClass,
  headRowClass,
  helperTextClass,
  primaryButtonWideClass,
  sectionKickerClass,
} from "./ui";

export function DrawActionPanel() {
  const {
    assignments,
    errorMessage,
    statusMessage,
    isDrawing,
    onRunDraw,
    onResetCurrentDraft,
  } = useSeatStore(
    useShallow((s) => ({
      assignments: s.assignments,
      isAdvancedOpen: s.isAdvancedOpen,
      errorMessage: s.errorMessage,
      statusMessage: s.statusMessage,
      isDrawing: s.isDrawing,
      onRunDraw: s.onRunDraw,
      onResetCurrentDraft: s.onResetCurrentDraft,
    })),
  );

  const hasAssignments = assignments.length > 0;

  return (
    <section className={flowCardClass}>
      <div className={headRowClass}>
        <div>
          <p className={sectionKickerClass}>3. 자리 뽑기</p>
        </div>
        <span className={badgeClass}>
          {hasAssignments ? "결과 있음" : "대기 중"}
        </span>
      </div>

      {errorMessage ? <p className={errorTextClass}>{errorMessage}</p> : null}
      {statusMessage ? (
        <p className={helperTextClass}>{statusMessage}</p>
      ) : null}

      <button
        type="button"
        className={primaryButtonWideClass}
        onClick={() => onRunDraw("all")}
        disabled={isDrawing}
      >
        {isDrawing ? "자리 뽑는 중..." : "자리 뽑기"}
      </button>

      <div className={buttonRowClass}>
        <button
          type="button"
          className={ghostButtonClass}
          onClick={onResetCurrentDraft}
        >
          현재 초안 초기화
        </button>
      </div>
    </section>
  );
}
