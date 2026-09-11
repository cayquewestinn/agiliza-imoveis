// Funções que tocam o banco (via service_role, injetado pelo runtime de
// Edge Functions) e as APIs externas (Meta). Separado de logica.ts
// porque essas aqui não dá pra testar sem credenciais reais.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { VisitaExistente } from './logica.ts'

export function criarClienteSupabase(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export interface Conversa {
  id: string
  telefone: string
  leadId: string | null
  historico: Array<{ role: 'user' | 'assistant'; content: string }>
  janelaExpiraEm: string | null
  status: string
  visitaId: string | null
  ultimaMensagemId: string | null
}

function fromRow(row: Record<string, unknown>): Conversa {
  return {
    id: row.id as string,
    telefone: row.telefone as string,
    leadId: (row.lead_id as string) ?? null,
    historico: (row.historico as Conversa['historico']) ?? [],
    janelaExpiraEm: (row.janela_expira_em as string) ?? null,
    status: row.status as string,
    visitaId: (row.visita_id as string) ?? null,
    ultimaMensagemId: (row.ultima_mensagem_id as string) ?? null,
  }
}

// Carrega a conversa pelo telefone, criando uma nova se essa for a
// primeira mensagem dessa pessoa. Resolve lead_id por igualdade de
// telefone (leads.telefone já vem sempre com prefixo 55, igual ao
// wa_id da Meta). Se houver mais de um lead com o mesmo telefone, usa
// o mais recente por data_recebimento — caso raro, não trava o fluxo.
export async function buscarOuCriarConversa(supabase: SupabaseClient, telefone: string): Promise<Conversa> {
  const { data: existente } = await supabase
    .from('whatsapp_conversas')
    .select('*')
    .eq('telefone', telefone)
    .maybeSingle()
  if (existente) return fromRow(existente)

  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('telefone', telefone)
    .order('data_recebimento', { ascending: false })
    .limit(1)
  const leadId = leads?.[0]?.id ?? null

  const { data: criada, error } = await supabase
    .from('whatsapp_conversas')
    .insert({ telefone, lead_id: leadId, historico: [], status: 'aberta' })
    .select('*')
    .single()
  if (error) throw error
  return fromRow(criada)
}

export async function atualizarConversa(
  supabase: SupabaseClient,
  conversaId: string,
  updates: Partial<{
    historico: Conversa['historico']
    janelaExpiraEm: string
    status: string
    visitaId: string
    ultimaMensagemId: string
  }>,
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.historico !== undefined) row.historico = updates.historico
  if (updates.janelaExpiraEm !== undefined) row.janela_expira_em = updates.janelaExpiraEm
  if (updates.status !== undefined) row.status = updates.status
  if (updates.visitaId !== undefined) row.visita_id = updates.visitaId
  if (updates.ultimaMensagemId !== undefined) row.ultima_mensagem_id = updates.ultimaMensagemId
  const { error } = await supabase.from('whatsapp_conversas').update(row).eq('id', conversaId)
  if (error) throw error
}

// --- Ferramentas que a IA usa ---

// Agendadores não atendem presencialmente — só perfis com cargo
// 'Vendedor' atendem visita. Mesmo filtro exato de Dashboard.jsx:131
// (profiles.filter(p => p.cargo === 'Vendedor')), pra não divergir do
// que o resto do CRM já considera "vendedor".
export async function listarVendedores(supabase: SupabaseClient): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('cargo', 'Vendedor')
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id as string, nome: r.nome as string }))
}

// Generalizada pra aceitar vários responsáveis de uma vez (antes era um
// só) — precisa das visitas de todos os vendedores no mesmo dia pra
// calcular a união de horários livres e, na hora de marcar, quem está
// livre exatamente naquele horário.
export async function visitasDoResponsavelNoDia(
  supabase: SupabaseClient,
  responsavelIds: string[],
  data: string,
): Promise<VisitaExistente[]> {
  const { data: rows, error } = await supabase
    .from('visitas')
    .select('data, hora, responsavel_id, status')
    .in('responsavel_id', responsavelIds)
    .eq('data', data)
  if (error) throw error
  return (rows ?? []).map(r => ({
    data: r.data,
    hora: (r.hora as string).slice(0, 5),
    responsavelId: r.responsavel_id,
    status: r.status,
  }))
}

// Quantas visitas 'Agendada' cada responsável já tem na semana (limites
// de logica.ts:limitesDaSemana) — usado só pra desempate entre vendedores
// livres no mesmo horário (ver escolherVendedor em logica.ts). Todo id
// pedido entra no resultado, mesmo com contagem zero.
export async function contagemVisitasAgendadasNaSemana(
  supabase: SupabaseClient,
  responsavelIds: string[],
  limites: { inicio: string; fim: string },
): Promise<Record<string, number>> {
  const { data: rows, error } = await supabase
    .from('visitas')
    .select('responsavel_id')
    .in('responsavel_id', responsavelIds)
    .eq('status', 'Agendada')
    .gte('data', limites.inicio)
    .lte('data', limites.fim)
  if (error) throw error
  const contagem: Record<string, number> = {}
  for (const id of responsavelIds) contagem[id] = 0
  for (const row of rows ?? []) {
    const id = row.responsavel_id as string
    contagem[id] = (contagem[id] ?? 0) + 1
  }
  return contagem
}

// Espelha VisitModal.jsx:150-172 — mesmo shape de visita/lead que o
// formulário manual grava. `responsavelId` é o vendedor sorteado (quem
// atende); `criadoPor` é a assinatura fixa da automação (distingue
// "marcado pela IA" de "marcado por pessoa" em visitas.criado_por) — os
// dois eram o mesmo valor antes da distribuição por vendedor existir, o
// que confundia "quem atende" com "quem/o quê criou o registro".
export async function marcarVisita(
  supabase: SupabaseClient,
  params: {
    leadId: string
    responsavelId: string
    criadoPor: string
    data: string
    hora: string
    observacao?: string
  },
): Promise<{ visitaId: string }> {
  const { data: visita, error } = await supabase
    .from('visitas')
    .insert({
      tipo: 'empresa',
      lote_id: null,
      lead_id: params.leadId,
      data: params.data,
      hora: params.hora,
      responsavel_id: params.responsavelId,
      status: 'Agendada',
      criado_por: params.criadoPor,
      feedback: params.observacao ?? null,
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: erroLead } = await supabase
    .from('leads')
    .update({ etapa: 'Em Visita' })
    .eq('id', params.leadId)
  if (erroLead) throw erroLead

  return { visitaId: visita.id }
}

export async function anotarObservacao(supabase: SupabaseClient, leadId: string, texto: string): Promise<void> {
  const { data: lead, error: erroBusca } = await supabase
    .from('leads')
    .select('observacoes')
    .eq('id', leadId)
    .single()
  if (erroBusca) throw erroBusca

  const existente = (lead?.observacoes as string) ?? ''
  const novoTexto = existente ? `${existente}\n${texto}` : texto

  const { error } = await supabase.from('leads').update({ observacoes: novoTexto }).eq('id', leadId)
  if (error) throw error
}

// --- Envio pelo Graph API da Meta ---
//
// Pulado (só logado) quando META_WHATSAPP_TOKEN não está configurado —
// não existe ainda, o chip/WABA é 100% manual do usuário.
export async function enviarMensagemWhatsapp(telefone: string, texto: string): Promise<void> {
  const token = Deno.env.get('META_WHATSAPP_TOKEN')
  const phoneNumberId = Deno.env.get('META_PHONE_NUMBER_ID')
  if (!token || !phoneNumberId) {
    console.log(`[dry-run] enviaria pro ${telefone}: ${texto}`)
    return
  }
  const resposta = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefone,
      type: 'text',
      text: { body: texto },
    }),
  })
  if (!resposta.ok) {
    console.error('Falha ao enviar mensagem via Graph API:', await resposta.text())
  }
}
