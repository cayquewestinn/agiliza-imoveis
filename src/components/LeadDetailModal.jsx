import { useEffect, useRef, useState } from 'react'
import {
  X, MessageCircle, Phone, IdCard, Tag, CalendarDays, Home, MapPin,
  UserRound, CalendarClock, MessageSquareText, NotebookPen,
} from 'lucide-react'
import { etapaToClassName, formatPhone, whatsappLink } from '../utils/leadHelpers'
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
    const { lead: l, rascunho: texto, updateLead: salvar } = pendente.current
    if (l && texto !== (l.observacoes ?? '')) {
      salvar(l.id, { observacoes: texto })
    }
  }, [])

  return (
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{nome}</h2>
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
            <Campo icon={Phone} rotulo="Telefone">
              {telefone ? formatPhone(telefone) : null}
            </Campo>
            <Campo icon={IdCard} rotulo="CPF">{recepcao?.cpf || null}</Campo>
            <Campo icon={Tag} rotulo="Etapa">
              {lead && (
                <span className={`status-badge status-${etapaToClassName(lead.etapa)}`}>
                  {lead.etapa}
                </span>
              )}
            </Campo>
            <Campo icon={CalendarDays} rotulo="Recebido em">
              {lead?.dataRecebimento ? formatDate(lead.dataRecebimento) : null}
            </Campo>
            <Campo icon={Tag} rotulo="Origem">{lead?.origem || null}</Campo>
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
