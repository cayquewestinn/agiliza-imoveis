export const VISITA_TIPO_OPTIONS = [
  { value: 'imovel', label: 'Visita ao imóvel' },
  { value: 'empresa', label: 'Visita à empresa' },
]

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

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
