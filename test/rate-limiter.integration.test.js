// El límite de tasa vivía en un Map dentro del proceso: con dos servidores se
// duplicaba y un reinicio lo borraba entero. Ahora el contador está en la base,
// así que estas pruebas comprueban lo que importa: que cuente de verdad, que la
// ventana caduque, y que separe a una persona de otra.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { closeDatabase, getPool } from '../src/db.js';
import { createRateLimiter, pruneRateLimitCounters } from '../src/middleware/rate-limiter.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

function peticionFalsa(userId, path = '/prueba') {
  return { path, context: { userId }, socket: {} };
}

function respuestaFalsa() {
  const headers = {};
  return { headers, setHeader(name, value) { headers[name] = value; } };
}

// Ejecuta el middleware y devuelve el error que haya pasado a next(), o null.
function ejecutar(limiter, req, res) {
  return new Promise((resolve, reject) => {
    limiter(req, res, (error) => (error ? resolve(error) : resolve(null)))
      .catch(reject);
  });
}

test('el contador de tasa es compartido y por persona', {
  skip: !connectionString,
}, async (t) => {
  const alguien = randomUUID();
  const otra = randomUUID();
  const ambito = `prueba:${randomUUID()}`;

  try {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
      scope: ambito,
      errorCode: 'PRUEBA_LIMITE',
    });

    await t.test('deja pasar hasta el límite', async () => {
      for (let intento = 1; intento <= 3; intento += 1) {
        const res = respuestaFalsa();
        const error = await ejecutar(limiter, peticionFalsa(alguien), res);
        assert.equal(error, null, `el intento ${intento} debía pasar`);
        assert.equal(res.headers['X-RateLimit-Remaining'], 3 - intento);
      }
    });

    await t.test('el siguiente se rechaza con 429 y dice cuánto esperar', async () => {
      const res = respuestaFalsa();
      const error = await ejecutar(limiter, peticionFalsa(alguien), res);
      assert.equal(error?.status, 429);
      assert.equal(error?.code, 'PRUEBA_LIMITE');
      assert.ok(Number(res.headers['Retry-After']) > 0);
      assert.equal(res.headers['X-RateLimit-Remaining'], 0);
    });

    await t.test('otra persona no hereda el castigo', async () => {
      const res = respuestaFalsa();
      const error = await ejecutar(limiter, peticionFalsa(otra), res);
      assert.equal(error, null);
      assert.equal(res.headers['X-RateLimit-Remaining'], 2);
    });

    await t.test('dos instancias comparten el mismo contador', async () => {
      // Un segundo limitador es lo que vería otro servidor: no comparte memoria
      // con el primero, solo la base. Si el contador siguiera en el proceso,
      // este empezaría de cero.
      const otraInstancia = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        scope: ambito,
        errorCode: 'PRUEBA_LIMITE',
      });
      const error = await ejecutar(otraInstancia, peticionFalsa(alguien), respuestaFalsa());
      assert.equal(error?.status, 429);
    });

    await t.test('al vencer la ventana el contador vuelve a empezar', async () => {
      const corta = createRateLimiter({
        windowMs: 1000,
        max: 1,
        scope: `${ambito}:corta`,
        errorCode: 'PRUEBA_LIMITE',
      });
      assert.equal(await ejecutar(corta, peticionFalsa(alguien), respuestaFalsa()), null);
      assert.equal(
        (await ejecutar(corta, peticionFalsa(alguien), respuestaFalsa()))?.status,
        429,
      );
      // La ventana se envejece a mano en lugar de esperar: la prueba comprueba
      // la regla, no la puntualidad del reloj.
      await getPool().query(
        "UPDATE rate_limit_counters SET window_started_at = now() - interval '2 seconds'",
      );
      assert.equal(await ejecutar(corta, peticionFalsa(alguien), respuestaFalsa()), null);
    });

    await t.test('el barrido borra los contadores vencidos', async () => {
      await getPool().query(
        "UPDATE rate_limit_counters SET window_started_at = now() - interval '48 hours'",
      );
      const borrados = await pruneRateLimitCounters({ olderThanHours: 24 });
      assert.ok(borrados > 0);
    });
  } finally {
    await getPool()
      .query('DELETE FROM rate_limit_counters')
      .catch(() => {});
    await closeDatabase();
  }
});
