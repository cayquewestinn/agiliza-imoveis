import { useState } from 'react'
import { Header } from '../components/Header'
import { TaskModal } from '../components/TaskModal'
import { List, LayoutGrid, Plus, Pencil, Trash2 } from 'lucide-react'
import { useTasks } from '../context/TasksContext'
import { useUser } from '../context/UserContext'
import { STATUS_OPTIONS, statusToClassName, isLate } from '../utils/taskHelpers'

export function MinhasTarefas() {
  const { tasks: allTasks, addTask, updateTask, deleteTask } = useTasks()
  const { currentUser, isAdmin } = useUser()
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.responsavel === currentUser.nome)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'kanban'
  const [editingTask, setEditingTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openNewTaskModal() {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  function openEditTaskModal(task) {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingTask(null)
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

  const toggleRender = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          <List size={16} /> Lista
        </button>
        <button
          className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
          onClick={() => setViewMode('kanban')}
        >
          <LayoutGrid size={16} /> Kanban
        </button>
      </div>
      <button className="btn btn-primary" onClick={openNewTaskModal}>
        <Plus size={16} /> Nova Tarefa
      </button>
    </div>
  )

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <Header title={isAdmin ? 'Todas as Tarefas' : 'Minhas Tarefas'} rightContent={toggleRender} />

      <div className="page-content" style={{flex: 1, overflow: 'auto'}}>
        {viewMode === 'list' ? (
          <div className="card">
            <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Status</th>
                  <th>Prazo</th>
                  <th>Responsável</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td style={{fontWeight: 500}}>{t.titulo}</td>
                    <td>
                      <span className={`status-badge status-${isLate(t) ? 'late' : statusToClassName(t.status)}`}>
                        {isLate(t) ? 'Atrasado' : t.status}
                      </span>
                    </td>
                    <td className="mono">{t.prazo}</td>
                    <td>{t.responsavel}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => openEditTaskModal(t)} aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(t.id)} aria-label="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: 32 }}>
                      Nenhuma tarefa cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="kanban-board">
            {STATUS_OPTIONS.map(statusOption => (
              <div className="kanban-column" key={statusOption}>
                <div className="kanban-header">
                  <span>{statusOption}</span>
                  <span className="kanban-count">{tasks.filter(t => t.status === statusOption).length}</span>
                </div>
                {tasks.filter(t => t.status === statusOption).map(t => (
                  <div key={t.id} className="kanban-card" onClick={() => openEditTaskModal(t)}>
                    <div className="kanban-card-title">{t.titulo}</div>
                    <div className="kanban-card-meta">
                      <span className={`status-badge status-${isLate(t) ? 'late' : statusToClassName(t.status)}`}>
                        {isLate(t) ? 'Atrasado' : t.status}
                      </span>
                      <span>{t.prazo}</span>
                    </div>
                  </div>
                ))}
                {statusOption === STATUS_OPTIONS[0] && (
                  <button className="kanban-add-btn" onClick={openNewTaskModal}>
                    <Plus size={16} /> Adicionar tarefa
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          defaultResponsavel={isAdmin ? undefined : currentUser.nome}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
