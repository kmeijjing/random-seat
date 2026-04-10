import { Button, Card, Drawer, Group, Stack, Text, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useShallow } from 'zustand/react/shallow'
import type { SeatTemplate } from '../types'
import { useSeatStore } from '../store/seatStore'
import { formatHistoryOptions, formatTimestamp } from '../utils/format'
import { AdvancedSettingsContent } from './AdvancedSettingsPanel'
import { NameInputModalBody } from './NameInputModalBody'

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

  const openSaveTemplateModal = () => {
    const modalId = 'save-template'
    modals.open({
      modalId,
      title: '새 템플릿 저장',
      children: (
        <NameInputModalBody
          modalId={modalId}
          initialValue="새 템플릿"
          placeholder="템플릿 이름"
          confirmLabel="저장"
          onConfirm={(name) => onSaveTemplate(name)}
        />
      ),
    })
  }

  const openRenameTemplateModal = (template: SeatTemplate) => {
    const modalId = 'rename-template'
    modals.open({
      modalId,
      title: '템플릿 이름 변경',
      children: (
        <NameInputModalBody
          modalId={modalId}
          initialValue={template.name}
          placeholder="새 이름"
          confirmLabel="변경"
          onConfirm={(nextName) => onRenameTemplate(template, nextName)}
        />
      ),
    })
  }

  const openLoadTemplateConfirm = (template: SeatTemplate) =>
    modals.openConfirmModal({
      title: '템플릿 불러오기',
      children: (
        <Text size="sm">
          <Text span fw={600}>"{template.name}"</Text> 템플릿을 현재 초안에 불러올까요?
          <br />
          현재 입력한 명단과 설정이 덮어써집니다.
        </Text>
      ),
      labels: { confirm: '불러오기', cancel: '취소' },
      onConfirm: () => onLoadTemplate(template),
    })

  const openDeleteTemplateConfirm = (template: SeatTemplate) =>
    modals.openConfirmModal({
      title: '템플릿 삭제',
      children: (
        <Text size="sm">
          <Text span fw={600}>"{template.name}"</Text> 템플릿을 삭제할까요?
          <br />
          이 동작은 되돌릴 수 없습니다.
        </Text>
      ),
      labels: { confirm: '삭제', cancel: '취소' },
      confirmProps: { color: 'red' },
      onConfirm: () => onDeleteTemplate(template),
    })

  const openLoadHistoryConfirm = (entryId: string) => {
    const entry = history.find((h) => h.id === entryId)
    if (!entry) return
    modals.openConfirmModal({
      title: '이력 불러오기',
      children: (
        <Text size="sm">
          이 이력 상태를 현재 작업 화면에 불러올까요?
          <br />
          현재 입력한 명단과 설정이 덮어써집니다.
        </Text>
      ),
      labels: { confirm: '불러오기', cancel: '취소' },
      onConfirm: () => onLoadHistory(entry),
    })
  }

  return (
    <Drawer
      opened={opened}
      onClose={onCloseDrawers}
      title={<Title order={4}>{drawerTitle}</Title>}
      position="right"
      size="md"
      overlayProps={{ backgroundOpacity: 0.35, blur: 4 }}
      trapFocus
      returnFocus
      className="print:hidden"
    >
      {isSettingsDrawerOpen ? (
        <AdvancedSettingsContent />
      ) : isTemplateDrawerOpen ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            현재 명단, 좌석 배치, 고정석 상태를 템플릿으로 저장할 수 있습니다.
          </Text>
          <Button
            variant="gradient"
            gradient={{ from: "orange.6", to: "orange.3", deg: 135 }}
            onClick={openSaveTemplateModal}
          >
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
                      <Button variant="subtle" size="xs" onClick={() => openLoadTemplateConfirm(template)}>
                        불러오기
                      </Button>
                      <Button variant="subtle" size="xs" onClick={() => openRenameTemplateModal(template)}>
                        이름 변경
                      </Button>
                      <Button variant="subtle" size="xs" color="red" onClick={() => openDeleteTemplateConfirm(template)}>
                        삭제
                      </Button>
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
          <Text size="xs" c="dimmed">최근 20건까지 자동으로 보관됩니다.</Text>
          <Stack gap="sm">
            {history.length > 0 ? (
              history.map((entry) => (
                <Card key={entry.id} withBorder radius="md" p="sm">
                  <Group justify="space-between" wrap="wrap">
                    <div>
                      <Text fw={600} size="sm">{formatTimestamp(entry.timestamp)}</Text>
                      <Text size="xs" c="dimmed">{formatHistoryOptions(entry.optionsUsed)}</Text>
                    </div>
                    <Button variant="subtle" size="xs" onClick={() => openLoadHistoryConfirm(entry.id)}>
                      불러오기
                    </Button>
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
