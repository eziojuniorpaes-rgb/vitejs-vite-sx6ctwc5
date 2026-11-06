import { useState } from 'react'

export function NewReportPage() {
  const [note, setNote] = useState('')
  return <div className="report-grid"><section className="card"><span className="eyebrow">RELATÓRIO INTELIGENTE</span><h2>Novo relatório de culto</h2><div className="form-grid"><label>Data<input type="date" /></label><label>Tipo de culto<select><option>Culto do Espírito</option><option>Celebração</option><option>Evento especial</option><option>Outro</option></select></label></div><label>Conte o que aconteceu<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: houve uma falha no projetor durante o louvor." /></label><button className="primary" disabled={!note.trim()}>Analisar anotação</button></section><aside className="card preview"><h3>Relatório em construção</h3><p>{note || 'As anotações confirmadas aparecerão aqui.'}</p><div className="preview-actions"><button className="secondary">Salvar rascunho</button><button className="primary" disabled={!note.trim()}>Finalizar</button></div></aside></div>
}
