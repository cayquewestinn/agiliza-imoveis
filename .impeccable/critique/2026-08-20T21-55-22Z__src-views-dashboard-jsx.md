---
target: Painel Geral (Dashboard)
total_score: 23
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 3
timestamp: 2026-08-20T21-55-22Z
slug: src-views-dashboard-jsx
---
Method: dual-agent (A: general-purpose design-review sub-agent · B: general-purpose detector/evidence sub-agent)

## Nota de descoberta própria

Antes de repassar os dois relatórios, uma checagem que fiz eu mesmo, direto no código, porque a Assessment B levantou uma suspeita forte demais pra não confirmar: o acento roxo "carimbo roxo" (`#5A2A6B`), a cor de identidade central documentada no `DESIGN.md`, **não existe no CSS real do app**. `--accent` está definido como `#1b1912` — exatamente igual a `--ink` (tinta preta). Rodei `git log -S` pra achar quando isso mudou: no commit `379866b` (18/08/2026, "lote photo gallery, visit feedback, dashboard lead funnel chart, search, and UI polish"), o valor original correto (`--accent: #5a2a6b` no claro / `#000000` no escuro, do commit de criação da identidade "Seção de Editais") foi silenciosamente substituído por `#1b1912`/`#f2f2f2`. Não foi decisão de design — foi um efeito colateral acidental de outro ajuste naquela sessão. Isso significa que, desde 18/08, o app inteiro roda sem a única cor de marca que o define, no modo claro (o padrão). Isso pesa mais na sensação de "genérico" do que qualquer coisa de layout.

## Health Score (heurísticas de Nielsen)

| # | Heurística | Nota | Achado principal |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3 | Feedback de hover/clique presente; sem indicação de "atualizado agora" apesar do "Edição de Hoje" sugerir dado ao vivo |
| 2 | Compatibilidade com o mundo real | 4 | Vocabulário do domínio (etapas, termos de leilão) bate com o Canal Pro; a metáfora de jornal funciona pro setor |
| 3 | Controle e liberdade do usuário | 2 | Modal de leads por etapa trava em 200 resultados sem paginação — pra "Novo" (1417), 1217 leads inacessíveis sem digitar busca |
| 4 | Consistência e padrões | 2 | Duas violações concretas da própria documentação: barra de progresso em formato pílula (proibido no DESIGN.md) e a cor de acento sumida (achado acima) |
| 5 | Prevenção de erros | 3 | Tela majoritariamente de leitura/navegação, pouco a prevenir |
| 6 | Reconhecimento em vez de memorização | 2 | Os 6 números de etapa aparecem duas vezes (tiles + barras) sem diferenciação de propósito |
| 7 | Flexibilidade e eficiência | 2 | Nenhum atalho, filtro salvo ou personalização pro usuário que confere isso todo dia |
| 8 | Design estético e minimalista | 2 | Polimento real existe, mas a tela duplica/triplica os mesmos dados |
| 9 | Recuperação de erros | 3 | Estados vazios bem escritos ("Nenhuma tarefa cadastrada ainda.") |
| 10 | Ajuda e documentação | N/A | Apropriadamente ausente — 9 usuários fixos e treinados não precisam disso |

**Total: 23/36 (64%) — Faixa "Aceitável": melhorias significativas necessárias antes que os usuários fiquem satisfeitos.**

## Veredito de especificidade de design

Misto. A moldura do app (masthead com data por extenso em serifada itálica, rótulos condensados maiúsculos, números em mono) é genuinamente autoral — nenhum produto genérico chega com essa cara. Mas os dois widgets que carregam o conteúdo real da tela — a grade de 6 "cards de estatística" (`dashboard-kpi-tile`) e a lista de barras de progresso logo abaixo — são exatamente o padrão "stat-card-grid + progress-bar-list" que aparece sem alteração em qualquer dashboard genérico. E pior: as barras usam cantos 100% arredondados (pílula), o que o próprio `DESIGN.md` proíbe explicitamente. Some isso à cor de acento ausente, e o resultado é que a identidade vive na moldura da página, não nos componentes que o time realmente olha e clica todo dia — exatamente a raiz da sensação de "genérico".

## Visão geral
O que funciona: a data do masthead, a linguagem das mensagens de estado vazio, e a reutilização visual consistente dos cards de lead entre modais. O que não funciona: os mesmos 6 números aparecem duas vezes, os dados de desempenho de vendedor/agendador aparecem três vezes, a cor de marca sumiu do CSS, e a hierarquia visual do gráfico de barras destaca o número menos importante ("Novo", fila não trabalhada) e esconde o mais importante ("Convertido").

## Pontos fortes
- **Masthead com data por extenso**, em serifada itálica sob um filete de tinta — identidade real, não SaaS genérico.
- **Microcópia de estado vazio específica e humana** ("Aguardando 1ª conversão", "Nenhum profissional cadastrado nesta função ainda.") em vez de "Sem dados" genérico.
- **Reuso de componente entre telas**: o card de lead dentro do modal de etapa é visualmente idêntico ao card de lead dentro do detalhe do imóvel — evita a sensação de "cada modal parece de um app diferente".

## Problemas prioritários

**[P0] Cor de acento (carimbo roxo) ausente do CSS em modo claro, desde 18/08/2026.**
Por que importa: é a única cor de identidade do sistema, e ela literalmente não existe no app hoje — motivo mais concreto pra sensação de "genérico" de todos os achados.
Fix: restaurar `--accent: #5a2a6b` (e o hover `#431f52`) no bloco `:root` claro de `src/index.css`. Correção de bug direta, não é julgamento subjetivo.
Comando sugerido: aplicar direto (ou `/impeccable harden`).

**[P0] Tiles de KPI duplicam o gráfico de barras logo abaixo — 12 alvos clicáveis pra 6 resultados, mesmo dado duas vezes.**
Por que importa: dobra a carga cognitiva sem informação nova — o cheiro clássico de "dois padrões de dashboard empilhados em vez de escolher um".
Fix: manter só um (as barras já mostram a contagem ao lado do rótulo); remover a grade de tiles.
Comando sugerido: `/impeccable distill`

**[P1] Hierarquia visual invertida em relação à prioridade de negócio.**
"Novo" (1417, menos acionável) domina o gráfico mesmo após a compressão por raiz quadrada; "Em Proposta" (0) e "Convertido" (2, a métrica de vitória) são quase invisíveis.
Fix: separar "volume de fila" (Novo, como contador isolado) do "pipeline ativo" (as 5 etapas de trabalho, escaladas só entre si).
Comando sugerido: `/impeccable clarify` ou `/impeccable layout`

**[P1] Gráfico de barras perde toda diferenciação de cor no modo escuro.**
As seis cores de status colapsam pro mesmo valor quase branco em modo escuro — sem fallback de borda como os badges de status já usam corretamente em outros lugares do app.
Fix: aplicar o mesmo padrão de borda-por-estilo (sólida/tracejada/dupla) já usado nos badges.
Comando sugerido: `/impeccable harden`

**[P1] Barra de progresso em formato pílula viola a regra explícita do DESIGN.md.**
`border-radius: var(--radius-full)` no track/fill da barra — a documentação proíbe especificamente esse arredondamento total fora de círculos reais.
Fix: trocar para `--radius-sm`, alinhando com o resto do sistema de cards/regras.
Comando sugerido: `/impeccable harden`

## Alertas de persona

**Alex (usuário de poder, confere os números rápido toda manhã)**
Precisa processar 12 elementos clicáveis + 2 tabelas completas + 1 card resumo pra responder "o que mudou desde ontem" — e nada na tela responde isso. Classes de tendência (`.trend-up/-down/-neutral`) já existem no CSS mas nunca foram usadas no Painel Geral.

**Sam (usuário de leitor de tela)**
Ouve "Ver leads em Novo" duas vezes seguidas (tile e barra) sem diferenciação — a variedade visual que talvez tornasse a duplicação tolerável pra quem enxerga não existe no áudio.

**Jordan (funcionário no primeiro dia)**
Sem explicação na tela do porquê 1417 leads estão em "Novo" enquanto todo o resto está em dígito único — não dá pra saber se é fila normal ou dado quebrado.

## Observações menores
- Dados de desempenho por vendedor/agendador aparecem **três vezes** (card resumo + 2 tabelas completas), mesma fonte de dado repetida.
- Botões de ação (WhatsApp, marcar vendido) têm 32×32px com 4px de espaçamento — abaixo da referência comum de ~44px pra toque.
- Limite de 200 leads sem paginação no modal de etapa deixa 1217 dos 1417 leads de "Novo" inacessíveis sem busca.
- Nomenclatura inconsistente: card lateral chama-se "Leads por Venda", as tabelas abaixo "Desempenho por Vendedor/Agendador" — mesmo dado, nomes diferentes.
- O detector automático (varredura mecânica de HTML/JSX) não encontrou nada — zero resultados. Isso é esperado: os problemas reais aqui são de nível de token CSS e de julgamento de hierarquia, que a varredura mecânica não alcança.

## Perguntas provocativas
- E se "Novo" saísse do gráfico comparativo e virasse um contador isolado de "volume de fila", deixando o gráfico comparar só as 5 etapas de trabalho entre si?
- E se o Painel abrisse com um bloco de ação do dia ("3 tarefas vencem hoje") acima da dobra, em vez de liderar com contagens de volume?
- Restaurar a cor de acento sozinha, sem nenhuma outra mudança, seria suficiente pra tirar boa parte da "cara de IA"?
