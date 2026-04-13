import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectParticipants, selectUsableSeatCount } from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";

export function AppHeader() {
  const {
    participantInput,
    seatConfig,
    assignments,
    templates,
    history,
    onOpenTemplateDrawer,
    onOpenHistoryDrawer,
  } = useSeatStore(
    useShallow((s) => ({
      participantInput: s.participantInput,
      seatConfig: s.seatConfig,
      assignments: s.assignments,
      templates: s.templates,
      history: s.history,
      onOpenTemplateDrawer: s.onOpenTemplateDrawer,
      onOpenHistoryDrawer: s.onOpenHistoryDrawer,
    })),
  );

  const participantCount = useMemo(
    () =>
      selectParticipants({ participantInput } as Parameters<
        typeof selectParticipants
      >[0]).length,
    [participantInput],
  );
  const usableSeatCount = useMemo(
    () =>
      selectUsableSeatCount({ seatConfig } as Parameters<
        typeof selectUsableSeatCount
      >[0]),
    [seatConfig],
  );
  const hasAssignments = assignments.length > 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-orange-200/40 bg-orange-50/55 px-4 py-3 backdrop-blur-md dark:border-orange-800/30 dark:bg-orange-950/20 print:hidden sm:px-6">
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Stack gap={4}>
          <Group gap="xs" align="center">
            <Title order={3} fw={700}>
              Random Seat
            </Title>
            <Badge color={hasAssignments ? "green" : "gray"} variant="light">
              {hasAssignments ? "결과 있음" : "결과 대기"}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            참여자 {participantCount}명 / 사용 좌석 {usableSeatCount}석 /{" "}
            {hasAssignments ? "결과 생성됨" : "결과 없음"}
          </Text>
        </Stack>

        <Group gap="xs" justify="flex-end">
          <Button variant="outline" size="xs" onClick={onOpenTemplateDrawer}>
            템플릿 {templates.length}
          </Button>
          <Button variant="outline" size="xs" onClick={onOpenHistoryDrawer}>
            이력 {history.length}
          </Button>
        </Group>
      </Group>
    </header>
  );
}
