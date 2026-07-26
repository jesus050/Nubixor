const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const elements = {
  refreshButton: document.querySelector('#refreshButton'),
  overallIndicator: document.querySelector('#overallIndicator'),
  overallLabel: document.querySelector('#overallLabel'),
  systemScore: document.querySelector('#systemScore'),
  scoreRing: document.querySelector('#scoreRing'),
  lastChecked: document.querySelector('#lastChecked'),
  apiDot: document.querySelector('#apiDot'),
  apiResult: document.querySelector('#apiResult'),
  postgresDot: document.querySelector('#postgresDot'),
  postgresResult: document.querySelector('#postgresResult'),
  redisDot: document.querySelector('#redisDot'),
  redisResult: document.querySelector('#redisResult'),
  companyCount: document.querySelector('#companyCount'),
  companyDetail: document.querySelector('#companyDetail'),
  warehouseCount: document.querySelector('#warehouseCount'),
  warehouseDetail: document.querySelector('#warehouseDetail'),
  productCount: document.querySelector('#productCount'),
  productDetail: document.querySelector('#productDetail'),
  balanceCount: document.querySelector('#balanceCount'),
  balanceDetail: document.querySelector('#balanceDetail'),
  menuButton: document.querySelector('#menuButton'),
  sidebar: document.querySelector('#sidebar'),
  moduleSearch: document.querySelector('#moduleSearch'),
  moduleGrid: document.querySelector('#moduleGrid'),
  emptySearch: document.querySelector('#emptySearch'),
  moduleResult: document.querySelector('#moduleResult'),
  toast: document.querySelector('#toast'),
};

let toastTimer;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('visible'), 2600);
}

function setServiceState(dot, result, state, message) {
  dot.classList.remove('ok', 'error');
  if (state) dot.classList.add(state);
  result.textContent = message;
}

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || 'No fue posible consultar la API.');
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function setMetric(valueElement, detailElement, result, label) {
  if (result.status === 'fulfilled') {
    const count = Array.isArray(result.value) ? result.value.length : 0;
    valueElement.textContent = String(count);
    detailElement.textContent = `${count} ${count === 1 ? label[0] : label[1]}`;
    return;
  }
  valueElement.textContent = '—';
  detailElement.textContent = 'No disponible';
}

async function refreshStatus({ notify = false } = {}) {
  elements.refreshButton.classList.add('loading');
  elements.refreshButton.disabled = true;
  elements.overallLabel.textContent = 'Comprobando';
  elements.overallIndicator.className = 'live-indicator';

  const healthPromise = getJson('/api/health');
  const readyPromise = getJson('/api/health/ready').catch((error) => error.body || Promise.reject(error));
  const headers = { 'x-tenant-id': DEMO_TENANT_ID };
  const dataPromises = [
    getJson('/api/companies'),
    getJson('/api/warehouses', { headers }),
    getJson('/api/products', { headers }),
    getJson('/api/inventory/balances', { headers }),
  ];

  const [health, readiness, data] = await Promise.all([
    Promise.allSettled([healthPromise]),
    readyPromise,
    Promise.allSettled(dataPromises),
  ]);

  const apiOk = health[0].status === 'fulfilled' && health[0].value.ok;
  const postgresOk = Boolean(readiness?.checks?.postgres?.ok);
  const redisOk = Boolean(readiness?.checks?.redis?.ok);
  const readyCount = [apiOk, postgresOk, redisOk].filter(Boolean).length;

  setServiceState(
    elements.apiDot,
    elements.apiResult,
    apiOk ? 'ok' : 'error',
    apiOk ? 'Operativa' : 'Sin respuesta',
  );
  setServiceState(
    elements.postgresDot,
    elements.postgresResult,
    postgresOk ? 'ok' : 'error',
    postgresOk ? `Lista · ${readiness.checks.postgres.latencyMs} ms` : 'No disponible',
  );
  setServiceState(
    elements.redisDot,
    elements.redisResult,
    redisOk ? 'ok' : 'error',
    redisOk ? `Listo · ${readiness.checks.redis.latencyMs} ms` : 'No disponible',
  );

  elements.systemScore.textContent = `${readyCount}/3`;
  elements.scoreRing.style.background =
    `conic-gradient(#739b77 0deg ${readyCount * 120}deg, rgba(255,255,255,.09) ${readyCount * 120}deg)`;
  elements.overallIndicator.classList.add(readyCount === 3 ? 'ready' : 'error');
  elements.overallLabel.textContent = readyCount === 3 ? 'Todo operativo' : 'Requiere atención';
  elements.lastChecked.textContent = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

  setMetric(elements.companyCount, elements.companyDetail, data[0], ['empresa activa', 'empresas activas']);
  setMetric(elements.warehouseCount, elements.warehouseDetail, data[1], ['bodega registrada', 'bodegas registradas']);
  setMetric(elements.productCount, elements.productDetail, data[2], ['producto registrado', 'productos registrados']);
  setMetric(elements.balanceCount, elements.balanceDetail, data[3], ['saldo registrado', 'saldos registrados']);

  elements.refreshButton.classList.remove('loading');
  elements.refreshButton.disabled = false;
  if (notify) showToast(readyCount === 3 ? 'Estado actualizado correctamente.' : 'Hay servicios que requieren atención.');
}

function filterModules() {
  const query = elements.moduleSearch.value.trim().toLocaleLowerCase('es');
  const cards = [...elements.moduleGrid.querySelectorAll('.module-card')];
  let visible = 0;

  for (const card of cards) {
    const matches = !query || card.dataset.search.includes(query) ||
      card.textContent.toLocaleLowerCase('es').includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  }

  elements.emptySearch.hidden = visible !== 0;
  elements.moduleResult.textContent = query
    ? `${visible} ${visible === 1 ? 'módulo encontrado' : 'módulos encontrados'} para “${elements.moduleSearch.value.trim()}”.`
    : 'Módulos actuales y próximos componentes del ERP.';
}

function toggleMenu(forceOpen) {
  const open = typeof forceOpen === 'boolean'
    ? forceOpen
    : !elements.sidebar.classList.contains('open');
  elements.sidebar.classList.toggle('open', open);
  elements.menuButton.setAttribute('aria-expanded', String(open));
}

document.querySelector('#currentDate').textContent = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date());

elements.refreshButton.addEventListener('click', () => refreshStatus({ notify: true }));
elements.moduleSearch.addEventListener('input', filterModules);
elements.menuButton.addEventListener('click', () => toggleMenu());
elements.sidebar.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => toggleMenu(false));
});

refreshStatus().catch(() => {
  elements.refreshButton.classList.remove('loading');
  elements.refreshButton.disabled = false;
  elements.overallIndicator.classList.add('error');
  elements.overallLabel.textContent = 'Sin conexión';
  setServiceState(elements.apiDot, elements.apiResult, 'error', 'Sin respuesta');
});
