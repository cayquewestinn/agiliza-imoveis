import { useEffect, useRef, useState } from 'react'
import {
  X, MessageCircle, Phone, IdCard, Tag, CalendarDays, Home, MapPin,
  UserRound, CalendarClock, MessageSquareText, NotebookPen, ChevronDown,
} from 'lucide-react'
import {
  etapaToClassName, formatPhone, whatsappLink, normalizePhoneBR, origemLabel, LEAD_ETAPA_OPTIONS,
} from '../utils/leadHelpers'
import { formatDate } from '../utils/loteHelpers'
import { statusToClassName } from '../utils/visitHelpers'
import { useLeads } from '../context/LeadsContext'
import { useLotes } from '../context/LotesContext'
import { useVisits } from '../context/VisitsContext'
import { useProfiles } from '../context/ProfilesContext'
import { useClosingTransition } from '../hooks/useClosingTransition'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

// Um campo só aparece quando tem conteúdo — uma ficha cheia de "—" esconde
// o que realmente foi preenchido no meio do que nunca foi.
function Campo({ icon: Icon, rotulo, children }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className="lead-detail-field">
      <div className="lead-detail-field-label">
        <Icon size={13} /> {rotulo}
      </div>
      <div className="lead-detail-field-value">{children}</div>
    </div>
  )
}

// Edição no lugar, compartilhada pelo nome no cabeçalho e pelos campos da
// grade. `paraEdicao`/`deEdicao` existem porque o que se digita nem sempre é o
// que se guarda: o telefone é exibido formatado e gravado só com dígitos, e
// comparar os dois formatos direto gravaria a cada clique.
function useEdicaoInline({
  valor, paraEdicao = v => v ?? '', deEdicao = t => t.trim(), obrigatorio = false, onSalvar,
}) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const cancelado = useRef(false)

  function abrir() {
    setRascunho(paraEdicao(valor))
    setEditando(true)
  }

  function confirmar() {
    setEditando(false)
    const novo = deEdicao(rascunho)
    // Campo obrigatório esvaziado é quase sempre apagão acidental — desfaz em
    // vez de gravar um lead sem nome, sem telefone ou sem data.
    if (obrigatorio && novo === '') return
    if (novo !== (valor ?? '')) onSalvar(novo)
  }

  const inputProps = {
    value: rascunho,
    autoFocus: true,
    onChange: e => setRascunho(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') { e.preventDefault(); confirmar() }
      if (e.key === 'Escape') { cancelado.current = true; setEditando(false) }
    },
    // O Esc já desmontou o campo, mas o ref garante que uma ordem diferente de
    // eventos não transforme um cancelamento em gravação.
    onBlur: () => {
      if (cancelado.current) { cancelado.current = false; return }
      confirmar()
    },
  }

  return { editando, abrir, inputProps }
}

// Ao contrário do Campo acima, este aparece mesmo vazio: se sumisse, não
// haveria onde clicar para preencher.
function CampoEditavel({
  icon: Icon, rotulo, valor, exibicao, vazio, tipo = 'text', editavel,
  paraEdicao, deEdicao, obrigatorio = false, onSalvar, aria,
}) {
  const edicao = useEdicaoInline({ valor, paraEdicao, deEdicao, obrigatorio, onSalvar })

  if (!editavel) {
    return <Campo icon={Icon} rotulo={rotulo}>{exibicao}</Campo>
  }

  return (
    <div className="lead-detail-field">
      <div className="lead-detail-field-label">
        <Icon size={13} /> {rotulo}
      </div>
      {edicao.editando ? (
        <input
          className="form-input lead-detail-input"
          type={tipo}
          aria-label={aria}
          {...edicao.inputProps}
        />
      ) : (
        <button
          type="button"
          className={`lead-detail-field-value lead-detail-editavel${valor ? '' : ' lead-detail-vazio'}`}
          onClick={edicao.abrir}
          title={`${rotulo}. Clique para alterar.`}
          aria-label={`${aria}. Clique para alterar.`}
        >
          {valor ? exibicao : vazio}
        </button>
      )}
    </div>
  )
}

export function LeadDetailModal({ leadId, visita, onClose }) {
  const { leads, updateLead } = useLeads()
  const { lotes } = useLotes()
  const { visitas } = useVisits()
  const { profiles } = useProfiles()
  const { closing, requestClose } = useClosingTransition(onClose)
  useBodyScrollLock()

  const lead = leads.find(l => l.id === leadId) ?? null
  const lote = lead?.loteId ? lotes.find(l => l.id === lead.loteId) : null
  const vendedor = profiles.find(p => p.id === lead?.vendedorId)
  const agendador = profiles.find(p => p.id === lead?.agendadorId)

  // A visita que abriu a ficha carrega os dados da recepção (CPF, telefone
  // informado na hora do agendamento), que não vivem na tabela de leads.
  const recepcao = visita?.recepcao ?? null
  const nome = lead?.nome ?? recepcao?.nomeCompleto ?? 'Contato'
  const telefone = lead?.telefone || recepcao?.telefone || ''

  // Sem lead cadastrado não há registro onde gravar — a ficha vira só leitura
  // em vez de oferecer campos que se perderiam ao fechar.
  const editavel = Boolean(lead)
  function salvar(campo) {
    return valor => { if (lead) updateLead(lead.id, { [campo]: valor }) }
  }

  const [editandoEtapa, setEditandoEtapa] = useState(false)
  const edicaoNome = useEdicaoInline({
    valor: lead?.nome ?? '', obrigatorio: true, onSalvar: salvar('nome'),
  })

  const historico = (lead
    ? visitas.filter(v => v.leadId === lead.id)
    : visita ? [visita] : []
  ).slice().sort((a, b) => `${b.data}${b.hora}`.localeCompare(`${a.data}${a.hora}`))

  const mensagem = lote
    ? `Olá ${nome.split(' ')[0]}, tudo bem? Sou da Agiliza Imóveis e gostaria de falar sobre o imóvel ${lote.codigo}.`
    : `Olá ${nome.split(' ')[0]}, tudo bem? Sou da Agiliza Imóveis.`

  // Rascunho local para não gravar a cada tecla — só salva ao sair do campo,
  // e só se o texto mudou de fato.
  const [rascunho, setRascunho] = useState(lead?.observacoes ?? '')

  function salvarObservacoes() {
    if (lead && rascunho !== (lead.observacoes ?? '')) {
      updateLead(lead.id, { observacoes: rascunho })
    }
  }

  // Rede de segurança: fechar a ficha pelo Esc ou pelo X nem sempre tira o
  // foco do campo antes de desmontar, e uma anotação perdida em silêncio é
  // pior do que uma gravação a mais. O ref evita depender de closure velha.
  const pendente = useRef(null)
  pendente.current = { lead, rascunho, updateLead }
  useEffect(() => () => {
    const { lead: l, rascunho: texto, updateLead: salvarNota } = pendente.current
    if (l && texto !== (l.observacoes ?? '')) {
      salvarNota(l.id, { observacoes: texto })
    }
  }, [])

  return (
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {editavel && edicaoNome.editando ? (
            <input
              className="form-input lead-detail-titulo-input"
              type="text"
              aria-label="Nome do contato"
              {...edicaoNome.inputProps}
            />
          ) : (
            <h2>
              {editavel ? (
                <button
                  type="button"
                  className="lead-detail-editavel"
                  onClick={edicaoNome.abrir}
                  title="Nome. Clique para alterar."
                  aria-label={`Nome: ${nome}. Clique para alterar.`}
                >
                  {nome}
                </button>
              ) : nome}
            </h2>
          )}
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {telefone && (
            <a
              className="btn btn-primary lead-detail-whatsapp"
              href={whatsappLink(telefone, mensagem)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} /> Conversar no WhatsApp
            </a>
          )}

          <div className="lead-detail-grid">
            <CampoEditavel
              icon={Phone}
              rotulo="Telefone"
              editavel={editavel}
              valor={telefone}
              exibicao={telefone ? formatPhone(telefone) : null}
              vazio="Informar telefone"
              tipo="tel"
              obrigatorio
              paraEdicao={v => (v ? formatPhone(v) : '')}
              deEdicao={t => (t.replace(/\D/g, '') ? normalizePhoneBR(t) : '')}
              onSalvar={salvar('telefone')}
              aria="Telefone do contato"
            />
            <Campo icon={IdCard} rotulo="CPF">{recepcao?.cpf || null}</Campo>
            {lead && (
              <div className="lead-detail-field">
                <div className="lead-detail-field-label">
                  <Tag size={13} /> Etapa
                </div>
                <div className="lead-detail-field-value">
                  {editandoEtapa ? (
                    <span className="status-select-wrap">
                      <select
                        className={`visit-status-select status-badge status-${etapaToClassName(lead.etapa)}`}
                        value={lead.etapa}
                        autoFocus
                        onChange={e => { updateLead(lead.id, { etapa: e.target.value }); setEditandoEtapa(false) }}
                        onBlur={() => setEditandoEtapa(false)}
                        aria-label={`Etapa de ${nome}`}
                      >
                        {LEAD_ETAPA_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown className="status-caret" size={12} aria-hidden="true" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`status-badge status-chip status-${etapaToClassName(lead.etapa)}`}
                      onClick={() => setEditandoEtapa(true)}
                      title={`Etapa: ${lead.etapa}. Clique para alterar.`}
                      aria-label={`Etapa de ${nome}: ${lead.etapa}. Clique para alterar.`}
                    >
                      {lead.etapa}
                      <ChevronDown className="status-caret" size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <CampoEditavel
              icon={CalendarDays}
              rotulo="Recebido em"
              editavel={editavel}
              valor={lead?.dataRecebimento ?? ''}
              exibicao={lead?.dataRecebimento ? formatDate(lead.dataRecebimento) : null}
              vazio="Informar data"
              tipo="date"
              obrigatorio
              onSalvar={salvar('dataRecebimento')}
              aria="Data de recebimento do contato"
            />
            <CampoEditavel
              icon={Tag}
              rotulo="Origem"
              editavel={editavel}
              valor={lead?.origem ?? ''}
              exibicao={origemLabel(lead?.origem)}
              vazio="Informar origem"
              onSalvar={salvar('origem')}
              aria="Origem do contato"
            />
            <Campo icon={UserRound} rotulo="Vendedor">{vendedor?.nome || null}</Campo>
            <Campo icon={UserRound} rotulo="Agendador">{agendador?.nome || null}</Campo>
          </div>

          {lead && (
            <div>
              <h3 className="lote-detail-section-title">
                <NotebookPen size={14} /> Observações
              </h3>
              <textarea
                className="form-input lead-detail-observacoes"
                value={rascunho}
                onChange={e => setRascunho(e.target.value)}
                onBlur={salvarObservacoes}
                rows={3}
                placeholder="Ex.: Motorista de aplicativo. Procura dois dormitórios na zona sul, com entrada de trinta mil reais."
                aria-label={`Observações sobre ${nome}`}
              />
            </div>
          )}

          <div>
            <h3 className="lote-detail-section-title">
              <Home size={14} /> Imóvel de interesse
            </h3>
            {lote ? (
              <div className="lead-detail-lote">
                <div className="lote-card-codigo">{lote.codigo}</div>
                <div className="lead-detail-lote-title">{lote.titulo}</div>
                <div className="lote-card-address">
                  <MapPin size={14} />
                  {lote.endereco ? `${lote.endereco}, ` : ''}{lote.bairro}, {lote.cidade} - {lote.uf}
                </div>
              </div>
            ) : (
              <p className="lote-leads-empty">
                Nenhum imóvel vinculado a este contato.
              </p>
            )}
          </div>

          <div>
            <h3 className="lote-detail-section-title">
              <CalendarClock size={14} /> Visitas ({historico.length})
            </h3>
            <div className="lead-detail-visitas">
              {historico.length === 0 && (
                <p className="lote-leads-empty">Nenhuma visita registrada.</p>
              )}
              {historico.map(v => (
                <div className="lead-detail-visita" key={v.id}>
                  <span className="mono lead-detail-visita-quando">
                    {formatDate(v.data)} · {v.hora}
                  </span>
                  <span className={`status-badge status-${statusToClassName(v.status)}`}>
                    {v.status}
                  </span>
                  <span className="lead-detail-visita-resp">{v.responsavel}</span>
                  {v.feedback && (
                    <span className="visit-row-feedback lead-detail-visita-feedback">
                      <MessageSquareText size={12} />
                      <span>{v.feedback}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
