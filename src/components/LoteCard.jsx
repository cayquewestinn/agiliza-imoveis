import { useState } from 'react'
import {
  MapPin, Bed, Bath, Car, Ruler, Building2, Home, Gavel, Pencil, Trash2,
  ChevronDown, ChevronUp, Users, MessageCircle, CalendarClock, ImageOff, Images,
} from 'lucide-react'
import { statusToClassName, formatCurrency, formatDate } from '../utils/loteHelpers'
import { etapaToClassName, formatPhone, whatsappLink, LEAD_ETAPA_OPTIONS } from '../utils/leadHelpers'
import { useLeads } from '../context/LeadsContext'
import { useProfiles } from '../context/ProfilesContext'
import { PhotoGallery } from './PhotoGallery'

export function LoteCard({ lote, onEdit, onDelete, onScheduleVisit }) {
  const { leadsByLote, updateLead } = useLeads()
  const { profiles } = useProfiles()
  const vendedores = profiles.filter(p => p.cargo === 'Vendedor')
  const agendadores = profiles.filter(p => p.cargo.includes('Agendador'))
  const [showLeads, setShowLeads] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const leads = leadsByLote(lote.id)
  const fotos = lote.fotos ?? []

  return (
    <div className="lote-card">
      <div className="lote-card-photo" onClick={() => fotos.length > 0 && setGalleryOpen(true)}>
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
            <button className="icon-btn" onClick={() => onEdit(lote)} aria-label="Editar">
              <Pencil size={16} />
            </button>
            <button className="icon-btn icon-btn-danger" onClick={() => onDelete(lote.id)} aria-label="Excluir">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <button className="lote-leads-toggle" onClick={() => setShowLeads(v => !v)}>
          <span><Users size={14} /> {leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
          {showLeads ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showLeads && (
          <div className="lote-leads-list">
            {leads.length === 0 && (
              <div className="lote-leads-empty">Nenhum lead para este lote ainda.</div>
            )}
            {leads.map(lead => (
              <div className="lote-lead-row" key={lead.id}>
                <div className="lote-lead-main">
                  <div className="lote-lead-info">
                    <div className="lote-lead-name">{lead.nome}</div>
                    <div className="lote-lead-meta">
                      <select
                        className={`visit-status-select status-badge status-${etapaToClassName(lead.etapa)}`}
                        value={lead.etapa}
                        onChange={e => updateLead(lead.id, { etapa: e.target.value })}
                        aria-label={`Etapa de ${lead.nome}`}
                      >
                        {LEAD_ETAPA_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <span className="lote-lead-phone">{formatPhone(lead.telefone)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onScheduleVisit(lote, lead)}
                      aria-label={`Marcar visita com ${lead.nome}`}
                    >
                      <CalendarClock size={16} />
                    </button>
                    <a
                      className="whatsapp-btn"
                      href={whatsappLink(lead.telefone, `Olá ${lead.nome.split(' ')[0]}, tudo bem? Sou da Agiliza Imóveis e gostaria de falar sobre o imóvel ${lote.codigo}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Chamar ${lead.nome} no WhatsApp`}
                    >
                      <MessageCircle size={16} />
                    </a>
                  </div>
                </div>
                <div className="lote-lead-assign">
                  <select
                    className="lote-lead-select"
                    value={lead.vendedorId ?? ''}
                    onChange={e => updateLead(lead.id, { vendedorId: e.target.value || null })}
                    aria-label={`Vendedor responsável por ${lead.nome}`}
                  >
                    <option value="">— Vendedor —</option>
                    {vendedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <select
                    className="lote-lead-select"
                    value={lead.agendadorId ?? ''}
                    onChange={e => updateLead(lead.id, { agendadorId: e.target.value || null })}
                    aria-label={`Agendador responsável por ${lead.nome}`}
                  >
                    <option value="">— Agendador —</option>
                    {agendadores.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary lote-lead-sold-btn"
                    onClick={() => updateLead(lead.id, { etapa: 'Convertido' })}
                    aria-label={`Marcar ${lead.nome} como vendido`}
                  >
                    Marcar como Vendido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {galleryOpen && (
        <PhotoGallery
          fotos={fotos}
          startIndex={0}
          titulo={lote.titulo}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}
