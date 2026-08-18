import { Header } from '../components/Header'
import { useTasks } from '../context/TasksContext'
import { useLeads } from '../context/LeadsContext'
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

export function Dashboard() {
  const { tasks: allTasks } = useTasks()
  const { leads } = useLeads()
  const { currentUser, isAdmin } = useUser()
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.responsavelId === currentUser.id)

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
      </div>
    </div>
  )
}
