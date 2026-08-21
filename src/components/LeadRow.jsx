import { useState } from 'react'
import { MessageCircle, CheckCircle2, Archive, ArchiveRestore } from 'lucide-react'
import { etapaToClassName, formatPhone, whatsappLink, LEAD_ETAPA_OPTIONS } from '../utils/leadHelpers'
import { formatDate } from '../utils/loteHelpers'

export function LeadRow({ lead, lote, vendedores, agendadores, updateLead, showLote = false }) {
  const [editing, setEditing] = useState(null) // null | 'etapa' | 'vendedor' | 'agendador'
  const vendedor = vendedores.find(p => p.id === lead.vendedorId)
  const agendador = agendadores.find(p => p.id === lead.agendadorId)
  const isSold = lead.etapa === 'Convertido'

  const mensagem = lote
    ? `Olá ${lead.nome.split(' ')[0]}, tudo bem? Sou da Agiliza Imóveis e gostaria de falar sobre o imóvel ${lote.codigo}.`
    : `Olá ${lead.nome.split(' ')[0]}, tudo bem? Sou da Agiliza Imóveis.`

  return (
    <div className={`lead-row${lead.arquivado ? ' lead-row-archived' : ''}`}>
      <div className="lote-lead-info">
        <div className="lote-lead-name">
          {lead.nome}
          {lead.arquivado && <span className="lead-archived-tag">Arquivado</span>}
        </div>
        <span className="lote-lead-phone">{formatPhone(lead.telefone)}</span>
        <span className="lote-lead-meta">
          {lead.origem || 'Origem não informada'} · recebido em {formatDate(lead.dataRecebimento)}
        </span>
        {showLote && (
          <span className="lote-lead-imovel mono">{lote ? lote.codigo : 'Sem imóvel vinculado'}</span>
        )}
      </div>

      <div className="lead-row-chips">
        {editing === 'etapa' ? (
          <select
            className={`visit-status-select status-badge status-${etapaToClassName(lead.etapa)}`}
            value={lead.etapa}
            autoFocus
            onChange={e => { updateLead(lead.id, { etapa: e.target.value }); setEditing(null) }}
            onBlur={() => setEditing(null)}
            aria-label={`Etapa de ${lead.nome}`}
          >
            {LEAD_ETAPA_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className={`status-badge status-chip status-${etapaToClassName(lead.etapa)}`}
            onClick={() => setEditing('etapa')}
            aria-label={`Etapa de ${lead.nome}: ${lead.etapa}. Clique para alterar.`}
          >
            {lead.etapa}
          </button>
        )}

        {editing === 'vendedor' ? (
          <select
            className="lote-lead-select"
            value={lead.vendedorId ?? ''}
            autoFocus
            onChange={e => { updateLead(lead.id, { vendedorId: e.target.value || null }); setEditing(null) }}
            onBlur={() => setEditing(null)}
            aria-label={`Vendedor responsável por ${lead.nome}`}
          >
            <option value="">— Vendedor —</option>
            {vendedores.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className="lead-assign-chip"
            onClick={() => setEditing('vendedor')}
            aria-label={`Vendedor responsável por ${lead.nome}: ${vendedor?.nome ?? 'nenhum'}. Clique para alterar.`}
          >
            {`Vendedor: ${vendedor?.nome ?? '—'}`}
          </button>
        )}

        {editing === 'agendador' ? (
          <select
            className="lote-lead-select"
            value={lead.agendadorId ?? ''}
            autoFocus
            onChange={e => { updateLead(lead.id, { agendadorId: e.target.value || null }); setEditing(null) }}
            onBlur={() => setEditing(null)}
            aria-label={`Agendador responsável por ${lead.nome}`}
          >
            <option value="">— Agendador —</option>
            {agendadores.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className="lead-assign-chip"
            onClick={() => setEditing('agendador')}
            aria-label={`Agendador responsável por ${lead.nome}: ${agendador?.nome ?? 'nenhum'}. Clique para alterar.`}
          >
            {`Agendador: ${agendador?.nome ?? '—'}`}
          </button>
        )}
      </div>

      <div className="lead-row-actions">
        <a
          className="whatsapp-btn"
          href={whatsappLink(lead.telefone, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chamar ${lead.nome} no WhatsApp`}
        >
          <MessageCircle size={16} />
        </a>
        <button
          type="button"
          className={`icon-btn${isSold ? ' is-sold' : ''}`}
          onClick={() => updateLead(lead.id, { etapa: 'Convertido' })}
          disabled={isSold}
          aria-disabled={isSold}
          aria-label={isSold ? `${lead.nome} já foi marcado como vendido` : `Marcar ${lead.nome} como vendido`}
        >
          <CheckCircle2 size={16} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => updateLead(lead.id, { arquivado: !lead.arquivado })}
          aria-label={lead.arquivado ? `Desarquivar ${lead.nome}` : `Arquivar ${lead.nome}`}
        >
          {lead.arquivado ? <ArchiveRestore size={16} /> : <Archive size={16} />}
        </button>
      </div>
    </div>
  )
}
