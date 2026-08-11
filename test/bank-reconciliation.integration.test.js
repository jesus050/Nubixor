import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

// Esta prueba se ejecuta en CI con PostgreSQL. No toma DATABASE_URL como
// alternativa para que un entorno local parcialmente configurado no intente
// modificar una base real por accidente.
const connectionString = process.env.TEST_DATABASE_URL || null;

async function expectDatabaseFailure(client, savepoint, work, predicate, message) {
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    await work();
    assert.fail(message);
  } catch (error) {
    assert.ok(predicate(error), message);
  } finally {
    // PostgreSQL deja la transacción en estado abortado tras una restricción.
    // El savepoint permite verificar la regla y continuar cubriendo los demás
    // controles de integridad dentro de la misma prueba aislada.
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  }
}

test(
  'bancos: aísla empresas y sella movimientos y conciliaciones completadas',
  { skip: !connectionString },
  async () => {
    const pool = new pg.Pool({ connectionString });
    const client = await pool.connect();
    const ids = {
      user: randomUUID(),
      companyA: randomUUID(),
      companyB: randomUUID(),
      bankA: randomUUID(),
      bankB: randomUUID(),
      transaction: randomUUID(),
      reconciliation: randomUUID(),
    };
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO users(id, email, full_name, status)
         VALUES($1,$2,'Contabilidad de prueba','ACTIVE')`,
        [ids.user, `accounting-${ids.user}@example.test`],
      );
      await client.query(
        `INSERT INTO tenants(id, legal_name, tax_id)
         VALUES($1,$3,$5),($2,$4,$6)`,
        [
          ids.companyA,
          ids.companyB,
          'Empresa bancaria A',
          'Empresa bancaria B',
          `NIT-A-${ids.companyA}`,
          `NIT-B-${ids.companyB}`,
        ],
      );
      const accounts = await client.query(
        `SELECT tenant_id, id
         FROM accounting_accounts
         WHERE tenant_id = ANY($1::uuid[]) AND code = '111005'`,
        [[ids.companyA, ids.companyB]],
      );
      assert.equal(accounts.rowCount, 2, 'cada empresa debe recibir su cuenta de bancos');
      const bankLedgerByTenant = new Map(accounts.rows.map((row) => [row.tenant_id, row.id]));

      await client.query(
        `INSERT INTO bank_accounts(
           id, tenant_id, accounting_account_id, bank_name, account_name,
           masked_account, opening_balance, created_by
         )
         VALUES
           ($1,$3,$5,'Banco A','Cuenta principal','****1001',0,$7),
           ($2,$4,$6,'Banco B','Cuenta principal','****2002',0,$7)`,
        [
          ids.bankA,
          ids.bankB,
          ids.companyA,
          ids.companyB,
          bankLedgerByTenant.get(ids.companyA),
          bankLedgerByTenant.get(ids.companyB),
          ids.user,
        ],
      );
      await client.query(
        `INSERT INTO bank_statement_transactions(
           id, tenant_id, bank_account_id, transaction_date, reference,
           description, amount, created_by
         ) VALUES($1,$2,$3,CURRENT_DATE,'TRF-001','Transferencia recibida',25000,$4)`,
        [ids.transaction, ids.companyA, ids.bankA, ids.user],
      );

      await expectDatabaseFailure(
        client,
        'cross_tenant_bank_account',
        () => client.query(
          `INSERT INTO bank_statement_transactions(
             tenant_id, bank_account_id, transaction_date, reference,
             description, amount, created_by
           ) VALUES($1,$2,CURRENT_DATE,'TRF-CRUZADA','No debe permitirse',1,$3)`,
          [ids.companyA, ids.bankB, ids.user],
        ),
        (error) => error.code === '23503',
        'una empresa no puede usar la cuenta bancaria de otra',
      );

      await client.query(
        `UPDATE bank_statement_transactions
         SET status='MATCHED', matched_by=$3, matched_at=now()
         WHERE id=$1 AND tenant_id=$2`,
        [ids.transaction, ids.companyA, ids.user],
      );
      await expectDatabaseFailure(
        client,
        'matched_bank_transaction_immutable',
        () => client.query(
          `UPDATE bank_statement_transactions
           SET description='Intento de modificar evidencia'
           WHERE id=$1 AND tenant_id=$2`,
          [ids.transaction, ids.companyA],
        ),
        (error) => error.code === '55000',
        'un movimiento ya conciliado debe ser inmutable',
      );

      await client.query(
        `INSERT INTO bank_reconciliation_runs(
           id, tenant_id, bank_account_id, period_start, period_end,
           statement_ending_balance, ledger_ending_balance, difference,
           unmatched_count, status, completed_by, completed_at, evidence_hash, notes
         ) VALUES(
           $1,$2,$3,CURRENT_DATE,CURRENT_DATE,25000,25000,0,0,
           'COMPLETED',$4,now(),'sha256-evidence-test','Conciliación de prueba'
         )`,
        [ids.reconciliation, ids.companyA, ids.bankA, ids.user],
      );
      await expectDatabaseFailure(
        client,
        'completed_reconciliation_immutable',
        () => client.query(
          `UPDATE bank_reconciliation_runs
           SET notes='Intento de modificar evidencia'
           WHERE id=$1 AND tenant_id=$2`,
          [ids.reconciliation, ids.companyA],
        ),
        (error) => error.code === '55000',
        'una conciliación terminada debe ser inmutable',
      );
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
      await pool.end();
    }
  },
);
