import { Accordion, Badge, Button, Card, Checkbox, Group, Select, SimpleGrid, Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { selectParticipants, selectSelectableSeatCells, selectUsableSeatCount } from '../store/seatSelectors'
import { useSeatStore } from '../store/seatStore'

export function AdvancedSettingsContent() {
  const {
    drawSettings, onAvoidPreviousSeatChange, onBalanceZonesChange,
    fixedSeats, fixedParticipantId, fixedCellId, participantInput, seatConfig,
    onFixedParticipantChange, onFixedCellChange, onAddFixedSeat, onRemoveFixedSeat,
    onCycleCellType, onClearAllStorage,
  } = useSeatStore(
    useShallow((s) => ({
      drawSettings: s.drawSettings,
      onAvoidPreviousSeatChange: s.onAvoidPreviousSeatChange,
      onBalanceZonesChange: s.onBalanceZonesChange,
      fixedSeats: s.fixedSeats,
      fixedParticipantId: s.fixedParticipantId,
      fixedCellId: s.fixedCellId,
      participantInput: s.participantInput,
      seatConfig: s.seatConfig,
      onFixedParticipantChange: s.onFixedParticipantChange,
      onFixedCellChange: s.onFixedCellChange,
      onAddFixedSeat: s.onAddFixedSeat,
      onRemoveFixedSeat: s.onRemoveFixedSeat,
      onCycleCellType: s.onCycleCellType,
      onClearAllStorage: s.onClearAllStorage,
    })),
  )

  const participants = useMemo(() => selectParticipants({ participantInput } as Parameters<typeof selectParticipants>[0]), [participantInput])
  const selectableSeatCells = useMemo(() => selectSelectableSeatCells({ seatConfig } as Parameters<typeof selectSelectableSeatCells>[0]), [seatConfig])
  const usableSeatCount = useMemo(() => selectUsableSeatCount({ seatConfig } as Parameters<typeof selectUsableSeatCount>[0]), [seatConfig])

  const sortedFixedSeats = fixedSeats.slice().sort((left, right) => left.cellId.localeCompare(right.cellId))

  const cellSelectRef = useRef<HTMLInputElement>(null)
  const bothSelected = Boolean(fixedParticipantId && fixedCellId)

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="sm">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={700} size="sm">배정 옵션</Text>
            <Text size="xs" c="dimmed">필요할 때만 사용</Text>
          </Group>
          <Checkbox
            label="지난 자리 피하기"
            checked={drawSettings.avoidPreviousSeat}
            onChange={(event) => onAvoidPreviousSeatChange(event.currentTarget.checked)}
            size="sm"
          />
          <Checkbox
            label="자리 편중 줄이기"
            checked={drawSettings.balanceZones}
            onChange={(event) => onBalanceZonesChange(event.currentTarget.checked)}
            size="sm"
          />
        </Stack>
      </Card>

      <Card withBorder radius="md" p="sm">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={700} size="sm">고정석 지정</Text>
            <Text size="xs" c="dimmed">{fixedSeats.length}건</Text>
          </Group>
          <SimpleGrid cols={2}>
            <Select
              label="학생 선택"
              placeholder="학생 선택"
              value={fixedParticipantId || null}
              onChange={(val) => {
                onFixedParticipantChange(val ?? '')
                if (val) {
                  // 학생 선택 직후 좌석 드롭다운으로 포커스 이동
                  requestAnimationFrame(() => cellSelectRef.current?.focus())
                }
              }}
              data={participants.map((p) => ({ value: p.id, label: p.displayName }))}
              size="sm"
              clearable
            />
            <Select
              ref={cellSelectRef}
              label="좌석 선택"
              placeholder="좌석 선택"
              value={fixedCellId || null}
              onChange={(val) => onFixedCellChange(val ?? '')}
              data={selectableSeatCells.map((c) => ({ value: c.id, label: c.label }))}
              size="sm"
              clearable
            />
          </SimpleGrid>
          <Button
            variant={bothSelected ? 'filled' : 'light'}
            size="xs"
            onClick={onAddFixedSeat}
            disabled={!bothSelected}
          >
            고정석 저장
          </Button>

          <Stack gap="xs" style={{ maxHeight: 150, overflow: 'auto' }}>
            {sortedFixedSeats.length > 0 ? (
              sortedFixedSeats.map((fs) => (
                <Card key={fs.participantId} withBorder radius="sm" p="xs">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600} size="sm">{fs.participantName}</Text>
                      <Text size="xs" c="dimmed">{fs.cellId} 고정</Text>
                    </div>
                    <Button variant="subtle" size="xs" color="red" onClick={() => onRemoveFixedSeat(fs.participantId)}>
                      해제
                    </Button>
                  </Group>
                </Card>
              ))
            ) : (
              <Text size="xs" c="dimmed">지정된 고정석이 없습니다.</Text>
            )}
          </Stack>
        </Stack>
      </Card>

      <Accordion variant="contained" radius="md">
        <Accordion.Item value="seat-editor">
          <Accordion.Control>좌석 직접 편집</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              <Text size="xs" c="dimmed">
                각 칸을 클릭하면 좌석 → 통로 → 비활성 순으로 바뀝니다.
              </Text>
              <Stack gap={4}>
                <Group gap="xs">
                  <Badge color="orange" variant="light" size="sm">좌석</Badge>
                  <Text size="xs" c="dimmed">학생이 배정되는 실제 자리</Text>
                </Group>
                <Group gap="xs">
                  <Badge color="gray" variant="light" size="sm">통로</Badge>
                  <Text size="xs" c="dimmed">자리 번호는 건너뛰고 배정 제외</Text>
                </Group>
                <Group gap="xs">
                  <Badge color="red" variant="light" size="sm">비활성</Badge>
                  <Text size="xs" c="dimmed">없는 셈 치고 배정 제외</Text>
                </Group>
              </Stack>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(56px, 1fr))` }}
              >
                {seatConfig.layout.cells.map((cell) => {
                  const nextType = cell.type === 'seat' ? '통로' : cell.type === 'aisle' ? '비활성' : '좌석'
                  return (
                    <Button
                      key={cell.id}
                      variant="light"
                      color={cell.type === 'seat' ? 'orange' : cell.type === 'aisle' ? 'gray' : 'red'}
                      size="xs"
                      h="auto"
                      p={4}
                      onClick={() => onCycleCellType(cell.id)}
                      aria-label={`${cell.label} ${cell.type === 'seat' ? '좌석' : cell.type === 'aisle' ? '통로' : '비활성'}, 클릭하여 ${nextType}로 변경`}
                      style={{ minHeight: 56 }}
                    >
                      <Stack gap={0} align="center">
                        <Text size="xs" fw={700}>{cell.label}</Text>
                        <Text size="xs" c="dimmed">
                          {cell.type === 'seat' ? '좌석' : cell.type === 'aisle' ? '통로' : '비활성'}
                        </Text>
                      </Stack>
                    </Button>
                  )
                })}
              </div>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Text size="xs" c="dimmed">
        현재 좌석 {usableSeatCount}석, 통로/비활성은 필요할 때만 편집합니다.
      </Text>

      <Button
        variant="subtle"
        color="red"
        size="xs"
        onClick={() =>
          modals.openConfirmModal({
            title: '전체 저장 데이터 삭제',
            children: (
              <Text size="sm">
                현재 초안과 저장된 모든 템플릿, 이력이 지워집니다.
                <br />
                이 동작은 되돌릴 수 없습니다.
              </Text>
            ),
            labels: { confirm: '전부 삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: onClearAllStorage,
          })
        }
      >
        전체 저장 삭제
      </Button>
    </Stack>
  )
}
