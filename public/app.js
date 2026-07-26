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
  companyContext: document.querySelector('#companyContext'),
  companyCount: document.querySelector('#companyCount'),
  companyDetail: document.querySelector('#companyDetail'),
  warehouseCount: document.querySelector('#warehouseCount'),
  warehouseDetail: document.querySelector('#warehouseDetail'),
  productCount: document.querySelector('#productCount'),
  productDetail: document.querySelector('#productDetail'),
  branchCount: document.querySelector('#branchCount'),
  branchDetail: document.querySelector('#branchDetail'),
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
  branchCompanyName: document.querySelector('#branchCompanyName'),
  branchSearch: document.querySelector('#branchSearch'),
  branchTableBody: document.querySelector('#branchTableBody'),
  branchDataState: document.querySelector('#branchDataState'),
  branchRecordCount: document.querySelector('#branchRecordCount'),
  reloadBranchesButton: document.querySelector('#reloadBranchesButton'),
  newBranchButton: document.querySelector('#newBranchButton'),
  branchDialog: document.querySelector('#branchDialog'),
  branchDialogCompany: document.querySelector('#branchDialogCompany'),
  closeBranchDialog: document.querySelector('#closeBranchDialog'),
  cancelBranchButton: document.querySelector('#cancelBranchButton'),
  branchForm: document.querySelector('#branchForm'),
  branchFormError: document.querySelector('#branchFormError'),
  saveBranchButton: document.querySelector('#saveBranchButton'),
  warehouseCompanyName: document.querySelector('#warehouseCompanyName'),
  warehouseSearch: document.querySelector('#warehouseSearch'),
  warehouseTableBody: document.querySelector('#warehouseTableBody'),
  warehouseDataState: document.querySelector('#warehouseDataState'),
  warehouseRecordCount: document.querySelector('#warehouseRecordCount'),
  reloadWarehousesButton: document.querySelector('#reloadWarehousesButton'),
  newWarehouseButton: document.querySelector('#newWarehouseButton'),
  warehouseDialog: document.querySelector('#warehouseDialog'),
  warehouseBranchId: document.querySelector('#warehouseBranchId'),
  closeWarehouseDialog: document.querySelector('#closeWarehouseDialog'),
  cancelWarehouseButton: document.querySelector('#cancelWarehouseButton'),
  warehouseForm: document.querySelector('#warehouseForm'),
  warehouseFormError: document.querySelector('#warehouseFormError'),
  saveWarehouseButton: document.querySelector('#saveWarehouseButton'),
  toast: document.querySelector('#toast'),
};

let toastTimer;
let companies = [];
let branches = [];
let warehouses = [];
let activeTenantId = readTenantPreference();

const warehouseTypeLabels = {
  AVAILABLE: 'Disponible',
  QUARANTINE: 'Cuarentena',
  DAMAGED: 'Averías',
  TRANSIT: 'En tránsito',
};

function readTenantPreference() {
  try {
    return window.localStorage.getItem('megasuite.activeTenantId') || DEMO_TENANT_ID;
  } catch {
    return DEMO_TENANT_ID;
  }
}

function saveTenantPreference(tenantId) {
  try {
    window.localStorage.setItem('megasuite.activeTenantId', tenantId);
  } catch {
    // La selección funciona durante la sesión aunque el navegador bloquee almacenamiento local.
  }
}

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

function getActiveCompany() {
  return companies.find((company) => company.id === activeTenantId) || null;
}

function syncCompanyContext(preferredTenantId = activeTenantId) {
  const availableTenant = companies.find((company) => company.id === preferredTenantId);
  activeTenantId = availableTenant?.id || companies[0]?.id || '';
  elements.companyContext.replaceChildren();

  if (!companies.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Sin empresas disponibles';
    elements.companyContext.append(option);
    elements.companyContext.disabled = true;
  } else {
    for (const company of companies) {
      const option = document.createElement('option');
      option.value = company.id;
      option.textContent = company.trade_name || company.legal_name;
      elements.companyContext.append(option);
    }
    elements.companyContext.value = activeTenantId;
    elements.companyContext.disabled = false;
    saveTenantPreference(activeTenantId);
  }

  const activeCompany = getActiveCompany();
  const companyName = activeCompany?.trade_name || activeCompany?.legal_name || 'Selecciona una empresa';
  elements.branchCompanyName.textContent = companyName;
  elements.branchDialogCompany.textContent = companyName;
  elements.warehouseCompanyName.textContent = companyName;
  elements.newBranchButton.disabled = !activeCompany;
  syncWarehouseBranchOptions();
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
    syncCompanyContext();
    return companies;
  } catch (error) {
    companies = [];
    syncCompanyContext('');
    showCompanyError(error.message);
    throw error;
  } finally {
    elements.reloadCompaniesButton.disabled = false;
  }
}

function renderBranches() {
  const query = normalizeSearch(elements.branchSearch.value.trim());
  const filtered = branches.filter((branch) => {
    const searchable = normalizeSearch([branch.name, branch.code, branch.address].filter(Boolean).join(' '));
    return !query || searchable.includes(query);
  });

  elements.branchTableBody.replaceChildren();
  elements.branchDataState.hidden = filtered.length > 0;
  elements.branchDataState.classList.remove('error');

  if (!filtered.length) {
    const hasSearch = Boolean(query);
    elements.branchDataState.querySelector('strong').textContent =
      hasSearch ? 'No encontramos sucursales' : 'Esta empresa todavía no tiene sucursales';
    elements.branchDataState.querySelector('p').textContent =
      hasSearch ? 'Prueba con otro nombre, código o dirección.' : 'Crea una sucursal para poder organizar sus bodegas.';
  }

  for (const branch of filtered) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Sucursal';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'company-name';
    const initial = document.createElement('span');
    initial.textContent = branch.name.slice(0, 1).toUpperCase();
    const name = document.createElement('strong');
    name.textContent = branch.name;
    nameWrap.append(initial, name);
    nameCell.append(nameWrap);
    row.append(nameCell);
    row.append(createCell('Código', branch.code));
    row.append(createCell('Dirección', branch.address));

    const statusCell = document.createElement('td');
    statusCell.dataset.label = 'Estado';
    const status = document.createElement('span');
    status.className = `table-status ${branch.active ? 'active' : 'inactive'}`;
    status.textContent = branch.active ? 'Activa' : 'Inactiva';
    statusCell.append(status);
    row.append(statusCell);
    elements.branchTableBody.append(row);
  }

  elements.branchRecordCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? 'sucursal' : 'sucursales'}`;
  syncWarehouseBranchOptions();
}

function showBranchError(message) {
  branches = [];
  elements.branchTableBody.replaceChildren();
  elements.branchDataState.hidden = false;
  elements.branchDataState.classList.add('error');
  elements.branchDataState.querySelector('strong').textContent = 'No pudimos cargar las sucursales';
  elements.branchDataState.querySelector('p').textContent = message;
  elements.branchRecordCount.textContent = 'Sin conexión de datos';
  syncWarehouseBranchOptions();
}

async function loadBranches() {
  if (!activeTenantId) {
    showBranchError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }

  elements.reloadBranchesButton.disabled = true;
  try {
    branches = await getJson('/api/branches', {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderBranches();
    return branches;
  } catch (error) {
    showBranchError(error.message);
    throw error;
  } finally {
    elements.reloadBranchesButton.disabled = false;
  }
}

function syncWarehouseBranchOptions() {
  const selectedBranchId = elements.warehouseBranchId.value;
  elements.warehouseBranchId.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = branches.length
    ? 'Selecciona una sucursal'
    : 'Crea primero una sucursal';
  elements.warehouseBranchId.append(placeholder);

  for (const branch of branches) {
    const option = document.createElement('option');
    option.value = branch.id;
    option.textContent = `${branch.name} · ${branch.code}`;
    elements.warehouseBranchId.append(option);
  }

  if (branches.some((branch) => branch.id === selectedBranchId)) {
    elements.warehouseBranchId.value = selectedBranchId;
  }
  elements.warehouseBranchId.disabled = branches.length === 0;
  elements.newWarehouseButton.disabled = !getActiveCompany() || branches.length === 0;
}

function renderWarehouses() {
  const query = normalizeSearch(elements.warehouseSearch.value.trim());
  const filtered = warehouses.filter((warehouse) => {
    const searchable = normalizeSearch([
      warehouse.name,
      warehouse.code,
      warehouse.branch_name,
      warehouseTypeLabels[warehouse.warehouse_type],
    ].filter(Boolean).join(' '));
    return !query || searchable.includes(query);
  });

  elements.warehouseTableBody.replaceChildren();
  elements.warehouseDataState.hidden = filtered.length > 0;
  elements.warehouseDataState.classList.remove('error');

  if (!filtered.length) {
    const hasSearch = Boolean(query);
    elements.warehouseDataState.querySelector('strong').textContent =
      hasSearch ? 'No encontramos bodegas' : 'Esta empresa todavía no tiene bodegas';
    elements.warehouseDataState.querySelector('p').textContent =
      hasSearch
        ? 'Prueba con otro nombre, código, sucursal o tipo.'
        : branches.length
          ? 'Habilita una bodega y vincúlala con una sucursal.'
          : 'Crea una sucursal antes de habilitar su primera bodega.';
  }

  for (const warehouse of filtered) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Bodega';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'company-name';
    const initial = document.createElement('span');
    initial.textContent = warehouse.name.slice(0, 1).toUpperCase();
    const name = document.createElement('strong');
    name.textContent = warehouse.name;
    nameWrap.append(initial, name);
    nameCell.append(nameWrap);
    row.append(nameCell);
    row.append(createCell('Código', warehouse.code));
    row.append(createCell('Sucursal', warehouse.branch_name));
    row.append(createCell('Tipo', warehouseTypeLabels[warehouse.warehouse_type] || warehouse.warehouse_type));

    const statusCell = document.createElement('td');
    statusCell.dataset.label = 'Estado';
    const status = document.createElement('span');
    status.className = `table-status ${warehouse.active ? 'active' : 'inactive'}`;
    status.textContent = warehouse.active ? 'Operativa' : 'Inactiva';
    statusCell.append(status);
    row.append(statusCell);
    elements.warehouseTableBody.append(row);
  }

  elements.warehouseRecordCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? 'bodega' : 'bodegas'}`;
}

function showWarehouseError(message) {
  warehouses = [];
  elements.warehouseTableBody.replaceChildren();
  elements.warehouseDataState.hidden = false;
  elements.warehouseDataState.classList.add('error');
  elements.warehouseDataState.querySelector('strong').textContent = 'No pudimos cargar las bodegas';
  elements.warehouseDataState.querySelector('p').textContent = message;
  elements.warehouseRecordCount.textContent = 'Sin conexión de datos';
}

async function loadWarehouses() {
  if (!activeTenantId) {
    showWarehouseError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }

  elements.reloadWarehousesButton.disabled = true;
  try {
    warehouses = await getJson('/api/warehouses', {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderWarehouses();
    return warehouses;
  } catch (error) {
    showWarehouseError(error.message);
    throw error;
  } finally {
    elements.reloadWarehousesButton.disabled = false;
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
  const [health, readiness, companyResult] = await Promise.all([
    Promise.allSettled([healthPromise]),
    readyPromise,
    Promise.allSettled([loadCompanies()]),
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

  setMetric(elements.companyCount, elements.companyDetail, companyResult[0], ['empresa activa', 'empresas activas']);
  await refreshTenantData();

  elements.refreshButton.classList.remove('loading');
  elements.refreshButton.disabled = false;
  if (notify) showToast(readyCount === 3 ? 'Estado actualizado correctamente.' : 'Hay servicios que requieren atención.');
}

async function refreshTenantData() {
  if (!activeTenantId) {
    showBranchError('Primero debes registrar o seleccionar una empresa.');
    showWarehouseError('Primero debes registrar o seleccionar una empresa.');
    setMetric(elements.branchCount, elements.branchDetail, { status: 'rejected' }, ['sucursal', 'sucursales']);
    setMetric(elements.warehouseCount, elements.warehouseDetail, { status: 'rejected' }, ['bodega registrada', 'bodegas registradas']);
    setMetric(elements.productCount, elements.productDetail, { status: 'rejected' }, ['producto registrado', 'productos registrados']);
    return;
  }

  const headers = { 'x-tenant-id': activeTenantId };
  const results = await Promise.allSettled([
    loadBranches(),
    loadWarehouses(),
    getJson('/api/products', { headers }),
  ]);
  setMetric(elements.branchCount, elements.branchDetail, results[0], ['sucursal', 'sucursales']);
  setMetric(elements.warehouseCount, elements.warehouseDetail, results[1], ['bodega registrada', 'bodegas registradas']);
  setMetric(elements.productCount, elements.productDetail, results[2], ['producto registrado', 'productos registrados']);
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
    const createdCompany = await getJson('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    closeCompanyDialog();
    activeTenantId = createdCompany.id;
    await loadCompanies();
    elements.companyCount.textContent = String(companies.length);
    elements.companyDetail.textContent =
      `${companies.length} ${companies.length === 1 ? 'empresa activa' : 'empresas activas'}`;
    await refreshTenantData();
    showToast('Empresa creada correctamente.');
  } catch (error) {
    elements.companyFormError.textContent = error.message;
    elements.companyFormError.hidden = false;
  } finally {
    elements.saveCompanyButton.disabled = false;
    elements.saveCompanyButton.textContent = 'Crear empresa y continuar';
  }
}

function openBranchDialog() {
  if (!getActiveCompany()) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  elements.branchForm.reset();
  elements.branchFormError.hidden = true;
  elements.branchDialog.showModal();
  document.querySelector('#branchName').focus();
}

function closeBranchDialog() {
  elements.branchDialog.close();
}

async function submitBranch(event) {
  event.preventDefault();
  elements.branchFormError.hidden = true;
  elements.saveBranchButton.disabled = true;
  elements.saveBranchButton.textContent = 'Creando sucursal…';

  const formData = new FormData(elements.branchForm);
  const payload = {
    name: formData.get('name'),
    code: formData.get('code'),
    address: formData.get('address') || null,
  };

  try {
    await getJson('/api/branches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    closeBranchDialog();
    await loadBranches();
    elements.branchCount.textContent = String(branches.length);
    elements.branchDetail.textContent =
      `${branches.length} ${branches.length === 1 ? 'sucursal' : 'sucursales'}`;
    showToast('Sucursal creada y vinculada a la empresa activa.');
  } catch (error) {
    elements.branchFormError.textContent = error.message;
    elements.branchFormError.hidden = false;
  } finally {
    elements.saveBranchButton.disabled = false;
    elements.saveBranchButton.textContent = 'Crear sucursal';
  }
}

function openWarehouseDialog() {
  if (!getActiveCompany()) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  if (!branches.length) {
    showToast('Crea una sucursal antes de habilitar una bodega.');
    return;
  }
  elements.warehouseForm.reset();
  syncWarehouseBranchOptions();
  elements.warehouseFormError.hidden = true;
  elements.warehouseDialog.showModal();
  elements.warehouseBranchId.focus();
}

function closeWarehouseDialog() {
  elements.warehouseDialog.close();
}

async function submitWarehouse(event) {
  event.preventDefault();
  elements.warehouseFormError.hidden = true;
  elements.saveWarehouseButton.disabled = true;
  elements.saveWarehouseButton.textContent = 'Habilitando bodega…';

  const formData = new FormData(elements.warehouseForm);
  const payload = {
    branchId: formData.get('branchId'),
    name: formData.get('name'),
    code: formData.get('code'),
    type: formData.get('type'),
  };

  try {
    await getJson('/api/warehouses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    closeWarehouseDialog();
    await loadWarehouses();
    elements.warehouseCount.textContent = String(warehouses.length);
    elements.warehouseDetail.textContent =
      `${warehouses.length} ${warehouses.length === 1 ? 'bodega registrada' : 'bodegas registradas'}`;
    showToast('Bodega habilitada en la sucursal seleccionada.');
  } catch (error) {
    elements.warehouseFormError.textContent = error.message;
    elements.warehouseFormError.hidden = false;
  } finally {
    elements.saveWarehouseButton.disabled = false;
    elements.saveWarehouseButton.textContent = 'Habilitar bodega';
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
elements.branchSearch.addEventListener('input', renderBranches);
elements.warehouseSearch.addEventListener('input', renderWarehouses);
elements.companyContext.addEventListener('change', async () => {
  activeTenantId = elements.companyContext.value;
  saveTenantPreference(activeTenantId);
  syncCompanyContext(activeTenantId);
  await refreshTenantData();
  showToast('Contexto de empresa actualizado.');
});
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
elements.reloadBranchesButton.addEventListener('click', () => {
  loadBranches()
    .then(() => showToast('Sucursales sincronizadas.'))
    .catch(() => showToast('No fue posible sincronizar las sucursales.'));
});
elements.newBranchButton.addEventListener('click', openBranchDialog);
elements.closeBranchDialog.addEventListener('click', closeBranchDialog);
elements.cancelBranchButton.addEventListener('click', closeBranchDialog);
elements.branchForm.addEventListener('submit', submitBranch);
elements.branchDialog.addEventListener('click', (event) => {
  if (event.target === elements.branchDialog) closeBranchDialog();
});
elements.reloadWarehousesButton.addEventListener('click', () => {
  loadWarehouses()
    .then(() => showToast('Bodegas sincronizadas.'))
    .catch(() => showToast('No fue posible sincronizar las bodegas.'));
});
elements.newWarehouseButton.addEventListener('click', openWarehouseDialog);
elements.closeWarehouseDialog.addEventListener('click', closeWarehouseDialog);
elements.cancelWarehouseButton.addEventListener('click', closeWarehouseDialog);
elements.warehouseForm.addEventListener('submit', submitWarehouse);
elements.warehouseDialog.addEventListener('click', (event) => {
  if (event.target === elements.warehouseDialog) closeWarehouseDialog();
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
