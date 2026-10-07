-- +goose Up
-- Default categories and tags, so a knowledge base never starts empty: an
-- incident needs a category, and suggested tags keep naming consistent
-- ("postgresql", not "postgres" here and "pgsql" there).
--
-- As a migration it runs once on every instance, new or already set up.
-- Rows whose name or slug already exist are skipped, so nothing a user
-- created is touched. Category names are in French, like the UI; tags are
-- the technical terms themselves.
--
-- Slugs must equal slug.Make(name) (internal/slug), since that is how the
-- API finds an existing tag or category from a name; seed_test.go checks it.

INSERT INTO categories (name, slug, description)
VALUES ('Base de données', 'base-de-donnees', 'PostgreSQL, MySQL, Redis : connexions, requêtes, performances, migrations.'),
       ('CI/CD', 'ci-cd', 'Pipelines, builds, tests automatisés et déploiements.'),
       ('Cloud', 'cloud', 'Services et infrastructure chez un fournisseur cloud.'),
       ('Développement', 'developpement', 'Code, dépendances, outils et environnement de développement.'),
       ('Docker', 'docker', 'Images, conteneurs, volumes, réseaux et Compose.'),
       ('Réseau', 'reseau', 'DNS, proxy, pare-feu, certificats et connectivité.'),
       ('Sécurité', 'securite', 'Authentification, droits, secrets et vulnérabilités.'),
       ('Système', 'systeme', 'Serveurs, OS, services, disques et ressources.')
ON CONFLICT DO NOTHING;

INSERT INTO tags (name, slug)
VALUES ('apache', 'apache'),
       ('aws', 'aws'),
       ('backup', 'backup'),
       ('ci', 'ci'),
       ('dns', 'dns'),
       ('docker', 'docker'),
       ('git', 'git'),
       ('github-actions', 'github-actions'),
       ('go', 'go'),
       ('http', 'http'),
       ('javascript', 'javascript'),
       ('kubernetes', 'kubernetes'),
       ('linux', 'linux'),
       ('mysql', 'mysql'),
       ('nginx', 'nginx'),
       ('node', 'node'),
       ('performance', 'performance'),
       ('permissions', 'permissions'),
       ('php', 'php'),
       ('postgresql', 'postgresql'),
       ('python', 'python'),
       ('redis', 'redis'),
       ('ssh', 'ssh'),
       ('ssl', 'ssl')
ON CONFLICT DO NOTHING;

-- +goose Down
-- Only removes the defaults nothing uses, so no incident loses its category
-- or a tag (a category in use can't be deleted anyway).
DELETE FROM tags t
WHERE t.slug IN ('apache', 'aws', 'backup', 'ci', 'dns', 'docker', 'git', 'github-actions', 'go', 'http',
                 'javascript', 'kubernetes', 'linux', 'mysql', 'nginx', 'node', 'performance', 'permissions',
                 'php', 'postgresql', 'python', 'redis', 'ssh', 'ssl')
  AND NOT EXISTS (SELECT 1 FROM incident_tags it WHERE it.tag_id = t.id);

DELETE FROM categories c
WHERE c.slug IN ('base-de-donnees', 'ci-cd', 'cloud', 'developpement', 'docker', 'reseau', 'securite', 'systeme')
  AND NOT EXISTS (SELECT 1 FROM incidents i WHERE i.category_id = c.id);
