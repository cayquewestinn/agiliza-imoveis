import { useState } from 'react'
import { Header } from '../components/Header'
import { VisitModal } from '../components/VisitModal'
import { Plus, Building2, Home, Pencil, Trash2, MapPin, MessageSquareText } from 'lucide-react'
import { useVisits } from '../context/VisitsContext'
import { useLotes } from '../context/LotesContext'
import { useLeads } from '../context/LeadsContext'
import { useUser } from '../context/UserContext'
import {
  VISITA_STATUS_OPTIONS, statusToClassName, formatDateHeading, groupByDate, isPast,
} from '../utils/visitHelpers'

export function Agenda() {
  const { visitas, updateVisita, deleteVisita } = useVisits()
  const { lotes } = useLotes()
  const { leads, updateLead } = useLeads()
  const { currentUser } = useUser()

  const [statusFilter, setStatusFilter] = useState('Todas')
  const [editingVisita, setEditingVisita] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = statusFilter === 'Todas' ? visitas : visitas.filter(v => v.status === statusFilter)
  const groups = groupByDate(filtered)

  function loteInfo(loteId) {
    return lotes.find(l => l.id === loteId)
  }

  function leadInfo(leadId) {
    return leads.find(l => l.id === leadId)
  }

  function openNewModal() {
    setEditingVisita(null)
    setIsModalOpen(true)
  }

  function openEditModal(visita) {
    setEditingVisita(visita)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingVisita(null)
  }

  function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir esta visita?')) {
      deleteVisita(id)
    }
  }

  function handleStatusChange(visita, novoStatus) {
    updateVisita(visita.id, { status: novoStatus })
    if (novoStatus === 'Realizada' && visita.leadId) {
      updateLead(visita.leadId, { etapa: 'Em Proposta' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header
        title="Agenda de Visitas"
        rightContent={
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={16} /> Marcar Visita
          </button>
        }
      />

      <div className="page-content" style={{ flex: 1, overflow: 'auto' }}>
        <div className="status-tabs">
          <button
            className={`status-tab ${statusFilter === 'Todas' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Todas')}
          >
            Todas <span className="status-tab-count">{visitas.length}</span>
          </button>
          {VISITA_STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`status-tab ${statusFilter === opt ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt)}
            >
              {opt} <span className="status-tab-count">{visitas.filter(v => v.status === opt).length}</span>
            </button>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: 48 }}>
            Nenhuma visita encontrada para este filtro.
          </div>
        )}

        {groups.map(group => (
          <div className="agenda-date-group" key={group.data}>
            <div className={`agenda-date-heading ${isPast(group.data) ? 'agenda-date-past' : ''}`}>
              {formatDateHeading(group.data)}
            </div>

            <div className="card" style={{ padding: 0 }}>
              {group.visitas.map(visita => {
                const lote = visita.tipo === 'imovel' ? loteInfo(visita.loteId) : null
                const lead = leadInfo(visita.leadId)
                return (
                  <div className="visit-row" key={visita.id}>
                    <div className="visit-row-time mono">{visita.hora}</div>

                    <div className={`visit-tipo-icon visit-tipo-${visita.tipo}`}>
                      {visita.tipo === 'imovel' ? <Home size={16} /> : <Building2 size={16} />}
                    </div>

                    <div className="visit-row-info">
                      <div className="visit-row-title">{lead?.nome ?? visita.recepcao?.nomeCompleto ?? 'Contato'}</div>
                      <div className="visit-row-subtitle">
                        {visita.tipo === 'imovel' ? (
                          <><MapPin size={12} /> {lote ? `${lote.codigo} — ${lote.titulo}` : 'Lote não encontrado'}</>
                        ) : (
                          <>Visita à empresa · CPF {visita.recepcao?.cpf}</>
                        )}
                      </div>
                      {visita.feedback && (
                        <div className="visit-row-feedback">
                          <MessageSquareText size={12} />
                          <span>{visita.feedback}</span>
                        </div>
                      )}
                    </div>

                    <div className="visit-row-responsavel">{visita.responsavel}</div>

                    <select
                      className={`visit-status-select status-badge status-${statusToClassName(visita.status)}`}
                      value={visita.status}
                      onChange={e => handleStatusChange(visita, e.target.value)}
                      aria-label="Status da visita"
                    >
                      {VISITA_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    <div className="visit-row-actions">
                      <button className="icon-btn" onClick={() => openEditModal(visita)} aria-label="Editar">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(visita.id)} aria-label="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <VisitModal visita={editingVisita} defaultResponsavelId={currentUser.id} onClose={closeModal} />
      )}
    </div>
  )
}
