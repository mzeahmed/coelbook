-- +goose Up
CREATE TABLE settings
(
    id             UUID PRIMARY KEY     DEFAULT '00000000-0000-0000-0000-000000000001',
    instance_name  TEXT        NOT NULL,
    timezone       TEXT        NOT NULL,
    locale         TEXT        NOT NULL DEFAULT 'en',
    initialized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE settings IS 'Singleton row holding the instance configuration produced by the first-time setup wizard.';
COMMENT ON COLUMN settings.id IS 'Primary key, fixed to a well-known value so the table can only ever hold one row.';
COMMENT ON COLUMN settings.instance_name IS 'Display name of this Playbook instance.';
COMMENT ON COLUMN settings.timezone IS 'IANA timezone used to display dates across the instance.';
COMMENT ON COLUMN settings.locale IS 'Default UI locale.';
COMMENT ON COLUMN settings.initialized_at IS 'Date the setup wizard completed; the presence of this row means the instance is initialized.';

-- +goose Down
DROP TABLE settings;