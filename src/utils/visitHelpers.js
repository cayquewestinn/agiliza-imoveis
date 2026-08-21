export const VISITA_STATUS_OPTIONS = ['Agendada', 'Realizada', 'Não Compareceu', 'Remarcada']

export function statusToClassName(status) {
  switch (status) {
    case 'Agendada': return 'doing'
    case 'Realizada': return 'done'
    case 'Não Compareceu': return 'late'
    case 'Remarcada': return 'todo'
    default: return 'todo'
  }
}

export function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayISO() {
  return toISODate(new Date())
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function formatMonthHeading(year, month) {
  const label = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = firstWeekday; i > 0; i--) {
    const date = new Date(year, month, 1 - i)
    cells.push({ date, iso: toISODate(date), inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    cells.push({ date, iso: toISODate(date), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const prev = cells[cells.length - 1].date
    const date = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1)
    cells.push({ date, iso: toISODate(date), inMonth: false })
  }
  return cells
}

export function isToday(isoDate) {
  return isoDate === todayISO()
}

export function isPast(isoDate) {
  return isoDate < todayISO()
}

export function formatDateHeading(isoDate) {
  const [year, month, day] = isoDate.split('-')
  if (isToday(isoDate)) return `Hoje · ${day}/${month}/${year}`
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${weekday} · ${day}/${month}/${year}`
}

export const AGENDA_WEEK_START_HOUR = 7
export const AGENDA_WEEK_END_HOUR = 20
export const AGENDA_WEEK_HOURS = Array.from(
  { length: AGENDA_WEEK_END_HOUR - AGENDA_WEEK_START_HOUR },
  (_, i) => AGENDA_WEEK_START_HOUR + i,
)
export const AGENDA_WEEK_ROW_HEIGHT = 56
export const AGENDA_WEEK_DEFAULT_EVENT_HEIGHT = 30
export const AGENDA_WEEK_DEFAULT_DURATION_MINUTES = 30

export function buildWeekGrid(anchorIso) {
  const [y, m, d] = anchorIso.split('-').map(Number)
  const anchorWeekday = new Date(y, m - 1, d).getDay()
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(y, m - 1, d - anchorWeekday + i)
    days.push({ date, iso: toISODate(date) })
  }
  return days
}

export function formatWeekHeading(days) {
  const first = days[0].date
  const last = days[6].date
  const year = last.getFullYear()
  const lastMonthLabel = last.toLocaleDateString('pt-BR', { month: 'long' })
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} de ${lastMonthLabel} de ${year}`
  }
  const firstMonthLabel = first.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${first.getDate()} de ${firstMonthLabel} – ${last.getDate()} de ${lastMonthLabel} de ${year}`
}

export function hourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

// Clamped so an event outside the 07h–20h grid still renders (pinned to the
// nearest edge) instead of disappearing off-canvas.
export function eventTopOffset(hora) {
  const [h, m] = hora.split(':').map(Number)
  const minutesFromStart = (h - AGENDA_WEEK_START_HOUR) * 60 + m
  const totalMinutes = (AGENDA_WEEK_END_HOUR - AGENDA_WEEK_START_HOUR) * 60
  const clamped = Math.min(Math.max(minutesFromStart, 0), totalMinutes - 15)
  return (clamped / 60) * AGENDA_WEEK_ROW_HEIGHT
}

function minutesFromMidnight(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

// Groups a day's visits by actual time overlap (not just "same day") so the
// side-by-side column width only shrinks for visits that really clash —
// a busy day with visits spread through the day still renders full-width.
export function clusterOverlappingVisits(visitasDoDia, durationMinutes = AGENDA_WEEK_DEFAULT_DURATION_MINUTES) {
  const sorted = visitasDoDia.slice().sort((a, b) => a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0)

  const clusters = []
  let current = []
  let clusterEndMinutes = -Infinity
  for (const v of sorted) {
    const start = minutesFromMidnight(v.hora)
    if (current.length > 0 && start >= clusterEndMinutes) {
      clusters.push(current)
      current = []
    }
    current.push(v)
    clusterEndMinutes = Math.max(clusterEndMinutes, start + durationMinutes)
  }
  if (current.length > 0) clusters.push(current)

  return clusters.flatMap(cluster => cluster.map((v, i) => ({ visita: v, col: i, colCount: cluster.length })))
}

export function groupByDate(visitas) {
  const sorted = [...visitas].sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? -1 : 1
    return a.hora < b.hora ? -1 : 1
  })
  const groups = []
  for (const v of sorted) {
    let group = groups[groups.length - 1]
    if (!group || group.data !== v.data) {
      group = { data: v.data, visitas: [] }
      groups.push(group)
    }
    group.visitas.push(v)
  }
  return groups
}
