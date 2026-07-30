import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mcpClient = path.join(__dirname, 'hostinger-mcp-client.js');
const nodeBin = process.execPath;

const DEFAULT_VM_ID = 1865967;
const DEFAULT_PROJECT = 'nubixor';

function runMcp(toolName, args = {}) {
  const cmd = `"${nodeBin}" "${mcpClient}" hostinger-vps-mcp ${toolName} '${JSON.stringify(args)}'`;
  try {
    const raw = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const match = raw.match(/\{[\s\S]*"jsonrpc"[\s\S]*\}/);
    if (!match) return { raw };
    const parsed = JSON.parse(match[0]);
    if (parsed.result && parsed.result.content && parsed.result.content[0]) {
      return JSON.parse(parsed.result.content[0].text);
    }
    return parsed;
  } catch (error) {
    return { error: error.message, stderr: error.stderr?.toString() };
  }
}

const action = process.argv[2] || 'status';
const vmId = Number(process.argv[3] || DEFAULT_VM_ID);
const projectName = process.argv[4] || DEFAULT_PROJECT;

console.log(`\n=== Nubixor Hostinger Deployer ===`);
console.log(`Action: ${action} | VM ID: ${vmId} | Project: ${projectName}\n`);

if (action === 'status') {
  console.log('Consultando estado del proyecto en Hostinger...');
  const res = runMcp('VPS_getProjectContainersV1', { virtualMachineId: vmId, projectName });
  console.log(JSON.stringify(res, null, 2));
} else if (action === 'restart') {
  console.log('Reiniciando el proyecto Nubixor en Hostinger...');
  const res = runMcp('VPS_restartProjectV1', { virtualMachineId: vmId, projectName });
  console.log(JSON.stringify(res, null, 2));
} else if (action === 'update') {
  console.log('Actualizando el proyecto Nubixor en Hostinger...');
  const res = runMcp('VPS_updateProjectV1', { virtualMachineId: vmId, projectName });
  console.log(JSON.stringify(res, null, 2));
} else if (action === 'vms') {
  console.log('Consultando máquinas virtuales...');
  const res = runMcp('VPS_getVirtualMachinesV1', {});
  console.log(JSON.stringify(res, null, 2));
} else {
  console.log(`Uso: node scripts/deploy-hostinger.js [status|restart|update|vms] [vmId] [projectName]`);
}
