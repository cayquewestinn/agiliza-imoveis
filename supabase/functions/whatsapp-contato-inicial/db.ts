// Funções que tocam o banco (via service_role) e a API da Meta. Separado
// de logica.ts porque essas aqui não dá pra testar sem credenciais
// reais. `criarClienteSupabase` é duplicado de propósito em vez de
// importado de whatsapp-webhook/ — as duas functions ficam isoladas,
// editar uma não arrisca a outra que já está no ar.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export function criarClienteSupabase(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

// Dedup best-effort: se já existe uma linha em whatsapp_conversas pra
// esse telefone, não manda o contato inicial de novo — reaproveita a
// tabela existente (sem coluna nova). Cobre o caso que motivou o
// pedido (Database Webhook reentregando por falha de rede); não é uma
// trava atômica contra duas entregas concorrentes no mesmo instante,
// cenário que não se aplica aqui (um INSERT por lead, sem concorrência
// real esperada).
export async function existeConversaParaTelefone(supabase: SupabaseClient, telefone: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('whatsapp_conversas')
    .select('id')
    .eq('telefone', telefone)
    .maybeSingle()
  if (error) throw error
  return data !== null
}

// Cria a conversa já com o histórico da mensagem que a automação acabou
// de mandar — quando o lead responder (ex.: "Sim, quero agendar"), o
// whatsapp-webhook (buscarOuCriarConversa) encontra essa linha pronta
// pelo telefone e a IA já sabe o que foi perguntado, em vez de ver a
// resposta do lead do nada. `janela_expira_em` fica nula de propósito:
// a janela de 24h grátis só abre quando o LEAD responde, não quando a
// empresa manda o template (que é pago à parte, categoria Utilidade).
export async function criarConversaAposContatoInicial(
  supabase: SupabaseClient,
  params: { telefone: string; leadId: string; textoEnviado: string },
): Promise<void> {
  const { error } = await supabase.from('whatsapp_conversas').insert({
    telefone: params.telefone,
    lead_id: params.leadId,
    historico: [{ role: 'assistant', content: params.textoEnviado }],
    status: 'aberta',
  })
  if (error) throw error
}

// --- Envio de template pelo Graph API da Meta ---
//
// Diferente de whatsapp-webhook/db.ts:enviarMensagemWhatsapp (texto
// livre, só funciona dentro da janela de 24h já aberta pelo lead) —
// aqui é SEMPRE um template aprovado, porque é a empresa iniciando a
// conversa. Estrutura confirmada na documentação oficial da Meta
// (Cloud API, template messages): como o botão de resposta rápida do
// template é estático (sem valor dinâmico — ver logica.ts:
// TEMPLATE_CONTATO_INICIAL), o payload não leva nenhum "button"
// component, só "body" com {{1}}. Um component de botão só seria
// necessário se o próprio botão carregasse um valor dinâmico.
//
// Pulado (só logado) sem META_WHATSAPP_TOKEN — mesmo padrão do
// enviarMensagemWhatsapp já existente: chip/WABA ainda é 100% manual do
// usuário, e sem template aprovado pela Meta o envio real falharia de
// qualquer forma.
export async function enviarMensagemTemplate(
  telefone: string,
  params: { nomeTemplate: string; idioma: string; primeiroNome: string },
): Promise<{ enviado: boolean }> {
  const token = Deno.env.get('META_WHATSAPP_TOKEN')
  const phoneNumberId = Deno.env.get('META_PHONE_NUMBER_ID')
  if (!token || !phoneNumberId) {
    console.log(`[dry-run] enviaria template "${params.nomeTemplate}" (${params.idioma}) pro ${telefone}, {{1}}=${params.primeiroNome}`)
    return { enviado: false }
  }
  const resposta = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefone,
      type: 'template',
      template: {
        name: params.nomeTemplate,
        language: { code: params.idioma },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: params.primeiroNome }],
          },
        ],
      },
    }),
  })
  if (!resposta.ok) {
    console.error('Falha ao enviar template via Graph API:', await resposta.text())
    return { enviado: false }
  }
  return { enviado: true }
}
