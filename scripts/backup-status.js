import { closeDatabase } from '../src/db.js';
import { backupStatus } from './backup-log.js';

const DIA_MS = 24 * 60 * 60 * 1000;

function hace(fecha) {
  if (!fecha) return 'nunca';
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / DIA_MS);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

function peso(bytes) {
  if (!bytes) return '—';
  const mb = Number(bytes) / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

function duracion(ms) {
  if (!ms) return '—';
  const segundos = Math.round(Number(ms) / 1000);
  return segundos >= 60 ? `${Math.floor(segundos / 60)} min ${segundos % 60} s` : `${segundos} s`;
}

const estado = await backupStatus();
const bueno = estado.lastSuccessfulBackup;
const intento = estado.lastBackupAttempt;
const restauracion = estado.lastRestoreTest;

const lineas = [
  '',
  'Estado de los respaldos de Nubixor',
  '──────────────────────────────────',
  `Último respaldo correcto:   ${bueno ? `${new Date(bueno.started_at).toISOString()} (${hace(bueno.started_at)})` : 'nunca'}`,
  `  archivo:                  ${bueno?.file_name || '—'}`,
  `  tamaño:                   ${peso(bueno?.bytes)}`,
  `  duración:                 ${duracion(bueno?.duration_ms)}`,
  `  sha256:                   ${bueno?.sha256 || '—'}`,
  `  copias eliminadas:        ${bueno?.pruned_count ?? '—'}`,
  '',
  `Último intento:             ${intento ? `${intento.status} · ${hace(intento.started_at)}` : 'nunca'}`,
  intento?.error_message ? `  error:                    ${intento.error_message}` : null,
  `Última verificación:        ${hace(estado.lastVerification?.started_at)}`,
  `Última prueba de restauración: ${hace(restauracion?.started_at)}`,
  `Ejecuciones sin terminar:   ${estado.unfinishedRuns}`,
  '',
].filter((linea) => linea !== null);

const avisos = [];
// Un respaldo de hace más de dos días con periodicidad diaria significa que
// alguna noche falló y nadie se enteró.
if (!bueno) avisos.push('No hay ningún respaldo correcto registrado.');
else if (Date.now() - new Date(bueno.started_at).getTime() > 2 * DIA_MS) {
  avisos.push('El último respaldo correcto tiene más de dos días.');
}
if (intento?.status === 'FAILED') avisos.push('El último intento de respaldo falló.');
if (estado.unfinishedRuns > 0) {
  avisos.push(`Hay ${estado.unfinishedRuns} ejecución(es) que empezaron y no terminaron.`);
}
// Una copia que nunca se restauró no está comprobada: puede estar corrupta,
// incompleta o cifrada con una clave que ya nadie tiene.
if (!restauracion) {
  avisos.push('Nunca se ha probado una restauración. Ver docs/RESTAURACION.md.');
} else if (Date.now() - new Date(restauracion.started_at).getTime() > 90 * DIA_MS) {
  avisos.push('La última prueba de restauración tiene más de 90 días.');
}

if (avisos.length) {
  lineas.push('Avisos:');
  for (const aviso of avisos) lineas.push(`  ⚠ ${aviso}`);
  lineas.push('');
}

process.stdout.write(`${lineas.join('\n')}\n`);
await closeDatabase();
process.exitCode = avisos.length ? 1 : 0;
