import { useState } from 'react'
import { Header } from '../components/Header'
import { VisitModal } from '../components/VisitModal'
import { LeadDetailModal } from '../components/LeadDetailModal'
import {
  Plus, Building2, Pencil, Trash2, MessageSquareText,
  ChevronLeft, ChevronRight, X, Clock, Check, RotateCcw,
} from 'lucide-react'
import { useVisits } from '../context/VisitsContext'
import { useLeads } from '../context/LeadsContext'
import { useUser } from '../context/UserContext'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import {
  VISITA_STATUS_OPTIONS, statusToClassName, formatDateHeading, isPast,
  WEEKDAY_LABELS, buildMonthGrid, formatMonthHeading, toISODate,
  AGENDA_WEEK_HOURS, buildWeekGrid, formatWeekHeading, hourLabel,
  eventTopOffset, AGENDA_WEEK_DEFAULT_EVENT_HEIGHT, clusterOverlappingVisits,
} from '../utils/visitHelpers'

const today = new Date()

// Same suffix statusToClassName() already produces for .status-badge
// (doing/done/late/todo) — reused so month chips, week blocks, and the
// popover accent bar all stay in sync with a single source of truth.
const STATUS_ICON = {
  Agendada: Clock,
  Realizada: Check,
  'Não Compareceu': X,
  Remarcada: RotateCcw,
}

// Hooks can't be called conditionally, but this only renders while the
// popover is open — same pattern as App.jsx's ScrollLock.
function PopoverScrollLock() {
  useBodyScrollLock()
  return null
}

export function Agenda() {
  const { visitas, updateVisita, deleteVisita } = useVisits()
  const { leads, updateLead } = useLeads()
  const { currentUser } = useUser()

  const [statusFilter, setStatusFilter] = useState('Todas')
  const [editingVisita, setEditingVisita] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('month')
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [weekAnchor, setWeekAnchor] = useState(toISODate(today))
  const [selectedDate, setSelectedDate] = useState(null)
  const [popoverDate, setPopoverDate] = useState(null)
  const [fichaVisita, setFichaVisita] = useState(null)

  // The calendar (month cells, week grid, "+N mais" popover) always shows
  // every visit — statusFilter only narrows the day list below, so the tabs
  // don't make the calendar itself look incomplete compared to "Todas".
  const visitasPorDia = {}
  for (const v of visitas) {
    if (!visitasPorDia[v.data]) visitasPorDia[v.data] = []
    visitasPorDia[v.data].push(v)
  }

  const monthCells = buildMonthGrid(calYear, calMonth)
  const weekDays = buildWeekGrid(weekAnchor)
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

  function shiftWeek(days) {
    const [y, m, d] = weekAnchor.split('-').map(Number)
    setWeekAnchor(toISODate(new Date(y, m - 1, d + days)))
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
          <button
            type="button"
            className="visit-row-title visit-row-title-link"
            onClick={() => setFichaVisita(visita)}
            title="Ver a ficha completa do contato"
          >
            {lead?.nome ?? visita.recepcao?.nomeCompleto ?? 'Contato'}
          </button>
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

  const visitasDoDiaSelecionado = selectedDate
    ? (visitasPorDia[selectedDate] ?? []).filter(v => statusFilter === 'Todas' || v.status === statusFilter)
    : []

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
        <div className="status-tabs agenda-view-toggle">
          <button
            className={`status-tab ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mês
          </button>
          <button
            className={`status-tab ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
        </div>

        {viewMode === 'month' ? (
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
                    <div className="agenda-calendar-cell-items">
                      {visitasDoDia.slice(0, 2).map(v => {
                        const StatusIcon = STATUS_ICON[v.status] ?? Clock
                        return (
                          <div className={`agenda-calendar-cell-item agenda-block-${statusToClassName(v.status)}`} key={v.id}>
                            <StatusIcon className="agenda-calendar-cell-item-icon" size={9} />
                            <span className="mono">{v.hora}</span>
                            <span className="agenda-calendar-cell-item-name">
                              {leadInfo(v.leadId)?.nome ?? v.recepcao?.nomeCompleto ?? 'Contato'}
                            </span>
                          </div>
                        )
                      })}
                      {visitasDoDia.length > 2 && (
                        <button
                          type="button"
                          className="agenda-calendar-cell-more"
                          onClick={e => { e.stopPropagation(); setPopoverDate(cell.iso) }}
                        >
                          +{visitasDoDia.length - 2} mais
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="agenda-week">
            <div className="agenda-calendar-header">
              <button className="icon-btn" onClick={() => shiftWeek(-7)} aria-label="Semana anterior">
                <ChevronLeft size={18} />
              </button>
              <div className="agenda-calendar-heading">{formatWeekHeading(weekDays)}</div>
              <button className="icon-btn" onClick={() => shiftWeek(7)} aria-label="Próxima semana">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="agenda-week-header-row">
              <div className="agenda-week-gutter" />
              {weekDays.map(day => (
                <div
                  key={day.iso}
                  className={`agenda-week-day-heading ${day.iso === todayISOStr ? 'agenda-week-day-heading-today' : ''}`}
                >
                  <span className="agenda-week-day-heading-label">{WEEKDAY_LABELS[day.date.getDay()]}</span>
                  <span className="agenda-week-day-heading-num mono">{day.date.getDate()}</span>
                </div>
              ))}
            </div>

            <div className="agenda-week-body">
              <div className="agenda-week-gutter">
                {AGENDA_WEEK_HOURS.map(hour => (
                  <div className="agenda-week-hour-label" key={hour}>{hourLabel(hour)}</div>
                ))}
              </div>
              {weekDays.map(day => {
                const laidOutVisitas = clusterOverlappingVisits(visitasPorDia[day.iso] ?? [])
                return (
                  <div
                    key={day.iso}
                    className="agenda-week-day-column"
                    onClick={() => { setSelectedDate(day.iso); openNewModal() }}
                  >
                    {AGENDA_WEEK_HOURS.map(hour => (
                      <div className="agenda-week-hour-cell" key={hour} />
                    ))}
                    {laidOutVisitas.map(({ visita: v, col, colCount }) => {
                      const StatusIcon = STATUS_ICON[v.status] ?? Clock
                      const width = 100 / colCount
                      return (
                        <button
                          type="button"
                          key={v.id}
                          className={`agenda-week-event agenda-block-${statusToClassName(v.status)}`}
                          style={{
                            top: eventTopOffset(v.hora),
                            height: AGENDA_WEEK_DEFAULT_EVENT_HEIGHT,
                            width: `calc(${width}% - 2px)`,
                            left: `${width * col}%`,
                          }}
                          onClick={e => { e.stopPropagation(); openEditModal(v) }}
                        >
                          <StatusIcon size={10} />
                          <span className="mono">{v.hora}</span>
                          <span className="agenda-week-event-title">
                            {leadInfo(v.leadId)?.nome ?? v.recepcao?.nomeCompleto ?? 'Contato'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

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

      {fichaVisita && (
        <LeadDetailModal
          leadId={fichaVisita.leadId}
          visita={fichaVisita}
          onClose={() => setFichaVisita(null)}
        />
      )}

      {popoverDate && (
        <div className="modal-overlay" onClick={() => setPopoverDate(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formatDateHeading(popoverDate)}</h2>
              <button type="button" className="icon-btn" onClick={() => setPopoverDate(null)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {(visitasPorDia[popoverDate] ?? []).map(v => {
                const StatusIcon = STATUS_ICON[v.status] ?? Clock
                return (
                  <div className="agenda-popover-row" key={v.id}>
                    <div className={`agenda-popover-row-swatch agenda-block-${statusToClassName(v.status)}`}>
                      <StatusIcon size={13} />
                    </div>
                    {renderVisitRow(v)}
                  </div>
                )
              })}
            </div>
          </div>
          <PopoverScrollLock />
        </div>
      )}
    </div>
  )
}
