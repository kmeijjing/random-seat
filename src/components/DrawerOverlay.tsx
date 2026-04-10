import { Button, Card, Drawer, Group, Stack, Text, Title } from '@mantine/core'
import { useShallow } from 'zustand/react/shallow'
import { useSeatStore } from '../store/seatStore'
import { formatHistoryOptions, formatTimestamp } from '../utils/format'
import { AdvancedSettingsContent } from './AdvancedSettingsPanel'

export function DrawerOverlay() {
  const {
    isTemplateDrawerOpen, isHistoryDrawerOpen, isSettingsDrawerOpen,
    templates, history, onCloseDrawers, onSaveTemplate, onLoadTemplate,
    onRenameTemplate, onDeleteTemplate, onLoadHistory,
  } = useSeatStore(
    useShallow((s) => ({
      isTemplateDrawerOpen: s.isTemplateDrawerOpen,
      isHistoryDrawerOpen: s.isHistoryDrawerOpen,
      isSettingsDrawerOpen: s.isSettingsDrawerOpen,
      templates: s.templates,
      history: s.history,
      onCloseDrawers: s.onCloseDrawers,
      onSaveTemplate: s.onSaveTemplate,
      onLoadTemplate: s.onLoadTemplate,
      onRenameTemplate: s.onRenameTemplate,
      onDeleteTemplate: s.onDeleteTemplate,
      onLoadHistory: s.onLoadHistory,
    })),
  )

  const opened = isTemplateDrawerOpen || isHistoryDrawerOpen || isSettingsDrawerOpen
  const drawerTitle = isSettingsDrawerOpen ? '고급 설정' : isTemplateDrawerOpen ? '저장된 템플릿' : '최근 이력'

  return (
    <Drawer
      opened={opened}
      onClose={onCloseDrawers}
      title={<Title order={4}>{drawerTitle}</Title>}
      position="right"
      size="md"
      overlayProps={{ backgroundOpacity: 0.35, blur: 4 }}
      className="print:hidden"
    >
      {isSettingsDrawerOpen ? (
        <AdvancedSettingsContent />
      ) : isTemplateDrawerOpen ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            현재 명단, 좌석 배치, 고정석 상태를 템플릿으로 저장할 수 있습니다.
          </Text>
          <Button variant="gradient" gradient={{ from: "orange.6", to: "orange.3", deg: 135 }} onClick={onSaveTemplate}>
            현재 상태 저장
          </Button>
          <Stack gap="sm">
            {templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template.id} withBorder radius="md" p="sm">
                  <Group justify="space-between" wrap="wrap">
                    <div>
                      <Text fw={600} size="sm">{template.name}</Text>
                      <Text size="xs" c="dimmed">{template.participantInput ? '명단 포함' : '빈 템플릿'}</Text>
                    </div>
                    <Group gap="xs">
                      <Button variant="subtle" size="xs" onClick={() => onLoadTemplate(template)}>불러오기</Button>
                      <Button variant="subtle" size="xs" onClick={() => onRenameTemplate(template)}>이름 변경</Button>
                      <Button variant="subtle" size="xs" color="red" onClick={() => onDeleteTemplate(template)}>삭제</Button>
                    </Group>
                  </Group>
                </Card>
              ))
            ) : (
              <Text size="sm" c="dimmed">저장된 템플릿이 없습니다.</Text>
            )}
          </Stack>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            최근 자리 뽑기 결과를 확인하고 현재 화면으로 다시 불러올 수 있습니다.
          </Text>
          <Stack gap="sm">
            {history.length > 0 ? (
              history.map((entry) => (
                <Card key={entry.id} withBorder radius="md" p="sm">
                  <Group justify="space-between" wrap="wrap">
                    <div>
                      <Text fw={600} size="sm">{formatTimestamp(entry.timestamp)}</Text>
                      <Text size="xs" c="dimmed">{formatHistoryOptions(entry.optionsUsed)}</Text>
                    </div>
                    <Button variant="subtle" size="xs" onClick={() => onLoadHistory(entry)}>불러오기</Button>
                  </Group>
                </Card>
              ))
            ) : (
              <Text size="sm" c="dimmed">저장된 이력이 아직 없습니다.</Text>
            )}
          </Stack>
        </Stack>
      )}
    </Drawer>
  )
}
