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

function hojeSemHora() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return hoje
}

// Dias entre hoje e a data do leilão (negativo = já passou). `null` quando
// não há data cadastrada — sem isso um lote sem data pareceria "encerrado".
export function diasParaLeilao(dataLeilaoISO) {
  if (!dataLeilaoISO) return null
  const [ano, mes, dia] = dataLeilaoISO.split('-').map(Number)
  const data = new Date(ano, mes - 1, dia)
  const diffMs = data - hojeSemHora()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

// O leilão é o prazo que torna um lead urgente — a frase precisa dizer isso
// de relance, sem exigir que alguém faça a conta de cabeça.
export function leilaoUrgenciaLabel(dataLeilaoISO) {
  const dias = diasParaLeilao(dataLeilaoISO)
  if (dias === null) return 'Sem data de leilão'
  if (dias < 0) return `Leilão em ${formatDate(dataLeilaoISO)} (encerrado)`
  if (dias === 0) return 'Leilão hoje'
  if (dias === 1) return 'Leilão amanhã'
  if (dias <= 7) return `Leilão em ${dias} dias`
  return `Leilão em ${formatDate(dataLeilaoISO)}`
}

// Classe de urgência para colorir a data — mesma paleta de status já usada
// nos badges, sem inventar cor nova.
export function leilaoUrgenciaClassName(dataLeilaoISO) {
  const dias = diasParaLeilao(dataLeilaoISO)
  if (dias === null) return 'neutro'
  if (dias < 0) return 'neutro'
  if (dias <= 3) return 'danger'
  if (dias <= 7) return 'warning'
  return 'neutro'
}
