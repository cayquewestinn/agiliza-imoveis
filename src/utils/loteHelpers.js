export const LOTE_STATUS_OPTIONS = ['Rascunho', 'Publicado', 'Suspenso', 'Cancelado']

export const TIPO_IMOVEL_OPTIONS = ['Residencial', 'Comercial']

export function statusToClassName(status) {
  switch (status) {
    case 'Rascunho': return 'todo'
    case 'Publicado': return 'doing'
    case 'Suspenso': return 'late'
    case 'Cancelado': return 'late'
    default: return 'todo'
  }
}

export function formatCurrency(value) {
  const num = Number(value) || 0
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}
