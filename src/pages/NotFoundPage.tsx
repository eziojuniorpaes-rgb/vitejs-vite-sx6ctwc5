import { Link } from 'react-router-dom'
export function NotFoundPage() { return <section className="card empty"><h2>Página não encontrada</h2><p>O endereço solicitado não existe.</p><Link className="primary" to="/">Voltar ao início</Link></section> }
