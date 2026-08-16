import { useState } from 'react'
import { X } from 'lucide-react'
import { useLotes } from '../context/LotesContext'
import { useLeads } from '../context/LeadsContext'
import { useVisits } from '../context/VisitsContext'
import { TEAM_MEMBERS } from '../utils/teamHelpers'
import { normalizePhoneBR } from '../utils/leadHelpers'
import { VISITA_TIPO_OPTIONS } from '../utils/visitHelpers'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function VisitModal({ visita, presetLote, presetLead, defaultResponsavel, onClose }) {
  const isEditing = Boolean(visita)
  const locked = isEditing || Boolean(presetLote)

  const { lotes } = useLotes()
  const { leads, leadsByLote, addLead, updateLead } = useLeads()
  const { addVisita, updateVisita } = useVisits()

  const [tipo, setTipo] = useState(visita?.tipo ?? (presetLote ? 'imovel' : 'imovel'))
  const [loteId, setLoteId] = useState(visita?.loteId ?? presetLote?.id ?? '')
  const [leadId, setLeadId] = useState(visita?.leadId ?? presetLead?.id ?? '')

  const [contatoOption, setContatoOption] = useState(isEditing ? String(visita.leadId) : 'novo')
  const [nomeCompleto, setNomeCompleto] = useState(visita?.recepcao?.nomeCompleto ?? '')
  const [telefone, setTelefone] = useState(
    visita?.recepcao?.telefone ? visita.recepcao.telefone.replace(/^55/, '') : ''
  )
  const [cpf, setCpf] = useState(visita?.recepcao?.cpf ?? '')

  const [data, setData] = useState(visita?.data ?? '')
  const [hora, setHora] = useState(visita?.hora ?? '')
  const [responsavel, setResponsavel] = useState(visita?.responsavel ?? defaultResponsavel ?? TEAM_MEMBERS[0].nome)
  const [error, setError] = useState('')

  const leadsDoLote = loteId ? leadsByLote(Number(loteId)) : []

  function handleContatoChange(value) {
    setContatoOption(value)
    if (value !== 'novo') {
      const lead = leads.find(l => l.id === Number(value))
      if (lead) {
        setNomeCompleto(lead.nome)
        setTelefone(lead.telefone.replace(/^55/, ''))
      }
    } else {
      setNomeCompleto('')
      setTelefone('')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!data || !hora) {
      setError('Informe data e hora da visita.')
      return
    }
    if (!responsavel) {
      setError('Selecione um responsável.')
      return
    }

    if (tipo === 'imovel') {
      if (!loteId || !leadId) {
        setError('Selecione o lote e o lead.')
        return
      }
      const payload = { tipo: 'imovel', loteId: Number(loteId), leadId: Number(leadId), data, hora, responsavel }
      if (isEditing) {
        updateVisita(visita.id, payload)
      } else {
        addVisita(payload)
        updateLead(Number(leadId), { etapa: 'Em Visita' })
      }
      onClose()
      return
    }

    // tipo === 'empresa'
    if (!nomeCompleto.trim() || !telefone.trim() || !cpf.trim()) {
      setError('Nome completo, CPF e telefone são obrigatórios para liberar a entrada na recepção.')
      return
    }

    const recepcao = { nomeCompleto: nomeCompleto.trim(), cpf: cpf.trim(), telefone: normalizePhoneBR(telefone) }

    if (isEditing) {
      updateVisita(visita.id, { data, hora, responsavel, recepcao })
      onClose()
      return
    }

    let finalLeadId = contatoOption === 'novo' ? null : Number(contatoOption)

    if (finalLeadId === null) {
      finalLeadId = Date.now()
      addLead({
        id: finalLeadId,
        loteId: null,
        nome: recepcao.nomeCompleto,
        telefone: recepcao.telefone,
        etapa: 'Em Visita',
        origem: 'Visita à empresa',
        dataRecebimento: todayISO(),
      })
    } else {
      updateLead(finalLeadId, { etapa: 'Em Visita' })
    }

    addVisita({ tipo: 'empresa', loteId: null, leadId: finalLeadId, data, hora, responsavel, recepcao })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Visita' : 'Marcar Visita'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            {!locked && (
              <div className="view-toggle" style={{ alignSelf: 'flex-start' }}>
                {VISITA_TIPO_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`toggle-btn ${tipo === opt.value ? 'active' : ''}`}
                    onClick={() => setTipo(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {tipo === 'imovel' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="lote">Lote</label>
                    {locked ? (
                      <div className="form-static">
                        {lotes.find(l => l.id === Number(loteId))?.codigo} — {lotes.find(l => l.id === Number(loteId))?.titulo}
                      </div>
                    ) : (
                      <select
                        id="lote"
                        className="form-input"
                        value={loteId}
                        onChange={e => { setLoteId(e.target.value); setLeadId('') }}
                      >
                        <option value="">Selecione o lote</option>
                        {lotes.map(l => (
                          <option key={l.id} value={l.id}>{l.codigo} — {l.titulo}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="lead">Lead</label>
                    {locked ? (
                      <div className="form-static">{leads.find(l => l.id === Number(leadId))?.nome}</div>
                    ) : (
                      <select
                        id="lead"
                        className="form-input"
                        value={leadId}
                        onChange={e => setLeadId(e.target.value)}
                        disabled={!loteId}
                      >
                        <option value="">Selecione o lead</option>
                        {leadsDoLote.map(l => (
                          <option key={l.id} value={l.id}>{l.nome}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {!isEditing && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="contato">Contato</label>
                    <select
                      id="contato"
                      className="form-input"
                      value={contatoOption}
                      onChange={e => handleContatoChange(e.target.value)}
                    >
                      <option value="novo">Novo contato</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="nomeCompleto">Nome completo</label>
                    <input
                      id="nomeCompleto"
                      className="form-input"
                      type="text"
                      value={nomeCompleto}
                      onChange={e => setNomeCompleto(e.target.value)}
                      placeholder="Nome para a recepção"
                      readOnly={!isEditing && contatoOption !== 'novo'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="telefone">Telefone</label>
                    <input
                      id="telefone"
                      className="form-input"
                      type="text"
                      value={telefone}
                      onChange={e => setTelefone(e.target.value)}
                      placeholder="11987654321"
                      readOnly={!isEditing && contatoOption !== 'novo'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cpf">CPF (liberação na recepção)</label>
                  <input
                    id="cpf"
                    className="form-input"
                    type="text"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="data">Data</label>
                <input
                  id="data"
                  className="form-input"
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hora">Hora</label>
                <input
                  id="hora"
                  className="form-input"
                  type="time"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="responsavel">Responsável</label>
              <select
                id="responsavel"
                className="form-input"
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
              >
                {TEAM_MEMBERS.map(member => (
                  <option key={member.nome} value={member.nome}>{member.nome} — {member.cargo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar' : 'Marcar Visita'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
