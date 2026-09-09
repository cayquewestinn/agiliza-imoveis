// Loop de ferramentas com o Claude Haiku 4.5: monta o histórico, chama
// a Anthropic com as 3 ferramentas, executa o que ela pedir e devolve
// o texto final pra responder no WhatsApp.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.32'
import { horariosLivres } from './logica.ts'
import { anotarObservacao, marcarVisita, visitasDoResponsavelNoDia, type Conversa } from './db.ts'

const MODELO = 'claude-haiku-4-5'
const MAX_ITERACOES_FERRAMENTA = 4

// Nunca inventar horário, nunca pedir CPF (recepcao_cpf é opcional no
// banco — quem coleta é a recepção, presencialmente), listas cabem os
// 13 horários do expediente (07h–19h), botões do WhatsApp só cabem 3.
function promptDeSistema(agendadorProfileId: string): string {
  return `Você é a assistente de agendamento de visitas da Agiliza Imóveis, conversando pelo WhatsApp com um lead que já demonstrou interesse.

Regras:
- Seu único objetivo é entender se a pessoa quer marcar uma visita e, se sim, oferecer horários realmente livres e marcar.
- NUNCA invente ou estime um horário livre — sempre use a ferramenta consultar_horarios_livres antes de oferecer qualquer data.
- NUNCA peça CPF, RG ou qualquer documento — isso é coletado presencialmente na recepção.
- Ao oferecer horários, ofereça todos os horários livres do dia perguntado, em formato de lista (o WhatsApp permite até 13 itens numa lista; nunca use botões para isso, botões cabem só 3 opções).
- O responsável por todas as visitas é sempre o mesmo (id ${agendadorProfileId}) — nunca pergunte "com qual corretor".
- Depois de marcar a visita com sucesso, confirme data e horário em uma frase curta.
- Se algo relevante sobre a preferência do lead aparecer na conversa (tipo de imóvel, bairro, orçamento), grave com anotar_observacao.
- Tom cordial e direto, português informal do Brasil, sem emojis em excesso.`
}

const FERRAMENTAS: Anthropic.Tool[] = [
  {
    name: 'consultar_horarios_livres',
    description: 'Lista os horários (07h-19h) que estão realmente livres na agenda para uma data específica.',
    input_schema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Data no formato AAAA-MM-DD' },
      },
      required: ['data'],
    },
  },
  {
    name: 'marcar_visita',
    description: 'Marca a visita na agenda para a data e hora escolhidas pelo lead. Só chamar depois de confirmar o horário com consultar_horarios_livres.',
    input_schema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Data no formato AAAA-MM-DD' },
        hora: { type: 'string', description: 'Hora no formato HH:MM, deve ser um dos horários livres retornados antes' },
        observacao: { type: 'string', description: 'Observação opcional sobre a visita' },
      },
      required: ['data', 'hora'],
    },
  },
  {
    name: 'anotar_observacao',
    description: 'Grava uma observação relevante sobre o lead no cadastro dele (preferências, orçamento, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        texto: { type: 'string' },
      },
      required: ['texto'],
    },
  },
]

export interface ResultadoProcessamento {
  respostaTexto: string
  historicoAtualizado: Conversa['historico']
  visitaId: string | null
}

export async function processarMensagem(
  supabase: SupabaseClient,
  conversa: Conversa,
  textoRecebido: string,
  opts: { anthropicApiKey: string; agendadorProfileId: string },
): Promise<ResultadoProcessamento> {
  const anthropic = new Anthropic({ apiKey: opts.anthropicApiKey })

  const mensagens: Anthropic.MessageParam[] = [
    ...conversa.historico.map(h => ({ role: h.role, content: h.content }) as Anthropic.MessageParam),
    { role: 'user', content: textoRecebido },
  ]

  let visitaIdMarcada: string | null = conversa.visitaId
  let iteracoes = 0

  while (iteracoes < MAX_ITERACOES_FERRAMENTA) {
    iteracoes++
    const resposta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system: promptDeSistema(opts.agendadorProfileId),
      tools: FERRAMENTAS,
      messages: mensagens,
    })

    const blocosDeFerramenta = resposta.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )

    if (blocosDeFerramenta.length === 0) {
      const textoFinal = resposta.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('\n')
      mensagens.push({ role: 'assistant', content: resposta.content })
      return {
        respostaTexto: textoFinal,
        historicoAtualizado: mensagensParaHistorico(mensagens),
        visitaId: visitaIdMarcada,
      }
    }

    mensagens.push({ role: 'assistant', content: resposta.content })

    const resultadosFerramenta: Anthropic.ToolResultBlockParam[] = []
    for (const bloco of blocosDeFerramenta) {
      const resultado = await executarFerramenta(supabase, bloco, conversa, opts.agendadorProfileId)
      if (resultado.visitaId) visitaIdMarcada = resultado.visitaId
      resultadosFerramenta.push({
        type: 'tool_result',
        tool_use_id: bloco.id,
        content: resultado.texto,
      })
    }
    mensagens.push({ role: 'user', content: resultadosFerramenta })
  }

  // Estourou o limite de idas e vindas com ferramenta sem chegar a uma
  // resposta final — não trava a conversa, só devolve algo genérico.
  return {
    respostaTexto: 'Vou verificar direitinho e já te retorno.',
    historicoAtualizado: mensagensParaHistorico(mensagens),
    visitaId: visitaIdMarcada,
  }
}

function mensagensParaHistorico(mensagens: Anthropic.MessageParam[]): Conversa['historico'] {
  // Achata pro formato simples gravado em jsonb — só o necessário pra
  // reconstruir o contexto no próximo turno, sem os blocos de tool_use
  // brutos da SDK (que não precisam sobreviver entre invocações).
  return mensagens.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }))
}

async function executarFerramenta(
  supabase: SupabaseClient,
  bloco: Anthropic.ToolUseBlock,
  conversa: Conversa,
  agendadorProfileId: string,
): Promise<{ texto: string; visitaId?: string }> {
  const input = bloco.input as Record<string, unknown>

  if (bloco.name === 'consultar_horarios_livres') {
    const data = input.data as string
    const visitas = await visitasDoResponsavelNoDia(supabase, agendadorProfileId, data)
    const livres = horariosLivres(data, agendadorProfileId, visitas)
    return { texto: livres.length ? livres.join(', ') : 'Nenhum horário livre nesse dia.' }
  }

  if (bloco.name === 'marcar_visita') {
    if (!conversa.leadId) {
      return { texto: 'Não foi possível identificar o cadastro deste contato para marcar a visita.' }
    }
    const { visitaId } = await marcarVisita(supabase, {
      leadId: conversa.leadId,
      responsavelId: agendadorProfileId,
      data: input.data as string,
      hora: input.hora as string,
      observacao: input.observacao as string | undefined,
    })
    return { texto: 'Visita marcada com sucesso.', visitaId }
  }

  if (bloco.name === 'anotar_observacao') {
    if (!conversa.leadId) return { texto: 'Não foi possível identificar o cadastro deste contato.' }
    await anotarObservacao(supabase, conversa.leadId, input.texto as string)
    return { texto: 'Observação gravada.' }
  }

  return { texto: 'Ferramenta desconhecida.' }
}
