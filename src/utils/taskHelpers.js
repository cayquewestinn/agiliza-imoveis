export const STATUS_OPTIONS = ['A Fazer', 'Em Andamento', 'Concluído']

export function statusToClassName(status) {
  if (status === 'A Fazer') return 'todo'
  if (status === 'Em Andamento') return 'doing'
  if (status === 'Concluído') return 'done'
  return 'todo'
}

export function isLate(task) {
  if (task.status === 'Concluído') return false
  const [day, month, year] = task.prazo.split('/').map(Number)
  const prazoDate = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return prazoDate < today
}

export function parsePrazo(prazo) {
  const [day, month, year] = prazo.split('/').map(Number)
  return new Date(year, month - 1, day)
}
