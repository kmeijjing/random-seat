import {
  Accordion,
  Alert,
  Badge,
  Card,
  Group,
  Pill,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { useMemo } from "react";
import { IoWarningOutline } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import {
  selectDuplicateNames,
  selectParticipants,
} from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";
import { LiaInfoCircleSolid } from "react-icons/lia";

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
    <Accordion.Item value={"명단 입력"}>
      <Accordion.Control>
        <Group gap={4}>
          <Title order={5} c="blue.7">
            1. 명단 입력
          </Title>
          <Tooltip label="줄바꿈, 쉼표, 탭 입력을 자동 정리합니다." withArrow>
            <LiaInfoCircleSolid className="text-lime-500" />
          </Tooltip>
          <Badge variant="light">{participants.length}명</Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="sm">
          <Textarea
            id="participant-input-textarea"
            value={participantInput}
            onChange={(event) => onParticipantInputChange(event.target.value)}
            placeholder={"예시\n김하나\n박둘\n이셋\n\n또는\n김하나,박둘,이셋"}
            styles={{ input: { height: 200 } }}
          />

          <Text size="xs" c="dimmed">
            줄바꿈, 쉼표, 탭 입력을 자동 정리합니다.
          </Text>

          {duplicateNames.length > 0 && (
            <Alert
              color="yellow"
              variant="light"
              icon={<IoWarningOutline />}
              title={`같은 이름 ${duplicateNames.length}개`}
              p="xs"
            >
              <Text size="xs">
                {duplicateNames.join(", ")}
                <br />
                동명이인으로 처리되어 "이름 (1)", "이름 (2)" 형태로 표시됩니다.
              </Text>
            </Alert>
          )}

          <Card radius="md" className="bg-surface-warm" p="sm">
            <Group justify="space-between" mb="xs">
              <Text fw={700} size="sm">
                파싱 미리보기
              </Text>
              <Text size="xs" c="dimmed">
                {participants.length}명
              </Text>
            </Group>
            <Group gap={6} style={{ maxHeight: 88, overflow: "auto" }}>
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <Pill
                    key={participant.id}
                    size="md"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "text/seat-participant-id",
                        participant.id,
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    style={{ cursor: "grab" }}
                  >
                    {participant.displayName}
                  </Pill>
                ))
              ) : (
                <Text size="xs" c="dimmed">
                  입력된 이름이 아직 없습니다.
                </Text>
              )}
            </Group>
          </Card>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
