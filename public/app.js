const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:4100' : '';

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
  companySearch: document.querySelector('#companySearch'),
  companyTableBody: document.querySelector('#companyTableBody'),
  companyDataState: document.querySelector('#companyDataState'),
  companyRecordCount: document.querySelector('#companyRecordCount'),
  reloadCompaniesButton: document.querySelector('#reloadCompaniesButton'),
  newCompanyButton: document.querySelector('#newCompanyButton'),
  companyDialog: document.querySelector('#companyDialog'),
  closeCompanyDialog: document.querySelector('#closeCompanyDialog'),
  cancelCompanyButton: document.querySelector('#cancelCompanyButton'),
  companyForm: document.querySelector('#companyForm'),
  companyFormError: document.querySelector('#companyFormError'),
  saveCompanyButton: document.querySelector('#saveCompanyButton'),
  toast: document.querySelector('#toast'),
};

let toastTimer;
let companies = [];

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
  const { headers = {}, ...requestOptions } = options;
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...requestOptions,
    headers: { Accept: 'application/json', ...headers },
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

function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

function createCell(label, value) {
  const cell = document.createElement('td');
  cell.dataset.label = label;
  cell.textContent = value || '—';
  return cell;
}

function renderCompanies() {
  const query = normalizeSearch(elements.companySearch.value.trim());
  const filtered = companies.filter((company) => {
    const searchable = normalizeSearch([
      company.legal_name,
      company.trade_name,
      company.tax_id,
    ].filter(Boolean).join(' '));
    return !query || searchable.includes(query);
  });

  elements.companyTableBody.replaceChildren();
  elements.companyDataState.hidden = filtered.length > 0;
  elements.companyDataState.classList.remove('error');

  if (!filtered.length) {
    const hasSearch = Boolean(query);
    elements.companyDataState.querySelector('strong').textContent =
      hasSearch ? 'No encontramos empresas' : 'Todavía no hay empresas';
    elements.companyDataState.querySelector('p').textContent =
      hasSearch ? 'Prueba con otro nombre o número de identificación.' : 'Crea la primera empresa para comenzar.';
  }

  for (const company of filtered) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Empresa';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'company-name';
    const initial = document.createElement('span');
    initial.textContent = company.legal_name.slice(0, 1).toUpperCase();
    const legalName = document.createElement('strong');
    legalName.textContent = company.legal_name;
    nameWrap.append(initial, legalName);
    nameCell.append(nameWrap);
    row.append(nameCell);
    row.append(createCell('Nombre comercial', company.trade_name));
    row.append(createCell('NIT', company.tax_id));

    const statusCell = document.createElement('td');
    statusCell.dataset.label = 'Estado';
    const status = document.createElement('span');
    status.className = `table-status ${company.status === 'ACTIVE' ? 'active' : 'inactive'}`;
    status.textContent = company.status === 'ACTIVE' ? 'Activa' : company.status;
    statusCell.append(status);
    row.append(statusCell);

    const createdAt = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(company.created_at));
    row.append(createCell('Creada', createdAt));
    elements.companyTableBody.append(row);
  }

  elements.companyRecordCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? 'empresa' : 'empresas'}`;
}

function showCompanyError(message) {
  elements.companyTableBody.replaceChildren();
  elements.companyDataState.hidden = false;
  elements.companyDataState.classList.add('error');
  elements.companyDataState.querySelector('strong').textContent = 'No pudimos cargar las empresas';
  elements.companyDataState.querySelector('p').textContent = message;
  elements.companyRecordCount.textContent = 'Sin conexión de datos';
}

async function loadCompanies() {
  elements.reloadCompaniesButton.disabled = true;
  try {
    companies = await getJson('/api/companies');
    renderCompanies();
    return companies;
  } catch (error) {
    companies = [];
    showCompanyError(error.message);
    throw error;
  } finally {
    elements.reloadCompaniesButton.disabled = false;
  }
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
    `conic-gradient(#4fd2e9 0deg ${readyCount * 120}deg, rgba(255,255,255,.11) ${readyCount * 120}deg)`;
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
  if (data[0].status === 'fulfilled') {
    companies = data[0].value;
    renderCompanies();
  } else {
    showCompanyError(data[0].reason?.message || 'PostgreSQL no está disponible.');
  }

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

function setActiveNavigation(selectedLink) {
  const links = [...elements.sidebar.querySelectorAll('.nav-item')];
  for (const link of links) {
    const isActive = link === selectedLink;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function openCompanyDialog() {
  elements.companyForm.reset();
  elements.companyFormError.hidden = true;
  elements.companyDialog.showModal();
  document.querySelector('#legalName').focus();
}

function closeCompanyDialog() {
  elements.companyDialog.close();
}

async function submitCompany(event) {
  event.preventDefault();
  elements.companyFormError.hidden = true;
  elements.saveCompanyButton.disabled = true;
  elements.saveCompanyButton.textContent = 'Guardando…';

  const formData = new FormData(elements.companyForm);
  const payload = {
    legalName: formData.get('legalName'),
    tradeName: formData.get('tradeName') || null,
    taxId: formData.get('taxId') || null,
  };

  try {
    await getJson('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    closeCompanyDialog();
    await loadCompanies();
    elements.companyCount.textContent = String(companies.length);
    elements.companyDetail.textContent =
      `${companies.length} ${companies.length === 1 ? 'empresa activa' : 'empresas activas'}`;
    showToast('Empresa creada correctamente.');
  } catch (error) {
    elements.companyFormError.textContent = error.message;
    elements.companyFormError.hidden = false;
  } finally {
    elements.saveCompanyButton.disabled = false;
    elements.saveCompanyButton.textContent = 'Guardar empresa';
  }
}

document.querySelector('#currentDate').textContent = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date());

elements.refreshButton.addEventListener('click', () => refreshStatus({ notify: true }));
elements.moduleSearch.addEventListener('input', filterModules);
elements.companySearch.addEventListener('input', renderCompanies);
elements.reloadCompaniesButton.addEventListener('click', () => {
  loadCompanies()
    .then(() => showToast('Empresas actualizadas.'))
    .catch(() => showToast('No fue posible actualizar las empresas.'));
});
elements.newCompanyButton.addEventListener('click', openCompanyDialog);
elements.closeCompanyDialog.addEventListener('click', closeCompanyDialog);
elements.cancelCompanyButton.addEventListener('click', closeCompanyDialog);
elements.companyForm.addEventListener('submit', submitCompany);
elements.companyDialog.addEventListener('click', (event) => {
  if (event.target === elements.companyDialog) closeCompanyDialog();
});
elements.menuButton.addEventListener('click', () => toggleMenu());
elements.sidebar.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    setActiveNavigation(link);
    toggleMenu(false);
  });
});

refreshStatus().catch(() => {
  elements.refreshButton.classList.remove('loading');
  elements.refreshButton.disabled = false;
  elements.overallIndicator.classList.add('error');
  elements.overallLabel.textContent = 'Sin conexión';
  setServiceState(elements.apiDot, elements.apiResult, 'error', 'Sin respuesta');
});
