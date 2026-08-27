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

// O Canal Pro trocou os rótulos de origem em 18/08/2026: até essa data os
// leads chegavam com nome em português, a partir dela com o código bruto
// ("CONTACT_FORM"). É a mesma taxonomia com dois nomes. A importação não
// está sob nosso controle, então normalizamos na EXIBIÇÃO em vez de
// reescrever o dado — uma carga nova do Canal Pro não desfaz o trabalho.
//
// "Visualizou telefone" é deliberado: a pessoa apenas revelou o número no
// anúncio, nunca ligou. O rótulo deixa isso explícito na tela.
const ORIGEM_CANONICA = {
  'formulário': 'Formulário',
  'contact_form': 'Formulário',
  'whatsapp': 'WhatsApp',
  'click_whatsapp': 'WhatsApp',
  'telefone': 'Visualizou telefone',
  'phone_view': 'Visualizou telefone',
  'chat olx': 'Chat do portal',
  'contact_chat': 'Chat do portal',
}

// Origem desconhecida passa intacta: "Visita à empresa" (escrita pelo próprio
// CRM), "Prospectado" e qualquer valor futuro continuam legíveis sem virarem
// um rótulo inventado.
export function origemLabel(origem) {
  if (!origem) return null
  const chave = origem.trim().toLowerCase()
  return ORIGEM_CANONICA[chave] ?? origem.trim()
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
