// Wrapper fino: recebe o Database Webhook do Supabase (evento "Insert"
// configurado na tabela leads — Dashboard → Database → Webhooks, passo
// manual do usuário, não é trigger SQL nem toca em código existente),
// valida o segredo compartilhado, filtra pela régua (Parte 2), evita
// duplicidade e dispara o contato inicial por WhatsApp via template
// aprovado (Parte 1). Regra de negócio testável fica em logica.ts;
// aqui só orquestra. Não toca em canalpro-leads-webhook nem em nenhum
// código da whatsapp-webhook já publicada — function nova e isolada
// (Parte 3), gatilho separado do webhook de captação de leads.

import { elegivelParaContatoInicial, extrairLeadInserido, primeiroNome, TEMPLATE_CONTATO_INICIAL, verificarSegredoWebhook } from './logica.ts'
import {
  criarClienteSupabase,
  criarConversaAposContatoInicial,
  enviarMensagemTemplate,
  existeConversaParaTelefone,
} from './db.ts'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Verificação do segredo ANTES de qualquer parsing ou acesso ao banco
  // — mesmo princípio da verificação HMAC do webhook da Meta (ver
  // whatsapp-webhook/index.ts): sem isso, quem descobrisse a URL
  // poderia forjar um "INSERT" falso e fazer a IA mandar mensagem/gravar
  // conversa pra qualquer telefone. Configurar em Database Webhooks →
  // HTTP Headers com a chave `x-db-webhook-secret`, mesmo valor do
  // secret DB_WEBHOOK_SECRET desta function.
  const segredoEsperado = Deno.env.get('DB_WEBHOOK_SECRET')
  if (!segredoEsperado) {
    console.error('DB_WEBHOOK_SECRET não configurado — recusando requisição.')
    return new Response('Server misconfigured', { status: 500 })
  }
  const segredoRecebido = req.headers.get('x-db-webhook-secret')
  if (!verificarSegredoWebhook(segredoRecebido, segredoEsperado)) {
    return new Response('Invalid secret', { status: 401 })
  }

  const payload = await req.json()
  const lead = extrairLeadInserido(payload)
  if (!lead) {
    // Não é um INSERT em leads que reconhecemos — responde 200 pra não
    // o Database Webhook ficar retentando por engano.
    return new Response('OK (ignorado)', { status: 200 })
  }

  if (!elegivelParaContatoInicial(lead.origem)) {
    return new Response('OK (fora da régua)', { status: 200 })
  }

  const supabase = criarClienteSupabase()

  if (await existeConversaParaTelefone(supabase, lead.telefone)) {
    return new Response('OK (já contatado)', { status: 200 })
  }

  const nome = primeiroNome(lead.nome)
  const { enviado } = await enviarMensagemTemplate(lead.telefone, {
    nomeTemplate: TEMPLATE_CONTATO_INICIAL.nome,
    idioma: TEMPLATE_CONTATO_INICIAL.idioma,
    primeiroNome: nome,
  })

  if (!enviado) {
    // Falhou (ou dry-run sem credenciais/template ainda não aprovado)
    // — não cria a conversa, pra não registrar um contato que não
    // aconteceu de verdade.
    return new Response('OK (nao enviado)', { status: 200 })
  }

  await criarConversaAposContatoInicial(supabase, {
    telefone: lead.telefone,
    leadId: lead.id,
    textoEnviado: TEMPLATE_CONTATO_INICIAL.corpo(nome),
  })

  return new Response('OK', { status: 200 })
})
