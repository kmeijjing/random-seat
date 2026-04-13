import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  getSeatCapacityFeedback,
  selectParticipants,
  selectRecommendedLayouts,
  selectUsableSeatCount,
} from "../store/seatSelectors";
import { useSeatStore } from "../store/seatStore";

export function SeatConfigPanel() {
  const {
    seatConfig,
    participantInput,
    onDimensionChange,
    onApplyRecommendation,
  } = useSeatStore(
    useShallow((s) => ({
      seatConfig: s.seatConfig,
      participantInput: s.participantInput,
      onDimensionChange: s.onDimensionChange,
      onApplyRecommendation: s.onApplyRecommendation,
    })),
  );

  const participants = useMemo(
    () =>
      selectParticipants({ participantInput } as Parameters<
        typeof selectParticipants
      >[0]),
    [participantInput],
  );
  const usableSeatCount = useMemo(
    () =>
      selectUsableSeatCount({ seatConfig } as Parameters<
        typeof selectUsableSeatCount
      >[0]),
    [seatConfig],
  );
  const recommendedLayouts = useMemo(
    () => selectRecommendedLayouts(participants.length),
    [participants.length],
  );
  const capacityFeedback = useMemo(
    () => getSeatCapacityFeedback(participants.length, usableSeatCount),
    [participants.length, usableSeatCount],
  );

  return (
    <Accordion.Item value={"좌석 설정"}>
      <Accordion.Control>
        <Group>
          <Title order={5} c="blue.7">
            2. 좌석 설정
          </Title>
          <Badge variant="light">{usableSeatCount}석</Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="sm">
          <SimpleGrid cols={2}>
            <NumberInput
              label="행"
              min={1}
              value={seatConfig.rows}
              onChange={(val) => onDimensionChange("rows", String(val))}
              size="sm"
            />
            <NumberInput
              label="열"
              min={1}
              value={seatConfig.columns}
              onChange={(val) => onDimensionChange("columns", String(val))}
              size="sm"
            />
          </SimpleGrid>

          <Group gap="xs">
            {recommendedLayouts.map((rec) => (
              <Button
                key={rec.label}
                variant="light"
                size="xs"
                onClick={() => onApplyRecommendation(rec.rows, rec.columns)}
              >
                {rec.label}
                <Text span size="xs" c="dimmed" ml={4}>
                  {rec.emptyCount}칸 여유
                </Text>
              </Button>
            ))}
          </Group>

          <Card radius="md" className="bg-surface-warm" p="sm">
            <SimpleGrid cols={3}>
              <div>
                <Text size="xs" c="dimmed">
                  사용 가능 좌석
                </Text>
                <Text fw={600}>{usableSeatCount}석</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  참여자
                </Text>
                <Text fw={600}>{participants.length}명</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  남는 좌석
                </Text>
                <Text fw={600}>
                  {Math.max(usableSeatCount - participants.length, 0)}석
                </Text>
              </div>
            </SimpleGrid>
            <Alert
              mt="sm"
              p="xs"
              radius="md"
              variant="light"
              color={capacityFeedback.color}
              title="현재 상태"
            >
              <Text size="xs">{capacityFeedback.message}</Text>
            </Alert>
          </Card>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
