-- Seed data for Supabase
-- Default admin user (mirrors engine.py initialize_default_user)

INSERT INTO users (username, level, xp)
VALUES ('Admin', 1, 0)
ON CONFLICT DO NOTHING;
