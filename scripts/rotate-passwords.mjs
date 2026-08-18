// Uso: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/rotate-passwords.mjs
//
// Troca a senha de TODAS as contas da equipe por uma senha aleatória nova,
// e imprime cada uma uma única vez no terminal — nada é salvo em arquivo.
// Rode isso porque as senhas antigas (cayque123, stefanie123, etc.) ficaram
// em texto puro no histórico do git em algum momento e precisam ser
// consideradas comprometidas, mesmo que o repositório nunca tenha sido
// publicado num servidor remoto.
//
// Depois de rodar: entregue cada senha à pessoa certa por um canal seguro
// (nunca e-mail ou chat aberto) e oriente a troca no primeiro acesso.

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
const USUARIOS = ['cayque', 'stefanie', 'scarlett', 'gilmar', 'raissa', 'ramon', 'vitoria']

function gerarSenhaAleatoria() {
  return randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12)
}

async function run() {
  const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    console.error('Falha ao listar usuários:', listError.message)
    process.exit(1)
  }

  for (const usuario of USUARIOS) {
    const email = `${usuario}@${EMAIL_DOMAIN}`
    const user = usersPage.users.find(u => u.email === email)
    if (!user) {
      console.error(`Usuário não encontrado: ${email}`)
      continue
    }

    const novaSenha = gerarSenhaAleatoria()
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: novaSenha })

    if (updateError) {
      console.error(`Falha ao trocar senha de ${usuario}:`, updateError.message)
      continue
    }

    console.log(`OK: ${usuario} -> nova senha: ${novaSenha}`)
  }
}

run()
