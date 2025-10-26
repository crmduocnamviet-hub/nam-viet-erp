-- Create employee_fcm_tokens table
-- Purpose: Store Firebase Cloud Messaging tokens for each employee's devices
-- Date: 2025-10-26

CREATE TABLE IF NOT EXISTS employee_fcm_tokens (
  id BIGSERIAL PRIMARY KEY,

  -- Employee Reference
  employee_id UUID NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,

  -- FCM Token
  fcm_token TEXT NOT NULL UNIQUE,

  -- Device Information
  device_type VARCHAR(20) CHECK (device_type IN ('web', 'android', 'ios')),
  device_name VARCHAR(255),
  user_agent TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employee_fcm_tokens_employee_id ON employee_fcm_tokens(employee_id);
CREATE INDEX idx_employee_fcm_tokens_active ON employee_fcm_tokens(is_active);
CREATE INDEX idx_employee_fcm_tokens_token ON employee_fcm_tokens(fcm_token);

-- Comments
COMMENT ON TABLE employee_fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for employee devices';
COMMENT ON COLUMN employee_fcm_tokens.fcm_token IS 'Unique FCM registration token for the device';
COMMENT ON COLUMN employee_fcm_tokens.device_type IS 'Type of device: web, android, or ios';
COMMENT ON COLUMN employee_fcm_tokens.is_active IS 'Whether this token is currently active and should receive notifications';
COMMENT ON COLUMN employee_fcm_tokens.last_used_at IS 'Last time this token was used to send a notification';

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_employee_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_fcm_tokens_updated_at
  BEFORE UPDATE ON employee_fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_fcm_tokens_updated_at();

-- Auto-deactivate old tokens (optional cleanup)
-- Run this periodically via cron or scheduled job
-- DELETE FROM employee_fcm_tokens WHERE last_used_at < NOW() - INTERVAL '90 days';
