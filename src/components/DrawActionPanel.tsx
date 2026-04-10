import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
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

        <Button variant="subtle" color="gray" size="xs" onClick={onResetCurrentDraft}>
          현재 초안 초기화
        </Button>
      </Stack>
    </Card>
  );
}
