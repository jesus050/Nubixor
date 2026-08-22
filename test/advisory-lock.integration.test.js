// Los trabajos periódicos corren dentro del servidor web, así que con dos
// instancias se disparan dos veces. El respaldo y la sincronización de rangos
// piden turno para que solo uno haga el trabajo caro.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { closeDatabase, withAdvisoryLock } from '../src/db.js';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;

test('solo un turno a la vez sobre el mismo nombre', {
  skip: !connectionString,
}, async (t) => {
  const nombre = `nubixor:test:${randomUUID()}`;

  await t.test('el segundo intento se aparta mientras el primero trabaja', async () => {
    let segundo = null;
    const primero = await withAdvisoryLock(nombre, async () => {
      segundo = await withAdvisoryLock(nombre, async () => 'no debería ejecutarse');
      return 'trabajo hecho';
    });

    assert.equal(primero.acquired, true);
    assert.equal(primero.result, 'trabajo hecho');
    assert.equal(segundo.acquired, false);
    assert.equal(segundo.result, null);
  });

  await t.test('al terminar, el turno vuelve a estar libre', async () => {
    const siguiente = await withAdvisoryLock(nombre, async () => 'otra vuelta');
    assert.equal(siguiente.acquired, true);
    assert.equal(siguiente.result, 'otra vuelta');
  });

  await t.test('un trabajo que falla libera el turno igualmente', async () => {
    await assert.rejects(
      withAdvisoryLock(nombre, async () => {
        throw new Error('el respaldo falló');
      }),
      /el respaldo falló/,
    );
    const siguiente = await withAdvisoryLock(nombre, async () => 'libre otra vez');
    assert.equal(siguiente.acquired, true);
  });

  await t.test('nombres distintos no se estorban', async () => {
    const otro = `${nombre}:otro`;
    const resultado = await withAdvisoryLock(nombre, () =>
      withAdvisoryLock(otro, async () => 'en paralelo'));
    assert.equal(resultado.result.acquired, true);
  });

  // Estas pruebas usan el pool de la aplicación, no uno propio. Sin cerrarlo,
  // el proceso de pruebas se queda esperando conexiones ociosas.
  await closeDatabase();
});
