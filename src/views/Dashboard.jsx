import { Header } from '../components/Header'
import { useTasks } from '../context/TasksContext'
import { useLeads } from '../context/LeadsContext'
import { useProfiles } from '../context/ProfilesContext'
import { useUser } from '../context/UserContext'
import { statusToClassName, isLate, parsePrazo } from '../utils/taskHelpers'

const LEAD_ETAPA_CHART = [
  { etapa: 'Novo', color: 'var(--status-neutral)' },
  { etapa: 'Em Atendimento', color: 'var(--status-active)' },
  { etapa: 'Em Visita', color: 'var(--status-warning)' },
  { etapa: 'Em Proposta', color: 'var(--status-advancing)' },
  { etapa: 'Convertido', color: 'var(--status-success)' },
  { etapa: 'Perdido', color: 'var(--status-danger)' },
]

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

function DesempenhoCard({ titulo, dados }) {
  return (
    <div className="card">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
        <h2 className="card-title" style={{margin: 0}}>{titulo}</h2>
      </div>
      <div className="desempenho-list">
        {dados.map(d => (
          <div className="desempenho-row" key={d.id}>
            <span className="desempenho-row-nome">{d.nome}</span>
            <span className="desempenho-row-valor">
              {d.leadsPorVenda !== null ? `${d.leadsPorVenda} leads por venda` : 'Aguardando 1ª conversão'}
            </span>
          </div>
        ))}
        {dados.length === 0 && (
          <div className="desempenho-row-empty">Nenhum profissional cadastrado nesta função ainda.</div>
        )}
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
              </tr>
            ))}
            {dados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: 32 }}>
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

export function Dashboard() {
  const { tasks: allTasks } = useTasks()
  const { leads } = useLeads()
  const { profiles } = useProfiles()
  const { currentUser, isAdmin } = useUser()
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.responsavelId === currentUser.id)

  const vendedores = buildDesempenho(profiles.filter(p => p.cargo === 'Vendedor'), leads, 'vendedorId')
  const agendadores = buildDesempenho(profiles.filter(p => p.cargo.includes('Agendador')), leads, 'agendadorId')

  const totalLeads = leads.length
  const leadsPorEtapa = LEAD_ETAPA_CHART.map(item => ({
    ...item,
    count: leads.filter(l => l.etapa === item.etapa).length,
  }))

  const tarefasRecentes = [...tasks]
    .sort((a, b) => parsePrazo(a.prazo) - parsePrazo(b.prazo))
    .slice(0, 5)

  const dataDeHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <Header title={isAdmin ? 'Painel Geral' : `Painel de ${currentUser.nome}`} />
      <div className="page-content">
        <div className="card">
          <h2 className="masthead-date">Edição de Hoje — {dataDeHoje}</h2>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16}}>
            <h3 className="card-title" style={{margin: 0}}>Leads por Etapa</h3>
            <span className="mono" style={{fontSize: '0.8rem', color: 'var(--ink-tertiary)'}}>{totalLeads} no total</span>
          </div>
          <div className="status-chart">
            {leadsPorEtapa.map(item => {
              const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0
              return (
                <div className="status-chart-row" key={item.etapa}>
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
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <h2 className="card-title" style={{margin: 0}}>Próximas Tarefas</h2>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {tarefasRecentes.map(t => (
                  <tr key={t.id}>
                    <td>{t.titulo}</td>
                    <td>{t.responsavel}</td>
                    <td>
                      <span className={`status-badge status-${isLate(t) ? 'late' : statusToClassName(t.status)}`}>
                        {isLate(t) ? 'Atrasado' : t.status}
                      </span>
                    </td>
                    <td className="mono">{t.prazo}</td>
                  </tr>
                ))}
                {tarefasRecentes.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: 32 }}>
                      Nenhuma tarefa cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DesempenhoCard titulo="Desempenho por Vendedor" dados={vendedores} />
        <DesempenhoCard titulo="Desempenho por Agendador" dados={agendadores} />
      </div>
    </div>
  )
}
