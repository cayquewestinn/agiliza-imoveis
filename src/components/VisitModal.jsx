import { useState } from 'react'
import { X } from 'lucide-react'
import { useLotes } from '../context/LotesContext'
import { useLeads } from '../context/LeadsContext'
import { useVisits } from '../context/VisitsContext'
import { useProfiles } from '../context/ProfilesContext'
import { normalizePhoneBR } from '../utils/leadHelpers'
import { VISITA_TIPO_OPTIONS } from '../utils/visitHelpers'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function VisitModal({ visita, presetLote, presetLead, defaultResponsavelId, onClose }) {
  const isEditing = Boolean(visita)
  const locked = isEditing || Boolean(presetLote)

  const { lotes } = useLotes()
  const { leads, leadsByLote, addLead, updateLead } = useLeads()
  const { addVisita, updateVisita } = useVisits()
  const { profiles } = useProfiles()

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
  const [responsavelId, setResponsavelId] = useState(visita?.responsavelId ?? defaultResponsavelId ?? profiles[0]?.id ?? '')
  const [feedback, setFeedback] = useState(visita?.feedback ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const leadsDoLote = loteId ? leadsByLote(loteId) : []

  function handleContatoChange(value) {
    setContatoOption(value)
    if (value !== 'novo') {
      const lead = leads.find(l => l.id === value)
      if (lead) {
        setNomeCompleto(lead.nome)
        setTelefone(lead.telefone.replace(/^55/, ''))
      }
    } else {
      setNomeCompleto('')
      setTelefone('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!data || !hora) {
      setError('Informe data e hora da visita.')
      return
    }
    if (!responsavelId) {
      setError('Selecione um responsável.')
      return
    }

    setSaving(true)

    if (tipo === 'imovel') {
      if (!loteId || !leadId) {
        setError('Selecione o lote e o lead.')
        setSaving(false)
        return
      }
      const payload = { tipo: 'imovel', loteId, leadId, data, hora, responsavelId, feedback }
      if (isEditing) {
        await updateVisita(visita.id, payload)
      } else {
        await addVisita(payload)
        await updateLead(leadId, { etapa: 'Em Visita' })
      }
      setSaving(false)
      onClose()
      return
    }

    // tipo === 'empresa'
    if (!nomeCompleto.trim() || !telefone.trim() || !cpf.trim()) {
      setError('Nome completo, CPF e telefone são obrigatórios para liberar a entrada na recepção.')
      setSaving(false)
      return
    }

    const recepcao = { nomeCompleto: nomeCompleto.trim(), cpf: cpf.trim(), telefone: normalizePhoneBR(telefone) }

    if (isEditing) {
      await updateVisita(visita.id, { data, hora, responsavelId, recepcao, feedback })
      setSaving(false)
      onClose()
      return
    }

    let finalLeadId = contatoOption === 'novo' ? null : contatoOption

    if (finalLeadId === null) {
      const novoLead = await addLead({
        loteId: null,
        nome: recepcao.nomeCompleto,
        telefone: recepcao.telefone,
        etapa: 'Em Visita',
        origem: 'Visita à empresa',
        dataRecebimento: todayISO(),
      })
      if (!novoLead) {
        setError('Não foi possível criar o contato. Tente novamente.')
        setSaving(false)
        return
      }
      finalLeadId = novoLead.id
    } else {
      await updateLead(finalLeadId, { etapa: 'Em Visita' })
    }

    await addVisita({ tipo: 'empresa', loteId: null, leadId: finalLeadId, data, hora, responsavelId, recepcao, feedback })
    setSaving(false)
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
                        {lotes.find(l => l.id === loteId)?.codigo} — {lotes.find(l => l.id === loteId)?.titulo}
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
                      <div className="form-static">{leads.find(l => l.id === leadId)?.nome}</div>
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
                value={responsavelId}
                onChange={e => setResponsavelId(e.target.value)}
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.nome} — {profile.cargo}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="feedback">Feedback do cliente</label>
              <textarea
                id="feedback"
                className="form-input"
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Ex.: Cliente disse que não gostou do imóvel, procurar outro. / Cliente gostou, mas o investimento só cai no dia 30/10."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{isEditing ? 'Salvar' : 'Marcar Visita'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
