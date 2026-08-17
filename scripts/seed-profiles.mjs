// Uso: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-profiles.mjs
// A service role key nunca deve ser commitada nem usada dentro de src/ —
// só aqui, uma vez, pra criar as contas iniciais da equipe.
// Pegue a key no painel do Supabase: Project Settings > API > service_role secret.

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

const EMAIL_DOMAIN = 'agiliza-imoveis.app'

const TEAM = [
  { nome: 'Cayque', cargo: 'Administrador/Agendador', usuario: 'cayque', senha: 'cayque123', isAdmin: true },
  { nome: 'Stefanie', cargo: 'Agendador', usuario: 'stefanie', senha: 'stefanie123', isAdmin: false },
  { nome: 'Scarlett', cargo: 'Agendador', usuario: 'scarlett', senha: 'scarlett123', isAdmin: false },
  { nome: 'Gilmar', cargo: 'Agendador', usuario: 'gilmar', senha: 'gilmar123', isAdmin: false },
  { nome: 'Raissa', cargo: 'Vendedor', usuario: 'raissa', senha: 'raissa123', isAdmin: false },
  { nome: 'Ramon', cargo: 'Vendedor', usuario: 'ramon', senha: 'ramon123', isAdmin: false },
  { nome: 'Vitória', cargo: 'Vendedor', usuario: 'vitoria', senha: 'vitoria123', isAdmin: false },
]

async function run() {
  for (const member of TEAM) {
    const email = `${member.usuario}@${EMAIL_DOMAIN}`
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: member.senha,
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

    console.log(`OK: ${member.usuario} -> ${email}`)
  }
}

run()
