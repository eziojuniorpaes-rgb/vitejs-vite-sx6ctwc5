import { InfoRow } from '../components/InfoRow'

export function ProfilePage() { return <section className="profile-grid"><div className="card profile-card"><span className="avatar large">EP</span><h2>Ézio Paes</h2><p>Liderança Geral</p></div><div className="card"><h3>Preferências</h3><InfoRow label="Identidade visual" value="Branco, #2e2e2e e vinho luminoso" /><InfoRow label="Acesso" value="Liderança Geral" /><InfoRow label="Tema" value="Claro ou escuro" /></div></section> }
