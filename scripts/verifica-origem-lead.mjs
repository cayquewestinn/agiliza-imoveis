// Verifica a normalização de origem dos leads (Canal Pro trocou os rótulos
// em 18/08/2026 — ver comentário em src/utils/leadHelpers.js).
//
// Rodar com:  node scripts/verifica-origem-lead.mjs
import { origemLabel } from '../src/utils/leadHelpers.js'

const casos = [
  // os dois nomes de cada par têm de chegar ao MESMO rótulo
  { entrada: 'Formulário',        esperado: 'Formulário' },
  { entrada: 'CONTACT_FORM',      esperado: 'Formulário' },
  { entrada: 'WhatsApp',          esperado: 'WhatsApp' },
  { entrada: 'CLICK_WHATSAPP',    esperado: 'WhatsApp' },
  { entrada: 'Telefone',          esperado: 'Visualizou telefone' },
  { entrada: 'PHONE_VIEW',        esperado: 'Visualizou telefone' },
  { entrada: 'Chat OLX',          esperado: 'Chat do portal' },
  { entrada: 'CONTACT_CHAT',      esperado: 'Chat do portal' },
  // origem desconhecida passa intacta, sem virar rótulo inventado
  { entrada: 'Visita à empresa',  esperado: 'Visita à empresa' },
  { entrada: 'Prospectado',       esperado: 'Prospectado' },
  { entrada: 'Olx Validacao',     esperado: 'Olx Validacao' },
  // vazios não quebram a tela
  { entrada: '',                  esperado: null },
  { entrada: null,                esperado: null },
  { entrada: undefined,           esperado: null },
  // espaços em volta não criam um rótulo diferente
  { entrada: '  CONTACT_FORM  ',  esperado: 'Formulário' },
]

let falhas = 0
for (const c of casos) {
  const obtido = origemLabel(c.entrada)
  const ok = obtido === c.esperado
  if (!ok) falhas++
  console.log(`${ok ? '✓' : '✗'}  ${String(JSON.stringify(c.entrada)).padEnd(22)} -> ${JSON.stringify(obtido)}`)
  if (!ok) console.log(`     esperado: ${JSON.stringify(c.esperado)}`)
}

console.log('')
if (falhas > 0) {
  console.error(`${falhas} de ${casos.length} caso(s) FALHARAM`)
  process.exit(1)
}
console.log(`Todos os ${casos.length} casos passaram.`)
