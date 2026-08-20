import { useState } from 'react'
import { Header } from '../components/Header'
import { VisitModal } from '../components/VisitModal'
import {
  Plus, Building2, Pencil, Trash2, MessageSquareText,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useVisits } from '../context/VisitsContext'
import { useLeads } from '../context/LeadsContext'
import { useUser } from '../context/UserContext'
import {
  VISITA_STATUS_OPTIONS, statusToClassName, formatDateHeading, isPast,
  WEEKDAY_LABELS, buildMonthGrid, formatMonthHeading, toISODate,
} from '../utils/visitHelpers'

const today = new Date()

export function Agenda() {
  const { visitas, updateVisita, deleteVisita } = useVisits()
  const { leads, updateLead } = useLeads()
  const { currentUser } = useUser()

  const [statusFilter, setStatusFilter] = useState('Todas')
  const [editingVisita, setEditingVisita] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  const filtered = statusFilter === 'Todas' ? visitas : visitas.filter(v => v.status === statusFilter)

  const visitasPorDia = {}
  for (const v of filtered) {
    if (!visitasPorDia[v.data]) visitasPorDia[v.data] = []
    visitasPorDia[v.data].push(v)
  }

  const monthCells = buildMonthGrid(calYear, calMonth)
  const todayISOStr = toISODate(today)

  function goToPrevMonth() {
    const date = new Date(calYear, calMonth - 1, 1)
    setCalYear(date.getFullYear())
    setCalMonth(date.getMonth())
  }

  function goToNextMonth() {
    const date = new Date(calYear, calMonth + 1, 1)
    setCalYear(date.getFullYear())
    setCalMonth(date.getMonth())
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
      const lead = leadInfo(visita.leadId)
      const etapasAnterioresAProposta = ['Novo', 'Em Atendimento', 'Em Visita']
      if (lead && etapasAnterioresAProposta.includes(lead.etapa)) {
        updateLead(visita.leadId, { etapa: 'Em Proposta' })
      }
    }
  }

  function renderVisitRow(visita) {
    const lead = leadInfo(visita.leadId)
    return (
      <div className="visit-row" key={visita.id}>
        <div className="visit-row-time mono">{visita.hora}</div>

        <div className="visit-tipo-icon visit-tipo-empresa">
          <Building2 size={16} />
        </div>

        <div className="visit-row-info">
          <div className="visit-row-title">{lead?.nome ?? visita.recepcao?.nomeCompleto ?? 'Contato'}</div>
          <div className="visit-row-subtitle">
            Visita à empresa · CPF {visita.recepcao?.cpf}
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
  }

  const visitasDoDiaSelecionado = selectedDate ? (visitasPorDia[selectedDate] ?? []) : []

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
        <div className="agenda-calendar">
          <div className="agenda-calendar-header">
            <button className="icon-btn" onClick={goToPrevMonth} aria-label="Mês anterior">
              <ChevronLeft size={18} />
            </button>
            <div className="agenda-calendar-heading">{formatMonthHeading(calYear, calMonth)}</div>
            <button className="icon-btn" onClick={goToNextMonth} aria-label="Próximo mês">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="agenda-calendar-weekdays">
            {WEEKDAY_LABELS.map(label => (
              <div className="agenda-calendar-weekday" key={label}>{label}</div>
            ))}
          </div>

          <div className="agenda-calendar-grid">
            {monthCells.map(cell => {
              const visitasDoDia = visitasPorDia[cell.iso] ?? []
              const cellClasses = [
                'agenda-calendar-cell',
                !cell.inMonth && 'agenda-calendar-cell-outside',
                cell.iso === todayISOStr && 'agenda-calendar-cell-today',
                cell.iso === selectedDate && 'agenda-calendar-cell-selected',
              ].filter(Boolean).join(' ')

              return (
                <div
                  key={cell.iso}
                  className={cellClasses}
                  onClick={() => {
                    setSelectedDate(cell.iso)
                    openNewModal()
                  }}
                >
                  <div className="agenda-calendar-cell-day">{cell.date.getDate()}</div>
                  <div className="agenda-calendar-cell-marks">
                    {visitasDoDia.slice(0, 3).map(v => (
                      <div className="agenda-calendar-mark" key={v.id} />
                    ))}
                  </div>
                  {visitasDoDia.length > 0 && (
                    <div className="agenda-calendar-cell-count">{visitasDoDia.length}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="status-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
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
        </div>

        {selectedDate && (
          <div className="agenda-date-group">
            <div className={`agenda-date-heading ${isPast(selectedDate) ? 'agenda-date-past' : ''}`}>
              {formatDateHeading(selectedDate)}
            </div>

            <div className="card" style={{ padding: 0 }}>
              {visitasDoDiaSelecionado.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: 24 }}>
                  Nenhuma visita neste dia.
                </div>
              ) : (
                visitasDoDiaSelecionado.map(renderVisitRow)
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <VisitModal
          visita={editingVisita}
          presetData={selectedDate}
          defaultResponsavelId={currentUser.id}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
