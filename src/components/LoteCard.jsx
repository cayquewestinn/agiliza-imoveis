import { useState } from 'react'
import {
  MapPin, Bed, Bath, Car, Ruler, Building2, Home, Gavel, Pencil, Trash2,
  Users, ImageOff, Images,
} from 'lucide-react'
import { statusToClassName, formatCurrency, formatDate } from '../utils/loteHelpers'
import { useLeads } from '../context/LeadsContext'
import { LoteDetailModal } from './LoteDetailModal'

export function LoteCard({ lote, onEdit, onDelete }) {
  const { leadsByLote } = useLeads()
  const [detailOpen, setDetailOpen] = useState(false)
  const leads = leadsByLote(lote.id)
  const fotos = lote.fotos ?? []

  return (
    <div className="lote-card" onClick={() => setDetailOpen(true)}>
      <div className="lote-card-photo">
        {fotos.length > 0 ? (
          <>
            <img src={fotos[0]} alt={lote.titulo} loading="lazy" />
            {fotos.length > 1 && (
              <span className="lote-card-photo-count">
                <Images size={13} /> {fotos.length}
              </span>
            )}
          </>
        ) : (
          <div className="lote-card-photo-empty">
            <ImageOff size={22} />
            <span>Sem fotos</span>
          </div>
        )}
        <div className="carimbo carimbo-lote-card" aria-hidden="true">
          <span className="carimbo-text">Origem<br />Leilão</span>
        </div>
      </div>

      <div className="lote-card-strip">
        <div className="lote-card-strip-left">
          {lote.tipoImovel === 'Comercial' ? <Building2 size={15} /> : <Home size={15} />}
          <span className="mono" style={{ fontSize: '0.76rem' }}>{lote.tipoImovel}</span>
        </div>
        <span className={`status-badge status-${statusToClassName(lote.status)}`}>
          {lote.status}
        </span>
      </div>

      <div className="lote-card-body">
        <div className="lote-card-codigo">{lote.codigo}</div>
        <h3 className="lote-card-title">{lote.titulo}</h3>
        <div className="lote-card-address">
          <MapPin size={14} />
          {lote.bairro}, {lote.cidade} - {lote.uf}
        </div>

        <div className="lote-specs">
          <span><Ruler size={14} /> {lote.areaUtil} m²</span>
          {lote.quartos > 0 && <span><Bed size={14} /> {lote.quartos}</span>}
          {lote.banheiros > 0 && <span><Bath size={14} /> {lote.banheiros}</span>}
          {lote.vagas > 0 && <span><Car size={14} /> {lote.vagas}</span>}
        </div>

        <div className="lote-price-row">
          <div>
            <div className="lote-price-label">Avaliação</div>
            <div className="lote-price-value">{formatCurrency(lote.valorAvaliacao)}</div>
          </div>
        </div>

        <div className="lote-card-footer">
          <div className="lote-card-meta">
            <Gavel size={14} /> {formatDate(lote.dataLeilao)}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="icon-btn"
              onClick={e => { e.stopPropagation(); onEdit(lote) }}
              aria-label="Editar"
            >
              <Pencil size={16} />
            </button>
            <button
              className="icon-btn icon-btn-danger"
              onClick={e => { e.stopPropagation(); onDelete(lote.id) }}
              aria-label="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="lote-card-leads-count">
          <Users size={14} /> {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </div>
      </div>

      {detailOpen && (
        <LoteDetailModal
          lote={lote}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  )
}
