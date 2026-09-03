import { useState } from 'react'
import { Header } from '../components/Header'
import { useLeads } from '../context/LeadsContext'
import { useProfiles } from '../context/ProfilesContext'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'
import { toISODate } from '../utils/visitHelpers'

const LEAD_ETAPA_CHART = [
  { etapa: 'Novo', color: 'var(--status-neutral)' },
  { etapa: 'Em Atendimento', color: 'var(--status-active)' },
  { etapa: 'Em Visita', color: 'var(--status-warning)' },
  { etapa: 'Em Proposta', color: 'var(--status-advancing)' },
  { etapa: 'Convertido', color: 'var(--status-success)' },
  { etapa: 'Perdido', color: 'var(--status-danger)' },
]

const PERIODOS_DESEMPENHO = [
  { valor: 'mes', rotulo: 'Este mês' },
  { valor: '90d', rotulo: 'Últimos 90 dias' },
  { valor: 'tudo', rotulo: 'Tudo' },
]

// Taxa de conversão vitalícia não diz nada sobre "como foi este mês" — sem
// recorte, o número só cresce e vira ruído com o tempo. Filtra por
// dataRecebimento, o único carimbo de data que todo lead já tem.
function filtrarPorPeriodo(leads, periodo) {
  if (periodo === 'tudo') return leads
  const hoje = new Date()
  const corte = new Date(hoje)
  if (periodo === 'mes') corte.setDate(1)
  else corte.setDate(corte.getDate() - 90)
  const corteISO = toISODate(corte)
  return leads.filter(l => l.dataRecebimento && l.dataRecebimento >= corteISO)
}

function buildDesempenho(pessoas, leads, campo) {
  return pessoas
    .map(p => {
      const atribuidos = leads.filter(l => l[campo] === p.id)
      const convertidos = atribuidos.filter(l => l.etapa === 'Convertido')
      const perdidos = atribuidos.filter(l => l.etapa === 'Perdido')
      const taxa = atribuidos.length > 0 ? Math.round((convertidos.length / atribuidos.length) * 100) : 0
      const leadsPorVenda = convertidos.length > 0
        ? Math.round((atribuidos.length / convertidos.length) * 10) / 10
        : null
      return {
        id: p.id,
        nome: p.nome,
        leadsAtribuidos: atribuidos.length,
        convertidos: convertidos.length,
        perdidos: perdidos.length,
        taxa,
        leadsPorVenda,
      }
    })
    .sort((a, b) => b.leadsAtribuidos - a.leadsAtribuidos)
}

function FiltroPeriodo({ periodo, onChange }) {
  return (
    <div className="periodo-tabs">
      {PERIODOS_DESEMPENHO.map(p => (
        <button
          key={p.valor}
          type="button"
          className={`periodo-tab ${periodo === p.valor ? 'active' : ''}`}
          onClick={() => onChange(p.valor)}
        >
          {p.rotulo}
        </button>
      ))}
    </div>
  )
}

function MeuDesempenho({ meusLeads, periodo, onChangePeriodo }) {
  const doPeriodo = filtrarPorPeriodo(meusLeads, periodo)
  const convertidos = doPeriodo.filter(l => l.etapa === 'Convertido')
  const perdidos = doPeriodo.filter(l => l.etapa === 'Perdido')
  const taxa = doPeriodo.length > 0 ? Math.round((convertidos.length / doPeriodo.length) * 100) : 0
  const leadsPorVenda = convertidos.length > 0
    ? Math.round((doPeriodo.length / convertidos.length) * 10) / 10
    : null

  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8}}>
        <h2 className="card-title" style={{margin: 0}}>Meu Desempenho</h2>
        <FiltroPeriodo periodo={periodo} onChange={onChangePeriodo} />
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Leads Atribuídos</th>
              <th>Convertidos</th>
              <th>Perdidos</th>
              <th>Taxa de Conversão</th>
              <th>Leads por Venda</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">{doPeriodo.length}</td>
              <td className="mono">{convertidos.length}</td>
              <td className="mono">{perdidos.length}</td>
              <td className="mono">{taxa}%</td>
              <td className="mono">{leadsPorVenda ?? '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DesempenhoTable({ titulo, dados, periodo, onChangePeriodo }) {
  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8}}>
        <h2 className="card-title" style={{margin: 0}}>{titulo}</h2>
        <FiltroPeriodo periodo={periodo} onChange={onChangePeriodo} />
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Leads Atribuídos</th>
              <th>Convertidos</th>
              <th>Perdidos</th>
              <th>Taxa de Conversão</th>
              <th>Leads por Venda</th>
            </tr>
          </thead>
          <tbody>
            {dados.map(d => (
              <tr key={d.id}>
                <td>{d.nome}</td>
                <td className="mono">{d.leadsAtribuidos}</td>
                <td className="mono">{d.convertidos}</td>
                <td className="mono">{d.perdidos}</td>
                <td className="mono">{d.taxa}%</td>
                <td className="mono">{d.leadsPorVenda ?? '—'}</td>
              </tr>
            ))}
            {dados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: 32 }}>
                  Nenhum profissional cadastrado nesta função ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Dashboard({ onVerLeads }) {
  const { leads: todosOsLeads } = useLeads()
  const { profiles } = useProfiles()
  const { currentUser, isAdmin } = useUser()
  const { theme } = useTheme()
  const [periodo, setPeriodo] = useState('mes')

  // Archived leads (no-shows with nothing pending) shouldn't inflate or
  // deflate funnel/performance numbers — they're set aside, not counted.
  const leads = todosOsLeads.filter(l => !l.arquivado)

  // Non-admins see only their own numbers, not the whole company's — the
  // funnel above, the modal it opens, and the performance card all scope
  // to leads where the logged-in person is the vendedor or agendador.
  const meusLeads = leads.filter(l => l.vendedorId === currentUser.id || l.agendadorId === currentUser.id)
  const leadsEscopo = isAdmin ? leads : meusLeads

  // O funil acima é sempre a foto de agora (o que está parado hoje); o
  // recorte de período vale só para as tabelas de desempenho, que respondem
  // "como foi este mês", não "quantos leads existem".
  const leadsDesempenho = filtrarPorPeriodo(leads, periodo)
  const vendedores = buildDesempenho(profiles.filter(p => p.cargo === 'Vendedor'), leadsDesempenho, 'vendedorId')
  const agendadores = buildDesempenho(profiles.filter(p => p.cargo.includes('Agendador')), leadsDesempenho, 'agendadorId')

  const totalLeads = leadsEscopo.length
  const leadsPorEtapa = LEAD_ETAPA_CHART.map(item => ({
    ...item,
    count: leadsEscopo.filter(l => l.etapa === item.etapa).length,
  }))
  const novoItem = leadsPorEtapa.find(item => item.etapa === 'Novo')
  const etapasDeTrabalho = leadsPorEtapa.filter(item => item.etapa !== 'Novo')
  const maxEtapaDeTrabalho = Math.max(...etapasDeTrabalho.map(item => item.count), 0)

  const dataDeHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <Header title={isAdmin ? 'Painel Geral' : `Painel de ${currentUser.nome}`} />
      <div className="page-content">
        <img
          src={theme === 'dark' ? '/logo-agiliza.png' : '/logo-agiliza-ink.png'}
          alt="Agiliza"
          className="dashboard-mobile-logo"
        />

        <div className="card">
          <h2 className="masthead-date">{dataDeHoje.charAt(0).toUpperCase() + dataDeHoje.slice(1)}</h2>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16}}>
            <h3 className="card-title" style={{margin: 0}}>Leads por Etapa</h3>
            <span className="mono" style={{fontSize: '0.8rem', color: 'var(--ink-tertiary)'}}>{totalLeads} no total</span>
          </div>

          <button
            type="button"
            className="dashboard-queue-callout"
            onClick={() => onVerLeads('Novo')}
            aria-label="Ver leads em Novo"
          >
            <div>
              <div className="dashboard-queue-callout-label">Novo</div>
              <div className="dashboard-queue-callout-sub">fila aguardando primeiro contato</div>
            </div>
            <div className="dashboard-queue-callout-value mono">{novoItem?.count ?? 0}</div>
          </button>

          <div className="status-chart">
            {etapasDeTrabalho.map(item => {
              const scale = maxEtapaDeTrabalho > 0 ? Math.sqrt(item.count) / Math.sqrt(maxEtapaDeTrabalho) : 0
              const pct = Math.max(scale * 100, item.count > 0 ? 4 : 0)
              return (
                <button
                  type="button"
                  className="status-chart-row"
                  key={item.etapa}
                  onClick={() => onVerLeads(item.etapa)}
                  aria-label={`Ver leads em ${item.etapa}`}
                >
                  <div className="status-chart-row-header">
                    <span className="status-chart-row-label">{item.etapa}</span>
                    <span className="status-chart-row-value mono">{item.count}</span>
                  </div>
                  <div className="status-chart-bar-track">
                    <div
                      className="status-chart-bar-fill"
                      style={{ transform: `scaleX(${pct / 100})`, backgroundColor: item.color }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {isAdmin ? (
          <div className="dashboard-row-perf">
            <DesempenhoTable titulo="Desempenho por Vendedor" dados={vendedores} periodo={periodo} onChangePeriodo={setPeriodo} />
            <DesempenhoTable titulo="Desempenho por Agendador" dados={agendadores} periodo={periodo} onChangePeriodo={setPeriodo} />
          </div>
        ) : (
          <MeuDesempenho meusLeads={meusLeads} periodo={periodo} onChangePeriodo={setPeriodo} />
        )}
      </div>
    </div>
  )
}
