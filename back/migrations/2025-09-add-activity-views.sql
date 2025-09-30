-- Migration: add activity_user_flags table to store per-user read/done flags for activities
CREATE TABLE IF NOT EXISTS activity_user_flags (
	activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
	user_id CHARACTER VARYING NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	is_read BOOLEAN NOT NULL DEFAULT FALSE,
	is_done BOOLEAN NOT NULL DEFAULT FALSE,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (activity_id, user_id)
);

