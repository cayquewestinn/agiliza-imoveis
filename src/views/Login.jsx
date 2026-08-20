import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'

export function Login() {
  const { login } = useUser()
  const { theme } = useTheme()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(usuario, senha)
    if (!ok) {
      setError('Usuário ou senha inválidos.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand-wrap">
          <img
            src={theme === 'dark' ? '/logo-agiliza.png' : '/logo-agiliza-ink.png'}
            alt="Agiliza"
            className="login-brand"
          />
          <div className="carimbo carimbo-login" aria-hidden="true">
            <span className="carimbo-text">Acesso<br />Restrito</span>
          </div>
        </div>

        <h1 className="login-title">Entrar</h1>
        <p className="login-subtitle">Acesse com seu usuário e senha.</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="usuario">Usuário</label>
            <input
              id="usuario"
              className="form-input"
              type="text"
              value={usuario}
              onChange={e => { setUsuario(e.target.value); setError('') }}
              placeholder="ex.: cayque"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              className="form-input"
              type="password"
              value={senha}
              onChange={e => { setSenha(e.target.value); setError('') }}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary login-submit">
            <LogIn size={16} /> Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
