export const LEAD_ETAPA_OPTIONS = ['Novo', 'Em Atendimento', 'Em Visita', 'Em Proposta', 'Convertido', 'Perdido']

export function etapaToClassName(etapa) {
  switch (etapa) {
    case 'Novo': return 'todo'
    case 'Em Atendimento': return 'doing'
    case 'Em Visita': return 'leilao'
    case 'Em Proposta': return 'proposta'
    case 'Convertido': return 'done'
    case 'Perdido': return 'late'
    default: return 'todo'
  }
}

export function formatPhone(phoneDigits) {
  const ddd = phoneDigits.slice(2, 4)
  const rest = phoneDigits.slice(4)
  if (rest.length === 9) {
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
  }
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
}

export function whatsappLink(phoneDigits, message) {
  const base = `https://wa.me/${phoneDigits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function normalizePhoneBR(input) {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}
