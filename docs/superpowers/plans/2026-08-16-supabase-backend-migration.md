# Migração do Backend para Supabase — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o estado em memória do Agiliza Leilões (React Context) por um backend real no Supabase — schema Postgres com índices e RLS, autenticação real (Supabase Auth), e Realtime na Agenda de Visitas — sem quebrar nenhuma tela já construída.

**Architecture:** Cada Context (`Tasks`, `Lotes`, `Leads`, `Visits`, `User`) mantém a mesma API pública que as telas já consomem (`useTasks()`, `useLotes()`, etc.); só o que acontece por dentro muda, de `useState` local pra chamadas ao Supabase. Um novo `ProfilesContext` substitui o array estático `TEAM_MEMBERS`. `VisitsContext` ganha uma assinatura Realtime.

**Tech Stack:** React 19, Vite, `@supabase/supabase-js`, Postgres 17 (Supabase), Supabase Auth.

**Spec:** `agiliza-leiloes/docs/superpowers/specs/2026-08-16-supabase-backend-migration-design.md`

## Global Constraints

- Projeto Supabase já existe: `golnjkuocqtpaeyzbemb` (`cayquewestinn's Project`, Postgres 17, região us-east-2). Todas as tarefas de banco usam esse `project_id`.
- **Este projeto não tem framework de testes configurado** (nenhum Jest/Vitest, confirmado no `package.json`). Em vez de inventar uma suíte de testes que não existe, cada tarefa é verificada do jeito que este projeto já verifica tudo: `npm run lint` limpo, uma consulta real via a MCP tool `execute_sql` pra tarefas de banco, e um teste ao vivo no navegador (login real, criar/editar/excluir um registro, conferir no Supabase) pra tarefas de React. Isso é mencionado uma vez aqui — não repita "sem framework de testes" em cada tarefa.
- Nunca commitar a `service_role key`. Ela só é usada uma vez, via variável de ambiente, no script de seed (Tarefa 4) — nunca dentro de `src/`.
- `responsavel` (tarefas) e `responsavel` (visitas) deixam de ser texto solto (nome) e viram `responsavel_id` (uuid, FK pra `profiles`) em todo o código React — isso é intencional, é a correção central desta migração.
- Datas: `visitas.data` e `lotes.data_leilao` já são consumidas em formato ISO (`YYYY-MM-DD`) pelo código atual — nenhuma conversão necessária. Só `tarefas.prazo` usa formato brasileiro (`DD/MM/AAAA`) no restante do app — a conversão ISO↔BR fica isolada dentro de `TasksContext.jsx`, pra não precisar tocar em `taskHelpers.js`, `Dashboard.jsx`, `MinhasTarefas.jsx` nem `TaskModal.jsx`.
- IDs viram `uuid` (string) em vez de `number` — todo `Number(id)` que existir no código atual precisa sumir.

---

### Tarefa 1: Schema — tabelas e índices

**Files:**
- Nenhum arquivo local — SQL executado direto no projeto Supabase via MCP.

**Interfaces:**
- Produces: tabelas `public.profiles`, `public.lotes`, `public.leads`, `public.tarefas`, `public.visitas` com as colunas exatas listadas abaixo. Toda tarefa seguinte depende destes nomes de coluna.

- [ ] **Passo 1: Rodar o SQL de criação das tabelas**

Use a MCP tool `mcp__plugin_supabase_supabase__execute_sql` com `project_id: "golnjkuocqtpaeyzbemb"` e este SQL:

```sql
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  cargo text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  titulo text not null,
  tipo_imovel text not null check (tipo_imovel in ('Residencial','Comercial')),
  endereco text,
  bairro text,
  cidade text,
  uf text,
  area_util numeric,
  quartos int not null default 0,
  banheiros int not null default 0,
  vagas int not null default 0,
  valor_avaliacao numeric not null default 0,
  lance_inicial numeric not null default 0,
  status text not null default 'Rascunho' check (status in ('Rascunho','Publicado','Em Leilão','Arrematado','Suspenso','Cancelado')),
  data_leilao date,
  comitente text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid references public.lotes(id) on delete cascade,
  nome text not null,
  telefone text not null,
  etapa text not null default 'Novo' check (etapa in ('Novo','Em Atendimento','Em Visita','Em Proposta','Convertido','Perdido')),
  origem text,
  data_recebimento date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  status text not null default 'A Fazer' check (status in ('A Fazer','Em Andamento','Concluído')),
  prazo date not null,
  responsavel_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.visitas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('imovel','empresa')),
  lote_id uuid references public.lotes(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  data date not null,
  hora time not null,
  responsavel_id uuid not null references public.profiles(id),
  status text not null default 'Agendada' check (status in ('Agendada','Realizada','Não Compareceu','Remarcada')),
  recepcao_nome_completo text,
  recepcao_cpf text,
  recepcao_telefone text,
  created_at timestamptz not null default now()
);

create index idx_tarefas_responsavel_id on public.tarefas(responsavel_id);
create index idx_tarefas_status on public.tarefas(status);
create index idx_tarefas_prazo on public.tarefas(prazo);
create index idx_tarefas_responsavel_status on public.tarefas(responsavel_id, status);
create index idx_lotes_status on public.lotes(status);
create index idx_leads_lote_id on public.leads(lote_id);
create index idx_visitas_status on public.visitas(status);
create index idx_visitas_data_hora on public.visitas(data, hora);
create index idx_visitas_lote_id on public.visitas(lote_id);
create index idx_visitas_lead_id on public.visitas(lead_id);
```

- [ ] **Passo 2: Verificar**

Rode `mcp__plugin_supabase_supabase__list_tables` com `project_id: "golnjkuocqtpaeyzbemb"`, `schemas: ["public"]`, `verbose: true`. Confirme que aparecem exatamente 5 tabelas (`profiles`, `lotes`, `leads`, `tarefas`, `visitas`) com as colunas listadas acima, e que `tarefas.responsavel_id` e `visitas.responsavel_id`/`lote_id`/`lead_id` aparecem como foreign keys.

---

### Tarefa 2: RLS, função `is_admin()` e Realtime

**Files:**
- Nenhum arquivo local — SQL via MCP.

**Interfaces:**
- Consumes: as 5 tabelas da Tarefa 1.
- Produces: RLS habilitado + policies em todas as tabelas; função `public.is_admin()`; `visitas` na publicação `supabase_realtime`.

- [ ] **Passo 1: Rodar o SQL de RLS**

`execute_sql` com `project_id: "golnjkuocqtpaeyzbemb"`:

```sql
alter table public.profiles enable row level security;
alter table public.lotes enable row level security;
alter table public.leads enable row level security;
alter table public.tarefas enable row level security;
alter table public.visitas enable row level security;

create function public.is_admin()
returns boolean
language sql
security invoker
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create policy "profiles_select_all" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "lotes_select_all" on public.lotes for select to authenticated using (true);
create policy "lotes_insert_all" on public.lotes for insert to authenticated with check (true);
create policy "lotes_update_all" on public.lotes for update to authenticated using (true) with check (true);
create policy "lotes_delete_all" on public.lotes for delete to authenticated using (true);

create policy "leads_select_all" on public.leads for select to authenticated using (true);
create policy "leads_insert_all" on public.leads for insert to authenticated with check (true);
create policy "leads_update_all" on public.leads for update to authenticated using (true) with check (true);
create policy "leads_delete_all" on public.leads for delete to authenticated using (true);

create policy "visitas_select_all" on public.visitas for select to authenticated using (true);
create policy "visitas_insert_all" on public.visitas for insert to authenticated with check (true);
create policy "visitas_update_all" on public.visitas for update to authenticated using (true) with check (true);
create policy "visitas_delete_all" on public.visitas for delete to authenticated using (true);

create policy "tarefas_select_own_or_admin" on public.tarefas for select to authenticated using (public.is_admin() or responsavel_id = auth.uid());
create policy "tarefas_insert_own_or_admin" on public.tarefas for insert to authenticated with check (public.is_admin() or responsavel_id = auth.uid());
create policy "tarefas_update_own_or_admin" on public.tarefas for update to authenticated using (public.is_admin() or responsavel_id = auth.uid()) with check (public.is_admin() or responsavel_id = auth.uid());
create policy "tarefas_delete_own_or_admin" on public.tarefas for delete to authenticated using (public.is_admin() or responsavel_id = auth.uid());

alter publication supabase_realtime add table public.visitas;
```

- [ ] **Passo 2: Rodar os advisors de segurança**

Rode `mcp__plugin_supabase_supabase__get_advisors` com `project_id: "golnjkuocqtpaeyzbemb"`, `type: "security"`. Confirme que não aparece nenhum aviso "RLS disabled" pra nenhuma das 5 tabelas. Se aparecer algum outro aviso não previsto aqui, pare e reporte antes de continuar — não ignore.

---

### Tarefa 3: Cliente Supabase e variáveis de ambiente

**Files:**
- Modify: `package.json` (adiciona dependência)
- Create: `src/lib/supabaseClient.js`
- Create: `.env.example`
- Create: `.env.local` (não commitado — coberto por `*.local` no `.gitignore`)

**Interfaces:**
- Produces: `supabase` (cliente exportado de `src/lib/supabaseClient.js`), usado por toda tarefa seguinte.

- [ ] **Passo 1: Instalar a dependência**

```bash
cd agiliza-leiloes
npm install @supabase/supabase-js
```

- [ ] **Passo 2: Pegar a URL e a publishable key do projeto**

Rode `mcp__plugin_supabase_supabase__get_project_url` com `project_id: "golnjkuocqtpaeyzbemb"` e `mcp__plugin_supabase_supabase__get_publishable_keys` com o mesmo `project_id`. Anote os dois valores retornados.

- [ ] **Passo 3: Criar `.env.example`**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Passo 4: Criar `.env.local` com os valores reais**

```
VITE_SUPABASE_URL=<url do Passo 2>
VITE_SUPABASE_ANON_KEY=<publishable key do Passo 2>
```

- [ ] **Passo 5: Criar `src/lib/supabaseClient.js`**

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Passo 6: Verificar**

Rode `npm run lint` — deve continuar limpo (só os avisos de fast-refresh já conhecidos dos outros arquivos `*Context.jsx`). Confirme que `.env.local` **não** aparece em `git status` (deve estar ignorado).

- [ ] **Passo 7: Commit**

```bash
git add package.json package-lock.json src/lib/supabaseClient.js .env.example
git commit -m "feat: add Supabase client setup"
```

---

### Tarefa 4: Provisionar as contas da equipe (Auth + profiles)

**Files:**
- Create: `scripts/seed-profiles.mjs`

**Interfaces:**
- Consumes: tabela `profiles` (Tarefa 1), cliente `@supabase/supabase-js` (já é dependência após a Tarefa 3).
- Produces: 7 usuários em `auth.users` + 7 linhas em `public.profiles`, um por membro de `TEAM_MEMBERS` (`src/utils/teamHelpers.js`).

- [ ] **Passo 1: Criar `scripts/seed-profiles.mjs`**

```js
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
```

- [ ] **Passo 2: Rodar o script**

Peça a `service_role key` pro usuário (Project Settings > API no painel Supabase) e rode:

```bash
cd agiliza-leiloes
SUPABASE_SERVICE_ROLE_KEY=<a key> node scripts/seed-profiles.mjs
```

Confirme que apareceram 7 linhas `OK: <usuario> -> <email>` sem nenhum `Falha ao criar`.

- [ ] **Passo 3: Verificar no banco**

`execute_sql` com `project_id: "golnjkuocqtpaeyzbemb"`:

```sql
select p.nome, p.cargo, p.is_admin, u.email
from public.profiles p
join auth.users u on u.id = p.id
order by p.nome;
```

Confirme 7 linhas, `cayque@agiliza-imoveis.app` com `is_admin = true` e os outros 6 com `is_admin = false`.

- [ ] **Passo 4: Commit**

```bash
git add scripts/seed-profiles.mjs
git commit -m "feat: add team account provisioning script"
```

---

### Tarefa 5: `ProfilesContext`

**Files:**
- Create: `src/context/ProfilesContext.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `supabase` de `src/lib/supabaseClient.js`; tabela `profiles` populada (Tarefa 4).
- Produces: `useProfiles()` retornando `{ profiles, loading }`, onde cada item de `profiles` é `{ id, nome, cargo, is_admin }`. Usado pelas Tarefas 7 e 10.

- [ ] **Passo 1: Criar `src/context/ProfilesContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ProfilesContext = createContext(null)

export function ProfilesProvider({ children }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('profiles')
      .select('id, nome, cargo, is_admin')
      .order('nome', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Erro ao carregar profiles:', error)
          setProfiles([])
        } else {
          setProfiles(data)
        }
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <ProfilesContext.Provider value={{ profiles, loading }}>
      {children}
    </ProfilesContext.Provider>
  )
}

export function useProfiles() {
  const context = useContext(ProfilesContext)
  if (!context) throw new Error('useProfiles deve ser usado dentro de um ProfilesProvider')
  return context
}
```

- [ ] **Passo 2: Modificar `src/App.jsx`**

Adicione o import e envolva a árvore de providers com `ProfilesProvider`, logo dentro de `UserProvider`:

```jsx
import { ProfilesProvider } from './context/ProfilesContext'
```

```jsx
    <ThemeProvider>
      <UserProvider>
        <ProfilesProvider>
          <TasksProvider>
            <LotesProvider>
              <LeadsProvider>
                <VisitsProvider>
                  <AppShell />
                </VisitsProvider>
              </LeadsProvider>
            </LotesProvider>
          </TasksProvider>
        </ProfilesProvider>
      </UserProvider>
    </ThemeProvider>
```

- [ ] **Passo 3: Verificar**

`npm run lint` limpo. Depois, com o app ainda usando o login antigo (a Tarefa 6 troca isso), não dá pra testar via UI ainda — confirme só que o app continua subindo sem erro no console (`npm run dev`, abrir no navegador, checar console). O teste de verdade do `ProfilesContext` acontece nas Tarefas 7 e 10, quando os dropdowns de responsável passam a depender dele.

- [ ] **Passo 4: Commit**

```bash
git add src/context/ProfilesContext.jsx src/App.jsx
git commit -m "feat: add ProfilesContext backed by Supabase"
```

---

### Tarefa 6: `UserContext` com Supabase Auth de verdade

**Files:**
- Modify: `src/context/UserContext.jsx` (reescrita completa)
- Modify: `src/views/Login.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `supabase.auth`, tabela `profiles`.
- Produces: `useUser()` retornando `{ currentUser, login, logout, isAdmin, loading }`, onde `login(usuario, senha)` agora é **assíncrona** (`Promise<boolean>`) e `currentUser` é `{ id, nome, cargo, is_admin }` (antes vinha de `TEAM_MEMBERS`, agora vem de `profiles`).

- [ ] **Passo 1: Reescrever `src/context/UserContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const UserContext = createContext(null)

const EMAIL_DOMAIN = 'agiliza-imoveis.app'

function toEmail(usuario) {
  return `${usuario.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, cargo, is_admin')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('Erro ao carregar profile:', error)
        setCurrentUser(null)
      } else {
        setCurrentUser(data)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setCurrentUser(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function login(usuario, senha) {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(usuario),
      password: senha,
    })
    return !error
  }

  async function logout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  const isAdmin = currentUser?.is_admin === true

  return (
    <UserContext.Provider value={{ currentUser, login, logout, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser deve ser usado dentro de um UserProvider')
  return context
}
```

- [ ] **Passo 2: Modificar `src/views/Login.jsx`**

Troque `handleSubmit` pra `async` e adicione `await` na chamada de `login`:

```jsx
  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(usuario, senha)
    if (!ok) {
      setError('Usuário ou senha inválidos.')
    }
  }
```

- [ ] **Passo 3: Modificar `src/App.jsx`**

Em `AppShell`, pegue `loading` de `useUser()` e evite renderizar `<Login/>` prematuramente enquanto a sessão ainda está sendo checada:

```jsx
function AppShell() {
  const { currentUser, isAdmin, loading } = useUser()
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  if (loading) {
    return null
  }

  if (!currentUser) {
    return <Login />
  }
  // ... resto da função continua igual (não copiar de novo — só o topo muda)
```

- [ ] **Passo 4: Verificar ao vivo no navegador**

1. `npm run dev`.
2. Abrir a URL local, fazer login com `cayque` / `cayque123`.
3. Confirmar que entra no Painel Geral, sem erro no console.
4. Clicar em Sair, confirmar que volta pra tela de login.
5. Tentar login com senha errada, confirmar que aparece "Usuário ou senha inválidos."
6. Dar F5 depois de logado — confirmar que continua logado (sessão persistida pelo Supabase), sem piscar a tela de login antes.

- [ ] **Passo 5: Commit**

```bash
git add src/context/UserContext.jsx src/views/Login.jsx src/App.jsx
git commit -m "feat: migrate UserContext to real Supabase Auth"
```

---

### Tarefa 7: Migrar Tarefas (`TasksContext` + `TaskModal` + telas)

**Files:**
- Modify: `src/context/TasksContext.jsx` (reescrita completa)
- Modify: `src/components/TaskModal.jsx` (reescrita completa)
- Modify: `src/views/Dashboard.jsx`
- Modify: `src/views/MinhasTarefas.jsx`
- Modify: `src/views/Equipe.jsx` (reescrita completa)

**Interfaces:**
- Consumes: `useProfiles()` (Tarefa 5), `useUser()` (Tarefa 6), tabela `tarefas` (Tarefas 1-2).
- Produces: `useTasks()` retornando `{ tasks, addTask, updateTask, deleteTask, updateStatus, loading }`. Cada item de `tasks` agora é `{ id, titulo, status, prazo, responsavelId, responsavel }` — `responsavelId` é o uuid (novo), `responsavel` continua sendo o nome pra exibição (sem mudar `Dashboard.jsx`/`MinhasTarefas.jsx` na parte de exibição). `prazo` continua em formato `DD/MM/AAAA` como hoje.

- [ ] **Passo 1: Reescrever `src/context/TasksContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const TasksContext = createContext(null)

const TAREFA_SELECT = 'id, titulo, status, prazo, responsavel_id, profiles(nome)'

function isoToBr(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function brToIso(br) {
  if (!br) return null
  const [d, m, y] = br.split('/')
  return `${y}-${m}-${d}`
}

function fromRow(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    status: row.status,
    prazo: isoToBr(row.prazo),
    responsavelId: row.responsavel_id,
    responsavel: row.profiles?.nome ?? '',
  }
}

function toRow(task) {
  return {
    titulo: task.titulo,
    status: task.status,
    prazo: brToIso(task.prazo),
    responsavel_id: task.responsavelId,
  }
}

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  async function refetch() {
    const { data, error } = await supabase
      .from('tarefas')
      .select(TAREFA_SELECT)
      .order('prazo', { ascending: true })
    if (error) {
      console.error('Erro ao carregar tarefas:', error)
      return
    }
    setTasks(data.map(fromRow))
  }

  useEffect(() => {
    refetch().then(() => setLoading(false))
  }, [])

  async function addTask(task) {
    const { error } = await supabase.from('tarefas').insert(toRow(task))
    if (error) {
      console.error('Erro ao criar tarefa:', error)
      return
    }
    await refetch()
  }

  async function updateTask(id, updates) {
    const current = tasks.find(t => t.id === id)
    const merged = { ...current, ...updates }
    const { error } = await supabase.from('tarefas').update(toRow(merged)).eq('id', id)
    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      return
    }
    await refetch()
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir tarefa:', error)
      return
    }
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function updateStatus(id, status) {
    updateTask(id, { status })
  }

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, updateStatus, loading }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) throw new Error('useTasks deve ser usado dentro de um TasksProvider')
  return context
}
```

- [ ] **Passo 2: Reescrever `src/components/TaskModal.jsx`**

```jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { STATUS_OPTIONS } from '../utils/taskHelpers'
import { useProfiles } from '../context/ProfilesContext'

function toInputDate(prazoBr) {
  if (!prazoBr) return ''
  const [day, month, year] = prazoBr.split('/')
  return `${year}-${month}-${day}`
}

function toBrDate(prazoInput) {
  const [year, month, day] = prazoInput.split('-')
  return `${day}/${month}/${year}`
}

export function TaskModal({ task, defaultResponsavelId, onClose, onSave }) {
  const { profiles } = useProfiles()
  const isEditing = Boolean(task)
  const [titulo, setTitulo] = useState(task?.titulo ?? '')
  const [status, setStatus] = useState(task?.status ?? STATUS_OPTIONS[0])
  const [prazo, setPrazo] = useState(toInputDate(task?.prazo))
  const [responsavelId, setResponsavelId] = useState(task?.responsavelId ?? defaultResponsavelId ?? profiles[0]?.id ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('Informe um título para a tarefa.')
      return
    }
    if (!prazo) {
      setError('Informe um prazo.')
      return
    }
    if (!responsavelId) {
      setError('Selecione um responsável.')
      return
    }
    onSave({
      titulo: titulo.trim(),
      status,
      prazo: toBrDate(prazo),
      responsavelId,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="titulo">Título</label>
              <input
                id="titulo"
                className="form-input"
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex.: Revisar edital do Lote 12"
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prazo">Prazo</label>
                <input
                  id="prazo"
                  className="form-input"
                  type="date"
                  value={prazo}
                  onChange={e => setPrazo(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="responsavel">Responsável</label>
              <select
                id="responsavel"
                className="form-input"
                value={responsavelId}
                onChange={e => setResponsavelId(e.target.value)}
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.nome} — {profile.cargo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar' : 'Criar Tarefa'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Passo 3: Modificar `src/views/Dashboard.jsx`**

Trocar a linha do filtro (é a única mudança neste arquivo — o resto, incluindo `{t.responsavel}` na tabela, continua igual):

```jsx
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.responsavelId === currentUser.id)
```

- [ ] **Passo 4: Modificar `src/views/MinhasTarefas.jsx`**

Duas mudanças: o filtro e a prop passada pro `TaskModal`.

```jsx
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.responsavelId === currentUser.id)
```

```jsx
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          defaultResponsavelId={isAdmin ? undefined : currentUser.id}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
```

- [ ] **Passo 5: Reescrever `src/views/Equipe.jsx`**

```jsx
import { useState } from 'react'
import { Header } from '../components/Header'
import { TaskModal } from '../components/TaskModal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTasks } from '../context/TasksContext'
import { useProfiles } from '../context/ProfilesContext'
import { statusToClassName, isLate } from '../utils/taskHelpers'
import { initials } from '../utils/teamHelpers'

export function Equipe() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks()
  const { profiles } = useProfiles()
  const [editingTask, setEditingTask] = useState(null)
  const [activeMember, setActiveMember] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openNewTaskModal(id) {
    setEditingTask(null)
    setActiveMember(id)
    setIsModalOpen(true)
  }

  function openEditTaskModal(task) {
    setEditingTask(task)
    setActiveMember(task.responsavelId)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingTask(null)
    setActiveMember(null)
  }

  function handleSave(data) {
    if (editingTask) {
      updateTask(editingTask.id, data)
    } else {
      addTask(data)
    }
    closeModal()
  }

  function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Equipe" />

      <div className="page-content" style={{ flex: 1, overflow: 'auto' }}>
        <div className="team-grid">
          {profiles.map(member => {
            const tarefasDoMembro = tasks.filter(t => t.responsavelId === member.id)
            const emAndamento = tarefasDoMembro.filter(t => t.status === 'Em Andamento').length
            const atrasadas = tarefasDoMembro.filter(isLate).length

            return (
              <div className="team-card" key={member.id}>
                <div className="team-card-header">
                  <div className="team-avatar">{initials(member.nome)}</div>
                  <div>
                    <div className="team-name">{member.nome}</div>
                    <div className="team-cargo">{member.cargo}</div>
                  </div>
                </div>

                <div className="team-card-stats">
                  <span>{tarefasDoMembro.length} tarefa{tarefasDoMembro.length !== 1 ? 's' : ''}</span>
                  <span>{emAndamento} em andamento</span>
                  {atrasadas > 0 && <span className="team-stat-late">{atrasadas} atrasada{atrasadas !== 1 ? 's' : ''}</span>}
                </div>

                <div className="team-task-list">
                  {tarefasDoMembro.length === 0 && (
                    <div className="lote-leads-empty">Nenhuma tarefa atribuída ainda.</div>
                  )}
                  {tarefasDoMembro.map(t => (
                    <div className="team-task-row" key={t.id}>
                      <div className="team-task-info">
                        <div className="team-task-title">{t.titulo}</div>
                        <div className="team-task-meta">
                          <span className={`status-badge status-${isLate(t) ? 'late' : statusToClassName(t.status)}`}>
                            {isLate(t) ? 'Atrasado' : t.status}
                          </span>
                          <span className="mono">{t.prazo}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" onClick={() => openEditTaskModal(t)} aria-label="Editar">
                          <Pencil size={14} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(t.id)} aria-label="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="kanban-add-btn" onClick={() => openNewTaskModal(member.id)}>
                  <Plus size={16} /> Nova tarefa para {member.nome}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen && (
        <TaskModal task={editingTask} defaultResponsavelId={activeMember} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  )
}
```

- [ ] **Passo 6: Verificar ao vivo no navegador**

1. `npm run lint` limpo.
2. Logado como `cayque` (admin): abrir Painel Geral, confirmar que "Próximas Tarefas" mostra os nomes certos.
3. Ir em Minhas Tarefas, criar uma tarefa nova atribuída a outra pessoa (ex. Stefanie), salvar, confirmar que aparece.
4. Editar essa tarefa, mudar status pra "Concluído", salvar, confirmar.
5. Excluir a tarefa, confirmar que some.
6. Ir em Equipe, confirmar que os 7 membros aparecem com as tarefas certas, e que "Nova tarefa para X" já vem com o responsável certo pré-selecionado.
7. Deslogar, entrar como `stefanie` / `stefanie123`, confirmar que Painel Geral e Minhas Tarefas mostram só as tarefas dela (a RLS deve estar filtrando isso automaticamente mesmo se o filtro do front falhar — pra confirmar isso de verdade, rode uma consulta via `execute_sql` autenticando como ela não é possível pela MCP tool, então confie no teste de UI mais o `get_advisors` já rodado na Tarefa 2).
8. Confirmar no Supabase: `execute_sql` com `select titulo, status, prazo, responsavel_id from public.tarefas order by created_at desc limit 5;` e comparar com o que foi criado na UI.

- [ ] **Passo 7: Commit**

```bash
git add src/context/TasksContext.jsx src/components/TaskModal.jsx src/views/Dashboard.jsx src/views/MinhasTarefas.jsx src/views/Equipe.jsx
git commit -m "feat: migrate Tarefas to Supabase"
```

---

### Tarefa 8: Migrar Lotes (`LotesContext`)

**Files:**
- Modify: `src/context/LotesContext.jsx` (reescrita completa)

**Interfaces:**
- Consumes: tabela `lotes` (Tarefas 1-2).
- Produces: `useLotes()` retornando `{ lotes, addLote, updateLote, deleteLote, loading }`. Formato de cada lote continua idêntico ao de hoje (`{ id, codigo, titulo, tipoImovel, endereco, bairro, cidade, uf, areaUtil, quartos, banheiros, vagas, valorAvaliacao, lanceInicial, status, dataLeilao, comitente }`) — só `id` agora é uuid em vez de number. **Nenhuma outra tela precisa mudar** (`Lotes.jsx`, `LoteCard.jsx`, `LoteModal.jsx` continuam iguais).

- [ ] **Passo 1: Reescrever `src/context/LotesContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const LotesContext = createContext(null)

const LOTE_COLUMNS = 'id, codigo, titulo, tipo_imovel, endereco, bairro, cidade, uf, area_util, quartos, banheiros, vagas, valor_avaliacao, lance_inicial, status, data_leilao, comitente'

function fromRow(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    titulo: row.titulo,
    tipoImovel: row.tipo_imovel,
    endereco: row.endereco ?? '',
    bairro: row.bairro ?? '',
    cidade: row.cidade ?? '',
    uf: row.uf ?? '',
    areaUtil: row.area_util ?? 0,
    quartos: row.quartos,
    banheiros: row.banheiros,
    vagas: row.vagas,
    valorAvaliacao: row.valor_avaliacao,
    lanceInicial: row.lance_inicial,
    status: row.status,
    dataLeilao: row.data_leilao,
    comitente: row.comitente ?? '',
  }
}

function toRow(lote) {
  return {
    codigo: lote.codigo,
    titulo: lote.titulo,
    tipo_imovel: lote.tipoImovel,
    endereco: lote.endereco,
    bairro: lote.bairro,
    cidade: lote.cidade,
    uf: lote.uf,
    area_util: lote.areaUtil,
    quartos: lote.quartos,
    banheiros: lote.banheiros,
    vagas: lote.vagas,
    valor_avaliacao: lote.valorAvaliacao,
    lance_inicial: lote.lanceInicial,
    status: lote.status,
    data_leilao: lote.dataLeilao,
    comitente: lote.comitente,
  }
}

export function LotesProvider({ children }) {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('lotes')
      .select(LOTE_COLUMNS)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Erro ao carregar lotes:', error)
          setLotes([])
        } else {
          setLotes(data.map(fromRow))
        }
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function addLote(lote) {
    const { data, error } = await supabase
      .from('lotes')
      .insert(toRow(lote))
      .select(LOTE_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao criar lote:', error)
      return
    }
    setLotes(prev => [fromRow(data), ...prev])
  }

  async function updateLote(id, updates) {
    const current = lotes.find(l => l.id === id)
    const merged = { ...current, ...updates }
    const { data, error } = await supabase
      .from('lotes')
      .update(toRow(merged))
      .eq('id', id)
      .select(LOTE_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao atualizar lote:', error)
      return
    }
    setLotes(prev => prev.map(l => (l.id === id ? fromRow(data) : l)))
  }

  async function deleteLote(id) {
    const { error } = await supabase.from('lotes').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir lote:', error)
      return
    }
    setLotes(prev => prev.filter(l => l.id !== id))
  }

  return (
    <LotesContext.Provider value={{ lotes, addLote, updateLote, deleteLote, loading }}>
      {children}
    </LotesContext.Provider>
  )
}

export function useLotes() {
  const context = useContext(LotesContext)
  if (!context) throw new Error('useLotes deve ser usado dentro de um LotesProvider')
  return context
}
```

- [ ] **Passo 2: Verificar ao vivo no navegador**

1. `npm run lint` limpo.
2. Ir em Lotes, criar um lote novo (preencher código, título, tipo, endereço, valores), salvar, confirmar que aparece na grade.
3. Editar esse lote, mudar status pra "Publicado", salvar, confirmar.
4. Trocar pra visão em Lista, confirmar que aparece igual.
5. Excluir o lote, confirmar que some.
6. Confirmar no Supabase: `execute_sql` com `select codigo, titulo, status from public.lotes order by created_at desc limit 5;`.

- [ ] **Passo 3: Commit**

```bash
git add src/context/LotesContext.jsx
git commit -m "feat: migrate Lotes to Supabase"
```

---

### Tarefa 9: Migrar Leads (`LeadsContext`)

**Files:**
- Modify: `src/context/LeadsContext.jsx` (reescrita completa)

**Interfaces:**
- Consumes: tabela `leads` (Tarefas 1-2), `lotes.id` (Tarefa 8) como FK opcional.
- Produces: `useLeads()` retornando `{ leads, addLead, updateLead, deleteLead, leadsByLote, loading }`. **Mudança de comportamento:** `addLead` agora é assíncrona e **retorna o lead criado** (`Promise<lead|null>`) em vez de nada — necessário porque o `id` agora vem do banco (uuid gerado), não pode mais ser inventado no cliente com `Date.now()`. Isso é usado pela Tarefa 10.

- [ ] **Passo 1: Reescrever `src/context/LeadsContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const LeadsContext = createContext(null)

const LEAD_COLUMNS = 'id, lote_id, nome, telefone, etapa, origem, data_recebimento'

function fromRow(row) {
  return {
    id: row.id,
    loteId: row.lote_id,
    nome: row.nome,
    telefone: row.telefone,
    etapa: row.etapa,
    origem: row.origem ?? '',
    dataRecebimento: row.data_recebimento,
  }
}

function toRow(lead) {
  return {
    lote_id: lead.loteId ?? null,
    nome: lead.nome,
    telefone: lead.telefone,
    etapa: lead.etapa,
    origem: lead.origem,
    data_recebimento: lead.dataRecebimento,
  }
}

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('leads')
      .select(LEAD_COLUMNS)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Erro ao carregar leads:', error)
          setLeads([])
        } else {
          setLeads(data.map(fromRow))
        }
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function addLead(lead) {
    const { data, error } = await supabase
      .from('leads')
      .insert(toRow(lead))
      .select(LEAD_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao criar lead:', error)
      return null
    }
    const created = fromRow(data)
    setLeads(prev => [created, ...prev])
    return created
  }

  async function updateLead(id, updates) {
    const current = leads.find(l => l.id === id)
    const merged = { ...current, ...updates }
    const { data, error } = await supabase
      .from('leads')
      .update(toRow(merged))
      .eq('id', id)
      .select(LEAD_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao atualizar lead:', error)
      return
    }
    setLeads(prev => prev.map(l => (l.id === id ? fromRow(data) : l)))
  }

  async function deleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir lead:', error)
      return
    }
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  function leadsByLote(loteId) {
    return leads.filter(l => l.loteId === loteId)
  }

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, deleteLead, leadsByLote, loading }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const context = useContext(LeadsContext)
  if (!context) throw new Error('useLeads deve ser usado dentro de um LeadsProvider')
  return context
}
```

- [ ] **Passo 2: Verificar ao vivo no navegador**

1. `npm run lint` limpo.
2. Ir num lote existente, expandir os leads — deve mostrar vazio (o banco começa sem dados demo, ver Tarefa 11 se quiser popular manualmente pra testar).
3. Não dá pra testar `addLead` isoladamente pela UI ainda (só é chamado de dentro do fluxo de criar lote ou de marcar visita — a Tarefa 10 é quem exercita isso de verdade). Confirme só que a tela de Lotes carrega sem erro no console com o novo Context.

- [ ] **Passo 3: Commit**

```bash
git add src/context/LeadsContext.jsx
git commit -m "feat: migrate Leads to Supabase"
```

---

### Tarefa 10: Migrar Visitas (`VisitsContext` + Realtime + `VisitModal` + telas)

**Files:**
- Modify: `src/context/VisitsContext.jsx` (reescrita completa)
- Modify: `src/components/VisitModal.jsx` (reescrita completa)
- Modify: `src/views/Agenda.jsx`
- Modify: `src/views/Lotes.jsx`

**Interfaces:**
- Consumes: `useProfiles()`, `useLeads().addLead()` (agora assíncrona, Tarefa 9), tabela `visitas` (Tarefas 1-2).
- Produces: `useVisits()` retornando `{ visitas, addVisita, updateVisita, deleteVisita, loading }`, atualizado automaticamente via Realtime quando qualquer usuário muda uma visita.

- [ ] **Passo 1: Reescrever `src/context/VisitsContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const VisitsContext = createContext(null)

const VISITA_SELECT = 'id, tipo, lote_id, lead_id, data, hora, responsavel_id, status, recepcao_nome_completo, recepcao_cpf, recepcao_telefone, profiles(nome)'

function fromRow(row) {
  const visita = {
    id: row.id,
    tipo: row.tipo,
    loteId: row.lote_id,
    leadId: row.lead_id,
    data: row.data,
    hora: row.hora?.slice(0, 5) ?? row.hora,
    responsavelId: row.responsavel_id,
    responsavel: row.profiles?.nome ?? '',
    status: row.status,
  }
  if (row.tipo === 'empresa') {
    visita.recepcao = {
      nomeCompleto: row.recepcao_nome_completo ?? '',
      cpf: row.recepcao_cpf ?? '',
      telefone: row.recepcao_telefone ?? '',
    }
  }
  return visita
}

function toRow(visita) {
  return {
    tipo: visita.tipo,
    lote_id: visita.loteId ?? null,
    lead_id: visita.leadId ?? null,
    data: visita.data,
    hora: visita.hora,
    responsavel_id: visita.responsavelId,
    status: visita.status,
    recepcao_nome_completo: visita.recepcao?.nomeCompleto ?? null,
    recepcao_cpf: visita.recepcao?.cpf ?? null,
    recepcao_telefone: visita.recepcao?.telefone ?? null,
  }
}

export function VisitsProvider({ children }) {
  const [visitas, setVisitas] = useState([])
  const [loading, setLoading] = useState(true)

  async function refetch() {
    const { data, error } = await supabase
      .from('visitas')
      .select(VISITA_SELECT)
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
    if (error) {
      console.error('Erro ao carregar visitas:', error)
      return
    }
    setVisitas(data.map(fromRow))
  }

  useEffect(() => {
    let active = true
    refetch().then(() => { if (active) setLoading(false) })

    const channel = supabase
      .channel('visitas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitas' }, () => {
        refetch()
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function addVisita(visita) {
    const { error } = await supabase.from('visitas').insert(toRow(visita))
    if (error) {
      console.error('Erro ao criar visita:', error)
      return
    }
    await refetch()
  }

  async function updateVisita(id, updates) {
    const current = visitas.find(v => v.id === id)
    const merged = { ...current, ...updates }
    const { error } = await supabase.from('visitas').update(toRow(merged)).eq('id', id)
    if (error) {
      console.error('Erro ao atualizar visita:', error)
      return
    }
    await refetch()
  }

  async function deleteVisita(id) {
    const { error } = await supabase.from('visitas').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir visita:', error)
      return
    }
    await refetch()
  }

  return (
    <VisitsContext.Provider value={{ visitas, addVisita, updateVisita, deleteVisita, loading }}>
      {children}
    </VisitsContext.Provider>
  )
}

export function useVisits() {
  const context = useContext(VisitsContext)
  if (!context) throw new Error('useVisits deve ser usado dentro de um VisitsProvider')
  return context
}
```

Nota: `addVisita`/`updateVisita`/`deleteVisita` chamam `refetch()` diretamente (não só confiam na assinatura Realtime) — o Realtime também vai disparar um refetch logo em seguida, então há uma pequena redundância proposital: garante que quem acabou de agir vê o resultado imediatamente, sem esperar o round-trip do Realtime.

- [ ] **Passo 2: Reescrever `src/components/VisitModal.jsx`**

```jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { useLotes } from '../context/LotesContext'
import { useLeads } from '../context/LeadsContext'
import { useVisits } from '../context/VisitsContext'
import { useProfiles } from '../context/ProfilesContext'
import { normalizePhoneBR } from '../utils/leadHelpers'
import { VISITA_TIPO_OPTIONS } from '../utils/visitHelpers'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function VisitModal({ visita, presetLote, presetLead, defaultResponsavelId, onClose }) {
  const isEditing = Boolean(visita)
  const locked = isEditing || Boolean(presetLote)

  const { lotes } = useLotes()
  const { leads, leadsByLote, addLead, updateLead } = useLeads()
  const { addVisita, updateVisita } = useVisits()
  const { profiles } = useProfiles()

  const [tipo, setTipo] = useState(visita?.tipo ?? (presetLote ? 'imovel' : 'imovel'))
  const [loteId, setLoteId] = useState(visita?.loteId ?? presetLote?.id ?? '')
  const [leadId, setLeadId] = useState(visita?.leadId ?? presetLead?.id ?? '')

  const [contatoOption, setContatoOption] = useState(isEditing ? String(visita.leadId) : 'novo')
  const [nomeCompleto, setNomeCompleto] = useState(visita?.recepcao?.nomeCompleto ?? '')
  const [telefone, setTelefone] = useState(
    visita?.recepcao?.telefone ? visita.recepcao.telefone.replace(/^55/, '') : ''
  )
  const [cpf, setCpf] = useState(visita?.recepcao?.cpf ?? '')

  const [data, setData] = useState(visita?.data ?? '')
  const [hora, setHora] = useState(visita?.hora ?? '')
  const [responsavelId, setResponsavelId] = useState(visita?.responsavelId ?? defaultResponsavelId ?? profiles[0]?.id ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const leadsDoLote = loteId ? leadsByLote(loteId) : []

  function handleContatoChange(value) {
    setContatoOption(value)
    if (value !== 'novo') {
      const lead = leads.find(l => l.id === value)
      if (lead) {
        setNomeCompleto(lead.nome)
        setTelefone(lead.telefone.replace(/^55/, ''))
      }
    } else {
      setNomeCompleto('')
      setTelefone('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!data || !hora) {
      setError('Informe data e hora da visita.')
      return
    }
    if (!responsavelId) {
      setError('Selecione um responsável.')
      return
    }

    setSaving(true)

    if (tipo === 'imovel') {
      if (!loteId || !leadId) {
        setError('Selecione o lote e o lead.')
        setSaving(false)
        return
      }
      const payload = { tipo: 'imovel', loteId, leadId, data, hora, responsavelId }
      if (isEditing) {
        await updateVisita(visita.id, payload)
      } else {
        await addVisita(payload)
        await updateLead(leadId, { etapa: 'Em Visita' })
      }
      setSaving(false)
      onClose()
      return
    }

    // tipo === 'empresa'
    if (!nomeCompleto.trim() || !telefone.trim() || !cpf.trim()) {
      setError('Nome completo, CPF e telefone são obrigatórios para liberar a entrada na recepção.')
      setSaving(false)
      return
    }

    const recepcao = { nomeCompleto: nomeCompleto.trim(), cpf: cpf.trim(), telefone: normalizePhoneBR(telefone) }

    if (isEditing) {
      await updateVisita(visita.id, { data, hora, responsavelId, recepcao })
      setSaving(false)
      onClose()
      return
    }

    let finalLeadId = contatoOption === 'novo' ? null : contatoOption

    if (finalLeadId === null) {
      const novoLead = await addLead({
        loteId: null,
        nome: recepcao.nomeCompleto,
        telefone: recepcao.telefone,
        etapa: 'Em Visita',
        origem: 'Visita à empresa',
        dataRecebimento: todayISO(),
      })
      if (!novoLead) {
        setError('Não foi possível criar o contato. Tente novamente.')
        setSaving(false)
        return
      }
      finalLeadId = novoLead.id
    } else {
      await updateLead(finalLeadId, { etapa: 'Em Visita' })
    }

    await addVisita({ tipo: 'empresa', loteId: null, leadId: finalLeadId, data, hora, responsavelId, recepcao })
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Visita' : 'Marcar Visita'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            {!locked && (
              <div className="view-toggle" style={{ alignSelf: 'flex-start' }}>
                {VISITA_TIPO_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`toggle-btn ${tipo === opt.value ? 'active' : ''}`}
                    onClick={() => setTipo(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {tipo === 'imovel' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="lote">Lote</label>
                    {locked ? (
                      <div className="form-static">
                        {lotes.find(l => l.id === loteId)?.codigo} — {lotes.find(l => l.id === loteId)?.titulo}
                      </div>
                    ) : (
                      <select
                        id="lote"
                        className="form-input"
                        value={loteId}
                        onChange={e => { setLoteId(e.target.value); setLeadId('') }}
                      >
                        <option value="">Selecione o lote</option>
                        {lotes.map(l => (
                          <option key={l.id} value={l.id}>{l.codigo} — {l.titulo}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="lead">Lead</label>
                    {locked ? (
                      <div className="form-static">{leads.find(l => l.id === leadId)?.nome}</div>
                    ) : (
                      <select
                        id="lead"
                        className="form-input"
                        value={leadId}
                        onChange={e => setLeadId(e.target.value)}
                        disabled={!loteId}
                      >
                        <option value="">Selecione o lead</option>
                        {leadsDoLote.map(l => (
                          <option key={l.id} value={l.id}>{l.nome}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {!isEditing && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="contato">Contato</label>
                    <select
                      id="contato"
                      className="form-input"
                      value={contatoOption}
                      onChange={e => handleContatoChange(e.target.value)}
                    >
                      <option value="novo">Novo contato</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="nomeCompleto">Nome completo</label>
                    <input
                      id="nomeCompleto"
                      className="form-input"
                      type="text"
                      value={nomeCompleto}
                      onChange={e => setNomeCompleto(e.target.value)}
                      placeholder="Nome para a recepção"
                      readOnly={!isEditing && contatoOption !== 'novo'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="telefone">Telefone</label>
                    <input
                      id="telefone"
                      className="form-input"
                      type="text"
                      value={telefone}
                      onChange={e => setTelefone(e.target.value)}
                      placeholder="11987654321"
                      readOnly={!isEditing && contatoOption !== 'novo'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cpf">CPF (liberação na recepção)</label>
                  <input
                    id="cpf"
                    className="form-input"
                    type="text"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="data">Data</label>
                <input
                  id="data"
                  className="form-input"
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hora">Hora</label>
                <input
                  id="hora"
                  className="form-input"
                  type="time"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="responsavel">Responsável</label>
              <select
                id="responsavel"
                className="form-input"
                value={responsavelId}
                onChange={e => setResponsavelId(e.target.value)}
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.nome} — {profile.cargo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{isEditing ? 'Salvar' : 'Marcar Visita'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Passo 3: Modificar `src/views/Agenda.jsx`**

Trocar a prop passada pro `VisitModal` (única mudança neste arquivo):

```jsx
      {isModalOpen && (
        <VisitModal visita={editingVisita} defaultResponsavelId={currentUser.id} onClose={closeModal} />
      )}
```

- [ ] **Passo 4: Modificar `src/views/Lotes.jsx`**

Mesma troca de prop, no uso do `VisitModal` a partir do card de lead:

```jsx
      {visitTarget && (
        <VisitModal
          presetLote={visitTarget.lote}
          presetLead={visitTarget.lead}
          defaultResponsavelId={currentUser.id}
          onClose={() => setVisitTarget(null)}
        />
      )}
```

- [ ] **Passo 5: Verificar ao vivo no navegador**

1. `npm run lint` limpo.
2. Ir na Agenda, clicar "Marcar Visita", tipo "Visita ao imóvel" — vai estar vazio (sem lote/lead cadastrados ainda nesta fase; se quiser testar de ponta a ponta, primeiro crie um lote em Lotes e um lead nele via a tela de Leads dentro do card do lote — mas hoje não existe criação de lead direta na UI fora do fluxo de "visita à empresa"; então o teste de "imovel" fica melhor coberto pelo fluxo do Passo 6 abaixo).
3. Testar "Visita à empresa" com "Novo contato": preencher nome, telefone, CPF, data, hora, responsável, salvar. Confirmar que a visita aparece na Agenda agrupada pela data certa.
4. Confirmar no Supabase que um novo lead foi criado: `execute_sql` com `select nome, telefone, etapa, lote_id from public.leads order by created_at desc limit 3;` — deve mostrar o contato novo com `etapa = 'Em Visita'` e `lote_id = null`.
5. Marcar a visita como "Realizada" (dropdown de status na própria linha da Agenda). Confirmar no Supabase que o lead correspondente avançou pra `etapa = 'Em Proposta'`: `select etapa from public.leads where nome = '<nome usado no teste>';`.
6. **Testar o Realtime de verdade:** abrir a Agenda em duas abas do navegador (duas sessões, pode ser a mesma conta). Marcar uma visita numa aba. Confirmar que ela aparece na outra aba **sem dar F5**.
7. Ir em Lotes, criar um lote, e a partir dele testar o botão de "marcar visita" num lead (esse fluxo cobre o tipo "imovel" com lote/lead pré-preenchidos e travados — vai precisar primeiro ter algum lead vinculado a esse lote, o que só acontece hoje via o fluxo de "visita à empresa" com contato existente vinculado depois, ou diretamente no banco pra fins de teste: `insert into public.leads (lote_id, nome, telefone) values ('<id do lote>', 'Lead de Teste', '5511999999999');` via `execute_sql`).

- [ ] **Passo 6: Commit**

```bash
git add src/context/VisitsContext.jsx src/components/VisitModal.jsx src/views/Agenda.jsx src/views/Lotes.jsx
git commit -m "feat: migrate Visitas to Supabase with Realtime"
```

---

### Tarefa 11: Limpeza final e varredura completa

**Files:**
- Modify: `src/utils/teamHelpers.js`

**Interfaces:**
- Consumes: nada novo.
- Produces: `teamHelpers.js` só exporta mais `initials()` — `TEAM_MEMBERS` e `findByCredentials` são removidos (não são mais usados por nenhum arquivo depois das Tarefas 6, 7 e 10).

- [ ] **Passo 1: Confirmar que nada mais importa `TEAM_MEMBERS` ou `findByCredentials`**

Rode uma busca de texto (`grep -rn "TEAM_MEMBERS\|findByCredentials" src/`) — só deve aparecer dentro do próprio `teamHelpers.js`. Se aparecer em qualquer outro arquivo, alguma tarefa anterior ficou incompleta — volte e corrija antes de continuar.

- [ ] **Passo 2: Reescrever `src/utils/teamHelpers.js`**

```js
export function initials(nome) {
  return nome.slice(0, 2).toUpperCase()
}
```

- [ ] **Passo 3: Varredura completa**

1. `npm run lint` — limpo.
2. Rodar `node "C:\Users\USER\.claude\plugins\cache\impeccable\impeccable\4.1.1\skills\impeccable\scripts\detect.mjs" --json src/` (a partir de `agiliza-leiloes/`) — deve continuar sem achados novos.
3. No navegador: deslogar e logar de novo com `cayque`/`cayque123`, navegar por todas as 5 telas (Painel Geral, Minhas Tarefas — lista e kanban, Agenda, Equipe, Lotes — grade e lista), abrir e fechar um modal de cada tipo (Tarefa, Lote, Visita), sem nenhum erro no console.
4. Deslogar e logar como `stefanie`/`stefanie123` (não-admin), confirmar que ela não vê "Equipe" no menu e só vê as próprias tarefas.

- [ ] **Passo 4: Commit**

```bash
git add src/utils/teamHelpers.js
git commit -m "chore: remove hardcoded TEAM_MEMBERS after Supabase migration"
```
