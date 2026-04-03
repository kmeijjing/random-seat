import type { Participant } from '../types'
import {
  badgeClass,
  chipClass,
  chipListClass,
  chipListScrollClass,
  emptyCopyClass,
  fieldClass,
  fieldLabelClass,
  flowCardClass,
  headRowClass,
  helperTextClass,
  panelTitleClass,
  previewBoxClass,
  previewMetaClass,
  sectionKickerClass,
  warningTextClass,
} from './ui'

type ParticipantInputPanelProps = {
  participantInput: string
  participants: Participant[]
  duplicateNames: string[]
  onParticipantInputChange: (value: string) => void
}

export function ParticipantInputPanel({
  participantInput,
  participants,
  duplicateNames,
  onParticipantInputChange,
}: ParticipantInputPanelProps) {
  return (
    <section className={flowCardClass}>
      <div className={headRowClass}>
        <div>
          <p className={sectionKickerClass}>1. 명단</p>
          <h2 className={panelTitleClass}>명단 입력</h2>
        </div>
        <span className={badgeClass}>{participants.length}명</span>
      </div>

      <label className={fieldClass}>
        <span className={fieldLabelClass}>이름 입력 또는 CSV 붙여넣기</span>
        <textarea
          className="min-h-[150px]"
          value={participantInput}
          onChange={(event) => onParticipantInputChange(event.target.value)}
          placeholder={'예시\n김하나\n박둘\n이셋\n\n또는\n김하나,박둘,이셋'}
          rows={8}
        />
      </label>

      <p className={helperTextClass}>줄바꿈, 쉼표, 탭 입력을 자동 정리합니다.</p>

      {duplicateNames.length > 0 ? (
        <p className={warningTextClass}>
          중복 이름 감지: {duplicateNames.join(', ')}
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
  )
}
