import {
  createCipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
} from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { config } from '../src/config.js';
import { failBackupRun, finishBackupRun, startBackupRun } from './backup-log.js';

const MAGIC = Buffer.from('MSBACK01');

function encryptionKey() {
  const raw = config.backupEncryptionKey || '';
  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('BACKUP_ENCRYPTION_KEY debe contener exactamente 32 bytes.');
  }
  return key;
}

function run(command, args, environment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      env: { ...process.env, ...environment },
    });
    let errorOutput = '';
    child.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString().slice(0, 2000);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} terminó con código ${code}: ${errorOutput}`));
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
      // Las tablas contables tienen aislamiento por fila forzado. Sin levantarlo
      // el respaldo fallaría, o peor, guardaría esas tablas vacías.
      PGOPTIONS: '-c app.bypass_tenant_isolation=on',
      ...(config.databaseSsl ? { PGSSLMODE: 'require' } : {}),
    },
  };
}

async function sha256(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function encryptFile(source, destination, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const output = createWriteStream(destination, { flags: 'wx', mode: 0o600 });
  output.write(MAGIC);
  output.write(iv);
  for await (const chunk of createReadStream(source)) {
    output.write(cipher.update(chunk));
  }
  output.write(cipher.final());
  output.write(cipher.getAuthTag());
  await new Promise((resolve, reject) => {
    output.end(resolve);
    output.on('error', reject);
  });
}

async function pruneBackups(directory) {
  const cutoff = Date.now() - config.backupRetentionDays * 24 * 60 * 60 * 1000;
  const removed = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.msbackup')) continue;
    const filePath = path.join(directory, entry.name);
    if ((await stat(filePath)).mtimeMs < cutoff) {
      await rm(filePath);
      removed.push(entry.name);
    }
  }
  return removed;
}

export async function runBackup() {
  if (!config.databaseUrl) throw new Error('DATABASE_URL es obligatoria.');
  // La ejecución se anota antes de empezar: si el proceso muere a mitad, la
  // fila queda en RUNNING y eso ya dice que esa noche el respaldo no terminó.
  const run = await startBackupRun('BACKUP');
  const key = encryptionKey();
  const backupDir = path.resolve(config.backupDir);
  const storageDir = path.resolve(config.storageDir);
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'megasuite-backup-'));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const databaseFile = path.join(temporary, 'database.dump');
  const storageFile = path.join(temporary, 'storage.tar.gz');
  const manifestFile = path.join(temporary, 'manifest.json');
  const bundleFile = path.join(temporary, 'bundle.tar.gz');
  const finalFile = path.join(backupDir, `megasuite-${stamp}.msbackup`);
  try {
    await mkdir(backupDir, { recursive: true, mode: 0o700 });
    const database = databaseConnection(config.databaseUrl);
    await run(process.env.PG_DUMP_BIN || 'pg_dump', [
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      // pg_dump apaga las políticas por su cuenta y eso lo rechaza PostgreSQL
      // cuando el usuario no puede saltárselas; aquí sí aplican, y la compuerta
      // de mantenimiento las deja pasar todas.
      '--enable-row-security',
      '--file',
      databaseFile,
      ...database.args,
    ], database.environment);
    try {
      await stat(storageDir);
      await run('tar', ['-czf', storageFile, '-C', storageDir, '.']);
    } catch {
      await run('tar', ['-czf', storageFile, '--files-from', '/dev/null']);
    }
    const manifest = {
      schema: 'megasuite.encrypted-backup.v1',
      createdAt: new Date().toISOString(),
      databaseSha256: await sha256(databaseFile),
      storageSha256: await sha256(storageFile),
    };
    await writeFile(manifestFile, JSON.stringify(manifest, null, 2), { mode: 0o600 });
    await run('tar', [
      '-czf',
      bundleFile,
      '-C',
      temporary,
      'database.dump',
      'storage.tar.gz',
      'manifest.json',
    ]);
    await encryptFile(bundleFile, finalFile, key);
    const removed = await pruneBackups(backupDir);
    const result = {
      file: finalFile,
      bytes: (await stat(finalFile)).size,
      sha256: await sha256(finalFile),
      removed,
    };
    await finishBackupRun(run, {
      file: path.basename(result.file),
      bytes: result.bytes,
      sha256: result.sha256,
      prunedCount: removed.length,
    });
    return result;
  } catch (error) {
    await failBackupRun(run, error);
    throw error;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) {
  runBackup()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => {
      process.stderr.write(`Backup fallido: ${error.message}\n`);
      process.exitCode = 1;
    });
}
