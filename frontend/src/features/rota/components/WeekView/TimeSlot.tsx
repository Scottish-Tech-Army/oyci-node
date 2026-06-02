import { SLOT_MINUTES, isBusinessHourSlot } from '../../model/rota.utils'

type TimeSlotProps = {
  index: number
}

export function TimeSlot({ index }: TimeSlotProps) {
  const isHourStart = (index * SLOT_MINUTES) % 60 === 0
  const isBusinessHour = isBusinessHourSlot(index)

  return (
    <div
      className={[
        'rota-week-column__slot',
        isHourStart ? 'is-hour-start' : '',
        isBusinessHour ? 'is-business-hour' : '',
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
