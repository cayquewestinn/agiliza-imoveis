import { assert, assertEquals } from 'jsr:@std/assert@1'
import {
  elegivelParaContatoInicial,
  extrairLeadInserido,
  primeiroNome,
  TEMPLATE_CONTATO_INICIAL,
  verificarSegredoWebhook,
} from './logica.ts'

Deno.test('elegivelParaContatoInicial aceita as 3 origens da régua', () => {
  assert(elegivelParaContatoInicial('CLICK_WHATSAPP'))
  assert(elegivelParaContatoInicial('CONTACT_FORM'))
  assert(elegivelParaContatoInicial('CONTACT_CHAT'))
})

Deno.test('elegivelParaContatoInicial rejeita PHONE_VIEW e Prospectado', () => {
  assert(!elegivelParaContatoInicial('PHONE_VIEW'))
  assert(!elegivelParaContatoInicial('Prospectado'))
})

Deno.test('elegivelParaContatoInicial rejeita origem vazia, nula ou desconhecida', () => {
  assert(!elegivelParaContatoInicial(''))
  assert(!elegivelParaContatoInicial(null))
  assert(!elegivelParaContatoInicial(undefined))
  assert(!elegivelParaContatoInicial('ALGO_NOVO_DO_CANAL_PRO'))
})

Deno.test('elegivelParaContatoInicial é sensível a maiúsculas (código bruto do Canal Pro, não rótulo)', () => {
  assert(!elegivelParaContatoInicial('click_whatsapp'))
})

Deno.test('primeiroNome extrai o primeiro nome e apara espaços', () => {
  assertEquals(primeiroNome('Maria da Silva'), 'Maria')
  assertEquals(primeiroNome('  João   Pedro'), 'João')
  assertEquals(primeiroNome('Ana'), 'Ana')
})

Deno.test('TEMPLATE_CONTATO_INICIAL.corpo monta o texto com o nome no lugar certo', () => {
  assertEquals(
    TEMPLATE_CONTATO_INICIAL.corpo('Ana'),
    'Olá Ana! Aqui é da Agiliza Imóveis. Vimos que você demonstrou interesse em um dos nossos imóveis e adoraríamos te ajudar a agendar uma visita. Podemos conversar?',
  )
})

Deno.test('extrairLeadInserido lê um INSERT válido em leads', () => {
  const payload = {
    type: 'INSERT',
    table: 'leads',
    schema: 'public',
    record: { id: 'lead-1', nome: 'Ana Souza', telefone: '5511987654321', origem: 'CLICK_WHATSAPP' },
    old_record: null,
  }
  const lead = extrairLeadInserido(payload)
  assertEquals(lead?.id, 'lead-1')
  assertEquals(lead?.nome, 'Ana Souza')
  assertEquals(lead?.telefone, '5511987654321')
  assertEquals(lead?.origem, 'CLICK_WHATSAPP')
})

Deno.test('extrairLeadInserido ignora UPDATE/DELETE e tabela errada', () => {
  assertEquals(extrairLeadInserido({ type: 'UPDATE', table: 'leads', record: { id: '1', telefone: 'x' } }), null)
  assertEquals(extrairLeadInserido({ type: 'DELETE', table: 'leads', record: { id: '1', telefone: 'x' } }), null)
  assertEquals(extrairLeadInserido({ type: 'INSERT', table: 'visitas', record: { id: '1', telefone: 'x' } }), null)
})

Deno.test('extrairLeadInserido retorna null sem id ou telefone no record', () => {
  assertEquals(extrairLeadInserido({ type: 'INSERT', table: 'leads', record: { nome: 'Ana' } }), null)
  assertEquals(extrairLeadInserido({ type: 'INSERT', table: 'leads', record: { id: '1' } }), null)
  assertEquals(extrairLeadInserido({ type: 'INSERT', table: 'leads' }), null)
})

Deno.test('extrairLeadInserido preenche nome/origem vazios quando ausentes no record', () => {
  const lead = extrairLeadInserido({ type: 'INSERT', table: 'leads', record: { id: '1', telefone: '5511999999999' } })
  assertEquals(lead?.nome, '')
  assertEquals(lead?.origem, '')
})

Deno.test('verificarSegredoWebhook aceita igual e rejeita diferente/ausente', () => {
  assert(verificarSegredoWebhook('segredo-123', 'segredo-123'))
  assert(!verificarSegredoWebhook('segredo-errado', 'segredo-123'))
  assert(!verificarSegredoWebhook(null, 'segredo-123'))
  assert(!verificarSegredoWebhook('', 'segredo-123'))
})
