import { AppError } from './errors.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// Se sigue la misma forma que ya usaba el módulo de reportes —página y tamaño,
// con el total al lado— en vez de introducir un segundo estilo de paginación en
// la misma API. Tener dos convenciones obliga a recordar cuál toca en cada
// pantalla, y eso se paga en cada consulta nueva.
//
// Para las tablas que crecen sin techo —movimientos de inventario, auditoría—
// un cursor rendiría mejor en las páginas muy profundas. En la práctica nadie
// navega diez mil páginas: filtra. El límite duro es lo que importa aquí.
export function parsePagination(req, { defaultPageSize = DEFAULT_PAGE_SIZE } = {}) {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? defaultPageSize);
  if (!Number.isInteger(page) || page < 1 ||
      !Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new AppError(
      `La paginación no es válida: la página empieza en 1 y el tamaño va de 1 a ${MAX_PAGE_SIZE}.`,
      422,
      'INVALID_PAGINATION',
    );
  }
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// Envuelve una consulta ya escrita para que devuelva una página y el total, sin
// que cada módulo repita el COUNT(*) OVER() ni se acuerde del LIMIT.
//
// El orden va en la consulta externa a propósito: el de un CTE no está
// garantizado, así que ordenar dentro y recortar fuera puede devolver páginas
// que no encajan entre sí. Por eso `orderBy` es obligatorio, y por eso lo
// escribe el módulo y nunca llega de la petición: entra en la sentencia tal
// cual.
export function paginatedQuery(sql, values, { pageSize, offset }, orderBy) {
  if (!orderBy) {
    throw new Error('paginatedQuery necesita saber por qué columna ordenar la página.');
  }
  return {
    text: `WITH pagina AS (${sql})
           SELECT pagina.*, COUNT(*) OVER()::integer total_rows
           FROM pagina
           ORDER BY ${orderBy}
           LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    values: [...values, pageSize, offset],
  };
}

export function paginatedResponse(result, { page, pageSize }, key = 'items') {
  const total = result.rows[0]?.total_rows || 0;
  return {
    [key]: result.rows.map(({ total_rows: _total, ...row }) => row),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
