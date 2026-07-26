import { createConnection } from 'node:net';
import { connect as createTlsConnection } from 'node:tls';
import { config } from './config.js';
import { ServiceUnavailableError } from './shared/errors.js';

function encodeCommand(parts) {
  return `*${parts.length}\r\n${parts
    .map((part) => `$${Buffer.byteLength(String(part))}\r\n${part}\r\n`)
    .join('')}`;
}

export async function checkRedis() {
  if (!config.redisUrl) {
    throw new ServiceUnavailableError('Redis no está configurado.', 'REDIS_NOT_CONFIGURED');
  }

  const url = new URL(config.redisUrl);
  const startedAt = performance.now();
  const username = url.username ? decodeURIComponent(url.username) : null;
  const password = url.password ? decodeURIComponent(url.password) : null;
  const database = url.pathname.length > 1 ? url.pathname.slice(1) : null;

  await new Promise((resolve, reject) => {
    const connectionOptions = {
      host: url.hostname,
      port: Number(url.port || 6379),
      timeout: config.databaseConnectTimeoutMs,
    };
    const socket = url.protocol === 'rediss:'
      ? createTlsConnection(connectionOptions)
      : createConnection(connectionOptions);
    let response = '';
    const commands = [];
    if (password) commands.push(username ? ['AUTH', username, password] : ['AUTH', password]);
    if (database) commands.push(['SELECT', database]);
    commands.push(['PING']);

    socket.on('connect', () => socket.write(commands.map(encodeCommand).join('')));
    socket.on('data', (chunk) => {
      response += chunk.toString();
      if (response.split('\r\n').some((line) => line.startsWith('-'))) {
        socket.destroy(new Error('Redis rejected the readiness command'));
        return;
      }
      if (response.includes('+PONG\r\n')) socket.end();
    });
    socket.on('timeout', () => socket.destroy(new Error('Redis connection timeout')));
    socket.on('error', reject);
    socket.on('close', () => {
      if (response.includes('+PONG\r\n')) resolve();
      else reject(new Error('Redis did not respond to PING'));
    });
  });

  return { latencyMs: Math.round(performance.now() - startedAt) };
}
