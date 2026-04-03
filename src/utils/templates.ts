import type { SeatTemplate } from '../types'

export function upsertTemplate(
  templates: SeatTemplate[],
  template: SeatTemplate,
) {
  const existingIndex = templates.findIndex((item) => item.id === template.id)

  if (existingIndex === -1) {
    return [template, ...templates]
  }

  return templates.map((item) => (item.id === template.id ? template : item))
}

export function deleteTemplate(
  templates: SeatTemplate[],
  templateId: string,
) {
  return templates.filter((template) => template.id !== templateId)
}

export function renameTemplate(
  templates: SeatTemplate[],
  templateId: string,
  nextName: string,
) {
  return templates.map((template) =>
    template.id === templateId
      ? {
        ...template,
        name: nextName,
        updatedAt: new Date().toISOString(),
      }
      : template,
  )
}
