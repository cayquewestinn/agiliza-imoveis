import { useState } from 'react'
import { X } from 'lucide-react'
import { STATUS_OPTIONS } from '../utils/taskHelpers'
import { useProfiles } from '../context/ProfilesContext'
import { useUser } from '../context/UserContext'
import { useClosingTransition } from '../hooks/useClosingTransition'

function toInputDate(prazoBr) {
  if (!prazoBr) return ''
  const [day, month, year] = prazoBr.split('/')
  return `${year}-${month}-${day}`
}

function toBrDate(prazoInput) {
  const [year, month, day] = prazoInput.split('-')
  return `${day}/${month}/${year}`
}

export function TaskModal({ task, defaultResponsavelId, onClose, onSave }) {
  const { profiles } = useProfiles()
  const { currentUser, isAdmin } = useUser()
  const isEditing = Boolean(task)
  const [titulo, setTitulo] = useState(task?.titulo ?? '')
  const [status, setStatus] = useState(task?.status ?? STATUS_OPTIONS[0])
  const [prazo, setPrazo] = useState(toInputDate(task?.prazo))
  const [responsavelId, setResponsavelId] = useState(
    isAdmin ? (task?.responsavelId ?? defaultResponsavelId ?? profiles[0]?.id ?? '') : (currentUser?.id ?? '')
  )
  const [error, setError] = useState('')
  const { closing, requestClose } = useClosingTransition(onClose)

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('Informe um título para a tarefa.')
      return
    }
    if (!prazo) {
      setError('Informe um prazo.')
      return
    }
    if (!responsavelId) {
      setError('Selecione um responsável.')
      return
    }
    onSave({
      titulo: titulo.trim(),
      status,
      prazo: toBrDate(prazo),
      responsavelId,
    })
  }

  return (
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="titulo">Título</label>
              <input
                id="titulo"
                className="form-input"
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex.: Revisar edital do Imóvel 12"
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prazo">Prazo</label>
                <input
                  id="prazo"
                  className="form-input"
                  type="date"
                  value={prazo}
                  onChange={e => setPrazo(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="responsavel">Responsável</label>
              <select
                id="responsavel"
                className="form-input"
                value={responsavelId}
                onChange={e => setResponsavelId(e.target.value)}
                disabled={!isAdmin}
              >
                {isAdmin
                  ? profiles.map(profile => (
                      <option key={profile.id} value={profile.id}>{profile.nome} — {profile.cargo}</option>
                    ))
                  : currentUser && (
                      <option key={currentUser.id} value={currentUser.id}>{currentUser.nome} — {currentUser.cargo}</option>
                    )}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={requestClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar' : 'Criar Tarefa'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
