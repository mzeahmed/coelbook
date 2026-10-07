# Dépendances

Ce document explique les dépendances directement déclarées par Coelbook :
`frontend/package.json` pour le navigateur et les outils frontend, et
`api/go.mod` pour l'API Go. Les paquets présents uniquement dans
`package-lock.json` ou `go.sum` sont des dépendances transitives résolues par
npm ou Go ; ils ne constituent pas des choix directs du projet.

Les versions ci-dessous sont celles déclarées dans les manifestes. Une mise à
jour de dépendance doit conserver cette page exacte : raison d'être, zone
d'intégration et conséquence d'un retrait.

## Frontend — exécution

| Dépendance | Version | Raison d'être et intégration |
| --- | --- | --- |
| `react` | `^19.2.7` | Bibliothèque d'interface : composants, état et rendu déclaratif de toute l'application. Son retrait impose de remplacer le frontend. |
| `react-dom` | `^19.2.7` | Adaptateur React pour le navigateur ; crée la racine dans `src/main.tsx`. Indissociable de React pour afficher l'interface. |
| `react-router-dom` | `^7.18.1` | Routage côté navigateur, liens, paramètres et redirections d'authentification dans `src/router` et les vues. Sans lui, les pages et leurs gardes doivent être réécrites. |
| `bootstrap` | `^5.3.8` | Base CSS des grilles, formulaires, boutons et variables visuelles. Importé au démarrage puis personnalisé par `design-system.css`. |
| `@fortawesome/fontawesome-free` | `^7.3.1` | Police et classes d'icônes utilisées par l'interface ; sa feuille CSS est chargée dans `src/main.tsx`. |
| `@fontsource/inter` | `^5.3.0` | Distribue localement la police de texte Inter, sans dépendre d'un CDN. Les graisses 400 à 700 sont importées au démarrage. |
| `@fontsource/jetbrains-mono` | `^5.3.0` | Distribue localement la police monospace des extraits de code ; les graisses 400 et 500 sont chargées au démarrage. |
| `highlight.js` | `^11.12.0` | Colore les snippets. Seuls le cœur et les langages pris en charge sont enregistrés dans `src/modules/dashboard/lib/highlight.ts` afin de limiter le bundle. |
| `react-markdown` | `^10.1.0` | Rend de façon sûre les champs Markdown des incidents et l'aide dans les composants `Markdown`. |
| `remark-gfm` | `^4.0.1` | Ajoute la syntaxe GitHub Flavored Markdown (tables, listes de tâches, barrés) au rendu et à l'analyse des titres. |
| `remark-breaks` | `^4.0.0` | Transforme les retours à la ligne simples en sauts de ligne visibles dans le Markdown affiché. |
| `unified` | `^11.0.5` | Moteur de traitement Markdown utilisé pour analyser le document avant de construire la table des matières. |
| `remark-parse` | `^11.0.0` | Analyse le texte Markdown en arbre MDAST pour extraire les titres, avec la même syntaxe que le rendu. |
| `mdast-util-to-string` | `^4.0.0` | Convertit le contenu d'un nœud titre MDAST en texte pour calculer ses ancres et la table des matières. |

## Frontend — développement, compilation et qualité

Ces paquets ne sont pas envoyés au navigateur comme fonctionnalités métier ;
ils servent à développer, vérifier et produire le frontend.

| Dépendance | Version | Raison d'être et intégration |
| --- | --- | --- |
| `vite` | `^8.1.1` | Serveur de développement, build de production et aperçu via les scripts npm. |
| `@vitejs/plugin-react` | `^6.0.3` | Intègre React et le rafraîchissement à chaud à Vite ; déclaré dans `vite.config.ts`. |
| `typescript` | `~6.0.2` | Vérifie les types TypeScript avant le build (`tsc -b`). |
| `@types/react` | `^19.2.17` | Déclarations TypeScript pour React et JSX. |
| `@types/react-dom` | `^19.2.3` | Déclarations TypeScript pour l'adaptateur React DOM. |
| `@types/node` | `^24.13.2` | Types des modules Node employés par la configuration Vite, notamment `node:url`. |
| `@types/mdast` | `^4.0.4` | Types TypeScript des arbres Markdown MDAST, utilisés par `lib/headings.ts`. |
| `eslint` | `^10.6.0` | Moteur d'analyse statique exécuté par `npm run lint`. |
| `@eslint/js` | `^10.0.1` | Configuration de règles JavaScript recommandées utilisée par `eslint.config.js`. |
| `typescript-eslint` | `^8.62.0` | Parse et applique les règles ESLint aux fichiers TypeScript et TSX. |
| `eslint-plugin-react-hooks` | `^7.1.1` | Vérifie les règles d'appel et les dépendances des Hooks React. |
| `eslint-plugin-react-refresh` | `^0.5.3` | Vérifie la compatibilité des exports avec React Fast Refresh sous Vite. |
| `globals` | `^17.7.0` | Déclare les variables globales du navigateur à ESLint sans masquer de vraies erreurs. |

## API Go — dépendances directes

| Module | Version | Raison d'être et intégration |
| --- | --- | --- |
| `github.com/golang-jwt/jwt/v5` | `v5.3.1` | Signe et vérifie les jetons d'accès JWT dans le module d'authentification. |
| `github.com/jackc/pgx/v5` | `v5.10.0` | Pilote PostgreSQL et pool de connexions ; utilisé par la couche base de données, les transactions et le code généré par sqlc. |
| `github.com/joho/godotenv` | `v1.5.1` | Charge le fichier `.env` lors du développement local, tout en laissant Docker fournir les variables en production. |
| `golang.org/x/crypto` | `v0.54.0` | Fournit bcrypt pour hacher et vérifier les mots de passe. |
| `golang.org/x/text` | `v0.40.0` | Fournit la normalisation Unicode utilisée pour créer des slugs ASCII stables et sans accents. |

## API Go — dépendances indirectes déclarées

Ces modules ne sont pas importés directement par le code applicatif. Go les
conserve explicitement dans `go.mod` car ils sont nécessaires au graphe de
modules de `pgx` ou aux primitives qu'il emploie.

| Module | Version | Raison d'être |
| --- | --- | --- |
| `github.com/jackc/pgpassfile` | `v1.0.0` | Lecture du format PostgreSQL `.pgpass`, fournie transitivement par l'écosystème pgx. |
| `github.com/jackc/pgservicefile` | `v0.0.0-20240606120523-5a60cdf6a761` | Lecture des profils PostgreSQL `pg_service.conf`, utilisée transitivement par la configuration pgx. |
| `github.com/jackc/puddle/v2` | `v2.2.2` | Implémentation de pool générique sur laquelle repose le pool de connexions pgx. |
| `golang.org/x/sync` | `v0.22.0` | Primitives de synchronisation complémentaires, requises transitivement par la pile PostgreSQL. |

## Dépendances système et outils associés

PostgreSQL, Docker, Docker Compose, `goose` et `sqlc` ne sont ni des paquets
npm ni des modules Go déclarés dans ce dépôt. Ils sont néanmoins requis pour
l'exécution ou les migrations ; leurs prérequis et commandes sont documentés
dans le [README](../README.md#requirements) et le [guide de développement](development.md).
