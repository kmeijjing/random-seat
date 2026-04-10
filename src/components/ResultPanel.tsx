import { Badge, Button, Card, Checkbox, Divider, Group, Stack, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { toPng } from "html-to-image";
import { useMemo, useRef } from "react";
import { IoBookmarkOutline, IoCopyOutline, IoImageOutline, IoPrintOutline, IoSearchOutline, IoShuffleOutline } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { selectSeatNumberMap } from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";
import { formatTimestamp } from "../utils/format";
import { NameInputModalBody } from "./NameInputModalBody";
import { PrintPreviewModalBody } from "./PrintPreviewModal";

export function ResultPanel() {
  const {
    assignments, updatedAt, drawSettings, searchQuery, onSearchQueryChange,
    onCopyResult, isDrawing, onRunDraw, onToggleRedrawPicker,
    isRedrawPickerOpen, selectedParticipantsForRedraw, onToggleRedrawParticipant,
    onSelectAllForRedraw, onDeselectAllForRedraw, seatConfig, fixedSeats,
    onSaveTemplate, onAddFixedSeat,
  } = useSeatStore(
    useShallow((s) => ({
      assignments: s.assignments, updatedAt: s.updatedAt, drawSettings: s.drawSettings,
      searchQuery: s.searchQuery, onSearchQueryChange: s.onSearchQueryChange,
      onCopyResult: s.onCopyResult, isDrawing: s.isDrawing,
      onRunDraw: s.onRunDraw, onToggleRedrawPicker: s.onToggleRedrawPicker,
      isRedrawPickerOpen: s.isRedrawPickerOpen,
      selectedParticipantsForRedraw: s.selectedParticipantsForRedraw,
      onToggleRedrawParticipant: s.onToggleRedrawParticipant,
      onSelectAllForRedraw: s.onSelectAllForRedraw,
      onDeselectAllForRedraw: s.onDeselectAllForRedraw,
      seatConfig: s.seatConfig, fixedSeats: s.fixedSeats,
      onSaveTemplate: s.onSaveTemplate,
      onAddFixedSeat: s.onAddFixedSeat,
    })),
  );

  const handleSeatDrop = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    const participantId = e.dataTransfer.getData("text/seat-participant-id");
    if (participantId) {
      onAddFixedSeat({ participantId, cellId });
    }
  };

  const handleSeatDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("text/seat-participant-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const isDesktop = useMediaQuery("(min-width: 1280px)");

  const handleGoToInput = () => {
    const el = document.getElementById("participant-input-textarea");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLTextAreaElement).focus();
    }
  };

  const gridRef = useRef<HTMLDivElement>(null);

  const handlePngExport = async () => {
    if (!gridRef.current) return;
    try {
      const PADDING = 24;
      const rect = gridRef.current.getBoundingClientRect();
      const dataUrl = await toPng(gridRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fffaf6",
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
        style: {
          padding: `${PADDING}px`,
          boxSizing: "content-box",
        },
      });
      const link = document.createElement("a");
      link.download = `자리표_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      notifications.show({ message: "자리표 이미지를 저장했습니다.", color: "teal", autoClose: 4000 });
    } catch {
      notifications.show({ message: "이미지 저장에 실패했습니다.", color: "red", autoClose: 4000 });
    }
  };

  const openPrintPreviewModal = () => {
    if (!hasAssignments) return;
    const modalId = "print-preview";
    modals.open({
      modalId,
      title: "인쇄 미리보기",
      children: <PrintPreviewModalBody modalId={modalId} />,
    });
  };

  const openSaveTemplateModal = () => {
    const modalId = "save-template-from-result";
    modals.open({
      modalId,
      title: "현재 상태를 템플릿으로 저장",
      children: (
        <NameInputModalBody
          modalId={modalId}
          initialValue="새 템플릿"
          placeholder="템플릿 이름"
          confirmLabel="저장"
          onConfirm={(name) => onSaveTemplate(name)}
        />
      ),
    });
  };

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
            <Card withBorder radius="md" p="xs" className="bg-surface-warm print:hidden">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">마지막 결과: {updatedAtLabel}</Text>
                <Text size="xs" c="dimmed">
                  {drawSettings.avoidPreviousSeat ? "지난 자리 피하기" : "완전 랜덤"}
                  {" · "}
                  {drawSettings.balanceZones ? "자리 편중 줄이기" : "균형 옵션 꺼짐"}
                </Text>
              </Group>
            </Card>

            <Group gap="xs" justify="space-between" wrap="wrap" className="print:hidden">
              <Group gap="xs">
                <Button variant="light" color="gray" size="xs" onClick={() => onRunDraw("all")} disabled={isDrawing}>
                  전체 다시 뽑기
                </Button>
                <Tooltip label="선택한 학생들만 다시 배정합니다 (고정석 제외)" withArrow>
                  <Button
                    variant="light"
                    color="gray"
                    size="xs"
                    leftSection={<IoShuffleOutline />}
                    onClick={onToggleRedrawPicker}
                    disabled={isDrawing || redrawCandidates.length === 0}
                  >
                    일부만 다시 뽑기
                  </Button>
                </Tooltip>
              </Group>
              <Divider orientation="vertical" className="max-[900px]:hidden" />
              <Group gap="xs">
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IoCopyOutline />}
                  onClick={onCopyResult}
                  disabled={!hasAssignments}
                >
                  복사
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IoImageOutline />}
                  onClick={handlePngExport}
                  disabled={!hasAssignments}
                >
                  이미지
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IoPrintOutline />}
                  onClick={openPrintPreviewModal}
                  disabled={!hasAssignments}
                >
                  인쇄
                </Button>
                <Tooltip label="현재 명단·좌석·고정석을 템플릿으로 저장" withArrow>
                  <Button
                    variant="subtle"
                    color="orange"
                    size="xs"
                    leftSection={<IoBookmarkOutline />}
                    onClick={openSaveTemplateModal}
                  >
                    템플릿 저장
                  </Button>
                </Tooltip>
              </Group>
            </Group>

            {isRedrawPickerOpen && (
              <Card withBorder radius="md" p="sm" className="bg-surface-warm print:hidden">
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
                ref={gridRef}
                key={updatedAt ?? "initial"}
                className={`grid gap-2 min-w-max ${isDrawing ? "opacity-60" : ""}`}
                style={{ gridTemplateColumns: `repeat(${seatConfig.columns}, minmax(118px, 1fr))` }}
              >
                {seatConfig.layout.cells.map((cell, index) => {
                  const assignment = assignmentMap.get(cell.id);
                  const isSearchMatch = matchingCellIds.has(cell.id);
                  const fixedSeat = fixedSeats.find((item) => item.cellId === cell.id);
                  const seatNumber = seatNumberMap.get(cell.id);
                  const primaryLabel = drawSettings.continuousNumbering && seatNumber
                    ? `${seatNumber}번`
                    : cell.label;
                  const animationDelay = `${Math.min(index * 30, 900)}ms`;

                  if (cell.type !== "seat") {
                    return (
                      <Card
                        key={cell.id}
                        withBorder
                        radius="md"
                        p="xs"
                        className="seat-card-animate bg-surface-muted"
                        style={{ borderStyle: "dashed", minHeight: 96, animationDelay }}
                      >
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
                      className={`seat-card-animate ${assignment?.isFixed ? "bg-surface-warm-strong" : "bg-surface-warm"}`}
                      onDragOver={handleSeatDragOver}
                      onDrop={(e) => handleSeatDrop(e, cell.id)}
                      style={{
                        minHeight: 96,
                        animationDelay,
                        borderColor: assignment?.isFixed ? "var(--mantine-color-orange-3)" : isSearchMatch ? "var(--mantine-color-orange-4)" : undefined,
                        outline: isSearchMatch ? "3px solid var(--mantine-color-orange-2)" : undefined,
                      }}
                    >
                      <Text size="xs" fw={800} c="orange.7">{primaryLabel}</Text>
                      <Text fw={600} size="sm">{assignment?.participant?.displayName ?? "빈자리"}</Text>
                      <Text size="xs" c="dimmed">
                        {drawSettings.continuousNumbering ? `칸 ${cell.label}` : `${seatNumber}번 자리`}
                        {fixedSeat ? " · 고정석" : ""}
                      </Text>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <Card withBorder radius="lg" p="xl" className="bg-surface-warm min-h-[320px] grid place-content-center text-center">
            <Stack align="center" gap="sm">
              <Text size="xs" fw={800} tt="uppercase" c="orange.6">Ready</Text>
              <Title order={3}>자리표가 아직 없습니다</Title>
              <Text c="dimmed">
                {isDesktop ? "왼쪽" : "위"} 패널에서 명단을 입력하고 좌석을 확인한 뒤,{" "}
                <Text span fw={700}>자리 뽑기</Text>를 누르면 결과가 이 영역에 표시됩니다.
              </Text>
              <Button variant="light" color="orange" onClick={handleGoToInput}>
                명단 입력하러 가기
              </Button>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
