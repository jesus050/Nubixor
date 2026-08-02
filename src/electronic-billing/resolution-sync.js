import { query, withTransaction } from '../db.js';
import { writeAudit } from '../audit.js';
import { createBillingAdapter } from './adapters/registry.js';
import { logger } from '../shared/logger.js';

function rangeRows(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function dateOnly(value) {
  const candidate = String(value || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return candidate;
  const colombianDate = candidate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return colombianDate ? `${colombianDate[3]}-${colombianDate[2]}-${colombianDate[1]}` : null;
}

export function normalizeFactusRange(range) {
  const id = Number(range?.id);
  const numberFrom = Number(range?.from);
  const numberTo = Number(range?.to);
  const current = Number(range?.current);
  const prefix = String(range?.prefix || '').trim().toUpperCase();
  const validFrom = dateOnly(range?.start_date);
  const validUntil = dateOnly(range?.end_date);
  if (!Number.isSafeInteger(id) || id <= 0 || !prefix ||
      !Number.isSafeInteger(numberFrom) || numberFrom <= 0 ||
      !Number.isSafeInteger(numberTo) || numberTo < numberFrom ||
      !validFrom || !validUntil) {
    return null;
  }
  return {
    id,
    prefix,
    numberFrom,
    numberTo,
    current: Number.isSafeInteger(current)
      ? Math.min(numberTo + 1, Math.max(numberFrom, current))
      : numberFrom,
    validFrom,
    validUntil,
    documentCode: String(range?.document?.code || range?.document_code || range?.document || '').trim() || null,
    active: !(range?.is_active === false || Number(range?.is_active) === 0 ||
      range?.is_expired === true || Number(range?.is_expired) === 1),
    snapshot: range,
  };
}

export async function syncFactusRangesForAccount(account) {
  const adapter = createBillingAdapter(account);
  const response = await adapter.listDianNumberingRanges();
  const ranges = rangeRows(response).map(normalizeFactusRange).filter(Boolean);
  const synced = await withTransaction(async (client) => {
    let updated = 0;
    for (const range of ranges) {
      // El vínculo empresa+sucursal+rango se define una vez en Nubixor. La
      // sincronización jamás crea una resolución ni decide una sucursal sola.
      const result = await client.query(
        `UPDATE billing_resolutions
         SET prefix = $3,
             number_from = $4,
             number_to = $5,
             current_number = $6,
             valid_from = $7,
             valid_until = $8,
             active = $9,
             provider_document_code = COALESCE($10, provider_document_code),
             provider_synced_at = now(),
             provider_snapshot = $11,
             provider_last_checked_at = now(),
             provider_last_sync_error = NULL,
             updated_at = now()
         WHERE company_id = $1
           AND provider_numbering_range_id = $2
         RETURNING id`,
        [
          account.company_id,
          range.id,
          range.prefix,
          range.numberFrom,
          range.numberTo,
          range.current,
          range.validFrom,
          range.validUntil,
          range.active,
          range.documentCode,
          range.snapshot,
        ],
      );
      updated += result.rowCount;
    }
    await client.query(
      `UPDATE electronic_billing_accounts
       SET last_success_at = now(), last_error = NULL, updated_at = now()
       WHERE id = $1 AND company_id = $2`,
      [account.id, account.company_id],
    );
    if (updated) {
      await writeAudit(client, {
        tenantId: account.company_id,
        userId: null,
        action: 'electronic_billing.resolutions_auto_synced',
        entityType: 'electronic_billing_account',
        entityId: account.id,
        after: { rangesRead: ranges.length, resolutionsUpdated: updated },
        reason: 'Consulta automática de rangos asociados al software en Factus',
      });
    }
    return updated;
  });
  return { rangesRead: ranges.length, resolutionsUpdated: synced };
}

export async function syncReadyFactusRanges() {
  const accounts = await query(
    `SELECT id, company_id, provider_code, environment, base_url,
            encrypted_credentials, provider_config
     FROM electronic_billing_accounts
     WHERE provider_code = 'FACTUS' AND active = TRUE
       AND connection_status = 'READY'
     ORDER BY updated_at ASC`,
  );
  const results = [];
  for (const account of accounts.rows) {
    try {
      results.push({ accountId: account.id, ...(await syncFactusRangesForAccount(account)) });
    } catch (error) {
      await query(
        `UPDATE electronic_billing_accounts
         SET last_error = $3, updated_at = now()
         WHERE id = $1 AND company_id = $2`,
        [account.id, account.company_id, error?.message || 'No fue posible sincronizar rangos Factus.'],
      );
      logger.error('billing.resolution_sync_failed', {
        accountId: account.id,
        companyId: account.company_id,
        errorCode: error?.code,
        status: error?.status,
      });
      results.push({ accountId: account.id, error: error?.code || 'FACTUS_RANGE_SYNC_FAILED' });
    }
  }
  return results;
}
