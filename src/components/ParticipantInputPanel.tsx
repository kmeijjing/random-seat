import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  selectDuplicateNames,
  selectParticipants,
} from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";
import {
  badgeClass,
  chipClass,
  chipListClass,
  chipListScrollClass,
  emptyCopyClass,
  fieldClass,
  flowCardClass,
  headRowClass,
  helperTextClass,
  previewBoxClass,
  previewMetaClass,
  sectionKickerClass,
  warningTextClass,
} from "./ui";

export function ParticipantInputPanel() {
  const { participantInput, onParticipantInputChange } = useSeatStore(
    useShallow((s) => ({
      participantInput: s.participantInput,
      onParticipantInputChange: s.onParticipantInputChange,
    })),
  );

  const participants = useMemo(
    () =>
      selectParticipants({ participantInput } as Parameters<
        typeof selectParticipants
      >[0]),
    [participantInput],
  );
  const duplicateNames = useMemo(
    () => selectDuplicateNames(participants),
    [participants],
  );

  return (
    <section className={flowCardClass}>
      <div className={headRowClass}>
        <div>
          <p className={sectionKickerClass}>1. 명단 입력</p>
        </div>
        <span className={badgeClass}>{participants.length}명</span>
      </div>

      <label className={fieldClass}>
        <textarea
          className="min-h-[150px]"
          value={participantInput}
          onChange={(event) => onParticipantInputChange(event.target.value)}
          placeholder={"예시\n김하나\n박둘\n이셋\n\n또는\n김하나,박둘,이셋"}
          rows={8}
        />
      </label>

      <p className={helperTextClass}>
        줄바꿈, 쉼표, 탭 입력을 자동 정리합니다.
      </p>

      {duplicateNames.length > 0 ? (
        <p className={warningTextClass}>
          중복 이름 감지: {duplicateNames.join(", ")}
        </p>
      ) : null}

      <div className={previewBoxClass}>
        <div className={headRowClass}>
          <strong>파싱 미리보기</strong>
          <span className={previewMetaClass}>{participants.length}명</span>
        </div>
        <div className={`${chipListClass} ${chipListScrollClass}`}>
          {participants.length > 0 ? (
            participants.map((participant) => (
              <span key={participant.id} className={chipClass}>
                {participant.name}
              </span>
            ))
          ) : (
            <span className={emptyCopyClass}>입력된 이름이 아직 없습니다.</span>
          )}
        </div>
      </div>
    </section>
  );
}
