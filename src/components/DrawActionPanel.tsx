import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useShallow } from "zustand/react/shallow";
import { useSeatStore } from "../store/seatStore";

export function DrawActionPanel() {
  const { assignments, errorMessage, statusMessage, isDrawing, onRunDraw, onResetCurrentDraft } =
    useSeatStore(
      useShallow((s) => ({
        assignments: s.assignments,
        errorMessage: s.errorMessage,
        statusMessage: s.statusMessage,
        isDrawing: s.isDrawing,
        onRunDraw: s.onRunDraw,
        onResetCurrentDraft: s.onResetCurrentDraft,
      })),
    );

  const hasAssignments = assignments.length > 0;

  const handleResetClick = () =>
    modals.openConfirmModal({
      title: "현재 초안을 초기화할까요?",
      children: (
        <Text size="sm">
          입력한 명단과 좌석 설정, 고정석, 뽑기 결과가 모두 지워집니다. 저장한 템플릿과 이력은 그대로 남습니다.
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
          <Title order={5} c="orange.7">3. 자리 뽑기</Title>
          <Badge color={hasAssignments ? "green" : "gray"} variant="light">
            {hasAssignments ? "결과 있음" : "대기 중"}
          </Badge>
        </Group>

        {errorMessage && <Text size="sm" c="red.7">{errorMessage}</Text>}
        {statusMessage && <Text size="sm" c="dimmed">{statusMessage}</Text>}

        <Button
          fullWidth
          size="lg"
          variant="gradient"
          gradient={{ from: "orange.6", to: "orange.3", deg: 135 }}
          onClick={() => onRunDraw("all")}
          loading={isDrawing}
        >
          {isDrawing ? "자리 뽑는 중..." : "자리 뽑기"}
        </Button>

        <Button variant="subtle" color="gray" size="xs" onClick={handleResetClick}>
          현재 초안 초기화
        </Button>
      </Stack>
    </Card>
  );
}
