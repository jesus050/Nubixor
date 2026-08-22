// El catálogo compartido es el caso que obligó a que la conexión declare un
// conjunto de empresas y no una sola. Estas pruebas fijan las dos mitades: que
// una empresa fuera del conjunto sigue siendo invisible, y que la que comparte
// la caja aparece solo mientras esté declarada.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;
const TABLAS_DE_APOYO = ['tenants', 'products', 'tax_categories'];

function conexionPara(base, rol, clave) {
  const url = new URL(base);
  url.username = rol;
  url.password = clave;
  return url.toString();
}

async function conAlcance(client, { activa, conjunto }, work) {
  await client.query('BEGIN');
  try {
    if (activa) await client.query(`SET LOCAL app.tenant_id = '${activa}'`);
    if (conjunto) await client.query(`SET LOCAL app.tenant_ids = '${conjunto.join(',')}'`);
    const result = await work();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

test('el catálogo compartido solo muestra las empresas declaradas', {
  skip: !connectionString,
}, async (t) => {
  const admin = new pg.Pool({ connectionString });
  const rol = `cat_probe_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const clave = randomUUID();
  const operadora = randomUUID();
  const socia = randomUUID();
  const ajena = randomUUID();
  let restringido = null;
  let sonda = null;

  const sembrarProducto = async (empresa, sku) => {
    const impuesto = randomUUID();
    const producto = randomUUID();
    await admin.query(
      `INSERT INTO tax_categories(id, tenant_id, code, name, treatment, rate)
       VALUES($1,$2,'IVA0','IVA 0','EXEMPT',0)`,
      [impuesto, empresa],
    );
    await admin.query(
      `INSERT INTO products(id, tenant_id, sku, name, sale_price,
                            sales_tax_category_id, tax_category_id, tax_review_status)
       VALUES($1,$2,$3,$4,1000,$5,$5,'REVIEWED')`,
      [producto, empresa, sku, `Producto ${sku}`, impuesto],
    );
    return producto;
  };

  try {
    const superusuario = await admin.query(
      'SELECT rolsuper FROM pg_roles WHERE rolname = current_user',
    );
    assert.ok(superusuario.rows[0]?.rolsuper, 'la cuenta de pruebas necesita crear el rol restringido');

    await admin.query(`CREATE ROLE ${rol} LOGIN PASSWORD '${clave}'`);
    await admin.query(`GRANT USAGE ON SCHEMA public TO ${rol}`);
    for (const tabla of TABLAS_DE_APOYO) {
      await admin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${tabla} TO ${rol}`);
    }
    await admin.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${rol}`);
    await admin.query(
      'INSERT INTO tenants(id, legal_name) VALUES($1,$2),($3,$4),($5,$6)',
      [operadora, 'Caja operadora', socia, 'Empresa socia', ajena, 'Empresa ajena'],
    );
    await sembrarProducto(operadora, 'PROP-1');
    await sembrarProducto(socia, 'SOCIA-1');
    await sembrarProducto(ajena, 'AJENA-1');

    restringido = new pg.Pool({ connectionString: conexionPara(connectionString, rol, clave) });
    sonda = await restringido.connect();

    await t.test('sin ampliar el alcance solo se ve la empresa activa', async () => {
      const visibles = await conAlcance(sonda, { activa: operadora }, () =>
        sonda.query('SELECT sku FROM products ORDER BY sku'));
      assert.deepEqual(visibles.rows.map((fila) => fila.sku), ['PROP-1']);
    });

    await t.test('con la caja compartida aparece también la socia', async () => {
      const visibles = await conAlcance(
        sonda,
        { activa: operadora, conjunto: [operadora, socia] },
        () => sonda.query('SELECT sku FROM products ORDER BY sku'),
      );
      assert.deepEqual(visibles.rows.map((fila) => fila.sku), ['PROP-1', 'SOCIA-1']);
    });

    await t.test('la empresa ajena a la caja nunca aparece', async () => {
      const visibles = await conAlcance(
        sonda,
        { activa: operadora, conjunto: [operadora, socia] },
        () => sonda.query('SELECT sku FROM products WHERE sku = $1', ['AJENA-1']),
      );
      assert.equal(visibles.rowCount, 0);
    });

    await t.test('no se puede crear un producto para una empresa fuera del alcance', async () => {
      await assert.rejects(
        conAlcance(sonda, { activa: operadora, conjunto: [operadora, socia] }, () =>
          sonda.query(
            `INSERT INTO products(tenant_id, sku, name, sale_price, tax_review_status)
             VALUES($1,'COLADO','Producto colado',1000,'REVIEWED')`,
            [ajena],
          )),
        (error) => error.code === '42501',
      );
    });

    await t.test('el alcance ampliado no sobrevive a la transacción', async () => {
      // SET LOCAL muere en el COMMIT: la siguiente petición que reciba esta
      // misma conexión del pool empieza sin las empresas de la caja anterior.
      const visibles = await conAlcance(sonda, { activa: operadora }, () =>
        sonda.query('SELECT sku FROM products ORDER BY sku'));
      assert.deepEqual(visibles.rows.map((fila) => fila.sku), ['PROP-1']);
    });
  } finally {
    sonda?.release();
    await restringido?.end();
    const limpieza = await admin.connect();
    try {
      await limpieza.query("SET session_replication_role = 'replica'");
      const propias = await limpieza.query(`
        SELECT columns.table_name, columns.column_name
        FROM information_schema.columns columns
        JOIN information_schema.tables tables
          ON tables.table_schema = columns.table_schema
         AND tables.table_name = columns.table_name
        WHERE columns.table_schema = 'public'
          AND tables.table_type = 'BASE TABLE'
          AND columns.column_name IN ('tenant_id', 'company_id')
          AND columns.data_type = 'uuid'
      `);
      for (const empresa of [operadora, socia, ajena]) {
        for (const fila of propias.rows) {
          await limpieza.query(
            `DELETE FROM "${fila.table_name}" WHERE "${fila.column_name}" = $1`,
            [empresa],
          );
        }
      }
      await limpieza.query(
        'DELETE FROM tenants WHERE id = ANY($1::uuid[])',
        [[operadora, socia, ajena]],
      );
    } finally {
      await limpieza.query("SET session_replication_role = 'origin'").catch(() => {});
      limpieza.release();
    }
    for (const tabla of TABLAS_DE_APOYO) {
      await admin.query(`REVOKE ALL ON ${tabla} FROM ${rol}`).catch(() => {});
    }
    await admin.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ${rol}`).catch(() => {});
    await admin.query(`REVOKE USAGE ON SCHEMA public FROM ${rol}`).catch(() => {});
    await admin.query(`DROP ROLE IF EXISTS ${rol}`).catch(() => {});
    await admin.end();
  }
});
