import { ActionIcon, Badge, Button, Group, Title } from "@mantine/core";
import { IoSettingsOutline } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { useSeatStore } from "../store/seatStore";

export function AppHeader() {
  const {
    templates,
    history,
    onOpenTemplateDrawer,
    onOpenHistoryDrawer,
    onOpenSettingsDrawer,
  } = useSeatStore(
    useShallow((s) => ({
      templates: s.templates,
      history: s.history,
      onOpenTemplateDrawer: s.onOpenTemplateDrawer,
      onOpenHistoryDrawer: s.onOpenHistoryDrawer,
      onOpenSettingsDrawer: s.onOpenSettingsDrawer,
    })),
  );

  return (
    <header className="bg-white/30 backdrop-blur-md py-2.5 px-6 fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 print:hidden">
      <Group justify="space-between">
        <Title order={3} fw={700}>
          Random Seat
        </Title>
        <Group gap="xs">
          <Button variant="outline" size="xs" onClick={onOpenTemplateDrawer}>
            템플릿 {templates.length}
          </Button>
          <Button variant="outline" size="xs" onClick={onOpenHistoryDrawer}>
            이력 {history.length}
          </Button>
          <ActionIcon
            variant="white"
            size="lg"
            onClick={onOpenSettingsDrawer}
            aria-label="설정"
          >
            <IoSettingsOutline size={20} />
          </ActionIcon>
        </Group>
      </Group>
    </header>
  );
}
