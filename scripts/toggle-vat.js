import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// El paquete declara "type": "module": este archivo se ejecuta como ESM.
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const tenantId = '00000000-0000-0000-0000-000000000001';
const action = process.argv[2]; // 'on' o 'off'

if (action !== 'on' && action !== 'off') {
  console.log('Uso: npm run toggle-vat -- on|off');
  console.log('Ejemplo para activar IVA 19% en todo: npm run toggle-vat -- on');
  console.log('Ejemplo para quitar IVA (Excluido 0%) en todo: npm run toggle-vat -- off');
  process.exit(1);
}

const taxCode = action === 'on' ? 'IVA19' : 'EXCL';
console.log(`⏳ Preparando para configurar todos los productos con impuesto: ${taxCode}...`);

const sql = `
  UPDATE products 
  SET sales_tax_category_id = (
    SELECT id FROM tax_categories WHERE tenant_id = '${tenantId}' AND code = '${taxCode}' LIMIT 1
  ),
  updated_at = now()
  WHERE tenant_id = '${tenantId}';
`;

const composeYaml = `services:
  vat_updater:
    image: docker:cli
    restart: "no"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: sh -c "docker exec nubixor-postgres-1 psql -U postgres -d megasuite -c \\"${sql.replace(/\n/g, ' ')}\\" && echo OK"
`;

const args = [
  "scripts/hostinger-mcp-client.js",
  "hostinger-vps-mcp",
  "VPS_createNewProjectV1",
  JSON.stringify({
    virtualMachineId: 1865967,
    project_name: "vatupd-" + Date.now(),
    content: composeYaml,
  }),
];

execFile(process.execPath, args, { cwd: path.resolve(scriptDir, '..'), timeout: 40000 }, (err, stdout) => {
  if (err) { 
    console.error("❌ Error conectando al servidor:", err.message); 
    return; 
  }
  console.log(`✅ ¡Comando enviado al servidor! Todos los productos se actualizarán a ${taxCode} en breve.`);
  console.log("Nota: Refresca la página de productos en unos segundos para ver el cambio.");
});
