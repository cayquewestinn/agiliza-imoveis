// Uso: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/remove-profiles.mjs
// A service role key nunca deve ser commitada nem usada dentro de src/ —
// só aqui, uma vez, pra remover contas da equipe.
// Pegue a key no painel do Supabase: Project Settings > API > service_role secret.
//
// profiles.id referencia auth.users.id com ON DELETE CASCADE (conferido em
// 03/09/2026): apagar a conta de auth já remove a linha de profiles junto,
// não precisa de dois passos. Antes de remover, o script confere se a pessoa
// tem leads, tarefas ou visitas atribuídos e recusa a remoção nesse caso —
// listar como responsável em qualquer um desses lugares deixaria referências
// quebradas (o nome "some" da tela, mas o registro antigo fica sem dono).

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://golnjkuocqtpaeyzbemb.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Adicione aqui apenas os nomes exatos (coluna profiles.nome) das contas a remover.
const REMOVER = ['Gustavo', 'Ramon']

async function contaVinculos(id) {
  const [leadsVendedor, leadsAgendador, tarefas, visitas] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('vendedor_id', id),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('agendador_id', id),
    supabase.from('tarefas').select('id', { count: 'exact', head: true }).eq('responsavel_id', id),
    supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('responsavel_id', id),
  ])
  return {
    leadsVendedor: leadsVendedor.count ?? 0,
    leadsAgendador: leadsAgendador.count ?? 0,
    tarefas: tarefas.count ?? 0,
    visitas: visitas.count ?? 0,
  }
}

async function run() {
  if (REMOVER.length === 0) {
    console.log('Nenhum nome configurado em REMOVER. Edite o array antes de rodar.')
    return
  }

  for (const nome of REMOVER) {
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, nome, cargo')
      .eq('nome', nome)
      .maybeSingle()

    if (findError) {
      console.error(`Falha ao buscar ${nome}:`, findError.message)
      continue
    }
    if (!profile) {
      console.error(`Nenhum profile encontrado com nome "${nome}". Nada foi removido.`)
      continue
    }

    const vinculos = await contaVinculos(profile.id)
    const totalVinculos = vinculos.leadsVendedor + vinculos.leadsAgendador + vinculos.tarefas + vinculos.visitas
    if (totalVinculos > 0) {
      console.error(
        `RECUSADO: ${nome} (${profile.cargo}) tem vínculos — ` +
        `${vinculos.leadsVendedor} lead(s) como vendedor, ${vinculos.leadsAgendador} como agendador, ` +
        `${vinculos.tarefas} tarefa(s), ${vinculos.visitas} visita(s). Remova ou reatribua antes de excluir a conta.`
      )
      continue
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(profile.id)
    if (deleteError) {
      console.error(`Falha ao remover ${nome}:`, deleteError.message)
      continue
    }

    console.log(`OK: ${nome} (${profile.cargo}) removido — conta de login e profile excluídos.`)
  }
}

run()
