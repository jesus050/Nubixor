import { createDecipheriv, createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  mkdtemp,
  open,
  readFile,
  rm,
  stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { config } from '../src/config.js';
import { closeDatabase } from '../src/db.js';
import { failBackupRun, finishBackupRun, startBackupRun } from './backup-log.js';

const MAGIC = Buffer.from('MSBACK01');
const EXPECTED_ENTRIES = new Set([
  'database.dump',
  'storage.tar.gz',
  'manifest.json',
]);

function encryptionKey() {
  const raw = config.backupEncryptionKey || '';
  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('BACKUP_ENCRYPTION_KEY no es válida; debe contener exactamente 32 bytes.');
  }
  return key;
}

function run(command, args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', capture ? 'pipe' : 'ignore', 'pipe'],
    });
    let output = '';
    let errors = '';
    child.stdout?.on('data', (chunk) => { output += chunk.toString(); });
    child.stderr.on('data', (chunk) => { errors += chunk.toString().slice(0, 2000); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} terminó con código ${code}: ${errors}`));
    });
  });
}

async function sha256(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

async function decrypt(source, destination) {
  const details = await stat(source);
  if (details.size < 36) throw new Error('El archivo de copia no es válido.');
  const header = Buffer.alloc(20);
  const tag = Buffer.alloc(16);
  const descriptor = await open(source, 'r');
  try {
    await descriptor.read(header, 0, header.length, 0);
    await descriptor.read(tag, 0, tag.length, details.size - tag.length);
  } finally {
    await descriptor.close();
  }
  if (!header.subarray(0, 8).equals(MAGIC)) {
    throw new Error('La copia no pertenece al formato cifrado de Nubixor.');
  }

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), header.subarray(8));
  decipher.setAuthTag(tag);
  const output = createWriteStream(destination, { flags: 'wx', mode: 0o600 });
  for await (const chunk of createReadStream(source, {
    start: header.length,
    end: details.size - tag.length - 1,
  })) {
    output.write(decipher.update(chunk));
  }
  output.write(decipher.final());
  await new Promise((resolve, reject) => {
    output.end(resolve);
    output.on('error', reject);
  });
}

async function verifyBackup(backupFile) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'nubixor-backup-verify-'));
  const bundle = path.join(temporary, 'bundle.tar.gz');
  try {
    await decrypt(backupFile, bundle);
    const entries = (await run('tar', ['-tzf', bundle], { capture: true }))
      .split(/\r?\n/)
      .filter(Boolean);
    if (entries.length !== EXPECTED_ENTRIES.size || entries.some((entry) => !EXPECTED_ENTRIES.has(entry))) {
      throw new Error('El contenido de la copia no coincide con el formato esperado.');
    }
    await run('tar', ['-xzf', bundle, '-C', temporary, ...EXPECTED_ENTRIES]);
    const manifest = JSON.parse(await readFile(path.join(temporary, 'manifest.json'), 'utf8'));
    if (manifest.schema !== 'megasuite.encrypted-backup.v1') {
      throw new Error('La versión de la copia no es compatible.');
    }
    const databaseSha256 = await sha256(path.join(temporary, 'database.dump'));
    const storageSha256 = await sha256(path.join(temporary, 'storage.tar.gz'));
    if (manifest.databaseSha256 !== databaseSha256 || manifest.storageSha256 !== storageSha256) {
      throw new Error('La copia no superó la verificación de integridad.');
    }
    return {
      verified: true,
      fileName: path.basename(backupFile),
      createdAt: manifest.createdAt,
      bytes: (await stat(backupFile)).size,
      databaseSha256,
      storageSha256,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

const backupFile = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!backupFile) {
  process.stderr.write('Uso: npm run backup:verify -- archivo.msbackup\n');
  process.exitCode = 1;
} else {
  // La verificación se anota igual que el respaldo: saber que la última copia
  // se comprobó, y cuándo, es parte de saber si hay respaldo.
  startBackupRun('VERIFICATION')
    .then(async (run) => {
      try {
        const result = await verifyBackup(backupFile);
        await finishBackupRun(run, {
          file: result.fileName,
          bytes: result.bytes,
          sha256: result.databaseSha256,
        });
        process.stdout.write(`${JSON.stringify(result)}\n`);
      } catch (error) {
        await failBackupRun(run, error);
        throw error;
      }
    })
    .catch((error) => {
      process.stderr.write(`Verificación fallida: ${error.message}\n`);
      process.exitCode = 1;
    })
    .finally(() => closeDatabase().catch(() => {}));
}
