import {
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
    <Card shadow="sm" radius="lg" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Title order={5} c="orange.7">
              1. 명단 입력
            </Title>
            <Tooltip label="줄바꿈·쉼표·탭·세미콜론으로 구분해 입력할 수 있어요" withArrow multiline w={220}>
              <span className="inline-flex cursor-help">
                <LiaInfoCircleSolid />
              </span>
            </Tooltip>
          </div>
          <Badge color="orange" variant="light">
            {participants.length}명
          </Badge>
        </Group>

        <Textarea
          value={participantInput}
          onChange={(event) => onParticipantInputChange(event.target.value)}
          placeholder={"예시\n김하나\n박둘\n이셋\n\n또는\n김하나,박둘,이셋"}
          styles={{ input: { height: 200 } }}
        />

        <Text size="xs" c="dimmed">
          줄바꿈, 쉼표, 탭 입력을 자동 정리합니다.
        </Text>

        {duplicateNames.length > 0 && (
          <Text size="xs" c="red.7">
            중복 이름 감지: {duplicateNames.join(", ")}
          </Text>
        )}

        <Card withBorder radius="md" bg="orange.0" p="sm">
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
                <Pill key={participant.id} size="md">
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
    </Card>
  );
}
