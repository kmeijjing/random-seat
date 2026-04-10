import { Kbd, Stack, Table, Text } from '@mantine/core'

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
const modKey = isMac ? '⌘' : 'Ctrl'

const shortcuts: Array<{ keys: string[]; label: string }> = [
  { keys: [modKey, 'Enter'], label: '자리 뽑기' },
  { keys: [modKey, 'K'], label: '학생 이름 검색 포커스' },
  { keys: [modKey, 'Shift', 'S'], label: '현재 상태를 템플릿으로 저장' },
  { keys: ['?'], label: '이 단축키 목록 열기' },
  { keys: ['Esc'], label: '열린 드로어/모달 닫기' },
]

export function KeyboardShortcutsModalBody() {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">자주 쓰는 동작을 단축키로 빠르게 호출할 수 있습니다.</Text>
      <Table verticalSpacing="xs">
        <Table.Tbody>
          {shortcuts.map((s) => (
            <Table.Tr key={s.label}>
              <Table.Td>
                {s.keys.map((key, i) => (
                  <span key={`${key}-${i}`}>
                    {i > 0 && <Text span mx={4}>+</Text>}
                    <Kbd>{key}</Kbd>
                  </span>
                ))}
              </Table.Td>
              <Table.Td>
                <Text size="sm">{s.label}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
