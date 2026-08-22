import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import {
  resolveRequiredPermissions,
  SELF_GUARDED_API_PREFIXES,
} from '../src/authorization.js';

// Rutas montadas antes del guardián de sesión: son públicas a propósito.
const UNAUTHENTICATED_PREFIXES = ['/api/health', '/api/version', '/api/auth'];

// Reconstruye el prefijo de montaje desde la expresión regular de Express.
function mountPath(layer) {
  if (layer.regexp?.fast_slash) return '';
  const match = layer.regexp?.source?.match(/^\^\\\/(.*)\\\/\?\(\?=/);
  if (!match) return '';
  return `/${match[1].replace(/\\\//g, '/').replace(/\\\./g, '.')}`;
}

// Sustituye los parámetros por un UUID para que la ruta se parezca a una real:
// el mapa de permisos distingue por sufijos como /content o /complete.
function concreteExample(routePath) {
  return routePath.replace(/:[^/]+/g, '00000000-0000-0000-0000-000000000001');
}

function collectRoutes(stack, base, found) {
  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        found.push({ method: method.toUpperCase(), path: base + layer.route.path });
      }
    } else if (layer.name === 'router' && layer.handle?.stack) {
      collectRoutes(layer.handle.stack, base + mountPath(layer), found);
    }
  }
}

function apiRoutes() {
  const app = createApp({ security: false, moduleGates: false });
  const found = [];
  collectRoutes(app._router.stack, '', found);
  return found.filter((route) => route.path.startsWith('/api/'));
}

test('toda ruta de la API declara los permisos que exige', () => {
  const sinDeclarar = apiRoutes().filter((route) => {
    if (UNAUTHENTICATED_PREFIXES.some((prefix) => route.path.startsWith(prefix))) return false;
    if (SELF_GUARDED_API_PREFIXES.some((prefix) => route.path.startsWith(prefix))) return false;
    return resolveRequiredPermissions(concreteExample(route.path), route.method) === null;
  });
  assert.deepEqual(
    sinDeclarar.map((route) => `${route.method} ${route.path}`),
    [],
    'Estas rutas quedarían sin verificación de membresía: registra sus permisos ' +
    'en resolveRequiredPermissions o decláralas en SELF_GUARDED_API_PREFIXES.',
  );
});

test('el recorrido encuentra rutas de verdad y no una lista vacía', () => {
  const routes = apiRoutes();
  assert.ok(routes.length > 200, `esperábamos más de 200 rutas, encontramos ${routes.length}`);
  assert.ok(routes.some((route) => route.path.startsWith('/api/pos')));
  assert.ok(routes.some((route) => route.path.startsWith('/api/audit')));
});

test('una ruta no declarada no se cuela por omisión', () => {
  assert.equal(resolveRequiredPermissions('/api/modulo-inventado', 'GET'), null);
  assert.deepEqual(resolveRequiredPermissions('/api/dashboard/executive', 'GET'), ['dashboard.view']);
  assert.deepEqual(resolveRequiredPermissions('/api/companies', 'GET'), []);
});
