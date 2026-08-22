-- Registro de respaldos y de sus pruebas de restauración.
--
-- Hasta ahora un respaldo dejaba una línea en el log y nada más. Saber si el
-- último salió bien exigía buscar en los registros del servidor, y saber si
-- alguna vez se probó a restaurarlo no era posible: nadie lo anotaba.
--
-- Un respaldo que nunca se restauró no es un respaldo, es una intención. Por eso
-- la prueba de restauración se registra en la misma tabla y con el mismo peso
-- que el respaldo: son dos mitades del mismo compromiso.
--
-- La tabla no tiene empresa: los respaldos son de la plataforma entera, no de
-- un cliente. Por lo mismo no se expone en la API multiempresa; se consulta con
-- npm run backup:status, que corre en el servidor.
CREATE TABLE backup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK(kind IN ('BACKUP', 'VERIFICATION', 'RESTORE_TEST')),
  status TEXT NOT NULL CHECK(status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  file_name TEXT,
  bytes BIGINT,
  sha256 TEXT,
  pruned_count INTEGER,
  error_message TEXT,
  hostname TEXT
);

CREATE INDEX backup_runs_kind_started
  ON backup_runs(kind, started_at DESC);

-- Una ejecución que se quedó a medias —el proceso murió, el disco se llenó—
-- queda como RUNNING para siempre y eso es información: significa que el
-- respaldo de esa noche no terminó.
CREATE INDEX backup_runs_unfinished
  ON backup_runs(started_at DESC)
  WHERE status = 'RUNNING';

COMMENT ON TABLE backup_runs IS
  'Historial de respaldos, verificaciones y pruebas de restauración de la plataforma.';
