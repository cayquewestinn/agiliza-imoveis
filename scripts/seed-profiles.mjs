// Uso: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-profiles.mjs
// A service role key nunca deve ser commitada nem usada dentro de src/ —
// só aqui, uma vez, pra criar contas novas da equipe.
// Pegue a key no painel do Supabase: Project Settings > API > service_role secret.
//
// SEGURANÇA: este script NUNCA deve conter senhas reais em texto puro.
// Cada conta nova recebe uma senha aleatória gerada na hora, impressa uma
// única vez no terminal — quem rodar o script é responsável por entregar
// essa senha à pessoa certa por um canal seguro (nunca por e-mail/chat aberto)
// e orientar a troca no primeiro acesso. Nada de senha é gravado em arquivo.

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const SUPABASE_URL = 'https://golnjkuocqtpaeyzbemb.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL_DOMAIN = 'agiliza-imoveis.app'

// Adicione aqui apenas os dados de contas NOVAS a criar — nunca inclua "senha".
const TEAM = [
  { nome: 'Elias', cargo: 'Administrador/Agendador', usuario: 'elias', isAdmin: true },
]

function gerarSenhaAleatoria() {
  return randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12)
}

async function run() {
  if (TEAM.length === 0) {
    console.log('Nenhuma conta nova configurada em TEAM. Edite o array antes de rodar.')
    return
  }

  for (const member of TEAM) {
    const email = `${member.usuario}@${EMAIL_DOMAIN}`
    const senha = gerarSenhaAleatoria()
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (createError) {
      console.error(`Falha ao criar usuário ${member.usuario}:`, createError.message)
      continue
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: created.user.id,
      nome: member.nome,
      cargo: member.cargo,
      is_admin: member.isAdmin,
    })

    if (profileError) {
      console.error(`Falha ao criar profile de ${member.usuario}:`, profileError.message)
      continue
    }

    console.log(`OK: ${member.usuario} -> ${email}  |  senha inicial: ${senha}`)
  }
}

run()
