// Regras puras da automação de agendamento por WhatsApp: nada aqui toca
// rede ou banco, por isso dá pra testar com `deno test` direto, sem
// precisar do runtime completo de Edge Functions (que exige Docker
// nesta máquina via `supabase functions serve`).

// Mesma janela e mesmo intervalo de conflito já usados no CRM
// (src/utils/visitHelpers.js e src/components/VisitModal.jsx) — não
// reinventar a regra aqui, só espelhar.
export const AGENDA_WEEK_START_HOUR = 7
export const AGENDA_WEEK_END_HOUR = 20
export const CONFLICT_WINDOW_MINUTES = 60

function toMinutes(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function horariosDoExpediente(): string[] {
  const horas: string[] = []
  for (let h = AGENDA_WEEK_START_HOUR; h < AGENDA_WEEK_END_HOUR; h++) horas.push(hourLabel(h))
  return horas
}

export interface VisitaExistente {
  data: string
  hora: string
  responsavelId: string
  status: string
}

// Mesma regra do VisitModal.jsx: só oferece horário que não tenha uma
// visita Agendada do mesmo responsável, no mesmo dia, a menos de 60 min.
export function horariosLivres(data: string, responsavelId: string, visitasDoResponsavel: VisitaExistente[]): string[] {
  const ocupadas = visitasDoResponsavel.filter(v =>
    v.status === 'Agendada' && v.data === data && v.responsavelId === responsavelId
  )
  return horariosDoExpediente().filter(slot =>
    !ocupadas.some(v => Math.abs(toMinutes(v.hora) - toMinutes(slot)) < CONFLICT_WINDOW_MINUTES)
  )
}

// --- Assinatura do webhook da Meta (X-Hub-Signature-256) ---
//
// Toda requisição POST precisa disso validado ANTES de tocar em
// qualquer tabela. Sem essa checagem, qualquer pessoa que descubra a
// URL pública da function pode forjar mensagens falsas — a function
// roda com service_role, que ignora RLS.

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verificarAssinatura(
  corpoBruto: string,
  assinaturaHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!assinaturaHeader || !assinaturaHeader.startsWith('sha256=')) return false
  const esperada = assinaturaHeader.slice('sha256='.length)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const assinaturaBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(corpoBruto))
  const calculada = Array.from(new Uint8Array(assinaturaBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return timingSafeEqual(calculada, esperada)
}

// --- Parsing do payload da Meta ---

export interface MensagemRecebida {
  telefone: string
  texto: string
  mensagemId: string
  timestamp: string
}

// deno-lint-ignore no-explicit-any
export function extrairMensagem(payload: any): MensagemRecebida | null {
  const mensagem = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!mensagem?.from || !mensagem?.id) return null

  let texto = ''
  if (mensagem.type === 'text') {
    texto = mensagem.text?.body ?? ''
  } else if (mensagem.type === 'interactive') {
    texto = mensagem.interactive?.list_reply?.title ?? mensagem.interactive?.button_reply?.title ?? ''
  }

  return {
    telefone: mensagem.from,
    texto,
    mensagemId: mensagem.id,
    timestamp: mensagem.timestamp ?? '',
  }
}

// --- Deduplicação ---
//
// A Meta reentrega webhooks por design. Se o id da mensagem bater com o
// que já está gravado na conversa, é reentrega — não reprocessar.
export function mensagemJaProcessada(mensagemId: string, ultimaMensagemIdGravada: string | null): boolean {
  return ultimaMensagemIdGravada !== null && ultimaMensagemIdGravada === mensagemId
}
