-- +goose Up
CREATE TABLE settings
(
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    singleton      BOOLEAN     NOT NULL DEFAULT true UNIQUE CHECK (singleton),
    instance_name  TEXT        NOT NULL,
    timezone       TEXT        NOT NULL,
    locale         TEXT        NOT NULL DEFAULT 'en',
    initialized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE settings IS 'Singleton row holding the instance configuration produced by the first-time setup wizard.';
COMMENT ON COLUMN settings.id IS 'Primary key.';
COMMENT ON COLUMN settings.singleton IS 'Always true; the UNIQUE constraint on this column is what enforces the table can only ever hold one row.';
COMMENT ON COLUMN settings.instance_name IS 'Display name of this Playbook instance.';
COMMENT ON COLUMN settings.timezone IS 'IANA timezone used to display dates across the instance.';
COMMENT ON COLUMN settings.locale IS 'Default UI locale.';
COMMENT ON COLUMN settings.initialized_at IS 'Date the setup wizard completed; the presence of this row means the instance is initialized.';

-- +goose Down
DROP TABLE settings;