import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  getSeatCapacityFeedback,
  selectParticipants,
  selectUsableSeatCount,
} from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";

export function DrawActionPanel() {
  const {
    assignments,
    errorMessage,
    statusMessage,
    isDrawing,
    onRunDraw,
    onResetCurrentDraft,
    participantInput,
    seatConfig,
  } = useSeatStore(
    useShallow((s) => ({
      assignments: s.assignments,
      errorMessage: s.errorMessage,
      statusMessage: s.statusMessage,
      isDrawing: s.isDrawing,
      onRunDraw: s.onRunDraw,
      onResetCurrentDraft: s.onResetCurrentDraft,
      participantInput: s.participantInput,
      seatConfig: s.seatConfig,
    })),
  );

  const hasAssignments = assignments.length > 0;

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
  const capacityFeedback = useMemo(
    () => getSeatCapacityFeedback(participants.length, usableSeatCount),
    [participants.length, usableSeatCount],
  );

  const disabledReason =
    capacityFeedback.kind === "empty"
      ? capacityFeedback.message
      : capacityFeedback.kind === "insufficient"
        ? `${capacityFeedback.message} (참여자 ${participants.length}명 / 좌석 ${usableSeatCount}석)`
        : null;
  const canDraw = disabledReason === null;

  const handleResetClick = () =>
    modals.openConfirmModal({
      title: "현재 초안을 초기화할까요?",
      children: (
        <Text size="sm">
          입력한 명단과 좌석 설정, 고정석, 뽑기 결과가 모두 지워집니다.
          <br />
          저장한 템플릿과 이력은 그대로 남습니다.
        </Text>
      ),
      labels: { confirm: "초기화", cancel: "취소" },
      confirmProps: { color: "red" },
      onConfirm: onResetCurrentDraft,
    });

  return (
    <Card shadow="sm" radius="lg" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={5} c="orange.7">
            3. 자리 뽑기
          </Title>
          <Badge color={hasAssignments ? "green" : "gray"} variant="light">
            {hasAssignments ? "결과 있음" : "대기 중"}
          </Badge>
        </Group>

        {errorMessage && (
          <Text size="sm" c="red.7">
            {errorMessage}
          </Text>
        )}
        {statusMessage && (
          <Text size="sm" c="dimmed">
            {statusMessage}
          </Text>
        )}

        {hasAssignments ? (
          <Card withBorder radius="md" p="sm" className="bg-surface-warm">
            <Stack gap={4}>
              <Text fw={700} size="sm">
                결과가 준비되었습니다.
              </Text>
              <Text size="xs" c="dimmed">
                다시 뽑기와 결과 공유는 오른쪽 결과 패널에서 이어서 진행하세요.
              </Text>
            </Stack>
          </Card>
        ) : (
          <Tooltip
            label={disabledReason ?? ""}
            disabled={canDraw}
            withArrow
            position="top"
          >
            <Button
              fullWidth
              size="lg"
              variant="gradient"
              gradient={{ from: "orange.6", to: "orange.3", deg: 135 }}
              onClick={() => onRunDraw("all")}
              loading={isDrawing}
              disabled={!canDraw}
              data-disabled={!canDraw || undefined}
            >
              {isDrawing ? "자리 뽑는 중..." : "자리 뽑기"}
            </Button>
          </Tooltip>
        )}

        <Button
          variant="subtle"
          color="gray"
          size="xs"
          onClick={handleResetClick}
        >
          현재 초안 초기화
        </Button>
      </Stack>
    </Card>
  );
}
