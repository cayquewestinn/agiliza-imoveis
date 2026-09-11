// Regras puras do contato inicial por WhatsApp: nada aqui toca rede ou
// banco, por isso dá pra testar com `deno test` direto, sem runtime
// completo de Edge Functions.

// --- Especificação do modelo (Parte 1) — fonte única, usada tanto pra
// montar o envio (db.ts) quanto pra registrar o histórico da conversa
// (index.ts). O texto abaixo é o que precisa ser submetido, palavra por
// palavra, no WhatsApp Manager da Meta — passo manual do usuário, feito
// fora do código. Categoria Utilidade (não Marketing) de propósito: o
// texto evita "oferta"/"condição especial", que fariam a Meta
// reclassificar. Sem cabeçalho, sem rodapé. Botão de resposta rápida
// "Sim, quero agendar" é ESTÁTICO (sem valor dinâmico) — por isso o
// envio (ver db.ts:enviarMensagemTemplate) não inclui nenhum "button"
// component, só "body" com {{1}} = primeiro nome do lead.
export const TEMPLATE_CONTATO_INICIAL = {
  nome: 'contato_inicial_interesse_imovel',
  idioma: 'pt_BR',
  categoria: 'UTILITY',
  botao: 'Sim, quero agendar',
  corpo(primeiroNomeDoLead: string): string {
    return `Olá ${primeiroNomeDoLead}! Aqui é da Agiliza Imóveis. Vimos que você demonstrou interesse em um dos nossos imóveis e adoraríamos te ajudar a agendar uma visita. Podemos conversar?`
  },
} as const

// --- Régua (Parte 2) ---
//
// Só dispara pra quem teve um sinal de interesse real no Canal Pro.
// Fica de fora PHONE_VIEW (só visualizou o telefone, nunca houve
// contato) e Prospectado (lead digitado à mão por alguém da equipe —
// presume-se contato humano já feito; puxar assunto do zero seria
// redundante). Cobre só os códigos novos do Canal Pro (pós 18/08/2026,
// ver src/utils/leadHelpers.js) porque o gatilho é sempre um INSERT
// novo — leads antigos com rótulo em português não passam por aqui.
const ORIGENS_ELEGIVEIS = new Set(['CLICK_WHATSAPP', 'CONTACT_FORM', 'CONTACT_CHAT'])

export function elegivelParaContatoInicial(origem: string | null | undefined): boolean {
  if (!origem) return false
  return ORIGENS_ELEGIVEIS.has(origem)
}

// Primeiro nome pro {{1}} do template. "Maria da Silva" -> "Maria".
export function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0] ?? ''
}

// --- Parsing do payload do Database Webhook do Supabase (Parte 3) ---
//
// Formato padrão de "Database Webhooks" (Dashboard → Database →
// Webhooks, evento "Insert" na tabela leads): { type, table, schema,
// record, old_record }. Não confundir com o payload da Meta (outro
// formato, tratado em whatsapp-webhook/logica.ts).

export interface LeadInserido {
  id: string
  nome: string
  telefone: string
  origem: string
}

// deno-lint-ignore no-explicit-any
export function extrairLeadInserido(payload: any): LeadInserido | null {
  if (payload?.type !== 'INSERT' || payload?.table !== 'leads') return null
  const record = payload?.record
  if (!record?.id || !record?.telefone) return null
  return {
    id: record.id,
    nome: record.nome ?? '',
    telefone: record.telefone,
    origem: record.origem ?? '',
  }
}

// --- Segredo compartilhado do Database Webhook ---
//
// Mesmo princípio da verificação HMAC do webhook da Meta (ver
// whatsapp-webhook/logica.ts) — nunca confiar numa chamada sem validar
// a origem antes de tocar o banco ou a API da Meta. Aqui é comparação
// direta em tempo constante (o Database Webhook do Supabase manda o
// segredo num header customizado configurado na mão, não uma
// assinatura HMAC sobre o corpo).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function verificarSegredoWebhook(recebido: string | null, esperado: string): boolean {
  if (!recebido) return false
  return timingSafeEqual(recebido, esperado)
}
