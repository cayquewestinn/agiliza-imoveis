import { createContext, useContext, useState } from 'react'

const TasksContext = createContext(null)

const tarefasIniciais = [
  { id: 1, titulo: 'Elaborar contrato de arrematação — Lote LT-045', status: 'A Fazer', prazo: '16/08/2026', responsavel: 'Cayque' },
  { id: 2, titulo: 'Aprovar laudo de avaliação — Lote LT-012', status: 'Em Andamento', prazo: '14/08/2026', responsavel: 'Stefanie' },
  { id: 3, titulo: 'Enviar notificação extrajudicial — Lote LT-091', status: 'Em Andamento', prazo: '13/08/2026', responsavel: 'Gilmar' },
  { id: 4, titulo: 'Reunião de alinhamento com comitente — Espólio Antônio Ferreira', status: 'Concluído', prazo: '12/08/2026', responsavel: 'Cayque' },
  { id: 5, titulo: 'Publicar edital no Diário Oficial — Lote LT-078', status: 'A Fazer', prazo: '18/08/2026', responsavel: 'Raissa' },
  { id: 6, titulo: 'Agendar vistoria pré-leilão — Lote LT-056', status: 'A Fazer', prazo: '20/08/2026', responsavel: 'Scarlett' },
  { id: 7, titulo: 'Follow-up com lead interessado — Lote LT-034', status: 'Em Andamento', prazo: '15/08/2026', responsavel: 'Ramon' },
  { id: 8, titulo: 'Enviar proposta comercial — Lote LT-021', status: 'A Fazer', prazo: '19/08/2026', responsavel: 'Vitória' },
]

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(tarefasIniciais)

  function addTask(task) {
    setTasks(prev => [...prev, { ...task, id: Date.now() }])
  }

  function updateTask(id, updates) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function updateStatus(id, status) {
    updateTask(id, { status })
  }

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, updateStatus }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) throw new Error('useTasks deve ser usado dentro de um TasksProvider')
  return context
}
