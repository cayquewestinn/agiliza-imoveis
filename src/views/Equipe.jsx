import { useState } from 'react'
import { Header } from '../components/Header'
import { TaskModal } from '../components/TaskModal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTasks } from '../context/TasksContext'
import { statusToClassName, isLate } from '../utils/taskHelpers'
import { TEAM_MEMBERS, initials } from '../utils/teamHelpers'

export function Equipe() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks()
  const [editingTask, setEditingTask] = useState(null)
  const [activeMember, setActiveMember] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openNewTaskModal(nome) {
    setEditingTask(null)
    setActiveMember(nome)
    setIsModalOpen(true)
  }

  function openEditTaskModal(task) {
    setEditingTask(task)
    setActiveMember(task.responsavel)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingTask(null)
    setActiveMember(null)
  }

  function handleSave(data) {
    if (editingTask) {
      updateTask(editingTask.id, data)
    } else {
      addTask(data)
    }
    closeModal()
  }

  function handleDelete(id) {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Equipe" />

      <div className="page-content" style={{ flex: 1, overflow: 'auto' }}>
        <div className="team-grid">
          {TEAM_MEMBERS.map(member => {
            const tarefasDoMembro = tasks.filter(t => t.responsavel === member.nome)
            const emAndamento = tarefasDoMembro.filter(t => t.status === 'Em Andamento').length
            const atrasadas = tarefasDoMembro.filter(isLate).length

            return (
              <div className="team-card" key={member.nome}>
                <div className="team-card-header">
                  <div className="team-avatar">{initials(member.nome)}</div>
                  <div>
                    <div className="team-name">{member.nome}</div>
                    <div className="team-cargo">{member.cargo}</div>
                  </div>
                </div>

                <div className="team-card-stats">
                  <span>{tarefasDoMembro.length} tarefa{tarefasDoMembro.length !== 1 ? 's' : ''}</span>
                  <span>{emAndamento} em andamento</span>
                  {atrasadas > 0 && <span className="team-stat-late">{atrasadas} atrasada{atrasadas !== 1 ? 's' : ''}</span>}
                </div>

                <div className="team-task-list">
                  {tarefasDoMembro.length === 0 && (
                    <div className="lote-leads-empty">Nenhuma tarefa atribuída ainda.</div>
                  )}
                  {tarefasDoMembro.map(t => (
                    <div className="team-task-row" key={t.id}>
                      <div className="team-task-info">
                        <div className="team-task-title">{t.titulo}</div>
                        <div className="team-task-meta">
                          <span className={`status-badge status-${isLate(t) ? 'late' : statusToClassName(t.status)}`}>
                            {isLate(t) ? 'Atrasado' : t.status}
                          </span>
                          <span className="mono">{t.prazo}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" onClick={() => openEditTaskModal(t)} aria-label="Editar">
                          <Pencil size={14} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(t.id)} aria-label="Excluir">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="kanban-add-btn" onClick={() => openNewTaskModal(member.nome)}>
                  <Plus size={16} /> Nova tarefa para {member.nome}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen && (
        <TaskModal task={editingTask} defaultResponsavel={activeMember} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  )
}
