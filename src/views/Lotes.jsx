import { useState } from 'react'
import { Header } from '../components/Header'
import { LoteModal } from '../components/LoteModal'
import { LoteCard } from '../components/LoteCard'
import { VisitModal } from '../components/VisitModal'
import { LayoutGrid, List, Plus, Pencil, Trash2 } from 'lucide-react'
import { useLotes } from '../context/LotesContext'
import { useUser } from '../context/UserContext'
import { LOTE_STATUS_OPTIONS, statusToClassName, formatCurrency, formatDate } from '../utils/loteHelpers'

export function Lotes() {
  const { lotes, addLote, updateLote, deleteLote } = useLotes()
  const { currentUser } = useUser()
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [editingLote, setEditingLote] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visitTarget, setVisitTarget] = useState(null) // { lote, lead } | null

  const filtered = statusFilter === 'Todos' ? lotes : lotes.filter(l => l.status === statusFilter)

  function openNewLoteModal() {
    setEditingLote(null)
    setIsModalOpen(true)
  }

  function openEditLoteModal(lote) {
    setEditingLote(lote)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingLote(null)
  }

  function handleSave(data) {
    if (editingLote) {
      updateLote(editingLote.id, data)
    } else {
      addLote(data)
    }
    closeModal()
  }

  function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir este lote?')) {
      deleteLote(id)
    }
  }

  const toggleRender = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid size={16} /> Grade
        </button>
        <button
          className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          <List size={16} /> Lista
        </button>
      </div>
      <button className="btn btn-primary" onClick={openNewLoteModal}>
        <Plus size={16} /> Novo Lote
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Lotes" rightContent={toggleRender} />

      <div className="page-content" style={{ flex: 1, overflow: 'auto' }}>
        <div className="status-tabs">
          <button
            className={`status-tab ${statusFilter === 'Todos' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Todos')}
          >
            Todos <span className="status-tab-count">{lotes.length}</span>
          </button>
          {LOTE_STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`status-tab ${statusFilter === opt ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt)}
            >
              {opt} <span className="status-tab-count">{lotes.filter(l => l.status === opt).length}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: 48 }}>
            Nenhum lote encontrado para este filtro.
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="lotes-grid">
            {filtered.map(lote => (
              <LoteCard
                key={lote.id}
                lote={lote}
                onEdit={openEditLoteModal}
                onDelete={handleDelete}
                onScheduleVisit={(l, lead) => setVisitTarget({ lote: l, lead })}
              />
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Lote</th>
                  <th>Localização</th>
                  <th>Avaliação</th>
                  <th>Lance Inicial</th>
                  <th>Status</th>
                  <th>Leilão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lote => (
                  <tr key={lote.id}>
                    <td className="mono" style={{ fontWeight: 500 }}>{lote.codigo}</td>
                    <td>{lote.titulo}</td>
                    <td>{lote.bairro}, {lote.cidade} - {lote.uf}</td>
                    <td>{formatCurrency(lote.valorAvaliacao)}</td>
                    <td>{formatCurrency(lote.lanceInicial)}</td>
                    <td>
                      <span className={`status-badge status-${statusToClassName(lote.status)}`}>
                        {lote.status}
                      </span>
                    </td>
                    <td className="mono">{formatDate(lote.dataLeilao)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => openEditLoteModal(lote)} aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(lote.id)} aria-label="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <LoteModal lote={editingLote} onClose={closeModal} onSave={handleSave} />
      )}

      {visitTarget && (
        <VisitModal
          presetLote={visitTarget.lote}
          presetLead={visitTarget.lead}
          defaultResponsavelId={currentUser.id}
          onClose={() => setVisitTarget(null)}
        />
      )}
    </div>
  )
}
