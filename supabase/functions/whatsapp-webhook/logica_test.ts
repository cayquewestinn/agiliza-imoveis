import { assert, assertEquals } from 'jsr:@std/assert@1'
import {
  extrairMensagem,
  horariosLivres,
  mensagemJaProcessada,
  verificarAssinatura,
} from './logica.ts'

Deno.test('horariosLivres exclui slot dentro de 60 min de uma visita Agendada', () => {
  const livres = horariosLivres('2026-09-10', 'resp-1', [
    { data: '2026-09-10', hora: '10:00', responsavelId: 'resp-1', status: 'Agendada' },
  ])
  assert(!livres.includes('10:00'))
  assert(!livres.includes('09:30')) // dentro dos 60 min, mesmo não sendo slot cheio
  assert(livres.includes('09:00'))
  assert(livres.includes('11:00'))
})

Deno.test('horariosLivres ignora visita de outro responsável ou outro dia', () => {
  const livres = horariosLivres('2026-09-10', 'resp-1', [
    { data: '2026-09-10', hora: '10:00', responsavelId: 'resp-2', status: 'Agendada' },
    { data: '2026-09-11', hora: '10:00', responsavelId: 'resp-1', status: 'Agendada' },
  ])
  assert(livres.includes('10:00'))
})

Deno.test('horariosLivres ignora visita Não Compareceu/Remarcada (não bloqueia o slot)', () => {
  const livres = horariosLivres('2026-09-10', 'resp-1', [
    { data: '2026-09-10', hora: '10:00', responsavelId: 'resp-1', status: 'Remarcada' },
  ])
  assert(livres.includes('10:00'))
})

Deno.test('extrairMensagem lê mensagem de texto', () => {
  const payload = {
    entry: [{ changes: [{ value: { messages: [{ from: '5511987654321', id: 'wamid.1', timestamp: '123', type: 'text', text: { body: 'Oi' } }] } }] }],
  }
  const msg = extrairMensagem(payload)
  assertEquals(msg?.telefone, '5511987654321')
  assertEquals(msg?.texto, 'Oi')
  assertEquals(msg?.mensagemId, 'wamid.1')
})

Deno.test('extrairMensagem lê resposta de lista interativa', () => {
  const payload = {
    entry: [{ changes: [{ value: { messages: [{ from: '5511987654321', id: 'wamid.2', type: 'interactive', interactive: { list_reply: { title: '14:00' } } }] } }] }],
  }
  const msg = extrairMensagem(payload)
  assertEquals(msg?.texto, '14:00')
})

Deno.test('extrairMensagem retorna null sem mensagem', () => {
  assertEquals(extrairMensagem({ entry: [{ changes: [{ value: {} }] }] }), null)
})

Deno.test('mensagemJaProcessada detecta reentrega', () => {
  assert(mensagemJaProcessada('wamid.1', 'wamid.1'))
  assert(!mensagemJaProcessada('wamid.2', 'wamid.1'))
  assert(!mensagemJaProcessada('wamid.1', null))
})

Deno.test('verificarAssinatura aceita assinatura correta e rejeita errada/ausente', async () => {
  const secret = 'segredo-de-teste'
  const corpo = JSON.stringify({ a: 1 })
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(corpo))
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')

  assert(await verificarAssinatura(corpo, `sha256=${hex}`, secret))
  assert(!(await verificarAssinatura(corpo, 'sha256=0000', secret)))
  assert(!(await verificarAssinatura(corpo, null, secret)))
  assert(!(await verificarAssinatura(corpo, `sha256=${hex}`, 'segredo-errado')))
})
