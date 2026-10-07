-- +goose Up
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Text search configuration used for incidents: the "simple" dictionary
-- (no stemming, so mixed French / English technical content behaves the
-- same) with accents stripped, so "refusée" and "refusee" match.
CREATE TEXT SEARCH CONFIGURATION coelbook (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION coelbook
    ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

ALTER TABLE incidents ADD COLUMN search_vector tsvector NOT NULL DEFAULT ''::tsvector;

CREATE INDEX idx_incidents_search_vector ON incidents USING GIN (search_vector);

COMMENT ON COLUMN incidents.search_vector IS 'Weighted full-text document of the incident, its tags and snippet titles. Refreshed with incident_search_vector() whenever the incident is written.';

-- incident_search_vector builds the full-text document of an incident.
-- Weights rank where a term was found: A title; B summary, problem and
-- tag names; C diagnosis, root cause, solution and snippet titles;
-- D prevention. Snippet content is code and is matched separately (by
-- substring) rather than indexed here.
-- +goose StatementBegin
CREATE FUNCTION incident_search_vector(incident_id BIGINT) RETURNS tsvector
    LANGUAGE sql
    STABLE
AS $$
SELECT
    setweight(to_tsvector('coelbook', coalesce(i.title, '')), 'A') ||
    setweight(to_tsvector('coelbook', coalesce(i.summary, '')), 'B') ||
    setweight(to_tsvector('coelbook', coalesce(i.problem, '')), 'B') ||
    setweight(to_tsvector('coelbook', coalesce(
        (SELECT string_agg(t.name, ' ')
         FROM incident_tags it
         JOIN tags t ON t.id = it.tag_id
         WHERE it.incident_id = i.id), '')), 'B') ||
    setweight(to_tsvector('coelbook', coalesce(i.diagnosis, '')), 'C') ||
    setweight(to_tsvector('coelbook', coalesce(i.root_cause, '')), 'C') ||
    setweight(to_tsvector('coelbook', coalesce(i.solution, '')), 'C') ||
    setweight(to_tsvector('coelbook', coalesce(
        (SELECT string_agg(s.title, ' ')
         FROM snippets s
         WHERE s.incident_id = i.id), '')), 'C') ||
    setweight(to_tsvector('coelbook', coalesce(i.prevention, '')), 'D')
FROM incidents i
WHERE i.id = incident_id;
$$;
-- +goose StatementEnd

UPDATE incidents SET search_vector = incident_search_vector(id);

-- +goose Down
DROP FUNCTION incident_search_vector(BIGINT);
DROP INDEX idx_incidents_search_vector;
ALTER TABLE incidents DROP COLUMN search_vector;
DROP TEXT SEARCH CONFIGURATION coelbook;
DROP EXTENSION IF EXISTS unaccent;
