import { Badge, Button, Card, Checkbox, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { useMemo } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { selectSeatNumberMap } from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";
import { formatTimestamp } from "../utils/format";

export function ResultPanel() {
  const {
    assignments, updatedAt, drawSettings, searchQuery, onSearchQueryChange,
    onCopyResult, onPrint, isDrawing, onRunDraw, onToggleRedrawPicker,
    isRedrawPickerOpen, selectedParticipantsForRedraw, onToggleRedrawParticipant,
    onSelectAllForRedraw, onDeselectAllForRedraw, seatConfig, fixedSeats,
  } = useSeatStore(
    useShallow((s) => ({
      assignments: s.assignments, updatedAt: s.updatedAt, drawSettings: s.drawSettings,
      searchQuery: s.searchQuery, onSearchQueryChange: s.onSearchQueryChange,
      onCopyResult: s.onCopyResult, onPrint: s.onPrint, isDrawing: s.isDrawing,
      onRunDraw: s.onRunDraw, onToggleRedrawPicker: s.onToggleRedrawPicker,
      isRedrawPickerOpen: s.isRedrawPickerOpen,
      selectedParticipantsForRedraw: s.selectedParticipantsForRedraw,
      onToggleRedrawParticipant: s.onToggleRedrawParticipant,
      onSelectAllForRedraw: s.onSelectAllForRedraw,
      onDeselectAllForRedraw: s.onDeselectAllForRedraw,
      seatConfig: s.seatConfig, fixedSeats: s.fixedSeats,
    })),
  );

  const updatedAtLabel = formatTimestamp(updatedAt);
  const assignmentMap = useMemo(() => new Map(assignments.map((a) => [a.cellId, a])), [assignments]);
  const matchingCellIds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return new Set(
      assignments.filter((a) => query ? a.participant?.displayName.toLowerCase().includes(query) : false).map((a) => a.cellId),
    );
  }, [assignments, searchQuery]);
  const showNoSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return Boolean(query && matchingCellIds.size === 0);
  }, [searchQuery, matchingCellIds]);
  const redrawCandidates = useMemo(() => assignments.filter((a) => a.participant && !a.isFixed), [assignments]);
  const seatNumberMap = useMemo(
    () => selectSeatNumberMap({ seatConfig } as Parameters<typeof selectSeatNumberMap>[0]),
    [seatConfig],
  );

  const hasAssignments = assignments.length > 0;

  return (
    <Card shadow="sm" radius="lg" withBorder className="min-h-0 overflow-hidden grid grid-rows-[auto_1fr] print:block print:border-0 print:shadow-none">
      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap" gap="xs">
          <Group gap="xs">
            <Title order={5} c="orange.7">결과</Title>
            <Badge color={hasAssignments ? "green" : "gray"} variant="light">
              {hasAssignments ? `${assignments.length}명 배정` : "결과 대기"}
            </Badge>
          </Group>
          <TextInput
            placeholder="학생 이름 검색"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.currentTarget.value)}
            leftSection={<IoSearchOutline />}
            size="xs"
            disabled={!hasAssignments}
            className="print:hidden"
            style={{ flex: "0 1 220px" }}
          />
        </Group>

        {hasAssignments ? (
          <>
            <Card withBorder radius="md" bg="orange.0" p="xs" className="print:hidden">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">마지막 결과: {updatedAtLabel}</Text>
                <Text size="xs" c="dimmed">
                  {drawSettings.avoidPreviousSeat ? "지난 자리 피하기" : "완전 랜덤"}
                  {" · "}
                  {drawSettings.balanceZones ? "자리 편중 줄이기" : "균형 옵션 꺼짐"}
                </Text>
              </Group>
            </Card>

            <Group gap="xs" className="print:hidden">
              <Button variant="light" color="gray" size="xs" onClick={() => onRunDraw("all")} disabled={isDrawing}>
                전체 다시 뽑기
              </Button>
              <Button variant="light" color="gray" size="xs" onClick={onToggleRedrawPicker} disabled={isDrawing || redrawCandidates.length === 0}>
                일부만 다시 뽑기
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="subtle" color="gray" size="xs" onClick={onCopyResult} disabled={!hasAssignments}>복사</Button>
                <Button variant="subtle" color="gray" size="xs" onClick={onPrint} disabled={!hasAssignments}>인쇄</Button>
              </div>
            </Group>

            {isRedrawPickerOpen && (
              <Card withBorder radius="md" bg="orange.0" p="sm" className="print:hidden">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={700} size="sm">다시 뽑을 학생 선택</Text>
                    <Group gap="xs">
                      <Button variant="subtle" size="xs" onClick={onSelectAllForRedraw}>전체 선택</Button>
                      <Button variant="subtle" size="xs" onClick={onDeselectAllForRedraw}>전체 해제</Button>
                      <Text size="xs" c="dimmed">{selectedParticipantsForRedraw.length}명 선택</Text>
                    </Group>
                  </Group>
                  <Group gap="xs" role="group" aria-label="다시 뽑을 학생 목록">
                    {redrawCandidates.map((assignment) => (
                      <Checkbox
                        key={assignment.participant!.id}
                        label={assignment.participant!.name}
                        checked={selectedParticipantsForRedraw.includes(assignment.participant!.id)}
                        onChange={() => onToggleRedrawParticipant(assignment.participant!.id)}
                        size="sm"
                      />
                    ))}
                  </Group>
                  <Button
                    variant="gradient"
                    gradient={{ from: "orange.6", to: "orange.3", deg: 135 }}
                    size="sm"
                    onClick={() => onRunDraw("selected")}
                    disabled={isDrawing}
                  >
                    선택한 학생만 다시 뽑기
                  </Button>
                </Stack>
              </Card>
            )}

            {showNoSearchResults && <Text size="sm" c="dimmed">검색 결과가 없습니다.</Text>}

            <div className="min-h-0 overflow-auto pr-1 print:overflow-visible print:pr-0">
              <div
                className={`grid gap-2 min-w-max ${isDrawing ? "opacity-60" : ""}`}
                style={{ gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(118px, 1fr))` }}
              >
                {seatConfig.layout.cells.map((cell) => {
                  const assignment = assignmentMap.get(cell.id);
                  const isSearchMatch = matchingCellIds.has(cell.id);
                  const fixedSeat = fixedSeats.find((item) => item.cellId === cell.id);
                  const seatNumber = seatNumberMap.get(cell.id);

                  if (cell.type !== "seat") {
                    return (
                      <Card key={cell.id} withBorder radius="md" p="xs" bg="gray.1" style={{ borderStyle: "dashed", minHeight: 96 }}>
                        <Text size="xs" fw={800} c="orange.7">{cell.label}</Text>
                        <Text fw={600} size="sm">{cell.type === "aisle" ? "통로" : "비활성"}</Text>
                        <Text size="xs" c="dimmed">배정 제외</Text>
                      </Card>
                    );
                  }

                  return (
                    <Card
                      key={cell.id}
                      withBorder
                      radius="md"
                      p="xs"
                      bg={assignment?.isFixed ? "orange.1" : "orange.0"}
                      style={{
                        minHeight: 96,
                        borderColor: assignment?.isFixed ? "var(--mantine-color-orange-3)" : isSearchMatch ? "var(--mantine-color-orange-4)" : undefined,
                        outline: isSearchMatch ? "3px solid var(--mantine-color-orange-2)" : undefined,
                      }}
                    >
                      <Text size="xs" fw={800} c="orange.7">{cell.label}</Text>
                      <Text fw={600} size="sm">{assignment?.participant?.displayName ?? "빈자리"}</Text>
                      <Text size="xs" c="dimmed">
                        {seatNumber}번 자리{fixedSeat ? " · 고정석" : ""}
                      </Text>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <Card withBorder radius="lg" bg="orange.0" p="xl" className="min-h-[320px] grid place-content-center text-center">
            <Stack align="center" gap="sm">
              <Text size="xs" fw={800} tt="uppercase" c="orange.6">Ready</Text>
              <Title order={3}>자리표가 아직 없습니다</Title>
              <Text c="dimmed">
                왼쪽에서 명단을 입력하고 좌석만 확인한 뒤, <Text span fw={700}>자리 뽑기</Text>를 누르면 결과가 이 영역에 표시됩니다.
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
