// Wrapper fino: só cuida do protocolo HTTP/webhook da Meta. Toda regra
// de negócio testável fica em logica.ts; tudo que toca banco/API
// externa fica em db.ts e orquestrador.ts.

import { extrairMensagem, mensagemJaProcessada, verificarAssinatura } from './logica.ts'
import { atualizarConversa, buscarOuCriarConversa, criarClienteSupabase, enviarMensagemWhatsapp } from './db.ts'
import { processarMensagem } from './orquestrador.ts'

const JANELA_24H_MS = 24 * 60 * 60 * 1000

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)

  // Handshake de verificação do webhook (GET, chamado uma vez pela Meta
  // ao configurar a URL do webhook).
  if (req.method === 'GET') {
    const modo = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const desafio = url.searchParams.get('hub.challenge')
    const tokenEsperado = Deno.env.get('META_VERIFY_TOKEN')
    if (modo === 'subscribe' && token === tokenEsperado && desafio) {
      return new Response(desafio, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const corpoBruto = await req.text()

  // Verificação de assinatura ANTES de qualquer parsing ou acesso ao
  // banco — sem isso, qualquer um que descubra a URL pode forjar
  // mensagens e fazer a IA marcar visitas/gravar observações falsas.
  const appSecret = Deno.env.get('META_APP_SECRET')
  if (!appSecret) {
    console.error('META_APP_SECRET não configurado — recusando requisição.')
    return new Response('Server misconfigured', { status: 500 })
  }
  const assinaturaValida = await verificarAssinatura(
    corpoBruto,
    req.headers.get('x-hub-signature-256'),
    appSecret,
  )
  if (!assinaturaValida) {
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(corpoBruto)
  const mensagem = extrairMensagem(payload)
  if (!mensagem) {
    // Não é uma mensagem de usuário (pode ser status de entrega, etc.)
    // — responde 200 pra Meta não ficar reentregando.
    return new Response('OK', { status: 200 })
  }

  const supabase = criarClienteSupabase()
  const conversa = await buscarOuCriarConversa(supabase, mensagem.telefone)

  if (mensagemJaProcessada(mensagem.mensagemId, conversa.ultimaMensagemId)) {
    return new Response('OK (duplicada)', { status: 200 })
  }

  const agendadorProfileId = Deno.env.get('AGENDADOR_PROFILE_ID')
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!agendadorProfileId || !anthropicApiKey) {
    console.error('AGENDADOR_PROFILE_ID ou ANTHROPIC_API_KEY não configurados.')
    return new Response('Server misconfigured', { status: 500 })
  }

  const resultado = await processarMensagem(supabase, conversa, mensagem.texto, {
    anthropicApiKey,
    agendadorProfileId,
  })

  await enviarMensagemWhatsapp(mensagem.telefone, resultado.respostaTexto)

  await atualizarConversa(supabase, conversa.id, {
    historico: resultado.historicoAtualizado,
    janelaExpiraEm: new Date(Date.now() + JANELA_24H_MS).toISOString(),
    ultimaMensagemId: mensagem.mensagemId,
    ...(resultado.visitaId ? { visitaId: resultado.visitaId, status: 'concluida' } : {}),
  })

  return new Response('OK', { status: 200 })
})
