import { Button, Checkbox, Group, Radio, Slider, Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useEffect, useState } from 'react'

type PrintPreviewModalBodyProps = {
  modalId: string
}

export function PrintPreviewModalBody({ modalId }: PrintPreviewModalBodyProps) {
  const [includeTitle, setIncludeTitle] = useState(true)
  const [seatFontSize, setSeatFontSize] = useState(14)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // CSS 변수를 통해 인쇄 옵션을 DOM에 반영한다.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--print-seat-font-size', `${seatFontSize}px`)
    root.style.setProperty('--print-show-title', includeTitle ? 'block' : 'none')
    return () => {
      root.style.removeProperty('--print-seat-font-size')
      root.style.removeProperty('--print-show-title')
    }
  }, [includeTitle, seatFontSize])

  // @page orientation을 동적으로 반영
  useEffect(() => {
    const styleId = 'dynamic-print-orientation'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = `@media print { @page { size: A4 ${orientation}; } }`
    return () => {
      styleEl?.remove()
    }
  }, [orientation])

  const handlePrint = () => {
    modals.close(modalId)
    // 모달이 닫히고 DOM이 정리된 뒤 인쇄
    setTimeout(() => window.print(), 100)
  }

  return (
    <Stack gap="md">
      <Checkbox
        label="상단 타이틀 포함"
        description="자리표 제목과 메타 정보를 같이 출력합니다."
        checked={includeTitle}
        onChange={(e) => setIncludeTitle(e.currentTarget.checked)}
      />

      <div>
        <Text size="sm" fw={600} mb={4}>좌석 글자 크기</Text>
        <Slider
          value={seatFontSize}
          onChange={setSeatFontSize}
          min={10}
          max={24}
          step={1}
          marks={[
            { value: 10, label: '10' },
            { value: 14, label: '14' },
            { value: 18, label: '18' },
            { value: 24, label: '24' },
          ]}
        />
      </div>

      <Radio.Group
        label="용지 방향"
        value={orientation}
        onChange={(v) => setOrientation(v as 'portrait' | 'landscape')}
      >
        <Group mt="xs">
          <Radio value="portrait" label="세로" />
          <Radio value="landscape" label="가로" />
        </Group>
      </Radio.Group>

      <Group justify="flex-end" gap="xs" mt="sm">
        <Button variant="default" onClick={() => modals.close(modalId)}>
          취소
        </Button>
        <Button onClick={handlePrint}>인쇄하기</Button>
      </Group>
    </Stack>
  )
}
