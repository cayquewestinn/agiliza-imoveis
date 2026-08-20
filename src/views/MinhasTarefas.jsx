import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Header } from '../components/Header'
import { TaskModal } from '../components/TaskModal'
import { List, LayoutGrid, Plus, Pencil, Trash2 } from 'lucide-react'
import { useTasks } from '../context/TasksContext'
import { useUser } from '../context/UserContext'
import { STATUS_OPTIONS, statusToClassName, isLate } from '../utils/taskHelpers'

function KanbanCard({ task, onOpen, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
      onClick={() => onOpen(task)}
    >
      <button
        type="button"
        className="icon-btn icon-btn-danger kanban-card-delete"
        aria-label="Excluir tarefa"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onDelete(task.id) }}
      >
        <Trash2 size={14} />
      </button>
      <div className="kanban-card-title">{task.titulo}</div>
      <div className="kanban-card-meta">
        <span className={`status-badge status-${isLate(task) ? 'late' : statusToClassName(task.status)}`}>
          {isLate(task) ? 'Atrasado' : task.status}
        </span>
        <span>{task.prazo}</span>
      </div>
    </div>
  )
}

function KanbanCardPreview({ task }) {
  return (
    <div className="kanban-card kanban-card-overlay">
      <div className="kanban-card-title">{task.titulo}</div>
      <div className="kanban-card-meta">
        <span className={`status-badge status-${isLate(task) ? 'late' : statusToClassName(task.status)}`}>
          {isLate(task) ? 'Atrasado' : task.status}
        </span>
        <span>{task.prazo}</span>
      </div>
    </div>
  )
}

function KanbanColumn({ status, tasks, onOpen, onAdd, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`} ref={setNodeRef}>
      <div className="kanban-header">
        <span>{status}</span>
        <span className="kanban-count">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(t => (
          <KanbanCard key={t.id} task={t} onOpen={onOpen} onDelete={onDelete} />
        ))}
      </SortableContext>
      {status === STATUS_OPTIONS[0] && (
        <button className="kanban-add-btn" onClick={onAdd}>
          <Plus size={16} /> Adicionar tarefa
        </button>
      )}
    </div>
  )
}

export function MinhasTarefas() {
  const { tasks: allTasks, addTask, updateTask, deleteTask, updateStatus } = useTasks()
  const { currentUser, isAdmin } = useUser()
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.responsavelId === currentUser.id)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'kanban'
  const [editingTask, setEditingTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggingTask, setDraggingTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id)
    setDraggingTask(task ?? null)
  }

  function handleDragEnd(event) {
    setDraggingTask(null)
    const { active, over } = event
    if (!over) return
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return
    const overStatus = STATUS_OPTIONS.includes(over.id)
      ? over.id
      : tasks.find(t => t.id === over.id)?.status
    if (overStatus && overStatus !== activeTask.status) {
      updateStatus(activeTask.id, overStatus)
    }
  }

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
            <table className="data-table tasks-table">
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
                    <td data-label="Tarefa" style={{fontWeight: 500}}>{t.titulo}</td>
                    <td data-label="Status">
                      <span className={`status-badge status-${isLate(t) ? 'late' : statusToClassName(t.status)}`}>
                        {isLate(t) ? 'Atrasado' : t.status}
                      </span>
                    </td>
                    <td data-label="Prazo" className="mono">{t.prazo}</td>
                    <td data-label="Responsável">{t.responsavel}</td>
                    <td data-label="Ações">
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="kanban-board">
              {STATUS_OPTIONS.map(statusOption => (
                <KanbanColumn
                  key={statusOption}
                  status={statusOption}
                  tasks={tasks.filter(t => t.status === statusOption)}
                  onOpen={openEditTaskModal}
                  onAdd={openNewTaskModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            <DragOverlay>
              {draggingTask && <KanbanCardPreview task={draggingTask} />}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          defaultResponsavelId={isAdmin ? undefined : currentUser.id}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
