import { createDecipheriv, createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { config } from '../src/config.js';

const MAGIC = Buffer.from('MSBACK01');

function keyFromEnvironment() {
  const raw = config.backupEncryptionKey || '';
  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('BACKUP_ENCRYPTION_KEY no es válida.');
  return key;
}

function run(command, args, environment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...environment },
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} terminó con código ${code}.`));
    });
  });
}

function databaseConnection(urlValue) {
  const url = new URL(urlValue);
  return {
    args: [
      '--host', url.hostname,
      '--port', url.port || '5432',
      '--username', decodeURIComponent(url.username),
      '--dbname', decodeURIComponent(url.pathname.replace(/^\//, '')),
    ],
    environment: {
      PGPASSWORD: decodeURIComponent(url.password),
      // Reinsertar en tablas con aislamiento forzado exige levantarlo: si no,
      // la política rechazaría cada fila contable de la restauración.
      PGOPTIONS: '-c app.bypass_tenant_isolation=on',
    },
  };
}

async function hashFile(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function decryptBackup(source, destination, key) {
  const details = await stat(source);
  if (details.size < 36) throw new Error('El archivo de copia no es válido.');
  const header = Buffer.alloc(20);
  const tag = Buffer.alloc(16);
  const descriptor = await import('node:fs/promises').then(({ open }) => open(source, 'r'));
  try {
    await descriptor.read(header, 0, 20, 0);
    await descriptor.read(tag, 0, 16, details.size - 16);
  } finally {
    await descriptor.close();
  }
  if (!header.subarray(0, 8).equals(MAGIC)) {
    throw new Error('La copia no pertenece al formato de MegaSuite.');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(8));
  decipher.setAuthTag(tag);
  const output = createWriteStream(destination, { flags: 'wx', mode: 0o600 });
  for await (const chunk of createReadStream(source, {
    start: 20,
    end: details.size - 17,
  })) {
    output.write(decipher.update(chunk));
  }
  output.write(decipher.final());
  await new Promise((resolve, reject) => {
    output.end(resolve);
    output.on('error', reject);
  });
}

async function restore() {
  const backupFile = process.argv[2] ? path.resolve(process.argv[2]) : null;
  const confirmed = process.argv.includes('--confirm=RESTORE_MEGASUITE');
  const targetDatabase = process.env.BACKUP_RESTORE_DATABASE_URL;
  const configuredRestoreStorage = process.env.BACKUP_RESTORE_STORAGE_DIR?.trim();
  if (!backupFile || !confirmed || !targetDatabase || !configuredRestoreStorage) {
    throw new Error(
      'Uso: BACKUP_RESTORE_DATABASE_URL=... BACKUP_RESTORE_STORAGE_DIR=/ruta/aislada node scripts/restore-backup.js archivo.msbackup --confirm=RESTORE_MEGASUITE',
    );
  }
  if (!path.isAbsolute(configuredRestoreStorage)) {
    throw new Error('BACKUP_RESTORE_STORAGE_DIR debe ser una ruta absoluta y aislada.');
  }
  const productionStorage = path.resolve(config.storageDir);
  const restoreStorage = path.resolve(configuredRestoreStorage);
  const sharesProductionStorage = productionStorage === restoreStorage ||
    productionStorage.startsWith(`${restoreStorage}${path.sep}`) ||
    restoreStorage.startsWith(`${productionStorage}${path.sep}`);
  if (sharesProductionStorage) {
    throw new Error('La restauración debe usar almacenamiento aislado; nunca el directorio activo.');
  }
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'megasuite-restore-'));
  const bundle = path.join(temporary, 'bundle.tar.gz');
  try {
    await decryptBackup(backupFile, bundle, keyFromEnvironment());
    await run('tar', ['-xzf', bundle, '-C', temporary]);
    const manifest = JSON.parse(
      await readFile(path.join(temporary, 'manifest.json'), 'utf8'),
    );
    if (manifest.databaseSha256 !==
        await hashFile(path.join(temporary, 'database.dump')) ||
        manifest.storageSha256 !==
        await hashFile(path.join(temporary, 'storage.tar.gz'))) {
      throw new Error('La copia no superó la verificación de integridad.');
    }
    const database = databaseConnection(targetDatabase);
    await run(process.env.PG_RESTORE_BIN || 'pg_restore', [
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      ...database.args,
      path.join(temporary, 'database.dump'),
    ], database.environment);
    try {
      await stat(restoreStorage);
      await rename(restoreStorage, `${restoreStorage}.before-restore-${Date.now()}`);
    } catch {
      // No existía almacenamiento previo.
    }
    await run('mkdir', ['-p', restoreStorage]);
    await run('tar', ['-xzf', path.join(temporary, 'storage.tar.gz'), '-C', restoreStorage]);
    process.stdout.write(
      `Restauración verificada. Copia creada: ${manifest.createdAt}\n`,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

restore().catch((error) => {
  process.stderr.write(`Restauración fallida: ${error.message}\n`);
  process.exitCode = 1;
});
