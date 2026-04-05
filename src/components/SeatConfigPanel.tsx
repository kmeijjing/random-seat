import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  selectParticipants,
  selectRecommendedLayouts,
  selectUsableSeatCount,
} from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";
import {
  badgeClass,
  buttonRowClass,
  fieldClass,
  fieldLabelClass,
  fieldRowClass,
  flowCardClass,
  headRowClass,
  recommendationChipClass,
  recommendationMetaClass,
  sectionKickerClass,
  summaryCardClass,
  summaryLabelClass,
  summaryValueClass,
} from "./ui";

export function SeatConfigPanel() {
  const {
    seatConfig,
    participantInput,
    onDimensionChange,
    onApplyRecommendation,
  } = useSeatStore(
    useShallow((s) => ({
      seatConfig: s.seatConfig,
      participantInput: s.participantInput,
      onDimensionChange: s.onDimensionChange,
      onApplyRecommendation: s.onApplyRecommendation,
    })),
  );

  const participants = useMemo(
    () =>
      selectParticipants({ participantInput } as Parameters<
        typeof selectParticipants
      >[0]),
    [participantInput],
  );
  const usableSeatCount = useMemo(
    () =>
      selectUsableSeatCount({ seatConfig } as Parameters<
        typeof selectUsableSeatCount
      >[0]),
    [seatConfig],
  );
  const recommendedLayouts = useMemo(
    () => selectRecommendedLayouts(participants.length),
    [participants.length],
  );

  return (
    <section className={flowCardClass}>
      <div className={headRowClass}>
        <div>
          <p className={sectionKickerClass}>2. 좌석 설정</p>
        </div>
        <span className={badgeClass}>{usableSeatCount}석</span>
      </div>

      <div className={fieldRowClass}>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>행</span>
          <input
            type="number"
            min="1"
            value={seatConfig.rows}
            onChange={(event) => onDimensionChange("rows", event.target.value)}
          />
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>열</span>
          <input
            type="number"
            min="1"
            value={seatConfig.columns}
            onChange={(event) =>
              onDimensionChange("columns", event.target.value)
            }
          />
        </label>
      </div>

      <div className={buttonRowClass}>
        {recommendedLayouts.map((recommendation) => (
          <button
            key={recommendation.label}
            type="button"
            className={recommendationChipClass}
            onClick={() =>
              onApplyRecommendation(recommendation.rows, recommendation.columns)
            }
          >
            {recommendation.label}
            <small className={recommendationMetaClass}>
              {recommendation.emptyCount}칸 여유
            </small>
          </button>
        ))}
      </div>

      <div className={summaryCardClass}>
        <div>
          <span className={summaryLabelClass}>사용 가능 좌석</span>
          <strong className={summaryValueClass}>{usableSeatCount}석</strong>
        </div>
        <div>
          <span className={summaryLabelClass}>참여자</span>
          <strong className={summaryValueClass}>{participants.length}명</strong>
        </div>
        <div>
          <span className={summaryLabelClass}>남는 좌석</span>
          <strong className={summaryValueClass}>
            {Math.max(usableSeatCount - participants.length, 0)}석
          </strong>
        </div>
      </div>
    </section>
  );
}
