import { useState } from 'react'
import { X } from 'lucide-react'
import { useLeads } from '../context/LeadsContext'
import { useVisits } from '../context/VisitsContext'
import { useProfiles } from '../context/ProfilesContext'
import { normalizePhoneBR } from '../utils/leadHelpers'
import { AGENDA_WEEK_HOURS, hourLabel } from '../utils/visitHelpers'
import { useClosingTransition } from '../hooks/useClosingTransition'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const CONFLICT_WINDOW_MINUTES = 60

function toMinutes(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function VisitModal({ visita, presetData, defaultResponsavelId, onClose }) {
  const isEditing = Boolean(visita)

  const { leads, addLead, updateLead } = useLeads()
  const { visitas, addVisita, updateVisita } = useVisits()
  const { profiles } = useProfiles()

  const [contatoOption, setContatoOption] = useState(isEditing ? String(visita.leadId) : 'novo')
  const [nomeCompleto, setNomeCompleto] = useState(visita?.recepcao?.nomeCompleto ?? '')
  const [telefone, setTelefone] = useState(
    visita?.recepcao?.telefone ? visita.recepcao.telefone.replace(/^55/, '') : ''
  )
  const [cpf, setCpf] = useState(visita?.recepcao?.cpf ?? '')

  const [data, setData] = useState(visita?.data ?? presetData ?? '')
  const [hora, setHora] = useState(visita?.hora ?? '')
  const [responsavelId, setResponsavelId] = useState(visita?.responsavelId ?? defaultResponsavelId ?? profiles[0]?.id ?? '')
  const [feedback, setFeedback] = useState(visita?.feedback ?? '')
  // Observações vivem no lead, não na visita — ao editar, carrega o que já
  // está gravado no contato para não sobrescrever com um campo vazio.
  const [observacoes, setObservacoes] = useState(
    (isEditing ? leads.find(l => l.id === visita.leadId)?.observacoes : '') ?? ''
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [conflito, setConflito] = useState(null)
  const { closing, requestClose } = useClosingTransition(onClose)
  useBodyScrollLock()

  function encontrarConflito() {
    return visitas.find(v => (
      v.status === 'Agendada' &&
      v.responsavelId === responsavelId &&
      v.data === data &&
      (!isEditing || v.id !== visita.id) &&
      Math.abs(toMinutes(v.hora) - toMinutes(hora)) < CONFLICT_WINDOW_MINUTES
    ))
  }

  // Only offer times that are actually free for this responsável on this
  // data — an already-booked slot (within the conflict window) never shows
  // up as a choice, instead of letting someone pick it and then warning.
  const horaOriginal = isEditing ? visita.hora : null
  const baseSlots = AGENDA_WEEK_HOURS.map(hourLabel)
  const todosOsSlots = horaOriginal && !baseSlots.includes(horaOriginal)
    ? [...baseSlots, horaOriginal].sort()
    : baseSlots
  const opcoesHora = !data || !responsavelId
    ? todosOsSlots
    : todosOsSlots.filter(slot => (
        slot === horaOriginal ||
        !visitas.some(v => (
          v.status === 'Agendada' &&
          v.responsavelId === responsavelId &&
          v.data === data &&
          (!isEditing || v.id !== visita.id) &&
          Math.abs(toMinutes(v.hora) - toMinutes(slot)) < CONFLICT_WINDOW_MINUTES
        ))
      ))

  function handleContatoChange(value) {
    setContatoOption(value)
    if (value !== 'novo') {
      const lead = leads.find(l => l.id === value)
      if (lead) {
        setNomeCompleto(lead.nome)
        setTelefone(lead.telefone.replace(/^55/, ''))
        setObservacoes(lead.observacoes ?? '')
      }
    } else {
      setNomeCompleto('')
      setTelefone('')
      setObservacoes('')
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

    if (!conflito) {
      const encontrado = encontrarConflito()
      if (encontrado) {
        setConflito(encontrado)
        return
      }
    }

    setSaving(true)

    if (!nomeCompleto.trim() || !telefone.trim() || !cpf.trim()) {
      setError('Nome completo, CPF e telefone são obrigatórios para liberar a entrada na recepção.')
      setSaving(false)
      return
    }

    const recepcao = { nomeCompleto: nomeCompleto.trim(), cpf: cpf.trim(), telefone: normalizePhoneBR(telefone) }

    if (isEditing) {
      await updateVisita(visita.id, { data, hora, responsavelId, recepcao, feedback })
      if (visita.leadId) {
        await updateLead(visita.leadId, { observacoes })
      }
      setSaving(false)
      requestClose()
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
        observacoes,
      })
      if (!novoLead) {
        setError('Não foi possível criar o contato. Tente novamente.')
        setSaving(false)
        return
      }
      finalLeadId = novoLead.id
    } else {
      await updateLead(finalLeadId, { etapa: 'Em Visita', observacoes })
    }

    await addVisita({ tipo: 'empresa', loteId: null, leadId: finalLeadId, data, hora, responsavelId, recepcao, feedback })
    setSaving(false)
    requestClose()
  }

  return (
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Visita' : 'Marcar Visita'}</h2>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="data">Data</label>
                <input
                  id="data"
                  className="form-input"
                  type="date"
                  value={data}
                  onChange={e => { setConflito(null); setData(e.target.value); setHora('') }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="hora">Hora</label>
                <select
                  id="hora"
                  className="form-input"
                  value={hora}
                  onChange={e => { setConflito(null); setHora(e.target.value) }}
                >
                  <option value="">
                    {data && responsavelId ? 'Selecione um horário disponível' : 'Selecione a data e o responsável primeiro'}
                  </option>
                  {opcoesHora.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="responsavel">Responsável</label>
              <select
                id="responsavel"
                className="form-input"
                value={responsavelId}
                onChange={e => { setConflito(null); setResponsavelId(e.target.value); setHora('') }}
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.nome} — {profile.cargo}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="observacoes">Observações sobre o cliente</label>
              <textarea
                id="observacoes"
                className="form-input"
                rows={3}
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Ex.: Motorista de aplicativo. Procura dois dormitórios na zona sul, com entrada de trinta mil reais."
              />
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

            {conflito && (
              <div className="form-error">
                {profiles.find(p => p.id === conflito.responsavelId)?.nome ?? 'Este responsável'} já tem uma visita marcada em {conflito.data.split('-').reverse().join('/')} às {conflito.hora}. Clique novamente em "{isEditing ? 'Salvar' : 'Marcar Visita'}" para confirmar mesmo assim.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={requestClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{conflito ? 'Confirmar mesmo assim' : (isEditing ? 'Salvar' : 'Marcar Visita')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
