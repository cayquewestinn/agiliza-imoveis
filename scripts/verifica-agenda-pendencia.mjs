// Teste de regressão do bug corrigido em 2026-08-26: o sistema marcava
// "Não Compareceu" sozinho, inclusive em visitas que aconteceram.
//
// Rodar com:  node scripts/verifica-agenda-pendencia.mjs
//
// Regra que este teste protege: NENHUMA visita muda de status sozinha.
// "Pendente de confirmação" é um estado só de exibição — nunca vai ao banco.
import { isPendenteConfirmacao, visitaClassName } from '../src/utils/visitHelpers.js'

const casos = [
  { n: 'Visita ACONTECENDO AGORA (começou há 5 min)', v: { status: 'Agendada', data: '2026-08-26', hora: '14:00' }, agora: '2026-08-26T14:05:00', pendente: false, classe: 'doing' },
  { n: 'Visita começou há 1 minuto',                  v: { status: 'Agendada', data: '2026-08-26', hora: '14:00' }, agora: '2026-08-26T14:01:00', pendente: false, classe: 'doing' },
  { n: 'Visita terminou há 5 min, sem atualização',   v: { status: 'Agendada', data: '2026-08-26', hora: '14:00' }, agora: '2026-08-26T15:05:00', pendente: true,  classe: 'pendente' },
  { n: 'Visita de ontem, corretor não atualizou',     v: { status: 'Agendada', data: '2026-08-25', hora: '10:00' }, agora: '2026-08-26T09:00:00', pendente: true,  classe: 'pendente' },
  { n: 'Visita daqui a 1 hora',                       v: { status: 'Agendada', data: '2026-08-26', hora: '16:00' }, agora: '2026-08-26T15:00:00', pendente: false, classe: 'doing' },
  { n: 'Corretor marcou "Realizada" (passada)',       v: { status: 'Realizada', data: '2026-08-25', hora: '10:00' }, agora: '2026-08-26T09:00:00', pendente: false, classe: 'done' },
  { n: 'Corretor marcou "Não Compareceu" de verdade', v: { status: 'Não Compareceu', data: '2026-08-25', hora: '10:00' }, agora: '2026-08-26T09:00:00', pendente: false, classe: 'late' },
]

let falhas = 0
for (const c of casos) {
  const agora = new Date(c.agora)
  const p = isPendenteConfirmacao(c.v, agora)
  const cls = visitaClassName(c.v, agora)
  const ok = p === c.pendente && cls === c.classe
  if (!ok) falhas++
  console.log(`${ok ? '✓' : '✗'}  ${c.n.padEnd(50)} pendente=${String(p).padEnd(5)} classe=${cls}`)
  if (!ok) console.log(`     esperado: pendente=${c.pendente} classe=${c.classe}`)
}

console.log('')
if (falhas > 0) {
  console.error(`${falhas} de ${casos.length} caso(s) FALHARAM`)
  process.exit(1)
}
console.log(`Todos os ${casos.length} casos passaram.`)
