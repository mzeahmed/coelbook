# User Guide

How to use Coelbook once it is running. For installing and running it, see the [README](../../README.md#getting-started).

The application itself is in French; the labels below are quoted as they appear on screen. The same content, in French, is available in the app under **Aide** in the sidebar.

---

# First launch

1. Open http://coelbook.local. A fresh instance redirects to the **setup wizard**.
2. Create the **administrator account** (name, email, password of at least 8 characters).
3. Name the **instance** and pick its time zone and language.
4. Finish setup and sign in.

Setup also creates a default set of categories (Base de données, CI/CD, Docker, Réseau, Sécurité, Système), so the first incident can be written right away. They can be renamed or deleted later.

A forgotten password can be reset from the sign-in page (**Mot de passe oublié ?**). In development, the reset email lands in Mailpit (http://localhost:8025).

---

# The dashboard

**Tableau de bord** is the landing page after sign-in:

- key figures: total incidents, and how many are published, drafts and archived — each links to the matching list;
- the incidents updated most recently;
- weekly activity over the last 12 weeks;
- incidents per category and the most used tags — each links to the list filtered on it.

---

# Writing an incident

An incident (shown as a *coelbook* in the app) documents **one technical problem and its solution**. Create one with **Nouveau coelbook**.

Only the **title** and the **category** are required: start short and fill the rest in later.

| Field | Purpose |
| --- | --- |
| Title | What went wrong, in a few words — it weighs the most in search |
| Summary | A one or two-sentence overview, shown on the incident cards |
| Category | The broad technical domain (exactly one) |
| Status | Draft, published or archived — see below |
| Tags | Free keywords, comma-separated; new ones are created, existing ones are suggested |
| Problem | Symptoms and observed behavior, error messages |
| Diagnosis | How the problem was investigated |
| Root cause | Why it happened |
| Solution | The steps that fixed it |
| Prevention | How to avoid it next time |
| Snippets | Reusable commands or code, each with a title and a language |
| Links | Documentation, tickets or articles (http or https URLs) |

The five sections accept **Markdown** (GitHub flavor): bold, inline code, lists, task lists, tables, quotes, links and fenced code blocks (```` ```bash ````). Use the **Aperçu** tab to preview the result. A single line break is kept. Raw HTML is ignored and only `http(s)` and `mailto` links are kept.

Snippets and fenced code blocks are syntax-highlighted and have a **Copier** button.

The slug (the incident's URL) is derived from the title on creation and never changes, so links to an incident keep working when its title is edited.

## Statuses

- **Brouillon** (draft): being written, not yet considered reliable.
- **Publié** (published): validated; the normal state of a finished incident.
- **Archivé** (archived): no longer recommended (obsolete version, abandoned tool…) but kept, and still found by search.

---

# Finding an incident

The **Coelbooks** page lists incidents, most recent first, with a search box and filters by category, status and tag.

Search covers the title, summary, every section, tag names, snippet titles and snippet content. It ignores accents and case, and ranks results by relevance (a match in the title counts more than one in the prevention section). Matched words are highlighted.

| Query | Finds |
| --- | --- |
| `nginx timeout` | incidents containing both words |
| `"connection refused"` | the exact phrase |
| `docker -compose` | docker, but not compose |
| `nginx or traefik` | either word |

Partial words also match titles and summaries while typing (`postg` finds *Postgres*).

Filters combine with the search and are kept in the page URL, so a filtered search can be bookmarked or shared.

---

# Categories and tags

- A **category** is the broad technical domain of an incident; every incident has exactly one. Manage them from **Catégories**: create, rename, describe, delete. Names are unique (case-insensitive), and a category still used by incidents can't be deleted.
- **Tags** are finer, free keywords. They are created from the incident form and listed in the filters while at least one incident uses them.
