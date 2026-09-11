// Loop de ferramentas com o Claude Haiku 4.5: monta o histórico, chama
// a Anthropic com as 3 ferramentas, executa o que ela pedir e devolve
// o texto final pra responder no WhatsApp.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.32'
import { escolherVendedor, horariosDoExpediente, horariosLivres, limitesDaSemana } from './logica.ts'
import {
  anotarObservacao,
  contagemVisitasAgendadasNaSemana,
  listarVendedores,
  marcarVisita,
  visitasDoResponsavelNoDia,
  type Conversa,
} from './db.ts'

const MODELO = 'claude-haiku-4-5'
const MAX_ITERACOES_FERRAMENTA = 4

// Nunca inventar horário, nunca pedir CPF (recepcao_cpf é opcional no
// banco — quem coleta é a recepção, presencialmente), listas cabem os
// 13 horários do expediente (07h–19h), botões do WhatsApp só cabem 3.
// Quem atende é sempre um Vendedor (agendadores não atendem
// presencialmente — decisão de produto), sorteado entre os livres no
// horário; o nome vem pronto no resultado de marcar_visita.
function promptDeSistema(): string {
  return `Você é a assistente de agendamento de visitas da Agiliza Imóveis, conversando pelo WhatsApp com um lead que já demonstrou interesse.

Regras:
- Seu único objetivo é entender se a pessoa quer marcar uma visita e, se sim, oferecer horários realmente livres e marcar.
- NUNCA invente ou estime um horário livre — sempre use a ferramenta consultar_horarios_livres antes de oferecer qualquer data.
- NUNCA peça CPF, RG ou qualquer documento — isso é coletado presencialmente na recepção.
- Ao oferecer horários, ofereça todos os horários livres do dia perguntado, em formato de lista (o WhatsApp permite até 13 itens numa lista; nunca use botões para isso, botões cabem só 3 opções).
- Não pergunte "com qual corretor" — quem vai atender é decidido só na hora de marcar.
- Depois de marcar a visita com sucesso, sempre informe ao lead quem vai atendê-lo, usando exatamente o nome que veio no resultado da ferramenta marcar_visita — nunca invente ou omita esse nome. Confirme data e horário na mesma frase.
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
  // Nome do campo (opts.agendadorProfileId) e do secret (AGENDADOR_PROFILE_ID)
  // continuam os mesmos por compatibilidade com index.ts — só o SENTIDO
  // de uso mudou: não é mais "quem atende toda visita", é só a
  // assinatura fixa de visitas.criado_por quando quem marcou foi a IA.
  const criadoPorAutomacaoId = opts.agendadorProfileId

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
      system: promptDeSistema(),
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
      const resultado = await executarFerramenta(supabase, bloco, conversa, criadoPorAutomacaoId)
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
  criadoPorAutomacaoId: string,
): Promise<{ texto: string; visitaId?: string }> {
  const input = bloco.input as Record<string, unknown>

  if (bloco.name === 'consultar_horarios_livres') {
    const data = input.data as string
    const vendedores = await listarVendedores(supabase)
    if (vendedores.length === 0) {
      return { texto: 'Nenhum vendedor disponível para atender no momento.' }
    }
    const visitas = await visitasDoResponsavelNoDia(supabase, vendedores.map(v => v.id), data)
    const livresPorVendedor = new Map(vendedores.map(v => [v.id, new Set(horariosLivres(data, v.id, visitas))]))
    // União: um horário aparece se PELO MENOS UM vendedor estiver livre
    // nele. horariosDoExpediente() já vem em ordem cronológica.
    const uniao = horariosDoExpediente().filter(slot =>
      vendedores.some(v => livresPorVendedor.get(v.id)!.has(slot))
    )
    return { texto: uniao.length ? uniao.join(', ') : 'Nenhum horário livre nesse dia.' }
  }

  if (bloco.name === 'marcar_visita') {
    if (!conversa.leadId) {
      return { texto: 'Não foi possível identificar o cadastro deste contato para marcar a visita.' }
    }
    const data = input.data as string
    const hora = input.hora as string

    const vendedores = await listarVendedores(supabase)
    if (vendedores.length === 0) {
      return { texto: 'Nenhum vendedor disponível para atender no momento.' }
    }

    // Recalcula quem está livre EXATAMENTE nesse horário — pode ter
    // mudado desde a última consulta (outra conversa marcou antes).
    const visitas = await visitasDoResponsavelNoDia(supabase, vendedores.map(v => v.id), data)
    const livresNoHorario = vendedores.filter(v => horariosLivres(data, v.id, visitas).includes(hora))

    if (livresNoHorario.length === 0) {
      return {
        texto: 'Esse horário acabou de ficar indisponível (outra visita foi marcada primeiro). Consulte os horários livres de novo antes de tentar marcar.',
      }
    }

    let escolhido: { id: string; nome: string }
    if (livresNoHorario.length === 1) {
      escolhido = livresNoHorario[0]
    } else {
      const limites = limitesDaSemana(data)
      const contagem = await contagemVisitasAgendadasNaSemana(supabase, livresNoHorario.map(v => v.id), limites)
      escolhido = escolherVendedor(
        livresNoHorario.map(v => ({ id: v.id, nome: v.nome, visitasNaSemana: contagem[v.id] ?? 0 })),
      )
    }

    const { visitaId } = await marcarVisita(supabase, {
      leadId: conversa.leadId,
      responsavelId: escolhido.id,
      criadoPor: criadoPorAutomacaoId,
      data,
      hora,
      observacao: input.observacao as string | undefined,
    })
    return { texto: `Visita marcada com sucesso. Você será atendido(a) por ${escolhido.nome}.`, visitaId }
  }

  if (bloco.name === 'anotar_observacao') {
    if (!conversa.leadId) return { texto: 'Não foi possível identificar o cadastro deste contato.' }
    await anotarObservacao(supabase, conversa.leadId, input.texto as string)
    return { texto: 'Observação gravada.' }
  }

  return { texto: 'Ferramenta desconhecida.' }
}
