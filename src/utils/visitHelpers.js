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
