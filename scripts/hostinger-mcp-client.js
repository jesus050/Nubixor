import { spawn } from 'node:child_process';
import process from 'node:process';

const [binary = 'hostinger-vps-mcp', operation = 'tools/list', cliArguments = '{}'] =
  process.argv.slice(2);
const rawArguments = process.env.MCP_ARGUMENTS_JSON || cliArguments;

const npx = '/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/npx';
const child = spawn(
  npx,
  ['--yes', '--package=hostinger-api-mcp@1.23.0', binary],
  {
    env: {
      ...process.env,
      PATH:
        '/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    },
    stdio: ['pipe', 'pipe', 'inherit'],
  },
);

let buffer = '';
let initialized = false;
let completed = false;

function send(message) {
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function finish(result) {
  if (completed) return;
  completed = true;
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  child.stdin.end();
  child.kill('SIGTERM');
}

function handle(message) {
  if (message.id === 1 && !initialized) {
    initialized = true;
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });

    if (operation === 'tools/list') {
      send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      return;
    }

    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: operation,
        arguments: JSON.parse(rawArguments),
      },
    });
    return;
  }

  if (message.id === 2) finish(message);
}

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  while (buffer.includes('\n')) {
    const lineEnd = buffer.indexOf('\n');
    const line = buffer.slice(0, lineEnd).trim();
    buffer = buffer.slice(lineEnd + 1);
    if (!line) continue;
    try {
      handle(JSON.parse(line));
    } catch {
      // The MCP process may write non-protocol diagnostics to stdout.
    }
  }
});

child.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});

child.on('exit', (code) => {
  if (!completed && code) process.exitCode = code;
});

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'nubixor-deployer', version: '1.0.0' },
  },
});

setTimeout(() => {
  if (!completed) {
    child.kill('SIGTERM');
    process.stderr.write('El servidor MCP no respondió dentro de 30 segundos.\n');
    process.exit(1);
  }
}, 30_000).unref();
