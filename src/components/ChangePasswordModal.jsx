import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { Modal } from './Modal'

export function ChangePasswordModal({ onClose }) {
  const { changePassword } = useUser()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (novaSenha.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }
    setError('')
    setSaving(true)
    const result = await changePassword(novaSenha)
    setSaving(false)
    if (!result.ok) {
      setError(result.message || 'Não foi possível trocar a senha. Tente novamente.')
      return
    }
    setSuccess(true)
  }

  return (
    <Modal titulo="Trocar Senha" onClose={onClose}>
      {({ requestClose }) => (
        success ? (
          <div className="modal-body">
            <p>Senha alterada com sucesso.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="novaSenha">Nova senha</label>
                <input
                  id="novaSenha"
                  className="form-input"
                  type="password"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmarSenha">Confirmar nova senha</label>
                <input
                  id="confirmarSenha"
                  className="form-input"
                  type="password"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={requestClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )
      )}
    </Modal>
  )
}
