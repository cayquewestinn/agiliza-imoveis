# Migração do backend para Supabase — Design

Data: 2026-08-16
Projeto Supabase: `cayquewestinn's Project` (`golnjkuocqtpaeyzbemb`, Postgres 17, região us-east-2), schema `public` hoje vazio.

## 1. Objetivo

Substituir o estado em memória (React Context: `TasksContext`, `LotesContext`, `LeadsContext`, `VisitsContext`) por um banco Postgres real via Supabase, incluindo autenticação real (Supabase Auth) no lugar do gate de usuário/senha em texto puro.

## 2. Abordagem

Manter a mesma API de Context que as telas já consomem (`useTasks()`, `useLotes()`, `useLeads()`, `useVisits()`, `useUser()`) — só troca o que acontece **dentro** de cada Provider: em vez de `useState` com array inicial, os dados vêm de `supabase.from(...).select()` no mount, e as funções de CRUD chamam `supabase.from(...).insert/update/delete()`. Isso significa que nenhuma das ~15 telas/componentes que já foram construídas e revisadas precisa mudar — elas não sabem (nem devem saber) de onde os dados vêm.

Não introduzimos uma lib de cache (React Query) agora — o app ainda é pequeno pra justificar essa complexidade a mais. Se crescer, é um upgrade natural depois.

**Realtime**: a Agenda de Visitas (`VisitsContext`) assina mudanças via Supabase Realtime (INSERT/UPDATE/DELETE em `visitas`), porque isso serve diretamente o motivo de visitas já serem compartilhadas entre toda a equipe hoje — evitar marcar duas visitas na mesma hora. Sem essa atualização ao vivo, dois agendadores olhando a agenda ao mesmo tempo não veriam a marcação um do outro até dar F5.

## 3. Autenticação

Supabase Auth (email/senha) substitui o gate atual (`usuario`/`senha` em texto puro no `teamHelpers.js`).

**Login continua pedindo só "usuário"**, sem mudar a experiência de ninguém: o app transforma o usuário digitado num e-mail sintético antes de chamar `supabase.auth.signInWithPassword` — `{usuario}@agiliza-imoveis.app` (ex.: `cayque` → `cayque@agiliza-imoveis.app`). Ninguém precisa saber que por trás é um e-mail.

**Senhas iniciais**: mantidas iguais às de hoje (`{primeironome}123`, ex. `cayque123`) — decisão confirmada com o usuário, ninguém precisa trocar nada na migração.

**Provisionamento**: as 7 contas da equipe (as que já existem em `TEAM_MEMBERS` hoje — Cayque, Stefanie, Scarlett, Gilmar, Raissa, Ramon, Vitória) são criadas uma vez via Admin API do Supabase (service role key, usada só num script de migração pontual, nunca dentro do app React). O app em produção usa só a publishable/anon key.

## 4. Tabelas

Nomes e tipos em português para bater com o domínio do negócio, seguindo o padrão que já existe no código.

### `profiles`
1:1 com `auth.users`. Guarda nome/cargo — nunca usar `auth.users.raw_user_meta_data` pra isso (editável pelo próprio usuário, não é seguro pra autorização).

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | `references auth.users(id) on delete cascade` |
| nome | text not null | |
| cargo | text not null | 'Administrador/Agendador', 'Agendador', 'Vendedor', 'Administrativo', 'Desenvolvedor' (lista pode crescer — ver dúvida do consultor financeiro) |
| is_admin | boolean not null default false | usado pelas policies de RLS |
| created_at | timestamptz default now() | |

### `lotes`
Comitente fica como **texto livre por enquanto** (decisão confirmada) — não normalizado em tabela própria nesta fase.

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| codigo | text unique not null | ex. `LT-045` |
| titulo | text not null | |
| tipo_imovel | text not null | check in ('Residencial','Comercial') |
| endereco, bairro, cidade, uf | text | |
| area_util | numeric | |
| quartos, banheiros, vagas | int default 0 | |
| valor_avaliacao, lance_inicial | numeric not null default 0 | |
| status | text not null default 'Rascunho' | check in ('Rascunho','Publicado','Em Leilão','Arrematado','Suspenso','Cancelado') |
| data_leilao | date | |
| comitente | text | texto livre |
| created_at, updated_at | timestamptz default now() | |

### `leads`
`lote_id` é **nullable** — visitas do tipo "empresa" com contato novo criam um lead sem lote vinculado ainda (comportamento que já existe hoje no `VisitModal.jsx`).

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| lote_id | uuid references lotes(id) on delete cascade, **nullable** | |
| nome | text not null | |
| telefone | text not null | |
| etapa | text not null default 'Novo' | check in ('Novo','Em Atendimento','Em Visita','Em Proposta','Convertido','Perdido') |
| origem | text | |
| data_recebimento | date default current_date | |
| created_at | timestamptz default now() | |

### `tarefas`
`responsavel` deixa de ser texto solto e vira FK real pra `profiles`.

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| titulo | text not null | |
| status | text not null default 'A Fazer' | check in ('A Fazer','Em Andamento','Concluído') |
| prazo | date not null | |
| responsavel_id | uuid not null references profiles(id) | |
| created_at | timestamptz default now() | |

### `visitas`
`recepcao_*` substitui o objeto `recepcao` do front (colunas simples, formato fixo e pequeno — não precisa de jsonb).

| coluna | tipo | notas |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| tipo | text not null | check in ('imovel','empresa') |
| lote_id | uuid references lotes(id) on delete set null, nullable | só pra tipo imovel |
| lead_id | uuid references leads(id) on delete set null, nullable | |
| data | date not null | |
| hora | time not null | |
| responsavel_id | uuid not null references profiles(id) | |
| status | text not null default 'Agendada' | check in ('Agendada','Realizada','Não Compareceu','Remarcada') |
| recepcao_nome_completo | text | só tipo empresa |
| recepcao_cpf | text | só tipo empresa |
| recepcao_telefone | text | só tipo empresa |
| created_at | timestamptz default now() | |

## 5. Índices

Derivados dos filtros/ordenações que as telas já fazem hoje (não é chute — é o que o Dashboard, Minhas Tarefas, Equipe, Lotes e Agenda realmente fazem):

- `tarefas(responsavel_id)` — toda tela não-admin filtra por isso; a tela Equipe faz isso uma vez por membro
- `tarefas(status)` — contadores do Dashboard, colunas do Kanban
- `tarefas(prazo)` — ordenação de "Próximas Tarefas", cálculo de atraso
- `tarefas(responsavel_id, status)` composto — Equipe soma "em andamento" por pessoa
- `lotes(status)` — abas de filtro em Lotes
- `leads(lote_id)` — toda vez que um card de lote é renderizado (o ponto mais quente do app hoje, é uma consulta por card visível)
- `visitas(status)` — abas de filtro na Agenda
- `visitas(data, hora)` composto — ordenação/agrupamento da Agenda
- `visitas(lote_id)`, `visitas(lead_id)` — junções pra mostrar nome do lote/lead na Agenda

Postgres não indexa FK automaticamente (diferente de PK), então cada FK acima ganha índice explícito.

## 6. RLS (Row Level Security)

Todas as tabelas com RLS habilitado (obrigatório em qualquer tabela no schema `public`, que é exposto pela Data API).

- **`profiles`**: SELECT liberado pra todo autenticado (precisa pra mostrar nome de responsável em qualquer tela); UPDATE só na própria linha.
- **`lotes`, `leads`, `visitas`**: SELECT/INSERT/UPDATE/DELETE liberado pra todo autenticado, sem restrição por dono — **igual ao comportamento de hoje** (decisão confirmada: "qualquer um pode editar"). É inventário/agenda compartilhada da equipe, não dado por pessoa.
- **`tarefas`**: aqui sim é por dono. SELECT/INSERT/UPDATE/DELETE só quando `is_admin()` for verdadeiro OU `responsavel_id = auth.uid()`. Isso é uma melhoria real de segurança em relação a hoje: atualmente até um não-admin *consegue* reatribuir uma tarefa pra outra pessoa pelo dropdown do modal, porque a trava é só visual. Com RLS isso passa a ser garantido pelo banco.
- Função auxiliar `public.is_admin()` (`security invoker`, não `security definer` — evita o problema de função rodando com privilégio elevado por engano) checando `profiles.is_admin` da própria sessão.

## 7. Dados

**Os dados mock atuais (lotes, leads, tarefas cruzadas) são demo/fictícios** (confirmado no `PRODUCT.md`) — **não** são migrados como se fossem reais. Só o que é real vai para o banco na migração:

- As 7 pessoas da equipe (`profiles`, criadas junto com as contas de Auth).
- `lotes`, `leads`, `tarefas`, `visitas` começam **vazios** — a equipe vai preenchendo com dados reais a partir de agora.

## 8. O que muda no código React

- `src/utils/teamHelpers.js`: `TEAM_MEMBERS` hardcoded sai; vira leitura de `profiles`.
- `src/context/UserContext.jsx`: `login`/`logout` passam a chamar `supabase.auth`; sessão observada via `supabase.auth.onAuthStateChange`.
- `src/context/TasksContext.jsx`, `LotesContext.jsx`, `LeadsContext.jsx`, `VisitsContext.jsx`: trocam `useState` local por fetch/mutate no Supabase; `VisitsContext` ganha a assinatura Realtime.
- Novo: `src/lib/supabaseClient.js` (cliente único, usando a publishable key).
- Variáveis de ambiente novas (`.env.local`, já coberto pelo `.gitignore` via `*.local`): URL do projeto e a publishable key.

## 9. Fora de escopo nesta fase

- Normalizar `comitente` em tabela própria (adiado — texto livre por enquanto).
- Qualquer geração de documento/contrato (ainda sem forma definida, ver `PRODUCT.md`).
- ~~Papel formal de "Consultor Financeiro"~~ — respondido 18/08/2026: não é um cargo separado, é o próprio vendedor (ver `docs/duvidas-para-o-juan.md`). Nenhuma mudança de schema necessária.
