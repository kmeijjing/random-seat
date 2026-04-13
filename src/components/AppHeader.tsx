import { Badge, Button, Group, Stack, Title } from "@mantine/core";
import { useShallow } from "zustand/react/shallow";
import { useSeatStore } from "../store/seatStore";

export function AppHeader() {
  const {
    assignments,
    templates,
    history,
    onOpenTemplateDrawer,
    onOpenHistoryDrawer,
  } = useSeatStore(
    useShallow((s) => ({
      assignments: s.assignments,
      templates: s.templates,
      history: s.history,
      onOpenTemplateDrawer: s.onOpenTemplateDrawer,
      onOpenHistoryDrawer: s.onOpenHistoryDrawer,
    })),
  );

  const hasAssignments = assignments.length > 0;

  return (
    <header className="app-header-shell fixed top-0 left-0 right-0 z-50 h-14 px-4 py-3 backdrop-blur-xs print:hidden sm:px-6">
      <Group justify="space-between" align="center" gap="md" wrap="wrap">
        <Stack gap={4}>
          <Group gap="xs" align="center">
            <Title order={3} fw={700}>
              Random Seat
            </Title>
            <Badge color={hasAssignments ? "green" : "gray"} variant="light">
              {hasAssignments ? "결과 있음" : "결과 대기"}
            </Badge>
          </Group>
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
