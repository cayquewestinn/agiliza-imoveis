import { Header } from '../components/Header'
import { CheckCircle2, AlertTriangle, Gauge } from 'lucide-react'
import { useTasks } from '../context/TasksContext'
import { useUser } from '../context/UserContext'
import { statusToClassName, isLate, parsePrazo } from '../utils/taskHelpers'

export function Dashboard() {
  const { tasks: allTasks } = useTasks()
  const { currentUser, isAdmin } = useUser()
  const tasks = isAdmin ? allTasks : allTasks.filter(t => t.responsavel === currentUser.nome)

  const concluidas = tasks.filter(t => t.status === 'Concluído').length
  const emAtraso = tasks.filter(isLate).length
  const produtividade = tasks.length > 0 ? Math.round((concluidas / tasks.length) * 100) : 0

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
          <div className="stat-row">
            <div className="stat-row-item">
              <div className="stat-row-label">
                <CheckCircle2 size={15} />
                Tarefas Concluídas
              </div>
              <div className="stat-row-value mono">{concluidas}</div>
              <div className="stat-row-trend trend-neutral">de {tasks.length} tarefas no total</div>
            </div>

            <div className="stat-row-item">
              <div className="stat-row-label">
                <AlertTriangle size={15} />
                Em Atraso
              </div>
              <div className="stat-row-value mono">{emAtraso}</div>
              <div className={`stat-row-trend ${emAtraso > 0 ? 'trend-down' : 'trend-neutral'}`}>
                {emAtraso > 0 ? 'requer atenção' : 'nenhuma pendência'}
              </div>
            </div>

            <div className="stat-row-item">
              <div className="stat-row-label">
                <Gauge size={15} />
                Produtividade
              </div>
              <div className="stat-row-value mono">{produtividade}%</div>
              <div className="stat-row-trend trend-neutral">tarefas concluídas / total</div>
            </div>
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
