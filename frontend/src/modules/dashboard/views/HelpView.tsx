import { Link } from 'react-router-dom'

import AppLayout from '../components/AppLayout'
import Markdown from '../components/Markdown'

const SECTION = { label: 'Aide', to: '/help' }

// Markdown examples are rendered with the same component as incident
// pages, so what the help shows is exactly what users will get.
const MARKDOWN_EXAMPLES: { source: string; note?: string }[] = [
  { source: '**gras**, *italique*, `code en ligne`' },
  { source: '1. Arrêter le service\n2. Vider le cache\n3. Redémarrer' },
  { source: '- [x] Sauvegarde vérifiée\n- [ ] Ticket fermé', note: 'Liste de tâches' },
  { source: '[Documentation PostgreSQL](https://www.postgresql.org/docs/)', note: 'Seuls les liens http(s) et mailto sont gardés.' },
  { source: '```bash\nsudo systemctl restart nginx\n```', note: 'Bloc de code coloré, avec bouton « Copier ».' },
  { source: '> Ne pas lancer en production\n> sans fenêtre de maintenance.', note: 'Citation' },
  { source: '| Port | Service |\n| --- | --- |\n| 5432 | PostgreSQL |', note: 'Tableau' },
]

const SEARCH_EXAMPLES: { query: string; meaning: string }[] = [
  { query: 'nginx timeout', meaning: 'les coelbooks qui contiennent nginx et timeout' },
  { query: '"connection refused"', meaning: 'l’expression exacte' },
  { query: 'docker -compose', meaning: 'docker, mais pas compose' },
  { query: 'nginx or traefik', meaning: 'l’un ou l’autre' },
]

function Card({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="pb-card border rounded-4 p-4">
      <h2 className="fs-6 fw-semibold mb-3">{title}</h2>
      <div className="small" style={{ lineHeight: 1.6 }}>
        {children}
      </div>
    </section>
  )
}

export default function HelpView() {
  return (
    <AppLayout section={SECTION}>
      <div className="mx-auto px-4 px-lg-5 py-4" style={{ maxWidth: '56rem' }}>
        <div className="mb-4">
          <h1 className="h4 fw-bold mb-1">Aide</h1>
          <p className="small mb-0" style={{ color: 'var(--pb-text-muted)' }}>
            Tout ce qu&apos;il faut savoir pour documenter un problème résolu et le retrouver plus tard.
          </p>
        </div>

        <div className="d-flex flex-column gap-3">
          <Card id="coelbook" title="Qu'est-ce qu'un coelbook ?">
            <p>
              Un coelbook documente <strong>un problème technique et sa solution</strong>, pour ne jamais avoir à le
              résoudre deux fois. Il se lit dans l&apos;ordre où le problème a été traité :
            </p>
            <ul className="mb-3">
              <li><strong>Problème</strong> : les symptômes, le message d&apos;erreur ;</li>
              <li><strong>Diagnostic</strong> : comment le problème a été analysé ;</li>
              <li><strong>Cause racine</strong> : pourquoi c&apos;est arrivé ;</li>
              <li><strong>Solution</strong> : les étapes qui l&apos;ont résolu ;</li>
              <li><strong>Prévention</strong> : comment l&apos;éviter la prochaine fois.</li>
            </ul>
            <p className="mb-0">
              Les <strong>snippets</strong> gardent les commandes et extraits de code réutilisables, et les{' '}
              <strong>liens</strong> la documentation ou les tickets utiles. Seuls le titre et la catégorie sont
              obligatoires : commencez court, complétez plus tard.
            </p>
          </Card>

          <Card id="statuts" title="Statuts">
            <ul className="mb-0">
              <li><strong>Brouillon</strong> : en cours de rédaction, pas encore considéré comme fiable ;</li>
              <li><strong>Publié</strong> : validé, c&apos;est l&apos;état normal d&apos;un coelbook terminé ;</li>
              <li>
                <strong>Archivé</strong> : plus recommandé (version obsolète, outil abandonné…), mais conservé et
                toujours trouvable par la recherche.
              </li>
            </ul>
          </Card>

          <Card id="recherche" title="Recherche">
            <p>
              La recherche porte sur le titre, le résumé, toutes les sections, les tags, les titres et le contenu des
              snippets. Les accents sont ignorés (« echoue » trouve « échoue ») et les résultats les plus pertinents
              remontent en premier : un mot trouvé dans le titre compte plus qu&apos;un mot trouvé dans la prévention.
            </p>
            <table className="table table-sm table-bordered mb-3">
              <thead>
                <tr>
                  <th scope="col">Vous tapez</th>
                  <th scope="col">Vous trouvez</th>
                </tr>
              </thead>
              <tbody>
                {SEARCH_EXAMPLES.map((e) => (
                  <tr key={e.query}>
                    <td className="font-mono">{e.query}</td>
                    <td>{e.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mb-0">
              Les filtres (catégorie, statut, tag) se combinent avec la recherche, et l&apos;adresse de la page les
              garde : vous pouvez partager une recherche filtrée en copiant son lien.
            </p>
          </Card>

          <Card id="markdown" title="Mise en forme (Markdown)">
            <p>
              Les sections d&apos;un coelbook acceptent le Markdown. Utilisez l&apos;onglet <strong>Aperçu</strong> du
              formulaire pour vérifier le rendu avant d&apos;enregistrer. Un simple retour à la ligne est conservé.
            </p>
            <div className="d-flex flex-column gap-2">
              {MARKDOWN_EXAMPLES.map((e) => (
                <div key={e.source} className="row g-2 align-items-start">
                  <div className="col-md-6">
                    <pre className="pb-code font-mono rounded-3 p-2 mb-0">{e.source}</pre>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-3 p-2">
                      <Markdown>{e.source}</Markdown>
                    </div>
                    {e.note && (
                      <div className="mt-1" style={{ fontSize: '0.75rem', color: 'var(--pb-text-muted)' }}>
                        {e.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="organisation" title="Catégories et tags">
            <p>
              Une <strong>catégorie</strong> est le grand domaine technique d&apos;un coelbook (Docker, Réseau…) : il en
              a toujours exactement une. Gérez-les depuis la page <Link to="/categories">Catégories</Link> ; une
              catégorie utilisée ne peut pas être supprimée.
            </p>
            <p className="mb-0">
              Les <strong>tags</strong> sont des mots-clés plus fins et libres (postgres, timeout, ssl…) : tapez-les
              séparés par des virgules, ils sont créés automatiquement, et les tags existants vous sont proposés.
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
