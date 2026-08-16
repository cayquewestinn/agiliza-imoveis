import { createContext, useContext, useState } from 'react'

const VisitsContext = createContext(null)

const visitasIniciais = [
  {
    id: 1,
    tipo: 'imovel',
    loteId: 1,
    leadId: 2,
    data: '2026-08-20',
    hora: '14:00',
    responsavel: 'Stefanie',
    status: 'Agendada',
  },
  {
    id: 2,
    tipo: 'imovel',
    loteId: 3,
    leadId: 4,
    data: '2026-08-12',
    hora: '10:30',
    responsavel: 'Gilmar',
    status: 'Realizada',
  },
  {
    id: 3,
    tipo: 'empresa',
    loteId: null,
    leadId: 1,
    data: '2026-08-18',
    hora: '16:00',
    responsavel: 'Raissa',
    status: 'Agendada',
    recepcao: { nomeCompleto: 'Fernanda Souza', cpf: '123.456.789-00', telefone: '5511987654321' },
  },
]

export function VisitsProvider({ children }) {
  const [visitas, setVisitas] = useState(visitasIniciais)

  function addVisita(visita) {
    setVisitas(prev => [...prev, { ...visita, id: visita.id ?? Date.now(), status: 'Agendada' }])
  }

  function updateVisita(id, updates) {
    setVisitas(prev => prev.map(v => (v.id === id ? { ...v, ...updates } : v)))
  }

  function deleteVisita(id) {
    setVisitas(prev => prev.filter(v => v.id !== id))
  }

  return (
    <VisitsContext.Provider value={{ visitas, addVisita, updateVisita, deleteVisita }}>
      {children}
    </VisitsContext.Provider>
  )
}

export function useVisits() {
  const context = useContext(VisitsContext)
  if (!context) throw new Error('useVisits deve ser usado dentro de um VisitsProvider')
  return context
}
