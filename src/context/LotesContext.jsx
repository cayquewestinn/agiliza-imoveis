import { createContext, useContext, useState } from 'react'

const LotesContext = createContext(null)

const lotesIniciais = [
  {
    id: 1,
    codigo: 'LT-045',
    titulo: 'Apartamento 3 quartos com varanda',
    tipoImovel: 'Residencial',
    endereco: 'Rua Pamplona, 450',
    bairro: 'Jardim Paulista',
    cidade: 'São Paulo',
    uf: 'SP',
    areaUtil: 98,
    quartos: 3,
    banheiros: 2,
    vagas: 2,
    valorAvaliacao: 890000,
    lanceInicial: 534000,
    status: 'Em Leilão',
    dataLeilao: '2026-08-22',
    comitente: 'Banco Ouro Novo S.A.',
  },
  {
    id: 2,
    codigo: 'LT-012',
    titulo: 'Casa térrea com quintal amplo',
    tipoImovel: 'Residencial',
    endereco: 'Rua Harmonia, 210',
    bairro: 'Vila Madalena',
    cidade: 'São Paulo',
    uf: 'SP',
    areaUtil: 160,
    quartos: 4,
    banheiros: 3,
    vagas: 3,
    valorAvaliacao: 1450000,
    lanceInicial: 870000,
    status: 'Publicado',
    dataLeilao: '2026-09-05',
    comitente: 'Espólio de Antônio Carlos Ferreira',
  },
  {
    id: 3,
    codigo: 'LT-078',
    titulo: 'Sala comercial em edifício corporativo',
    tipoImovel: 'Comercial',
    endereco: 'Av. do Batel, 1868',
    bairro: 'Batel',
    cidade: 'Curitiba',
    uf: 'PR',
    areaUtil: 45,
    quartos: 0,
    banheiros: 1,
    vagas: 1,
    valorAvaliacao: 320000,
    lanceInicial: 192000,
    status: 'Rascunho',
    dataLeilao: '2026-09-18',
    comitente: '3ª Vara Cível da Comarca de Curitiba',
  },
  {
    id: 4,
    codigo: 'LT-033',
    titulo: 'Cobertura duplex com piscina privativa',
    tipoImovel: 'Residencial',
    endereco: 'Av. Ibirapuera, 3200',
    bairro: 'Moema',
    cidade: 'São Paulo',
    uf: 'SP',
    areaUtil: 210,
    quartos: 4,
    banheiros: 4,
    vagas: 3,
    valorAvaliacao: 2380000,
    lanceInicial: 1428000,
    status: 'Arrematado',
    dataLeilao: '2026-07-30',
    comitente: 'Banco Ouro Novo S.A.',
  },
  {
    id: 5,
    codigo: 'LT-091',
    titulo: 'Terreno comercial esquina',
    tipoImovel: 'Comercial',
    endereco: 'Rua Pium-í, 122',
    bairro: 'Savassi',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    areaUtil: 480,
    quartos: 0,
    banheiros: 0,
    vagas: 0,
    valorAvaliacao: 1980000,
    lanceInicial: 1188000,
    status: 'Suspenso',
    dataLeilao: '2026-09-01',
    comitente: '2ª Vara de Falências e Recuperações Judiciais de BH',
  },
  {
    id: 6,
    codigo: 'LT-056',
    titulo: 'Apartamento 2 quartos vista mar',
    tipoImovel: 'Residencial',
    endereco: 'Av. Atlântica, 1702',
    bairro: 'Copacabana',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    areaUtil: 72,
    quartos: 2,
    banheiros: 2,
    vagas: 1,
    valorAvaliacao: 1120000,
    lanceInicial: 672000,
    status: 'Publicado',
    dataLeilao: '2026-09-10',
    comitente: 'Espólio de Antônio Carlos Ferreira',
  },
]

export function LotesProvider({ children }) {
  const [lotes, setLotes] = useState(lotesIniciais)

  function addLote(lote) {
    setLotes(prev => [...prev, { ...lote, id: Date.now() }])
  }

  function updateLote(id, updates) {
    setLotes(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)))
  }

  function deleteLote(id) {
    setLotes(prev => prev.filter(l => l.id !== id))
  }

  return (
    <LotesContext.Provider value={{ lotes, addLote, updateLote, deleteLote }}>
      {children}
    </LotesContext.Provider>
  )
}

export function useLotes() {
  const context = useContext(LotesContext)
  if (!context) throw new Error('useLotes deve ser usado dentro de um LotesProvider')
  return context
}
