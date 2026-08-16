import { createContext, useContext, useState } from 'react'

const LeadsContext = createContext(null)

const leadsIniciais = [
  { id: 1, loteId: 1, nome: 'Fernanda Souza', telefone: '5511987654321', etapa: 'Em Atendimento', origem: 'Site', dataRecebimento: '2026-08-10' },
  { id: 2, loteId: 1, nome: 'Ricardo Almeida', telefone: '5511976543210', etapa: 'Em Visita', origem: 'Indicação', dataRecebimento: '2026-08-08' },
  { id: 3, loteId: 2, nome: 'Juliana Martins', telefone: '5511965432109', etapa: 'Novo', origem: 'Portal', dataRecebimento: '2026-08-13' },
  { id: 4, loteId: 3, nome: 'Carlos Eduardo', telefone: '5541987654321', etapa: 'Em Proposta', origem: 'WhatsApp', dataRecebimento: '2026-08-05' },
  { id: 5, loteId: 4, nome: 'Marina Torres', telefone: '5511954321098', etapa: 'Convertido', origem: 'Site', dataRecebimento: '2026-07-25' },
  { id: 6, loteId: 5, nome: 'Paulo Henrique', telefone: '5531987654321', etapa: 'Perdido', origem: 'Portal', dataRecebimento: '2026-08-01' },
  { id: 7, loteId: 6, nome: 'Beatriz Lima', telefone: '5521987654321', etapa: 'Novo', origem: 'Site', dataRecebimento: '2026-08-12' },
  { id: 8, loteId: 6, nome: 'Gustavo Rocha', telefone: '5521976543210', etapa: 'Em Atendimento', origem: 'Indicação', dataRecebimento: '2026-08-11' },
]

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState(leadsIniciais)

  function addLead(lead) {
    setLeads(prev => [...prev, { ...lead, id: lead.id ?? Date.now() }])
  }

  function updateLead(id, updates) {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)))
  }

  function deleteLead(id) {
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  function leadsByLote(loteId) {
    return leads.filter(l => l.loteId === loteId)
  }

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, deleteLead, leadsByLote }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const context = useContext(LeadsContext)
  if (!context) throw new Error('useLeads deve ser usado dentro de um LeadsProvider')
  return context
}
