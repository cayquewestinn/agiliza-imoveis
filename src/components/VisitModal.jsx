import { useMemo, useState } from 'react'
import { Search, UserPlus, Check } from 'lucide-react'
import { useLeads } from '../context/LeadsContext'
import { useVisits } from '../context/VisitsContext'
import { useProfiles } from '../context/ProfilesContext'
import { useUser } from '../context/UserContext'
import { formatPhone, normalizePhoneBR } from '../utils/leadHelpers'
import { AGENDA_WEEK_HOURS, hourLabel } from '../utils/visitHelpers'
import { Modal } from './Modal'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const CONFLICT_WINDOW_MINUTES = 60
const SUGESTOES_MAX = 8

function toMinutes(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function VisitModal({ visita, presetData, defaultResponsavelId, leadPreselecionado, onClose }) {
  const isEditing = Boolean(visita)

  const { leads, addLead, updateLead } = useLeads()
  const { visitas, addVisita, updateVisita } = useVisits()
  const { profiles } = useProfiles()
  const { currentUser } = useUser()

  // Vindo de um lead, o contato já está resolvido: o campo de busca nem
  // aparece. É o caso comum, e o que torna a lista de 1.389 nomes evitável.
  const leadInicial = leadPreselecionado
    ?? (isEditing ? leads.find(l => l.id === visita.leadId) : null)

  const [contatoId, setContatoId] = useState(leadInicial?.id ?? 'novo')
  const [buscaContato, setBuscaContato] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState(
    visita?.recepcao?.nomeCompleto ?? leadPreselecionado?.nome ?? ''
  )
  const [telefone, setTelefone] = useState(() => {
    const bruto = visita?.recepcao?.telefone ?? leadPreselecionado?.telefone ?? ''
    return bruto.replace(/^55/, '')
  })
  const [cpf, setCpf] = useState(visita?.recepcao?.cpf ?? '')

  const [data, setData] = useState(visita?.data ?? presetData ?? '')
  const [hora, setHora] = useState(visita?.hora ?? '')
  const [responsavelId, setResponsavelId] = useState(
    visita?.responsavelId ?? defaultResponsavelId ?? currentUser?.id ?? profiles[0]?.id ?? ''
  )
  const [feedback, setFeedback] = useState(visita?.feedback ?? '')
  // Observações vivem no lead, não na visita — ao editar, carrega o que já
  // está gravado no contato para não sobrescrever com um campo vazio.
  const [observacoes, setObservacoes] = useState(leadInicial?.observacoes ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [conflito, setConflito] = useState(null)

  const contatoTravado = Boolean(leadPreselecionado) || isEditing
  const contatoEscolhido = contatoId === 'novo' ? null : leads.find(l => l.id === contatoId)

  // Mesmo predicado de busca já usado no modal de etapa do Painel — nome,
  // telefone ou código do imóvel — para o operador não aprender duas buscas.
  const sugestoes = useMemo(() => {
    const termo = buscaContato.trim().toLowerCase()
    if (!termo) return []
    const digitos = termo.replace(/\D/g, '')
    return leads
      .filter(l => l.nome.toLowerCase().includes(termo) || (digitos && l.telefone.includes(digitos)))
      .slice(0, SUGESTOES_MAX)
  }, [buscaContato, leads])

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

  function escolherContato(lead) {
    setContatoId(lead.id)
    setNomeCompleto(lead.nome)
    setTelefone(lead.telefone.replace(/^55/, ''))
    setObservacoes(lead.observacoes ?? '')
    setBuscaContato('')
    setError('')
  }

  function usarNovoContato() {
    setContatoId('novo')
    setNomeCompleto('')
    setTelefone('')
    setObservacoes('')
    setBuscaContato('')
    setError('')
  }

  // Campo obrigatório vem ANTES de qualquer checagem de conflito ou estado de
  // gravação: um CPF em branco não pode ficar escondido atrás de um aviso de
  // horário, nem só aparecer depois de "Confirmar mesmo assim".
  function primeiroErro() {
    if (!nomeCompleto.trim() || !telefone.trim() || !cpf.trim()) {
      return 'Nome completo, CPF e telefone são obrigatórios para liberar a entrada na recepção.'
    }
    if (!data || !hora) return 'Informe data e hora da visita.'
    if (!responsavelId) return 'Selecione um responsável.'
    return ''
  }

  async function gravar(requestClose) {
    setSaving(true)
    const recepcao = { nomeCompleto: nomeCompleto.trim(), cpf: cpf.trim(), telefone: normalizePhoneBR(telefone) }

    if (isEditing) {
      await updateVisita(visita.id, { data, hora, responsavelId, recepcao, feedback })
      if (visita.leadId) {
        await updateLead(visita.leadId, { observacoes }, { silencioso: true })
      }
      setSaving(false)
      requestClose()
      return
    }

    let finalLeadId = contatoId === 'novo' ? null : contatoId

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
      await updateLead(finalLeadId, { etapa: 'Em Visita', observacoes }, { silencioso: true })
    }

    await addVisita({ tipo: 'empresa', loteId: null, leadId: finalLeadId, data, hora, responsavelId, recepcao, feedback })
    setSaving(false)
    requestClose()
  }

  function handleSubmit(e, requestClose) {
    e.preventDefault()

    const problema = primeiroErro()
    if (problema) {
      setError(problema)
      setConflito(null)
      return
    }
    setError('')

    const encontrado = encontrarConflito()
    if (encontrado) {
      setConflito(encontrado)
      return
    }

    gravar(requestClose)
  }

  return (
    <Modal titulo={isEditing ? 'Editar Visita' : 'Marcar Visita'} wide onClose={onClose}>
      {({ requestClose }) => (
        <form onSubmit={e => handleSubmit(e, requestClose)}>
          <div className="modal-body">
            {!isEditing && (
              <div className="form-group">
                <label className="form-label" htmlFor="contato-busca">Contato</label>

                {contatoTravado || contatoEscolhido ? (
                  <div className="contato-escolhido">
                    <Check size={15} className="contato-escolhido-icone" aria-hidden="true" />
                    <div className="contato-escolhido-info">
                      <span className="contato-escolhido-nome">
                        {contatoEscolhido?.nome ?? nomeCompleto}
                      </span>
                      {telefone && (
                        <span className="contato-escolhido-tel">
                          {formatPhone(normalizePhoneBR(telefone))}
                        </span>
                      )}
                    </div>
                    {!contatoTravado && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={usarNovoContato}>
                        Trocar
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="search-field">
                      <Search size={16} className="search-field-icon" />
                      <input
                        id="contato-busca"
                        type="text"
                        className="search-field-input"
                        placeholder="Buscar contato por nome ou telefone..."
                        value={buscaContato}
                        onChange={e => setBuscaContato(e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    {buscaContato.trim() !== '' && (
                      <div className="contato-sugestoes">
                        {sugestoes.length === 0 && (
                          <div className="contato-sugestao-vazia">
                            Nenhum contato encontrado. Preencha os dados abaixo para criar um novo.
                          </div>
                        )}
                        {sugestoes.map(l => (
                          <button
                            type="button"
                            key={l.id}
                            className="contato-sugestao"
                            onClick={() => escolherContato(l)}
                          >
                            <span className="contato-sugestao-nome">{l.nome}</span>
                            <span className="contato-sugestao-tel">{formatPhone(l.telefone)}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="form-hint">
                      <UserPlus size={13} aria-hidden="true" /> Sem busca, os dados abaixo criam um contato novo.
                    </p>
                  </>
                )}
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
                  readOnly={!isEditing && contatoId !== 'novo'}
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
                  readOnly={!isEditing && contatoId !== 'novo'}
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
          </div>

          {/* Colado no rodapé, junto do botão que dispara o envio: no topo de
              um modal que rola até 90vh, o aviso nascia fora da tela. */}
          {(error || conflito) && (
            <div className="modal-alerta">
              {error && <div className="form-error">{error}</div>}
              {conflito && !error && (
                <div className="form-error">
                  {profiles.find(p => p.id === conflito.responsavelId)?.nome ?? 'Este responsável'} já tem uma visita marcada em {conflito.data.split('-').reverse().join('/')} às {conflito.hora}.
                </div>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={requestClose} disabled={saving}>Cancelar</button>
            {conflito ? (
              // Botão próprio, e não uma segunda batida no mesmo: confirmar um
              // conflito é uma decisão diferente de marcar uma visita livre.
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={() => gravar(requestClose)}
              >
                Marcar mesmo assim
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Marcar Visita')}
              </button>
            )}
          </div>
        </form>
      )}
    </Modal>
  )
}
