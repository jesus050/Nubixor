-- Limitación de tasa compartida entre instancias.
--
-- Hasta ahora los contadores vivían en un Map dentro del proceso: con dos
-- servidores el límite se duplicaba, y un reinicio lo borraba entero. Un
-- atacante solo tenía que esperar un despliegue.
--
-- El contador vive en PostgreSQL y no en Redis, que también está desplegado,
-- por una razón concreta: si PostgreSQL no responde la aplicación no atiende
-- nada de todos modos, mientras que sumar Redis a la ruta de cada petición
-- añade un segundo servicio que puede caerse y una decisión incómoda sobre qué
-- hacer cuando eso pasa. La tabla es UNLOGGED porque estos contadores son
-- desechables: perderlos en una caída solo reinicia las ventanas, y a cambio no
-- generan registro de transacciones ni viajan a las réplicas.
CREATE UNLOGGED TABLE rate_limit_counters (
  bucket TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hits INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX rate_limit_counters_window
  ON rate_limit_counters(window_started_at);

-- Suma un intento y devuelve cuántos van en la ventana vigente. Si la ventana
-- venció, la fila se reutiliza empezando de nuevo: así no hace falta borrar
-- nada para que el límite vuelva a permitir.
CREATE OR REPLACE FUNCTION register_rate_limit_hit(
  bucket_key TEXT,
  window_seconds INTEGER
)
RETURNS TABLE(hits INTEGER, resets_at TIMESTAMPTZ)
LANGUAGE sql
AS $$
  INSERT INTO rate_limit_counters(bucket, window_started_at, hits)
  VALUES(bucket_key, now(), 1)
  ON CONFLICT(bucket) DO UPDATE
  SET hits = CASE
        WHEN rate_limit_counters.window_started_at
             < now() - (window_seconds * interval '1 second')
        THEN 1
        ELSE rate_limit_counters.hits + 1
      END,
      window_started_at = CASE
        WHEN rate_limit_counters.window_started_at
             < now() - (window_seconds * interval '1 second')
        THEN now()
        ELSE rate_limit_counters.window_started_at
      END
  RETURNING hits, window_started_at + (window_seconds * interval '1 second');
$$;

COMMENT ON TABLE rate_limit_counters IS
  'Contadores de limitación de tasa compartidos entre instancias. UNLOGGED: '
  'perderlos solo reinicia las ventanas en curso.';
