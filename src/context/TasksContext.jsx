import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'

const TasksContext = createContext(null)

const TAREFA_SELECT = 'id, titulo, status, prazo, responsavel_id, profiles(nome)'

function isoToBr(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function brToIso(br) {
  if (!br) return null
  const [d, m, y] = br.split('/')
  return `${y}-${m}-${d}`
}

function fromRow(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    status: row.status,
    prazo: isoToBr(row.prazo),
    responsavelId: row.responsavel_id,
    responsavel: row.profiles?.nome ?? '',
  }
}

function toRow(task) {
  return {
    titulo: task.titulo,
    status: task.status,
    prazo: brToIso(task.prazo),
    responsavel_id: task.responsavelId,
  }
}

export function TasksProvider({ children }) {
  const { currentUser } = useUser()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  async function refetch(isActive = () => true) {
    const { data, error } = await supabase
      .from('tarefas')
      .select(TAREFA_SELECT)
      .order('prazo', { ascending: true })
    if (error) {
      console.error('Erro ao carregar tarefas:', error)
      return
    }
    if (isActive()) {
      setTasks(data.map(fromRow))
    }
  }

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setTasks([])
      setLoading(false)
      return
    }

    refetch(() => active).then(() => {
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [currentUser?.id])

  async function addTask(task) {
    const { error } = await supabase.from('tarefas').insert(toRow(task))
    if (error) {
      console.error('Erro ao criar tarefa:', error)
      return
    }
    await refetch()
  }

  async function updateTask(id, updates) {
    const current = tasks.find(t => t.id === id)
    const merged = { ...current, ...updates }
    const { error } = await supabase.from('tarefas').update(toRow(merged)).eq('id', id)
    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      return
    }
    await refetch()
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tarefas').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir tarefa:', error)
      return
    }
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function updateStatus(id, status) {
    updateTask(id, { status })
  }

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, updateStatus, loading }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) throw new Error('useTasks deve ser usado dentro de um TasksProvider')
  return context
}
