import type { Participant } from '../types'

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
    <section className="panel flow-card">
      <div className="flow-card-head">
        <div>
          <p className="section-kicker">1. 명단</p>
          <h2>명단 입력</h2>
        </div>
        <span className="badge">{participants.length}명</span>
      </div>

      <label className="field">
        <span>이름 입력 또는 CSV 붙여넣기</span>
        <textarea
          value={participantInput}
          onChange={(event) => onParticipantInputChange(event.target.value)}
          placeholder={'예시\n김하나\n박둘\n이셋\n\n또는\n김하나,박둘,이셋'}
          rows={8}
        />
      </label>

      <p className="helper-text">줄바꿈, 쉼표, 탭 입력을 자동 정리합니다.</p>

      {duplicateNames.length > 0 ? (
        <p className="warning-text">
          중복 이름 감지: {duplicateNames.join(', ')}
        </p>
      ) : null}

      <div className="preview-box compact-box">
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
  )
}
