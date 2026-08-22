// La paginación es la única defensa contra una consulta que devuelve el
// catálogo entero. Estas pruebas fijan los límites y la forma de la respuesta,
// que es lo que el resto de los módulos va a copiar.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  paginatedQuery,
  paginatedResponse,
  parsePagination,
} from '../src/shared/pagination.js';

function peticion(query = {}) {
  return { query };
}

test('sin parámetros devuelve la primera página con el tamaño por defecto', () => {
  assert.deepEqual(parsePagination(peticion()), { page: 1, pageSize: 50, offset: 0 });
});

test('calcula el desplazamiento a partir de la página', () => {
  assert.deepEqual(
    parsePagination(peticion({ page: '3', pageSize: '25' })),
    { page: 3, pageSize: 25, offset: 50 },
  );
});

test('rechaza tamaños fuera de rango en vez de recortarlos en silencio', () => {
  // Recortar sin avisar deja al cliente creyendo que pidió 5000 y recibió todo.
  for (const query of [{ pageSize: '5000' }, { pageSize: '0' }, { page: '0' }, { page: '-2' }]) {
    assert.throws(() => parsePagination(peticion(query)), { code: 'INVALID_PAGINATION' });
  }
});

test('rechaza valores que no son enteros', () => {
  for (const query of [{ page: 'dos' }, { pageSize: '10.5' }, { pageSize: '' }]) {
    assert.throws(() => parsePagination(peticion(query)), { code: 'INVALID_PAGINATION' });
  }
});

test('la consulta paginada añade el total y coloca los parámetros al final', () => {
  const { text, values } = paginatedQuery(
    'SELECT id FROM productos WHERE tenant_id = $1',
    ['empresa-1'],
    { pageSize: 20, offset: 40 },
    'nombre ASC',
  );
  assert.match(text, /COUNT\(\*\) OVER\(\)::integer total_rows/);
  assert.match(text, /ORDER BY nombre ASC/);
  assert.match(text, /LIMIT \$2 OFFSET \$3/);
  assert.deepEqual(values, ['empresa-1', 20, 40]);
});

test('el orden va fuera del CTE, no dentro', () => {
  const { text } = paginatedQuery('SELECT id FROM t', [], { pageSize: 10, offset: 0 }, 'id DESC');
  const cierreDelCte = text.indexOf(')\n');
  assert.ok(
    text.indexOf('ORDER BY id DESC') > cierreDelCte,
    'ordenar dentro del CTE y recortar fuera puede devolver páginas que no encajan',
  );
});

test('exige saber por qué columna ordenar', () => {
  assert.throws(
    () => paginatedQuery('SELECT 1', [], { pageSize: 10, offset: 0 }),
    /por qué columna ordenar/,
  );
});

test('la respuesta separa las filas del total y quita la columna auxiliar', () => {
  const resultado = {
    rows: [
      { id: 1, nombre: 'uno', total_rows: 7 },
      { id: 2, nombre: 'dos', total_rows: 7 },
    ],
  };
  assert.deepEqual(paginatedResponse(resultado, { page: 2, pageSize: 2 }, 'productos'), {
    productos: [{ id: 1, nombre: 'uno' }, { id: 2, nombre: 'dos' }],
    pagination: { page: 2, pageSize: 2, total: 7, totalPages: 4 },
  });
});

test('una página vacía sigue teniendo forma de página', () => {
  assert.deepEqual(paginatedResponse({ rows: [] }, { page: 1, pageSize: 50 }), {
    items: [],
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  });
});
