-- Idempotent schema for Talking Pill Bag
-- Run with: psql $DATABASE_URL -f db/schema.sql

CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  bp_target_systolic int,
  bp_target_diastolic int,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('caregiver','senior')),
  token_hash text NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

-- Idempotent migrations for tables created before a column existed
ALTER TABLE devices ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE pairing_codes ADD COLUMN IF NOT EXISTS label text;

CREATE INDEX IF NOT EXISTS idx_devices_household_id ON devices(household_id);

CREATE TABLE IF NOT EXISTS pairing_codes (
  code_hash text PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('caregiver','senior')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by_device uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  label text
);

CREATE INDEX IF NOT EXISTS idx_pairing_codes_household_id ON pairing_codes(household_id);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_expires_at ON pairing_codes(expires_at);

CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  drug_name text NOT NULL,
  strength text NOT NULL,
  dose_per_time text NOT NULL,
  times_per_day int NOT NULL,
  time_slots text[] NOT NULL,
  food text NOT NULL CHECK (food IN ('after_food','before_food','with_food','any')),
  special_instructions text[] NOT NULL DEFAULT '{}',
  quantity_dispensed int,
  dispensed_date date,
  added_on date NOT NULL,
  thumbnail text,
  unclear_fields text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_medicines_household_id ON medicines(household_id);
CREATE INDEX IF NOT EXISTS idx_medicines_household_id_deleted_at ON medicines(household_id, deleted_at);

CREATE TABLE IF NOT EXISTS dose_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  date date NOT NULL,
  slot text NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (medicine_id, date, slot)
);

CREATE INDEX IF NOT EXISTS idx_dose_logs_household_id ON dose_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_dose_logs_household_id_date ON dose_logs(household_id, date);

CREATE TABLE IF NOT EXISTS missed_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  reason text NOT NULL,
  missed_count int NOT NULL,
  recorded_on date NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_missed_reasons_household_id ON missed_reasons(household_id);
CREATE INDEX IF NOT EXISTS idx_missed_reasons_household_id_recorded_on ON missed_reasons(household_id, recorded_on);

CREATE TABLE IF NOT EXISTS bp_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,
  systolic int NOT NULL,
  diastolic int NOT NULL,
  pulse int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bp_readings_household_id ON bp_readings(household_id);
CREATE INDEX IF NOT EXISTS idx_bp_readings_household_id_date ON bp_readings(household_id, date);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('redirected','custom')),
  medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL,
  drug_name text,
  text text NOT NULL,
  asked_on date NOT NULL,
  done boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_questions_household_id ON questions(household_id);
