import { useState } from 'react'
import { X } from 'lucide-react'
import { LOTE_STATUS_OPTIONS, TIPO_IMOVEL_OPTIONS } from '../utils/loteHelpers'
import { useClosingTransition } from '../hooks/useClosingTransition'

export function LoteModal({ lote, onClose, onSave }) {
  const isEditing = Boolean(lote)
  const [codigo, setCodigo] = useState(lote?.codigo ?? '')
  const [titulo, setTitulo] = useState(lote?.titulo ?? '')
  const [tipoImovel, setTipoImovel] = useState(lote?.tipoImovel ?? TIPO_IMOVEL_OPTIONS[0])
  const [status, setStatus] = useState(lote?.status ?? LOTE_STATUS_OPTIONS[0])
  const [endereco, setEndereco] = useState(lote?.endereco ?? '')
  const [bairro, setBairro] = useState(lote?.bairro ?? '')
  const [cidade, setCidade] = useState(lote?.cidade ?? '')
  const [uf, setUf] = useState(lote?.uf ?? '')
  const [areaUtil, setAreaUtil] = useState(lote?.areaUtil ?? '')
  const [quartos, setQuartos] = useState(lote?.quartos ?? 0)
  const [banheiros, setBanheiros] = useState(lote?.banheiros ?? 0)
  const [vagas, setVagas] = useState(lote?.vagas ?? 0)
  const [valorAvaliacao, setValorAvaliacao] = useState(lote?.valorAvaliacao ?? '')
  const [dataLeilao, setDataLeilao] = useState(lote?.dataLeilao ?? '')
  const [comitente, setComitente] = useState(lote?.comitente ?? '')
  const [error, setError] = useState('')
  const { closing, requestClose } = useClosingTransition(onClose)

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('Informe um título para o lote.')
      return
    }
    if (!codigo.trim()) {
      setError('Informe o código do lote.')
      return
    }
    onSave({
      codigo: codigo.trim(),
      titulo: titulo.trim(),
      tipoImovel,
      status,
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      uf: uf.trim().toUpperCase(),
      areaUtil: Number(areaUtil) || 0,
      quartos: Number(quartos) || 0,
      banheiros: Number(banheiros) || 0,
      vagas: Number(vagas) || 0,
      valorAvaliacao: Number(valorAvaliacao) || 0,
      dataLeilao,
      comitente: comitente.trim(),
    })
  }

  return (
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Lote' : 'Novo Lote'}</h2>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="codigo">Código</label>
                <input
                  id="codigo"
                  className="form-input"
                  type="text"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  placeholder="Ex.: LT-045"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {LOTE_STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="titulo">Título</label>
              <input
                id="titulo"
                className="form-input"
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex.: Apartamento 3 quartos com varanda"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="tipoImovel">Tipo de imóvel</label>
                <select
                  id="tipoImovel"
                  className="form-input"
                  value={tipoImovel}
                  onChange={e => setTipoImovel(e.target.value)}
                >
                  {TIPO_IMOVEL_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="comitente">Comitente</label>
                <input
                  id="comitente"
                  className="form-input"
                  type="text"
                  value={comitente}
                  onChange={e => setComitente(e.target.value)}
                  placeholder="Nome do comitente"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="endereco">Endereço</label>
              <input
                id="endereco"
                className="form-input"
                type="text"
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
                placeholder="Rua, número"
              />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label" htmlFor="bairro">Bairro</label>
                <input
                  id="bairro"
                  className="form-input"
                  type="text"
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cidade">Cidade</label>
                <input
                  id="cidade"
                  className="form-input"
                  type="text"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="uf">UF</label>
                <input
                  id="uf"
                  className="form-input"
                  type="text"
                  maxLength={2}
                  value={uf}
                  onChange={e => setUf(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-4">
              <div className="form-group">
                <label className="form-label" htmlFor="areaUtil">Área (m²)</label>
                <input
                  id="areaUtil"
                  className="form-input"
                  type="number"
                  min="0"
                  value={areaUtil}
                  onChange={e => setAreaUtil(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="quartos">Quartos</label>
                <input
                  id="quartos"
                  className="form-input"
                  type="number"
                  min="0"
                  value={quartos}
                  onChange={e => setQuartos(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="banheiros">Banheiros</label>
                <input
                  id="banheiros"
                  className="form-input"
                  type="number"
                  min="0"
                  value={banheiros}
                  onChange={e => setBanheiros(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vagas">Vagas</label>
                <input
                  id="vagas"
                  className="form-input"
                  type="number"
                  min="0"
                  value={vagas}
                  onChange={e => setVagas(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="valorAvaliacao">Valor de avaliação (R$)</label>
              <input
                id="valorAvaliacao"
                className="form-input"
                type="number"
                min="0"
                value={valorAvaliacao}
                onChange={e => setValorAvaliacao(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dataLeilao">Data do leilão</label>
              <input
                id="dataLeilao"
                className="form-input"
                type="date"
                value={dataLeilao}
                onChange={e => setDataLeilao(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={requestClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar' : 'Criar Lote'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
