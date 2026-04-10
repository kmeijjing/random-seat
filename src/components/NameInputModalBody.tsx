import { Button, Group, Stack, TextInput } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useState } from 'react'

type NameInputModalBodyProps = {
  modalId: string
  initialValue: string
  placeholder?: string
  confirmLabel: string
  onConfirm: (value: string) => void
}

export function NameInputModalBody({
  modalId,
  initialValue,
  placeholder,
  confirmLabel,
  onConfirm,
}: NameInputModalBodyProps) {
  const [value, setValue] = useState(initialValue)
  const trimmed = value.trim()
  const canSubmit = trimmed.length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onConfirm(trimmed)
    modals.close(modalId)
  }

  return (
    <Stack gap="md">
      <TextInput
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={placeholder}
        data-autofocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit) {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />
      <Group justify="flex-end" gap="xs">
        <Button variant="default" onClick={() => modals.close(modalId)}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {confirmLabel}
        </Button>
      </Group>
    </Stack>
  )
}
