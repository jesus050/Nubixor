CREATE TABLE auth_recovery_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requester_ip_hash TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX auth_recovery_attempts_ip_recent
  ON auth_recovery_attempts(requester_ip_hash, created_at DESC);
CREATE INDEX auth_recovery_attempts_email_recent
  ON auth_recovery_attempts(email_hash, created_at DESC);
