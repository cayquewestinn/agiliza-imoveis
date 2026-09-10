# Sistema interno Agiliza Imóveis — status do projeto

**Data:** 09/09/2026

---

## 1. Resumo executivo

O sistema interno está no ar e a equipe usa todos os dias. Ele reúne num só lugar os
contatos vindos dos portais, os imóveis e a agenda de visitas, com acesso separado por
cargo. Os contatos do Canal Pro entram sozinhos, sem ninguém digitar. A base tem 2.991
contatos e recebe cerca de 546 novos por semana. Esse volume está acima da capacidade de
atendimento manual. A etapa seguinte é um atendimento automático por WhatsApp, já
construído e testado, aguardando piloto com cliente real.

---

## 2. O que já foi entregue

**Captação automática dos contatos do Canal Pro**
O contato gerado no Canal Pro entra no sistema sozinho, no momento em que acontece, sem
digitação. Funciona desde 19/08, 24 horas por dia. Nos últimos 7 dias entraram 587
contatos, em 512 minutos diferentes ao longo de todas as horas. Nenhum contato depende de
alguém lembrar de cadastrar.

**Cadastro único de contatos, imóveis e visitas**
Tudo num só lugar e ligado entre si. A administração enxerga a empresa inteira, os demais
enxergam o próprio trabalho. Saber a situação de um contato deixa de depender de perguntar
a quem falou com ele. Os 2.991 contatos têm origem e data registradas, então deixa de
existir contato sem procedência.

**Agenda de visitas compartilhada**
Calendário por mês e por semana, visível para toda a equipe. O sistema não oferece horário
já ocupado e avisa quando há choque. Marcar uma visita move o contato para a etapa de
visita, e concluir move para proposta, sem ninguém precisar atualizar.

**Arquivamento automático de contato sem retorno**
Registrado um não comparecimento, e não havendo visita futura marcada, o contato é
arquivado sem ação humana. Já ocorreu com 37 contatos.

**Painel do funil com acesso à lista**
Mostra quantos contatos há em cada etapa. Clicar numa etapa abre a lista completa, com
busca por nome, telefone e código do imóvel, inclusive na etapa de entrada, que tem 2.899.

**Registro de erros em produção**
Falhas que aparecem para o usuário são registradas automaticamente. Um erro real em
celular foi capturado em 07/09.

---

## 3. Ganho prático até aqui

**A base ficou visível e mensurável.** São 2.991 contatos, dos quais 1.211 são histórico
acumulado, carregado de uma vez. O sistema não criou esse acúmulo. Tornou-o mensurável pela
primeira vez.

**O volume de entrada está acima da capacidade de atendimento.** Entram 546 contatos novos
por semana, ou 78 por dia.

> **Estimativa, não medição.** Os tempos por contato são hipóteses de trabalho. O sistema
> mede o volume de entrada, não quanto dura um atendimento por telefone.

| Tempo por contato | Horas de trabalho por dia | Pessoas em tempo integral |
|---|---|---|
| 5 minutos | 6,5 | 1,1 |
| 10 minutos | 13,0 | 2,2 |
| 15 minutos | 19,5 | 3,3 |

Considerando 6 horas produtivas por pessoa ao dia. Em qualquer hipótese, atender todo
contato que entra exige pelo menos uma pessoa em tempo integral, e isso cobre só os
contatos novos, não o histórico acumulado.

**Quase metade chega fora do expediente.** Dos 587 contatos dos últimos 7 dias, 251
entraram fora do intervalo das 8h às 18h, sendo 44 entre meia-noite e 6h. Nesse horário
não há ninguém para responder. Para dar escala, foram registradas 51 visitas desde o
início: é o que o agendamento por telefone comporta enquanto entram 78 contatos por dia.

**Conclusão: o gargalo é capacidade de atendimento, não geração de leads.** A empresa já
paga pelos contatos que chegam e não tem braço para falar com todos. É esse ponto, e só
ele, que a automação de WhatsApp ataca.

---

## 4. Em andamento

**Atendimento automático de agendamento por WhatsApp.**
O contato manda mensagem, o sistema entende se quer visitar, consulta os horários livres na
mesma agenda que a equipe usa, oferece as opções, marca a visita e registra na ficha o que
a pessoa procura. Nunca oferece horário ocupado e nunca pede documento, que segue coletado
na recepção. Responde a qualquer hora.

Situação: **construído e testado, aguardando piloto com cliente real.** As regras estão
cobertas por testes automáticos, todos passando. Nenhuma conversa com cliente real
aconteceu até hoje.

---

## 5. O que falta para entrar no ar

| # | Passo | Responsável |
|---|---|---|
| 1 | Contratar a linha de WhatsApp Business oficial | Empresa |
| 2 | Colocar crédito na conta do serviço de inteligência artificial | Empresa |
| 3 | Ligar a conta do WhatsApp ao sistema | Eu |
| 4 | Publicar o atendimento e testar com um número da própria equipe | Eu |
| 5 | Abrir para o lote de contatos do piloto, com acompanhamento | Equipe |

Os passos 3 e 4 levam cerca de um dia depois que 1 e 2 estiverem prontos. O piloto proposto
dura duas semanas, com acompanhamento manual de cada conversa antes de qualquer ampliação.

---

## 6. Custos

| Item | Tipo | Valor |
|---|---|---|
| Responder dentro da janela de 24 horas | Variável | **R$ 0,00** |
| Serviço de inteligência artificial | Variável, por conversa | cerca de US$ 0,03 |
| Recarga mínima do serviço de inteligência artificial | Entrada única | US$ 5,00 |
| Linha telefônica para o número oficial | Fixo mensal | custo de uma linha comum |

A tarifa oficial do WhatsApp para mensagens de atendimento no Brasil é R$ 0,00: responder
quem escreveu primeiro não custa nada, e é assim que a automação funciona. A recarga mínima
de US$ 5 cobre da ordem de 150 conversas, suficiente para todo o piloto. A gratuidade da
janela de atendimento é a política vigente da Meta, sem prazo de encerramento anunciado, e
as tarifas são revisadas periodicamente.

Existe uma fase seguinte, para reativar a base parada, condicionada a consentimento válido
e à aprovação de mensagens modelo pela Meta. Está detalhada no anexo ao final.

---

## 7. Decisões e riscos

**Decisões necessárias.** Definir o lote de contatos do piloto e quem da equipe acompanha
as conversas. Definir também qual documento ou contrato o sistema deverá gerar, com um
modelo em mãos: hoje essa funcionalidade não existe.

**Acompanhamento por pessoa da equipe.** O painel individual já existe, mas depende de a
atribuição de responsável virar rotina. Hoje 20 contatos têm vendedor e 27 têm agendador
registrados, então ele ainda não tem o que mostrar.

**Se não for aprovado.** A automação permanece construída, testada e parada. Continuam
entrando 546 contatos por semana, 43% deles fora do expediente, e a maior parte da base
segue sem ser contatada.

---

*Números do sistema e tarifas oficiais da Meta para o Brasil conferidos em 09/09/2026.
Os itens marcados como estimativa não são medições.*


---

# Anexo — Fase seguinte: reativação da base parada

Esta fase não faz parte do que está sendo pedido agora. Ela só se torna possível depois de
resolvidas as condições abaixo, nesta ordem.

## 1. Condições, antes de qualquer coisa

**Consentimento válido para abordagem ativa.** Puxar conversa com quem não escreveu
primeiro é abordagem ativa e exige base legal conforme a LGPD. Boa parte da base é anterior
ao sistema e provavelmente não tem esse consentimento registrado. É preciso apurar quais
contatos têm consentimento antes de considerar qualquer disparo.

**Mensagens modelo aprovadas pela Meta.** Não é possível escrever livremente para quem não
respondeu. O texto precisa ser submetido e aprovado antes do uso.

**Risco à qualidade do número oficial.** Disparar sem as duas condições acima expõe o
número a denúncias dos destinatários. O próprio WhatsApp pode rebaixar a classificação de
qualidade do número, reduzir o limite de envios ou bloqueá-lo. O número oficial passaria a
ser o canal de atendimento da empresa, então perdê-lo afeta também o atendimento de quem
procura a empresa espontaneamente.

**O que trava esta fase é a permissão, não o custo.** Enquanto as três condições acima não
estiverem resolvidas, o valor abaixo é irrelevante.

## 2. Custo, uma vez resolvidas as condições

Puxar conversa é cobrado por mensagem entregue. Tarifas oficiais da Meta para o Brasil:

| Categoria da mensagem | Tarifa por mensagem | Custo para abordar os 2.899 contatos parados |
|---|---|---|
| Marketing | R$ 0,3217 | R$ 932,61 |
| Utilidade | R$ 0,0350 | R$ 101,47 |

Uma oferta de visita para quem não pediu nada é classificada como marketing, então o valor
realista é o da primeira linha. Cobra-se uma mensagem por contato abordado, não por
conversa: quando a pessoa responde, abre a janela de 24 horas e o resto é gratuito.
