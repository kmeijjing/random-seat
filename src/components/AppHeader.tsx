import { ActionIcon, Button, Group, Title, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IoKeypadOutline, IoMoonOutline, IoSettingsOutline, IoSunnyOutline } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { useSeatStore } from "../store/seatStore";

type AppHeaderProps = {
  onOpenShortcuts: () => void;
};

export function AppHeader({ onOpenShortcuts }: AppHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
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
    <header className="bg-orange-50/40 dark:bg-orange-950/20 backdrop-blur-md py-2.5 px-6 fixed top-0 left-0 right-0 z-50 border-b border-orange-200/40 dark:border-orange-800/30 print:hidden">
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
          <Tooltip label={isDark ? "라이트 모드로" : "다크 모드로"} withArrow>
            <ActionIcon
              variant="default"
              size="lg"
              onClick={toggleColorScheme}
              aria-label="색상 모드 전환"
            >
              {isDark ? <IoSunnyOutline size={20} /> : <IoMoonOutline size={20} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="키보드 단축키 (?)" withArrow>
            <ActionIcon
              variant="default"
              size="lg"
              onClick={onOpenShortcuts}
              aria-label="키보드 단축키"
            >
              <IoKeypadOutline size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="고급 설정 (배정 옵션, 고정석, 좌석 편집)" withArrow>
            <ActionIcon
              variant="default"
              size="lg"
              onClick={onOpenSettingsDrawer}
              aria-label="고급 설정"
            >
              <IoSettingsOutline size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </header>
  );
}
