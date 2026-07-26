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
  activeCountTotal: document.querySelector('#activeCountTotal'),
  pendingCountItems: document.querySelector('#pendingCountItems'),
  countDiscrepancies: document.querySelector('#countDiscrepancies'),
  completedCountsMonth: document.querySelector('#completedCountsMonth'),
  reloadCountsButton: document.querySelector('#reloadCountsButton'),
  newCountButton: document.querySelector('#newCountButton'),
  countRecordCount: document.querySelector('#countRecordCount'),
  countSessionList: document.querySelector('#countSessionList'),
  countDataState: document.querySelector('#countDataState'),
  countDetailEmpty: document.querySelector('#countDetailEmpty'),
  countDetailContent: document.querySelector('#countDetailContent'),
  countDetailNumber: document.querySelector('#countDetailNumber'),
  countDetailName: document.querySelector('#countDetailName'),
  countDetailWarehouse: document.querySelector('#countDetailWarehouse'),
  countDetailStatus: document.querySelector('#countDetailStatus'),
  countProgressLabel: document.querySelector('#countProgressLabel'),
  countProgressBar: document.querySelector('#countProgressBar'),
  countDifferenceLabel: document.querySelector('#countDifferenceLabel'),
  startCountButton: document.querySelector('#startCountButton'),
  submitCountButton: document.querySelector('#submitCountButton'),
  completeCountButton: document.querySelector('#completeCountButton'),
  countProductSearch: document.querySelector('#countProductSearch'),
  countItemFilter: document.querySelector('#countItemFilter'),
  countItemList: document.querySelector('#countItemList'),
  countDialog: document.querySelector('#countDialog'),
  countForm: document.querySelector('#countForm'),
  countFormError: document.querySelector('#countFormError'),
  countWarehouseId: document.querySelector('#countWarehouseId'),
  closeCountDialog: document.querySelector('#closeCountDialog'),
  cancelCountButton: document.querySelector('#cancelCountButton'),
  saveCountButton: document.querySelector('#saveCountButton'),
  completeCountDialog: document.querySelector('#completeCountDialog'),
  completeCountForm: document.querySelector('#completeCountForm'),
  completeCountFormError: document.querySelector('#completeCountFormError'),
  closeCompleteCountDialog: document.querySelector('#closeCompleteCountDialog'),
  cancelCompleteCountButton: document.querySelector('#cancelCompleteCountButton'),
  saveCompleteCountButton: document.querySelector('#saveCompleteCountButton'),
  productCompanyName: document.querySelector('#productCompanyName'),
  productSearch: document.querySelector('#productSearch'),
  productTableBody: document.querySelector('#productTableBody'),
  productDataState: document.querySelector('#productDataState'),
  productRecordCount: document.querySelector('#productRecordCount'),
  reloadProductsButton: document.querySelector('#reloadProductsButton'),
  newCategoryButton: document.querySelector('#newCategoryButton'),
  newBrandButton: document.querySelector('#newBrandButton'),
  newProductButton: document.querySelector('#newProductButton'),
  categoryCount: document.querySelector('#categoryCount'),
  brandCount: document.querySelector('#brandCount'),
  taxCount: document.querySelector('#taxCount'),
  categoryList: document.querySelector('#categoryList'),
  brandList: document.querySelector('#brandList'),
  categoryPanelCreateButton: document.querySelector('#categoryPanelCreateButton'),
  brandPanelCreateButton: document.querySelector('#brandPanelCreateButton'),
  categoryDialog: document.querySelector('#categoryDialog'),
  categoryForm: document.querySelector('#categoryForm'),
  categoryFormError: document.querySelector('#categoryFormError'),
  closeCategoryDialog: document.querySelector('#closeCategoryDialog'),
  cancelCategoryButton: document.querySelector('#cancelCategoryButton'),
  saveCategoryButton: document.querySelector('#saveCategoryButton'),
  brandDialog: document.querySelector('#brandDialog'),
  brandForm: document.querySelector('#brandForm'),
  brandFormError: document.querySelector('#brandFormError'),
  closeBrandDialog: document.querySelector('#closeBrandDialog'),
  cancelBrandButton: document.querySelector('#cancelBrandButton'),
  saveBrandButton: document.querySelector('#saveBrandButton'),
  productDialog: document.querySelector('#productDialog'),
  productForm: document.querySelector('#productForm'),
  productFormError: document.querySelector('#productFormError'),
  productCategoryId: document.querySelector('#productCategoryId'),
  productBrandId: document.querySelector('#productBrandId'),
  productTaxId: document.querySelector('#productTaxId'),
  newProductImage: document.querySelector('#newProductImage'),
  closeProductDialog: document.querySelector('#closeProductDialog'),
  cancelProductButton: document.querySelector('#cancelProductButton'),
  saveProductButton: document.querySelector('#saveProductButton'),
  productImageDialog: document.querySelector('#productImageDialog'),
  productImageForm: document.querySelector('#productImageForm'),
  productImageFormError: document.querySelector('#productImageFormError'),
  productImageFile: document.querySelector('#productImageFile'),
  productImagePreview: document.querySelector('#productImagePreview'),
  productImagePlaceholder: document.querySelector('#productImagePlaceholder'),
  productImageAlt: document.querySelector('#productImageAlt'),
  imageProductName: document.querySelector('#imageProductName'),
  closeProductImageDialog: document.querySelector('#closeProductImageDialog'),
  cancelProductImageButton: document.querySelector('#cancelProductImageButton'),
  saveProductImageButton: document.querySelector('#saveProductImageButton'),
  cashStatus: document.querySelector('#cashStatus'),
  cashRegisterName: document.querySelector('#cashRegisterName'),
  cashBranchName: document.querySelector('#cashBranchName'),
  cashOpeningAmount: document.querySelector('#cashOpeningAmount'),
  cashOpenedAt: document.querySelector('#cashOpenedAt'),
  cashGuidance: document.querySelector('#cashGuidance'),
  openCashButton: document.querySelector('#openCashButton'),
  closeCashButton: document.querySelector('#closeCashButton'),
  openCashDialog: document.querySelector('#openCashDialog'),
  openCashForm: document.querySelector('#openCashForm'),
  openCashFormError: document.querySelector('#openCashFormError'),
  cashRegisterId: document.querySelector('#cashRegisterId'),
  closeOpenCashDialog: document.querySelector('#closeOpenCashDialog'),
  cancelOpenCashButton: document.querySelector('#cancelOpenCashButton'),
  saveOpenCashButton: document.querySelector('#saveOpenCashButton'),
  closeCashDialog: document.querySelector('#closeCashDialog'),
  closeCashForm: document.querySelector('#closeCashForm'),
  closeCashFormError: document.querySelector('#closeCashFormError'),
  closeCloseCashDialog: document.querySelector('#closeCloseCashDialog'),
  cancelCloseCashButton: document.querySelector('#cancelCloseCashButton'),
  saveCloseCashButton: document.querySelector('#saveCloseCashButton'),
  posWarehouseSelect: document.querySelector('#posWarehouseSelect'),
  posProductSearch: document.querySelector('#posProductSearch'),
  posProductGrid: document.querySelector('#posProductGrid'),
  posCatalogState: document.querySelector('#posCatalogState'),
  cartItems: document.querySelector('#cartItems'),
  cartEmpty: document.querySelector('#cartEmpty'),
  cartItemCount: document.querySelector('#cartItemCount'),
  cartSubtotal: document.querySelector('#cartSubtotal'),
  cartTax: document.querySelector('#cartTax'),
  cartTotal: document.querySelector('#cartTotal'),
  posPaymentMethod: document.querySelector('#posPaymentMethod'),
  posSaleError: document.querySelector('#posSaleError'),
  completeSaleButton: document.querySelector('#completeSaleButton'),
  posSaleLock: document.querySelector('#posSaleLock'),
  receiptDialog: document.querySelector('#receiptDialog'),
  receiptNumber: document.querySelector('#receiptNumber'),
  receiptLines: document.querySelector('#receiptLines'),
  receiptSubtotal: document.querySelector('#receiptSubtotal'),
  receiptTax: document.querySelector('#receiptTax'),
  receiptTotal: document.querySelector('#receiptTotal'),
  closeReceiptDialog: document.querySelector('#closeReceiptDialog'),
  finishReceiptButton: document.querySelector('#finishReceiptButton'),
  arOutstanding: document.querySelector('#arOutstanding'),
  arOpenCount: document.querySelector('#arOpenCount'),
  arCurrent: document.querySelector('#arCurrent'),
  arOverdue30: document.querySelector('#arOverdue30'),
  arOverdue60: document.querySelector('#arOverdue60'),
  arOverdue61: document.querySelector('#arOverdue61'),
  arCollectedMonth: document.querySelector('#arCollectedMonth'),
  invoiceSearch: document.querySelector('#invoiceSearch'),
  invoiceStatusFilter: document.querySelector('#invoiceStatusFilter'),
  reloadReceivablesButton: document.querySelector('#reloadReceivablesButton'),
  invoiceList: document.querySelector('#invoiceList'),
  invoiceDataState: document.querySelector('#invoiceDataState'),
  invoiceRecordCount: document.querySelector('#invoiceRecordCount'),
  invoiceDetailEmpty: document.querySelector('#invoiceDetailEmpty'),
  invoiceDetailContent: document.querySelector('#invoiceDetailContent'),
  invoiceDetailNumber: document.querySelector('#invoiceDetailNumber'),
  invoiceDetailStatus: document.querySelector('#invoiceDetailStatus'),
  invoiceDetailCustomer: document.querySelector('#invoiceDetailCustomer'),
  invoiceDetailDocument: document.querySelector('#invoiceDetailDocument'),
  invoiceDetailIssue: document.querySelector('#invoiceDetailIssue'),
  invoiceDetailDue: document.querySelector('#invoiceDetailDue'),
  invoiceDetailTotal: document.querySelector('#invoiceDetailTotal'),
  invoiceDetailBalance: document.querySelector('#invoiceDetailBalance'),
  invoiceDetailItems: document.querySelector('#invoiceDetailItems'),
  invoicePaymentCount: document.querySelector('#invoicePaymentCount'),
  invoicePaymentList: document.querySelector('#invoicePaymentList'),
  newCustomerButton: document.querySelector('#newCustomerButton'),
  newInvoiceButton: document.querySelector('#newInvoiceButton'),
  newPaymentButton: document.querySelector('#newPaymentButton'),
  customerDialog: document.querySelector('#customerDialog'),
  customerForm: document.querySelector('#customerForm'),
  customerFormError: document.querySelector('#customerFormError'),
  closeCustomerDialog: document.querySelector('#closeCustomerDialog'),
  cancelCustomerButton: document.querySelector('#cancelCustomerButton'),
  saveCustomerButton: document.querySelector('#saveCustomerButton'),
  invoiceDialog: document.querySelector('#invoiceDialog'),
  invoiceForm: document.querySelector('#invoiceForm'),
  invoiceFormError: document.querySelector('#invoiceFormError'),
  invoiceCustomerId: document.querySelector('#invoiceCustomerId'),
  invoiceBranchId: document.querySelector('#invoiceBranchId'),
  invoiceIssueDate: document.querySelector('#invoiceIssueDate'),
  invoiceDueDate: document.querySelector('#invoiceDueDate'),
  invoiceItemRows: document.querySelector('#invoiceItemRows'),
  invoiceItemTemplate: document.querySelector('#invoiceItemTemplate'),
  invoiceDraftTotal: document.querySelector('#invoiceDraftTotal'),
  addInvoiceItemButton: document.querySelector('#addInvoiceItemButton'),
  closeInvoiceDialog: document.querySelector('#closeInvoiceDialog'),
  cancelInvoiceButton: document.querySelector('#cancelInvoiceButton'),
  saveInvoiceButton: document.querySelector('#saveInvoiceButton'),
  paymentDialog: document.querySelector('#paymentDialog'),
  paymentForm: document.querySelector('#paymentForm'),
  paymentFormError: document.querySelector('#paymentFormError'),
  paymentInvoiceNumber: document.querySelector('#paymentInvoiceNumber'),
  paymentBalance: document.querySelector('#paymentBalance'),
  paymentAmount: document.querySelector('#paymentAmount'),
  paymentDate: document.querySelector('#paymentDate'),
  closePaymentDialog: document.querySelector('#closePaymentDialog'),
  cancelPaymentButton: document.querySelector('#cancelPaymentButton'),
  savePaymentButton: document.querySelector('#savePaymentButton'),
  toast: document.querySelector('#toast'),
};

let toastTimer;
let companies = [];
let branches = [];
let warehouses = [];
let categories = [];
let brands = [];
let taxCategories = [];
let products = [];
let posSummary = { registers: [], openSession: null };
let posCatalog = [];
let receivableCustomers = [];
let receivableInvoices = [];
let selectedReceivable = null;
let physicalCounts = [];
let selectedPhysicalCount = null;
const saleCart = new Map();
let imageProduct = null;
let imagePreviewUrl = null;
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
  elements.productCompanyName.textContent = companyName;
  elements.newBranchButton.disabled = !activeCompany;
  elements.newCategoryButton.disabled = !activeCompany;
  elements.newBrandButton.disabled = !activeCompany;
  elements.newProductButton.disabled = !activeCompany;
  elements.categoryPanelCreateButton.disabled = !activeCompany;
  elements.brandPanelCreateButton.disabled = !activeCompany;
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

function replaceCatalogOptions(select, placeholder, records, label) {
  const selectedValue = select.value;
  select.replaceChildren();
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = placeholder;
  select.append(emptyOption);

  for (const record of records) {
    const option = document.createElement('option');
    option.value = record.id;
    option.textContent = label(record);
    select.append(option);
  }
  if (records.some((record) => record.id === selectedValue)) {
    select.value = selectedValue;
  }
}

function syncProductOptions() {
  replaceCatalogOptions(
    elements.productCategoryId,
    'Sin categoría',
    categories,
    (category) => `${category.name} · ${category.code}`,
  );
  replaceCatalogOptions(
    elements.productBrandId,
    'Sin marca',
    brands,
    (brand) => `${brand.name} · ${brand.code}`,
  );
  replaceCatalogOptions(
    elements.productTaxId,
    'Pendiente de revisión',
    taxCategories,
    (tax) => `${tax.name} · ${Number(tax.rate)}%`,
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function renderProducts() {
  const query = normalizeSearch(elements.productSearch.value.trim());
  const filtered = products.filter((product) => {
    const searchable = normalizeSearch([
      product.name,
      product.sku,
      product.barcode,
      product.category_name,
      product.brand_name,
      product.tax_name,
    ].filter(Boolean).join(' '));
    return !query || searchable.includes(query);
  });

  elements.productTableBody.replaceChildren();
  elements.productDataState.hidden = filtered.length > 0;
  elements.productDataState.classList.remove('error');

  if (!filtered.length) {
    const hasSearch = Boolean(query);
    elements.productDataState.querySelector('strong').textContent =
      hasSearch ? 'No encontramos productos' : 'Esta empresa todavía no tiene productos';
    elements.productDataState.querySelector('p').textContent =
      hasSearch
        ? 'Prueba con otro nombre, SKU, categoría o marca.'
        : 'Agrega el primer producto para comenzar a construir el catálogo.';
  }

  for (const product of filtered) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.dataset.label = 'Producto';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'company-name';
    let visual;
    if (product.image_url) {
      visual = document.createElement('img');
      visual.className = 'product-thumbnail';
      visual.src = product.image_url;
      visual.alt = product.image_alt || product.name;
    } else {
      visual = document.createElement('span');
      visual.textContent = product.name.slice(0, 1).toUpperCase();
    }
    const name = document.createElement('strong');
    name.textContent = product.name;
    nameWrap.append(visual, name);
    const imageButton = document.createElement('button');
    imageButton.className = 'photo-action';
    imageButton.type = 'button';
    imageButton.textContent = product.image_url ? 'Cambiar foto' : 'Adjuntar foto';
    imageButton.addEventListener('click', () => openProductImageDialog(product));
    nameCell.append(nameWrap, imageButton);
    row.append(nameCell);
    row.append(createCell('SKU', product.sku));
    row.append(createCell('Categoría', product.category_name));
    row.append(createCell('Marca', product.brand_name));
    row.append(createCell('Precio de venta', formatCurrency(product.sale_price)));

    const taxCell = document.createElement('td');
    taxCell.dataset.label = 'Impuesto';
    const taxStatus = document.createElement('span');
    taxStatus.className = `table-status ${product.tax_review_status === 'REVIEWED' ? 'active' : 'pending'}`;
    taxStatus.textContent = product.tax_name
      ? `${product.tax_name} · ${Number(product.tax_rate)}%`
      : 'Pendiente';
    taxCell.append(taxStatus);
    row.append(taxCell);
    elements.productTableBody.append(row);
  }

  elements.productRecordCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`;
}

function updateCatalogCounters() {
  elements.categoryCount.textContent =
    `${categories.length} ${categories.length === 1 ? 'categoría' : 'categorías'}`;
  elements.brandCount.textContent =
    `${brands.length} ${brands.length === 1 ? 'marca' : 'marcas'}`;
  elements.taxCount.textContent =
    `${taxCategories.length} ${taxCategories.length === 1 ? 'impuesto' : 'impuestos'}`;
}

function renderTaxonomyList(container, records, type) {
  container.replaceChildren();
  if (!records.length) {
    const empty = document.createElement('div');
    empty.className = 'taxonomy-empty';
    empty.textContent = type === 'category'
      ? 'Todavía no hay categorías registradas.'
      : 'Todavía no hay marcas registradas.';
    container.append(empty);
    return;
  }
  for (const record of records) {
    const card = document.createElement('article');
    const symbol = document.createElement('span');
    symbol.textContent = record.name.slice(0, 1).toUpperCase();
    const content = document.createElement('div');
    const code = document.createElement('small');
    code.textContent = record.code;
    const name = document.createElement('strong');
    name.textContent = record.name;
    const description = document.createElement('p');
    description.textContent = record.description ||
      (type === 'category' ? 'Categoría activa del catálogo.' : 'Marca activa del catálogo.');
    content.append(code, name, description);
    const status = document.createElement('b');
    status.textContent = record.active ? 'Activa' : 'Inactiva';
    card.append(symbol, content, status);
    container.append(card);
  }
}

function renderTaxonomies() {
  renderTaxonomyList(elements.categoryList, categories, 'category');
  renderTaxonomyList(elements.brandList, brands, 'brand');
}

function showCatalogPanel(panelName) {
  document.querySelectorAll('[data-catalog-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.catalogPanel !== panelName;
  });
  document.querySelectorAll('[data-catalog-tab]').forEach((tab) => {
    const isActive = tab.dataset.catalogTab === panelName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

function showCatalogError(message) {
  categories = [];
  brands = [];
  taxCategories = [];
  products = [];
  elements.productTableBody.replaceChildren();
  elements.productDataState.hidden = false;
  elements.productDataState.classList.add('error');
  elements.productDataState.querySelector('strong').textContent = 'No pudimos cargar el catálogo';
  elements.productDataState.querySelector('p').textContent = message;
  elements.productRecordCount.textContent = 'Sin conexión de datos';
  updateCatalogCounters();
  renderTaxonomies();
  syncProductOptions();
}

async function loadCatalog() {
  if (!activeTenantId) {
    showCatalogError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }

  elements.reloadProductsButton.disabled = true;
  const headers = { 'x-tenant-id': activeTenantId };
  try {
    [categories, brands, taxCategories, products] = await Promise.all([
      getJson('/api/categories', { headers }),
      getJson('/api/brands', { headers }),
      getJson('/api/taxes', { headers }),
      getJson('/api/products', { headers }),
    ]);
    updateCatalogCounters();
    renderTaxonomies();
    syncProductOptions();
    renderProducts();
    return products;
  } catch (error) {
    showCatalogError(error.message);
    throw error;
  } finally {
    elements.reloadProductsButton.disabled = false;
  }
}

function syncCashRegisterOptions() {
  const selectedValue = elements.cashRegisterId.value;
  elements.cashRegisterId.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = posSummary.registers.length
    ? 'Selecciona una caja'
    : 'No hay cajas configuradas';
  elements.cashRegisterId.append(placeholder);

  for (const register of posSummary.registers) {
    const option = document.createElement('option');
    option.value = register.id;
    option.textContent = `${register.name} · ${register.branch_name}`;
    elements.cashRegisterId.append(option);
  }
  if (posSummary.registers.some((register) => register.id === selectedValue)) {
    elements.cashRegisterId.value = selectedValue;
  }
  elements.cashRegisterId.disabled = posSummary.registers.length === 0;
}

function renderPos() {
  const session = posSummary.openSession;
  const firstRegister = posSummary.registers[0] || null;
  syncCashRegisterOptions();

  if (session) {
    elements.cashStatus.textContent = 'Turno abierto';
    elements.cashStatus.className = 'pos-state open';
    elements.cashRegisterName.textContent = `${session.register_name} · ${session.register_code}`;
    elements.cashBranchName.textContent = session.branch_name;
    elements.cashOpeningAmount.textContent = formatCurrency(session.opening_amount);
    elements.cashOpenedAt.textContent = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(session.opened_at));
    elements.cashGuidance.textContent =
      'El turno está listo. El carrito y el cobro se conectarán en el siguiente bloque sin romper inventario.';
    elements.openCashButton.hidden = true;
    elements.closeCashButton.hidden = false;
    return;
  }

  elements.cashStatus.textContent = firstRegister ? 'Caja cerrada' : 'Sin cajas configuradas';
  elements.cashStatus.className = 'pos-state';
  elements.cashRegisterName.textContent = firstRegister?.name || 'Sin caja disponible';
  elements.cashBranchName.textContent = firstRegister?.branch_name || '—';
  elements.cashOpeningAmount.textContent = '—';
  elements.cashOpenedAt.textContent = '—';
  elements.cashGuidance.textContent = firstRegister
    ? 'Abre un turno para preparar el registro de ventas y movimientos de efectivo.'
    : 'Registra una caja física antes de comenzar la operación POS.';
  elements.openCashButton.hidden = false;
  elements.openCashButton.disabled = !firstRegister;
  elements.closeCashButton.hidden = true;
}

function showPosError(message) {
  posSummary = { registers: [], openSession: null };
  elements.cashStatus.textContent = 'Caja no disponible';
  elements.cashStatus.className = 'pos-state error';
  elements.cashRegisterName.textContent = 'No pudimos consultar la caja';
  elements.cashBranchName.textContent = '—';
  elements.cashOpeningAmount.textContent = '—';
  elements.cashOpenedAt.textContent = '—';
  elements.cashGuidance.textContent = message;
  elements.openCashButton.hidden = false;
  elements.openCashButton.disabled = true;
  elements.closeCashButton.hidden = true;
  syncCashRegisterOptions();
}

async function loadPos() {
  if (!activeTenantId) {
    showPosError('Primero debes registrar o seleccionar una empresa.');
    return posSummary;
  }
  try {
    posSummary = await getJson('/api/pos/summary', {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderPos();
    return posSummary;
  } catch (error) {
    showPosError(error.message);
    throw error;
  }
}

function setPosCatalogState(title, message, isError = false) {
  elements.posProductGrid.replaceChildren();
  elements.posCatalogState.hidden = false;
  elements.posCatalogState.classList.toggle('error', isError);
  elements.posCatalogState.querySelector('strong').textContent = title;
  elements.posCatalogState.querySelector('p').textContent = message;
}

function calculateCartTotals() {
  let total = 0;
  let tax = 0;
  let itemCount = 0;
  for (const item of saleCart.values()) {
    const lineTotal = Number(item.product.sale_price) * item.quantity;
    const taxRate = Number(item.product.tax_rate) || 0;
    total += lineTotal;
    tax += taxRate > 0 ? lineTotal * taxRate / (100 + taxRate) : 0;
    itemCount += item.quantity;
  }
  total = Math.round(total * 100) / 100;
  tax = Math.round(tax * 100) / 100;
  return {
    subtotal: Math.round((total - tax) * 100) / 100,
    tax,
    total,
    itemCount,
  };
}

function renderPosCatalog() {
  const search = normalizeSearch(elements.posProductSearch.value.trim());
  const filtered = posCatalog.filter((product) => {
    const searchable = normalizeSearch(`${product.name} ${product.sku}`);
    return !search || searchable.includes(search);
  });
  elements.posProductGrid.replaceChildren();
  elements.posCatalogState.hidden = filtered.length > 0;
  elements.posCatalogState.classList.remove('error');

  if (!filtered.length) {
    elements.posCatalogState.querySelector('strong').textContent =
      search ? 'No encontramos ese producto' : 'No hay productos disponibles';
    elements.posCatalogState.querySelector('p').textContent =
      search
        ? 'Prueba con otro nombre o SKU.'
        : 'Registra existencias en esta bodega para habilitar la venta.';
  }

  for (const product of filtered) {
    const card = document.createElement('article');
    card.className = 'pos-product-card';
    const visual = product.image_url
      ? document.createElement('img')
      : document.createElement('span');
    visual.className = 'pos-product-visual';
    if (product.image_url) {
      visual.src = product.image_url;
      visual.alt = product.image_alt || product.name;
    } else {
      visual.textContent = product.name.slice(0, 1).toUpperCase();
    }
    const info = document.createElement('div');
    info.className = 'pos-product-info';
    const sku = document.createElement('small');
    sku.textContent = product.sku;
    const name = document.createElement('strong');
    name.textContent = product.name;
    const price = document.createElement('b');
    price.textContent = formatCurrency(product.sale_price);
    info.append(sku, name, price);

    const footer = document.createElement('div');
    footer.className = 'pos-product-footer';
    const stock = Number(product.on_hand);
    const stockLabel = document.createElement('span');
    stockLabel.textContent = `${stock} disponibles`;
    const currentQuantity = saleCart.get(product.id)?.quantity || 0;
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = stock <= 0 ? 'Sin existencias' : 'Agregar';
    addButton.disabled =
      stock <= 0 ||
      currentQuantity >= stock ||
      product.tax_review_status !== 'REVIEWED';
    addButton.addEventListener('click', () => addProductToCart(product));
    footer.append(stockLabel, addButton);
    card.append(visual, info, footer);
    elements.posProductGrid.append(card);
  }
}

function addProductToCart(product) {
  const current = saleCart.get(product.id);
  const nextQuantity = (current?.quantity || 0) + 1;
  if (nextQuantity > Number(product.on_hand)) {
    showToast('No hay más existencias disponibles.');
    return;
  }
  saleCart.set(product.id, { product, quantity: nextQuantity });
  renderCart();
  renderPosCatalog();
}

function changeCartQuantity(productId, change) {
  const current = saleCart.get(productId);
  if (!current) return;
  const nextQuantity = current.quantity + change;
  if (nextQuantity <= 0) saleCart.delete(productId);
  else if (nextQuantity <= Number(current.product.on_hand)) {
    saleCart.set(productId, { ...current, quantity: nextQuantity });
  }
  renderCart();
  renderPosCatalog();
}

function renderCart() {
  elements.cartItems.replaceChildren();
  elements.cartEmpty.hidden = saleCart.size > 0;

  for (const item of saleCart.values()) {
    const row = document.createElement('div');
    row.className = 'cart-item';
    const info = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.product.name;
    const detail = document.createElement('small');
    detail.textContent = `${item.product.sku} · ${formatCurrency(item.product.sale_price)}`;
    info.append(name, detail);

    const controls = document.createElement('div');
    controls.className = 'cart-quantity';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `Restar ${item.product.name}`);
    minus.addEventListener('click', () => changeCartQuantity(item.product.id, -1));
    const quantity = document.createElement('span');
    quantity.textContent = String(item.quantity);
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.disabled = item.quantity >= Number(item.product.on_hand);
    plus.setAttribute('aria-label', `Agregar otro ${item.product.name}`);
    plus.addEventListener('click', () => changeCartQuantity(item.product.id, 1));
    controls.append(minus, quantity, plus);

    const lineTotal = document.createElement('b');
    lineTotal.textContent = formatCurrency(Number(item.product.sale_price) * item.quantity);
    row.append(info, controls, lineTotal);
    elements.cartItems.append(row);
  }

  const totals = calculateCartTotals();
  elements.cartItemCount.textContent =
    `${totals.itemCount} ${totals.itemCount === 1 ? 'artículo' : 'artículos'}`;
  elements.cartSubtotal.textContent = formatCurrency(totals.subtotal);
  elements.cartTax.textContent = formatCurrency(totals.tax);
  elements.cartTotal.textContent = formatCurrency(totals.total);
  elements.completeSaleButton.disabled =
    !posSummary.openSession || !elements.posWarehouseSelect.value || saleCart.size === 0;
  elements.posSaleError.hidden = true;
}

function clearCart() {
  saleCart.clear();
  renderCart();
  renderPosCatalog();
}

async function loadPosCatalog() {
  const warehouseId = elements.posWarehouseSelect.value;
  if (!posSummary.openSession || !warehouseId) {
    posCatalog = [];
    setPosCatalogState(
      'Abre un turno y selecciona una bodega',
      'Los productos disponibles aparecerán aquí con sus existencias.',
    );
    renderCart();
    return [];
  }
  try {
    posCatalog = await getJson(`/api/pos/catalog?warehouseId=${encodeURIComponent(warehouseId)}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderPosCatalog();
    renderCart();
    return posCatalog;
  } catch (error) {
    posCatalog = [];
    setPosCatalogState('No pudimos cargar las existencias', error.message, true);
    renderCart();
    throw error;
  }
}

async function syncPosWorkstation() {
  const session = posSummary.openSession;
  const currentWarehouse = elements.posWarehouseSelect.value;
  const eligibleWarehouses = session
    ? warehouses.filter((warehouse) =>
      warehouse.active &&
      warehouse.branch_id === session.branch_id &&
      warehouse.warehouse_type === 'AVAILABLE')
    : [];
  elements.posWarehouseSelect.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = eligibleWarehouses.length
    ? 'Selecciona una bodega'
    : 'Sin bodegas disponibles';
  elements.posWarehouseSelect.append(placeholder);
  for (const warehouse of eligibleWarehouses) {
    const option = document.createElement('option');
    option.value = warehouse.id;
    option.textContent = `${warehouse.name} · ${warehouse.code}`;
    elements.posWarehouseSelect.append(option);
  }
  elements.posWarehouseSelect.value = eligibleWarehouses.some(
    (warehouse) => warehouse.id === currentWarehouse,
  ) ? currentWarehouse : (eligibleWarehouses[0]?.id || '');
  elements.posWarehouseSelect.disabled = !session || !eligibleWarehouses.length;
  elements.posProductSearch.disabled = !session;
  elements.posSaleLock.hidden = Boolean(session);
  if (!session) {
    posCatalog = [];
    clearCart();
    setPosCatalogState(
      'Abre un turno y selecciona una bodega',
      'Los productos disponibles aparecerán aquí con sus existencias.',
    );
    return;
  }
  await loadPosCatalog();
}

function isoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatShortDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`));
}

function receivableStatus(invoice) {
  if (invoice.status === 'PAID') return { label: 'Pagada', className: 'paid' };
  if (Number(invoice.days_overdue) > 0) {
    return {
      label: `${invoice.days_overdue} d vencida`,
      className: Number(invoice.days_overdue) > 60 ? 'critical' : 'overdue',
    };
  }
  if (invoice.status === 'PARTIAL') return { label: 'Abono parcial', className: 'partial' };
  return { label: 'Por cobrar', className: 'open' };
}

function setReceivableSummary(summary = {}) {
  elements.arOutstanding.textContent = formatCurrency(summary.outstanding || 0);
  elements.arOpenCount.textContent =
    `${summary.open_count || 0} ${Number(summary.open_count) === 1 ? 'factura abierta' : 'facturas abiertas'}`;
  elements.arCurrent.textContent = formatCurrency(summary.current || 0);
  elements.arOverdue30.textContent = formatCurrency(summary.overdue_1_30 || 0);
  elements.arOverdue60.textContent = formatCurrency(summary.overdue_31_60 || 0);
  elements.arOverdue61.textContent = formatCurrency(summary.overdue_61_plus || 0);
  elements.arCollectedMonth.textContent = formatCurrency(summary.collected_month || 0);
}

function showReceivableError(message) {
  receivableCustomers = [];
  receivableInvoices = [];
  selectedReceivable = null;
  setReceivableSummary();
  elements.invoiceList.replaceChildren();
  elements.invoiceDataState.hidden = false;
  elements.invoiceDataState.classList.add('error');
  elements.invoiceDataState.querySelector('strong').textContent = 'No pudimos consultar la cartera';
  elements.invoiceDataState.querySelector('p').textContent = message;
  elements.invoiceRecordCount.textContent = 'Sin datos';
  elements.invoiceDetailContent.hidden = true;
  elements.invoiceDetailEmpty.hidden = false;
}

function renderInvoiceList() {
  const search = normalizeSearch(elements.invoiceSearch.value.trim());
  const filter = elements.invoiceStatusFilter.value;
  const filtered = receivableInvoices.filter((invoice) => {
    const haystack = normalizeSearch([
      invoice.invoice_number,
      invoice.external_reference,
      invoice.customer_name,
      invoice.document_number,
    ].filter(Boolean).join(' '));
    const matchesSearch = !search || haystack.includes(search);
    const overdue = Number(invoice.days_overdue) > 0 && ['ISSUED', 'PARTIAL'].includes(invoice.status);
    const matchesStatus =
      filter === 'ALL' ||
      (filter === 'OPEN' && ['ISSUED', 'PARTIAL'].includes(invoice.status)) ||
      (filter === 'OVERDUE' && overdue) ||
      (filter === 'PAID' && invoice.status === 'PAID');
    return matchesSearch && matchesStatus;
  });

  elements.invoiceList.replaceChildren();
  elements.invoiceRecordCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`;
  elements.invoiceDataState.hidden = filtered.length > 0;
  elements.invoiceDataState.classList.remove('error');
  if (!filtered.length) {
    elements.invoiceDataState.querySelector('strong').textContent =
      receivableInvoices.length ? 'No hay coincidencias' : 'Aún no hay facturas';
    elements.invoiceDataState.querySelector('p').textContent =
      receivableInvoices.length
        ? 'Cambia la búsqueda o el filtro para consultar otros documentos.'
        : 'Crea la primera cuenta por cobrar para comenzar el seguimiento.';
    return;
  }

  for (const invoice of filtered) {
    const status = receivableStatus(invoice);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ar-invoice-card';
    if (selectedReceivable?.id === invoice.id) button.classList.add('selected');
    button.dataset.invoiceId = invoice.id;

    const top = document.createElement('div');
    top.className = 'ar-invoice-card-top';
    const number = document.createElement('strong');
    number.textContent = invoice.invoice_number;
    const badge = document.createElement('span');
    badge.className = `ar-status ${status.className}`;
    badge.textContent = status.label;
    top.append(number, badge);

    const customer = document.createElement('span');
    customer.className = 'ar-invoice-customer';
    customer.textContent = invoice.customer_name;

    const bottom = document.createElement('div');
    bottom.className = 'ar-invoice-card-bottom';
    const due = document.createElement('span');
    due.textContent = `Vence ${formatShortDate(invoice.due_date)}`;
    const balance = document.createElement('strong');
    balance.textContent = formatCurrency(invoice.balance);
    bottom.append(due, balance);
    button.append(top, customer, bottom);
    button.addEventListener('click', () => loadInvoiceDetail(invoice.id));
    elements.invoiceList.append(button);
  }
}

function renderInvoiceDetail(invoice) {
  selectedReceivable = invoice;
  elements.invoiceDetailEmpty.hidden = true;
  elements.invoiceDetailContent.hidden = false;
  elements.invoiceDetailNumber.textContent = invoice.invoice_number;
  const status = receivableStatus(invoice);
  elements.invoiceDetailStatus.textContent = status.label;
  elements.invoiceDetailStatus.className = `ar-status ${status.className}`;
  elements.invoiceDetailCustomer.textContent = invoice.customer_name;
  elements.invoiceDetailDocument.textContent =
    invoice.document_number
      ? `${invoice.document_type} ${invoice.document_number}`
      : 'Sin documento registrado';
  elements.invoiceDetailIssue.textContent = formatShortDate(invoice.issue_date);
  elements.invoiceDetailDue.textContent = formatShortDate(invoice.due_date);
  elements.invoiceDetailTotal.textContent = formatCurrency(invoice.total);
  elements.invoiceDetailBalance.textContent = formatCurrency(invoice.balance);

  elements.invoiceDetailItems.replaceChildren();
  for (const item of invoice.items) {
    const row = document.createElement('div');
    const description = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.description;
    const meta = document.createElement('small');
    meta.textContent =
      `${Number(item.quantity).toLocaleString('es-CO')} × ${formatCurrency(item.unit_price)} · IVA ${Number(item.tax_rate)}%`;
    description.append(name, meta);
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(item.line_total);
    row.append(description, amount);
    elements.invoiceDetailItems.append(row);
  }

  elements.invoicePaymentList.replaceChildren();
  elements.invoicePaymentCount.textContent = String(invoice.payments.length);
  if (!invoice.payments.length) {
    const empty = document.createElement('p');
    empty.className = 'ar-no-payments';
    empty.textContent = 'Todavía no se han registrado abonos.';
    elements.invoicePaymentList.append(empty);
  } else {
    for (const payment of invoice.payments) {
      const row = document.createElement('div');
      const info = document.createElement('div');
      const date = document.createElement('strong');
      date.textContent = formatShortDate(payment.payment_date);
      const reference = document.createElement('small');
      reference.textContent =
        payment.reference || payment.payment_method.replaceAll('_', ' ').toLocaleLowerCase('es');
      info.append(date, reference);
      const amount = document.createElement('strong');
      amount.textContent = formatCurrency(payment.amount);
      row.append(info, amount);
      elements.invoicePaymentList.append(row);
    }
  }
  elements.newPaymentButton.hidden = invoice.status === 'PAID';
  renderInvoiceList();
}

async function loadInvoiceDetail(invoiceId) {
  try {
    const detail = await getJson(`/api/receivables/invoices/${invoiceId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderInvoiceDetail(detail);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadReceivables() {
  if (!activeTenantId) {
    showReceivableError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  try {
    const [summary, customersResult, invoicesResult] = await Promise.all([
      getJson('/api/receivables/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/receivables/customers', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/receivables/invoices', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    receivableCustomers = customersResult;
    receivableInvoices = invoicesResult;
    setReceivableSummary(summary);
    renderInvoiceList();
    if (selectedReceivable) {
      const stillExists = invoicesResult.some((invoice) => invoice.id === selectedReceivable.id);
      if (stillExists) await loadInvoiceDetail(selectedReceivable.id);
      else {
        selectedReceivable = null;
        elements.invoiceDetailContent.hidden = true;
        elements.invoiceDetailEmpty.hidden = false;
      }
    }
    return invoicesResult;
  } catch (error) {
    showReceivableError(error.message);
    throw error;
  }
}

function openCustomerDialog() {
  if (!activeTenantId) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  elements.customerForm.reset();
  elements.customerFormError.hidden = true;
  elements.customerDialog.showModal();
  elements.customerForm.elements.name.focus();
}

function closeCustomerDialog() {
  elements.customerDialog.close();
}

async function submitCustomer(event) {
  event.preventDefault();
  const formData = new FormData(elements.customerForm);
  elements.customerFormError.hidden = true;
  elements.saveCustomerButton.disabled = true;
  elements.saveCustomerButton.textContent = 'Registrando cliente…';
  try {
    await getJson('/api/receivables/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    closeCustomerDialog();
    await loadReceivables();
    showToast('Cliente registrado y disponible para facturar.');
  } catch (error) {
    elements.customerFormError.textContent = error.message;
    elements.customerFormError.hidden = false;
  } finally {
    elements.saveCustomerButton.disabled = false;
    elements.saveCustomerButton.textContent = 'Registrar cliente';
  }
}

function syncInvoiceOptions() {
  elements.invoiceCustomerId.replaceChildren(new Option('Selecciona un cliente', ''));
  for (const customer of receivableCustomers.filter((item) => item.active)) {
    const detail = customer.document_number ? ` · ${customer.document_number}` : '';
    elements.invoiceCustomerId.append(new Option(`${customer.name}${detail}`, customer.id));
  }
  elements.invoiceBranchId.replaceChildren(new Option('Sin sucursal específica', ''));
  for (const branch of branches.filter((item) => item.active)) {
    elements.invoiceBranchId.append(new Option(branch.name, branch.id));
  }
}

function updateInvoiceDraftTotal() {
  let total = 0;
  elements.invoiceItemRows.querySelectorAll('.ar-item-row').forEach((row) => {
    const quantity = Number(row.querySelector('[data-item="quantity"]').value) || 0;
    const unitPrice = Number(row.querySelector('[data-item="unitPrice"]').value) || 0;
    const taxRate = Number(row.querySelector('[data-item="taxRate"]').value) || 0;
    const subtotal = quantity * unitPrice;
    total += subtotal + (subtotal * taxRate / 100);
  });
  elements.invoiceDraftTotal.textContent = formatCurrency(total);
}

function addInvoiceItemRow() {
  const row = elements.invoiceItemTemplate.content.firstElementChild.cloneNode(true);
  row.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', updateInvoiceDraftTotal);
  });
  row.querySelector('[data-remove-item]').addEventListener('click', () => {
    if (elements.invoiceItemRows.children.length === 1) {
      showToast('La factura debe conservar al menos un concepto.');
      return;
    }
    row.remove();
    updateInvoiceDraftTotal();
  });
  elements.invoiceItemRows.append(row);
  updateInvoiceDraftTotal();
  return row;
}

function openInvoiceDialog() {
  if (!activeTenantId) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  if (!receivableCustomers.length) {
    showToast('Registra un cliente antes de crear la factura.');
    openCustomerDialog();
    return;
  }
  elements.invoiceForm.reset();
  elements.invoiceItemRows.replaceChildren();
  syncInvoiceOptions();
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 30);
  elements.invoiceIssueDate.value = isoDate(today);
  elements.invoiceDueDate.value = isoDate(due);
  addInvoiceItemRow();
  elements.invoiceFormError.hidden = true;
  elements.invoiceDialog.showModal();
  elements.invoiceCustomerId.focus();
}

function closeInvoiceDialog() {
  elements.invoiceDialog.close();
}

function collectInvoiceItems() {
  return [...elements.invoiceItemRows.querySelectorAll('.ar-item-row')].map((row) => ({
    description: row.querySelector('[data-item="description"]').value,
    quantity: row.querySelector('[data-item="quantity"]').value,
    unitPrice: row.querySelector('[data-item="unitPrice"]').value,
    taxRate: row.querySelector('[data-item="taxRate"]').value,
  }));
}

async function submitInvoice(event) {
  event.preventDefault();
  const formData = new FormData(elements.invoiceForm);
  elements.invoiceFormError.hidden = true;
  elements.saveInvoiceButton.disabled = true;
  elements.saveInvoiceButton.textContent = 'Emitiendo factura…';
  try {
    const invoice = await getJson('/api/receivables/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        customerId: formData.get('customerId'),
        branchId: formData.get('branchId') || null,
        issueDate: formData.get('issueDate'),
        dueDate: formData.get('dueDate'),
        externalReference: formData.get('externalReference') || null,
        notes: formData.get('notes') || null,
        items: collectInvoiceItems(),
      }),
    });
    closeInvoiceDialog();
    await loadReceivables();
    await loadInvoiceDetail(invoice.id);
    showToast(`${invoice.invoice_number} creada y agregada a cartera.`);
  } catch (error) {
    elements.invoiceFormError.textContent = error.message;
    elements.invoiceFormError.hidden = false;
  } finally {
    elements.saveInvoiceButton.disabled = false;
    elements.saveInvoiceButton.textContent = 'Emitir cuenta por cobrar';
  }
}

function openPaymentDialog() {
  if (!selectedReceivable || selectedReceivable.status === 'PAID') return;
  elements.paymentForm.reset();
  elements.paymentFormError.hidden = true;
  elements.paymentInvoiceNumber.textContent = selectedReceivable.invoice_number;
  elements.paymentBalance.textContent =
    `${formatCurrency(selectedReceivable.balance)} pendientes`;
  elements.paymentAmount.max = String(selectedReceivable.balance);
  elements.paymentAmount.value = String(selectedReceivable.balance);
  elements.paymentDate.value = isoDate();
  elements.paymentDialog.showModal();
  elements.paymentAmount.focus();
  elements.paymentAmount.select();
}

function closePaymentDialog() {
  elements.paymentDialog.close();
}

async function submitPayment(event) {
  event.preventDefault();
  const formData = new FormData(elements.paymentForm);
  elements.paymentFormError.hidden = true;
  elements.savePaymentButton.disabled = true;
  elements.savePaymentButton.textContent = 'Aplicando abono…';
  try {
    await getJson(`/api/receivables/invoices/${selectedReceivable.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const invoiceId = selectedReceivable.id;
    closePaymentDialog();
    await loadReceivables();
    await loadInvoiceDetail(invoiceId);
    showToast('Abono registrado y saldo actualizado.');
  } catch (error) {
    elements.paymentFormError.textContent = error.message;
    elements.paymentFormError.hidden = false;
  } finally {
    elements.savePaymentButton.disabled = false;
    elements.savePaymentButton.textContent = 'Aplicar abono';
  }
}

const countStatusLabels = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En conteo',
  REVIEW: 'En revisión',
  COMPLETED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

const countClassificationLabels = {
  PENDING: 'Pendiente',
  OK: 'Correcto',
  SHORTAGE: 'Faltante',
  EXCESS: 'Sobrante',
  UNEXPECTED: 'No esperado',
  MISSING: 'Sin existencias',
};

function setCountSummary(summary = {}) {
  elements.activeCountTotal.textContent = String(summary.active_counts || 0);
  elements.pendingCountItems.textContent = String(summary.pending_items || 0);
  elements.countDiscrepancies.textContent = String(summary.discrepancies || 0);
  elements.completedCountsMonth.textContent = String(summary.completed_month || 0);
}

function showCountsError(message) {
  physicalCounts = [];
  selectedPhysicalCount = null;
  setCountSummary();
  elements.countSessionList.replaceChildren();
  elements.countDataState.hidden = false;
  elements.countDataState.classList.add('error');
  elements.countDataState.querySelector('strong').textContent = 'No pudimos consultar los conteos';
  elements.countDataState.querySelector('p').textContent = message;
  elements.countRecordCount.textContent = '—';
  elements.countDetailContent.hidden = true;
  elements.countDetailEmpty.hidden = false;
}

function renderCountSessions() {
  elements.countSessionList.replaceChildren();
  elements.countRecordCount.textContent = String(physicalCounts.length);
  elements.countDataState.hidden = physicalCounts.length > 0;
  elements.countDataState.classList.remove('error');
  if (!physicalCounts.length) {
    elements.countDataState.querySelector('strong').textContent = 'Aún no hay conteos';
    elements.countDataState.querySelector('p').textContent =
      'Crea una jornada para tomar la primera fotografía física.';
    return;
  }
  for (const count of physicalCounts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'count-session-card';
    if (selectedPhysicalCount?.id === count.id) button.classList.add('selected');

    const top = document.createElement('div');
    const number = document.createElement('strong');
    number.textContent = count.count_number;
    const status = document.createElement('span');
    status.className = `count-status ${count.status.toLocaleLowerCase('es')}`;
    status.textContent = countStatusLabels[count.status] || count.status;
    top.append(number, status);

    const name = document.createElement('span');
    name.className = 'count-session-name';
    name.textContent = count.name;
    const warehouse = document.createElement('small');
    warehouse.textContent = `${count.warehouse_name} · ${count.branch_name}`;

    const progress = document.createElement('div');
    progress.className = 'count-session-progress';
    const counted = document.createElement('span');
    counted.textContent = `${count.counted_count}/${count.item_count} contados`;
    const discrepancies = document.createElement('strong');
    discrepancies.textContent =
      `${count.discrepancy_count} ${Number(count.discrepancy_count) === 1 ? 'diferencia' : 'diferencias'}`;
    progress.append(counted, discrepancies);
    button.append(top, name, warehouse, progress);
    button.addEventListener('click', () => loadPhysicalCountDetail(count.id));
    elements.countSessionList.append(button);
  }
}

function countClassificationMeta(item) {
  const classification = item.classification || 'PENDING';
  return {
    label: countClassificationLabels[classification] || classification,
    className: classification.toLocaleLowerCase('es'),
  };
}

function renderCountItems() {
  if (!selectedPhysicalCount) return;
  const search = normalizeSearch(elements.countProductSearch.value.trim());
  const filter = elements.countItemFilter.value;
  const filtered = selectedPhysicalCount.items.filter((item) => {
    const matchesSearch = !search || normalizeSearch(
      `${item.name_snapshot} ${item.sku_snapshot}`,
    ).includes(search);
    const hasDifference =
      item.counted_quantity !== null && Number(item.difference) !== 0;
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'PENDING' && item.counted_quantity === null) ||
      (filter === 'DIFFERENCE' && hasDifference) ||
      (filter === 'OK' && item.classification === 'OK');
    return matchesSearch && matchesFilter;
  });

  elements.countItemList.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'count-items-empty';
    empty.innerHTML = '<strong>No hay productos para este filtro</strong><p>Cambia la búsqueda o consulta todas las referencias.</p>';
    elements.countItemList.append(empty);
    return;
  }

  for (const item of filtered) {
    const card = document.createElement('article');
    card.className = 'count-item-card';
    if (item.severity === 'HIGH') card.classList.add('high-severity');

    const identity = document.createElement('div');
    identity.className = 'count-item-identity';
    const visual = document.createElement('div');
    visual.className = 'count-item-visual';
    if (item.image_url) {
      const image = document.createElement('img');
      image.src = item.image_url;
      image.alt = item.image_alt || item.name_snapshot;
      visual.append(image);
    } else {
      visual.textContent = item.name_snapshot.slice(0, 1).toLocaleUpperCase('es');
    }
    const copy = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.name_snapshot;
    const sku = document.createElement('small');
    sku.textContent = item.sku_snapshot;
    copy.append(name, sku);
    identity.append(visual, copy);

    const badgeMeta = countClassificationMeta(item);
    const badge = document.createElement('span');
    badge.className = `count-result ${badgeMeta.className}`;
    badge.textContent = badgeMeta.label;

    const facts = document.createElement('div');
    facts.className = 'count-item-facts';
    const expected = document.createElement('div');
    expected.innerHTML = `<span>Esperado</span><strong>${Number(item.expected_quantity).toLocaleString('es-CO')}</strong>`;
    const counted = document.createElement('div');
    counted.innerHTML = `<span>Contado</span><strong>${item.counted_quantity === null ? '—' : Number(item.counted_quantity).toLocaleString('es-CO')}</strong>`;
    const difference = document.createElement('div');
    difference.innerHTML = `<span>Diferencia</span><strong>${item.difference === null ? '—' : Number(item.difference).toLocaleString('es-CO', { signDisplay: 'always' })}</strong>`;
    facts.append(expected, counted, difference);

    card.append(identity, badge, facts);

    if (selectedPhysicalCount.status === 'IN_PROGRESS') {
      const editor = document.createElement('div');
      editor.className = 'count-item-editor';
      const quantityLabel = document.createElement('label');
      quantityLabel.className = 'form-field';
      quantityLabel.innerHTML = '<span>Cantidad encontrada</span>';
      const quantity = document.createElement('input');
      quantity.type = 'number';
      quantity.min = '0';
      quantity.step = '0.0001';
      quantity.value = item.counted_quantity ?? '';
      quantity.placeholder = '0';
      quantityLabel.append(quantity);

      const notesLabel = document.createElement('label');
      notesLabel.className = 'form-field count-item-notes';
      notesLabel.innerHTML = '<span>Observación</span>';
      const notes = document.createElement('input');
      notes.type = 'text';
      notes.maxLength = 500;
      notes.value = item.notes || '';
      notes.placeholder = 'Motivo, ubicación o novedad';
      notesLabel.append(notes);

      const save = document.createElement('button');
      save.type = 'button';
      save.className = 'secondary-button count-save-item';
      save.textContent = item.counted_quantity === null ? 'Registrar' : 'Actualizar';
      save.addEventListener('click', () =>
        savePhysicalCountItem(item.product_id, quantity.value, notes.value, save));
      editor.append(quantityLabel, notesLabel, save);
      card.append(editor);
    } else if (item.notes) {
      const note = document.createElement('p');
      note.className = 'count-item-readonly-note';
      note.textContent = item.notes;
      card.append(note);
    }

    elements.countItemList.append(card);
  }
}

function renderPhysicalCountDetail(count) {
  selectedPhysicalCount = count;
  elements.countDetailEmpty.hidden = true;
  elements.countDetailContent.hidden = false;
  elements.countDetailNumber.textContent = count.count_number;
  elements.countDetailName.textContent = count.name;
  elements.countDetailWarehouse.textContent =
    `${count.warehouse_name} · ${count.branch_name}`;
  elements.countDetailStatus.textContent = countStatusLabels[count.status] || count.status;
  elements.countDetailStatus.className =
    `count-status ${count.status.toLocaleLowerCase('es')}`;
  elements.countProgressLabel.textContent = `${count.countedCount} de ${count.itemCount}`;
  const percentage = count.itemCount
    ? Math.round((count.countedCount / count.itemCount) * 100)
    : 100;
  elements.countProgressBar.style.width = `${percentage}%`;
  elements.countDifferenceLabel.textContent = count.discrepancyCount
    ? `${count.discrepancyCount} ${count.discrepancyCount === 1 ? 'diferencia requiere' : 'diferencias requieren'} revisión`
    : 'Sin diferencias registradas';
  elements.startCountButton.hidden = count.status !== 'DRAFT';
  elements.submitCountButton.hidden = count.status !== 'IN_PROGRESS';
  elements.submitCountButton.disabled = count.countedCount !== count.itemCount;
  elements.completeCountButton.hidden = count.status !== 'REVIEW';
  elements.countProductSearch.disabled = false;
  elements.countItemFilter.disabled = false;
  renderCountSessions();
  renderCountItems();
}

async function loadPhysicalCountDetail(countId) {
  try {
    const detail = await getJson(`/api/physical-counts/${countId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderPhysicalCountDetail(detail);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadPhysicalCounts() {
  if (!activeTenantId) {
    showCountsError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  try {
    const [summary, countsResult] = await Promise.all([
      getJson('/api/physical-counts/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/physical-counts', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    physicalCounts = countsResult;
    setCountSummary(summary);
    renderCountSessions();
    if (selectedPhysicalCount) {
      const stillExists = countsResult.some((count) => count.id === selectedPhysicalCount.id);
      if (stillExists) await loadPhysicalCountDetail(selectedPhysicalCount.id);
      else {
        selectedPhysicalCount = null;
        elements.countDetailContent.hidden = true;
        elements.countDetailEmpty.hidden = false;
      }
    }
    return countsResult;
  } catch (error) {
    showCountsError(error.message);
    throw error;
  }
}

function openCountDialog() {
  if (!activeTenantId || !warehouses.length) {
    showToast('Crea una bodega antes de iniciar un conteo.');
    return;
  }
  elements.countForm.reset();
  elements.countWarehouseId.replaceChildren(new Option('Selecciona una bodega', ''));
  for (const warehouse of warehouses.filter((item) => item.active)) {
    elements.countWarehouseId.append(
      new Option(`${warehouse.name} · ${warehouse.branch_name}`, warehouse.id),
    );
  }
  elements.countFormError.hidden = true;
  elements.countDialog.showModal();
  elements.countWarehouseId.focus();
}

function closeCountDialog() {
  elements.countDialog.close();
}

async function submitPhysicalCount(event) {
  event.preventDefault();
  const formData = new FormData(elements.countForm);
  elements.countFormError.hidden = true;
  elements.saveCountButton.disabled = true;
  elements.saveCountButton.textContent = 'Creando fotografía…';
  try {
    const count = await getJson('/api/physical-counts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    closeCountDialog();
    await loadPhysicalCounts();
    await loadPhysicalCountDetail(count.id);
    showToast(`${count.count_number} creado con el saldo esperado.`);
  } catch (error) {
    elements.countFormError.textContent = error.message;
    elements.countFormError.hidden = false;
  } finally {
    elements.saveCountButton.disabled = false;
    elements.saveCountButton.textContent = 'Crear fotografía inicial';
  }
}

async function startPhysicalCount() {
  if (!selectedPhysicalCount) return;
  elements.startCountButton.disabled = true;
  try {
    await getJson(`/api/physical-counts/${selectedPhysicalCount.id}/start`, {
      method: 'POST',
      headers: { 'x-tenant-id': activeTenantId },
    });
    await loadPhysicalCounts();
    showToast('Conteo iniciado. Ya puedes registrar cantidades.');
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.startCountButton.disabled = false;
  }
}

async function savePhysicalCountItem(productId, countedQuantity, notes, button) {
  if (!selectedPhysicalCount) return;
  button.disabled = true;
  button.textContent = 'Guardando…';
  try {
    await getJson(
      `/api/physical-counts/${selectedPhysicalCount.id}/items/${productId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ countedQuantity, notes }),
      },
    );
    await loadPhysicalCounts();
    showToast('Cantidad registrada.');
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Reintentar';
    showToast(error.message);
  }
}

async function submitPhysicalCountReview() {
  if (!selectedPhysicalCount) return;
  elements.submitCountButton.disabled = true;
  try {
    await getJson(`/api/physical-counts/${selectedPhysicalCount.id}/submit`, {
      method: 'POST',
      headers: { 'x-tenant-id': activeTenantId },
    });
    await loadPhysicalCounts();
    showToast('Conteo enviado a revisión.');
  } catch (error) {
    showToast(error.message);
    elements.submitCountButton.disabled = false;
  }
}

function openCompleteCountDialog() {
  if (!selectedPhysicalCount || selectedPhysicalCount.status !== 'REVIEW') return;
  elements.completeCountForm.reset();
  elements.completeCountFormError.hidden = true;
  elements.completeCountDialog.showModal();
  elements.completeCountForm.elements.reason.focus();
}

function closeCompleteCountDialog() {
  elements.completeCountDialog.close();
}

async function completePhysicalCount(event) {
  event.preventDefault();
  const formData = new FormData(elements.completeCountForm);
  elements.completeCountFormError.hidden = true;
  elements.saveCompleteCountButton.disabled = true;
  elements.saveCompleteCountButton.textContent = 'Aplicando ajustes…';
  try {
    const result = await getJson(
      `/api/physical-counts/${selectedPhysicalCount.id}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ reason: formData.get('reason') }),
      },
    );
    closeCompleteCountDialog();
    await loadWarehouses();
    await loadPhysicalCounts();
    showToast(
      result.adjustments
        ? `${result.adjustments} ajustes aplicados y auditados.`
        : 'Conteo cerrado sin diferencias.',
    );
  } catch (error) {
    elements.completeCountFormError.textContent = error.message;
    elements.completeCountFormError.hidden = false;
  } finally {
    elements.saveCompleteCountButton.disabled = false;
    elements.saveCompleteCountButton.textContent = 'Confirmar ajustes';
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
    showCountsError('Primero debes registrar o seleccionar una empresa.');
    showCatalogError('Primero debes registrar o seleccionar una empresa.');
    showPosError('Primero debes registrar o seleccionar una empresa.');
    showReceivableError('Primero debes registrar o seleccionar una empresa.');
    setMetric(elements.branchCount, elements.branchDetail, { status: 'rejected' }, ['sucursal', 'sucursales']);
    setMetric(elements.warehouseCount, elements.warehouseDetail, { status: 'rejected' }, ['bodega registrada', 'bodegas registradas']);
    setMetric(elements.productCount, elements.productDetail, { status: 'rejected' }, ['producto registrado', 'productos registrados']);
    return;
  }

  const results = await Promise.allSettled([
    loadBranches(),
    loadWarehouses(),
    loadPhysicalCounts(),
    loadCatalog(),
    loadPos(),
    loadReceivables(),
  ]);
  await syncPosWorkstation().catch(() => {});
  setMetric(elements.branchCount, elements.branchDetail, results[0], ['sucursal', 'sucursales']);
  setMetric(elements.warehouseCount, elements.warehouseDetail, results[1], ['bodega registrada', 'bodegas registradas']);
  setMetric(elements.productCount, elements.productDetail, results[3], ['producto registrado', 'productos registrados']);
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

const availableViews = new Set([
  'inicio',
  'empresas',
  'sucursales',
  'bodegas',
  'conteos',
  'productos',
  'caja',
  'cartera',
  'modulos',
  'sistema',
]);

const viewAliases = {
  resumen: 'inicio',
  catalogos: 'productos',
};

const viewTitles = {
  inicio: 'Dashboard',
  empresas: 'Empresas',
  sucursales: 'Sucursales',
  bodegas: 'Bodegas',
  conteos: 'Conteos físicos',
  productos: 'Catálogo',
  caja: 'Caja & POS',
  cartera: 'Cuentas por cobrar',
  modulos: 'Mapa del ERP',
  sistema: 'Sistema',
};

function resolveView(hash = window.location.hash) {
  const requested = hash.replace(/^#/, '') || 'inicio';
  const resolved = viewAliases[requested] || requested;
  return availableViews.has(resolved) ? resolved : 'inicio';
}

function showView(requestedView, { scroll = true } = {}) {
  const view = resolveView(`#${requestedView}`);
  document.querySelectorAll('.app-view').forEach((section) => {
    section.hidden = section.dataset.view !== view;
  });
  document.querySelectorAll('[data-view-link]').forEach((link) => {
    const isActive = link.dataset.viewLink === view;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.body.dataset.activeView = view;
  document.title = `MegaSuite — ${viewTitles[view]}`;
  if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
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
    saleCart.clear();
    posCatalog = [];
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

function openCategoryDialog() {
  if (!getActiveCompany()) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  elements.categoryForm.reset();
  elements.categoryFormError.hidden = true;
  elements.categoryDialog.showModal();
  elements.categoryForm.elements.name.focus();
}

function closeCategoryDialog() {
  elements.categoryDialog.close();
}

async function submitCategory(event) {
  event.preventDefault();
  elements.categoryFormError.hidden = true;
  elements.saveCategoryButton.disabled = true;
  elements.saveCategoryButton.textContent = 'Creando categoría…';
  const formData = new FormData(elements.categoryForm);

  try {
    await getJson('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        name: formData.get('name'),
        code: formData.get('code'),
        description: formData.get('description') || null,
      }),
    });
    closeCategoryDialog();
    await loadCatalog();
    showToast('Categoría creada y disponible para los productos.');
  } catch (error) {
    elements.categoryFormError.textContent = error.message;
    elements.categoryFormError.hidden = false;
  } finally {
    elements.saveCategoryButton.disabled = false;
    elements.saveCategoryButton.textContent = 'Crear categoría';
  }
}

function openBrandDialog() {
  if (!getActiveCompany()) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  elements.brandForm.reset();
  elements.brandFormError.hidden = true;
  elements.brandDialog.showModal();
  elements.brandForm.elements.name.focus();
}

function closeBrandDialog() {
  elements.brandDialog.close();
}

async function submitBrand(event) {
  event.preventDefault();
  elements.brandFormError.hidden = true;
  elements.saveBrandButton.disabled = true;
  elements.saveBrandButton.textContent = 'Registrando marca…';
  const formData = new FormData(elements.brandForm);

  try {
    await getJson('/api/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        name: formData.get('name'),
        code: formData.get('code'),
      }),
    });
    closeBrandDialog();
    await loadCatalog();
    showToast('Marca registrada y disponible para el catálogo.');
  } catch (error) {
    elements.brandFormError.textContent = error.message;
    elements.brandFormError.hidden = false;
  } finally {
    elements.saveBrandButton.disabled = false;
    elements.saveBrandButton.textContent = 'Registrar marca';
  }
}

function openProductDialog() {
  if (!getActiveCompany()) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  elements.productForm.reset();
  syncProductOptions();
  elements.productFormError.hidden = true;
  elements.productDialog.showModal();
  document.querySelector('#productName').focus();
}

function closeProductDialog() {
  elements.productDialog.close();
}

function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!file || !allowedTypes.includes(file.type)) {
    throw new Error('Selecciona una imagen JPG, PNG o WEBP.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('La imagen debe pesar máximo 2 MB.');
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error('No fue posible leer la imagen.')));
    reader.readAsDataURL(file);
  });
}

async function uploadProductImage(productId, file, altText) {
  validateImageFile(file);
  const dataUrl = await fileToDataUrl(file);
  return getJson(`/api/products/${productId}/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': activeTenantId,
    },
    body: JSON.stringify({ dataUrl, altText }),
  });
}

async function submitProduct(event) {
  event.preventDefault();
  elements.productFormError.hidden = true;
  elements.saveProductButton.disabled = true;
  elements.saveProductButton.textContent = 'Agregando producto…';
  const formData = new FormData(elements.productForm);

  try {
    const imageFile = elements.newProductImage.files[0] || null;
    if (imageFile) validateImageFile(imageFile);
    const createdProduct = await getJson('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        name: formData.get('name'),
        sku: formData.get('sku'),
        barcode: formData.get('barcode') || null,
        categoryId: formData.get('categoryId') || null,
        brandId: formData.get('brandId') || null,
        salesTaxCategoryId: formData.get('salesTaxCategoryId') || null,
        cost: formData.get('cost'),
        salePrice: formData.get('salePrice'),
      }),
    });
    let imageUploaded = false;
    let imageWarning = null;
    if (imageFile) {
      try {
        await uploadProductImage(createdProduct.id, imageFile, formData.get('name'));
        imageUploaded = true;
      } catch (error) {
        imageWarning = error.message;
      }
    }
    closeProductDialog();
    await loadCatalog();
    elements.productCount.textContent = String(products.length);
    elements.productDetail.textContent =
      `${products.length} ${products.length === 1 ? 'producto registrado' : 'productos registrados'}`;
    if (imageWarning) {
      showToast('Producto creado; la fotografía se puede adjuntar desde el listado.');
    } else {
      showToast(
        imageUploaded
          ? 'Producto e imagen agregados al catálogo.'
          : 'Producto agregado al catálogo sin alterar el inventario.',
      );
    }
  } catch (error) {
    elements.productFormError.textContent = error.message;
    elements.productFormError.hidden = false;
  } finally {
    elements.saveProductButton.disabled = false;
    elements.saveProductButton.textContent = 'Agregar al catálogo';
  }
}

function resetProductImagePreview() {
  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  imagePreviewUrl = null;
  elements.productImagePreview.hidden = true;
  elements.productImagePreview.removeAttribute('src');
  elements.productImagePlaceholder.hidden = false;
}

function openProductImageDialog(product) {
  imageProduct = product;
  elements.productImageForm.reset();
  elements.productImageFormError.hidden = true;
  elements.imageProductName.textContent = product.name;
  elements.productImageAlt.value = product.name;
  resetProductImagePreview();
  elements.productImageDialog.showModal();
  elements.productImageFile.focus();
}

function closeProductImageDialog() {
  elements.productImageDialog.close();
  resetProductImagePreview();
  imageProduct = null;
}

function previewProductImage() {
  const file = elements.productImageFile.files[0];
  resetProductImagePreview();
  if (!file) return;
  try {
    validateImageFile(file);
    imagePreviewUrl = URL.createObjectURL(file);
    elements.productImagePreview.src = imagePreviewUrl;
    elements.productImagePreview.hidden = false;
    elements.productImagePlaceholder.hidden = true;
    elements.productImageFormError.hidden = true;
  } catch (error) {
    elements.productImageFile.value = '';
    elements.productImageFormError.textContent = error.message;
    elements.productImageFormError.hidden = false;
  }
}

async function submitProductImage(event) {
  event.preventDefault();
  const file = elements.productImageFile.files[0];
  elements.productImageFormError.hidden = true;
  elements.saveProductImageButton.disabled = true;
  elements.saveProductImageButton.textContent = 'Guardando fotografía…';
  try {
    await uploadProductImage(imageProduct.id, file, elements.productImageAlt.value);
    closeProductImageDialog();
    await loadCatalog();
    showToast('Fotografía principal actualizada.');
  } catch (error) {
    elements.productImageFormError.textContent = error.message;
    elements.productImageFormError.hidden = false;
  } finally {
    elements.saveProductImageButton.disabled = false;
    elements.saveProductImageButton.textContent = 'Guardar fotografía';
  }
}

function openCashDialog() {
  if (!getActiveCompany() || !posSummary.registers.length) {
    showToast('No hay una caja disponible para la empresa activa.');
    return;
  }
  elements.openCashForm.reset();
  syncCashRegisterOptions();
  elements.openCashFormError.hidden = true;
  elements.openCashDialog.showModal();
  elements.cashRegisterId.focus();
}

function closeOpenCashDialog() {
  elements.openCashDialog.close();
}

async function submitOpenCash(event) {
  event.preventDefault();
  const formData = new FormData(elements.openCashForm);
  elements.openCashFormError.hidden = true;
  elements.saveOpenCashButton.disabled = true;
  elements.saveOpenCashButton.textContent = 'Abriendo turno…';
  try {
    await getJson('/api/pos/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        cashRegisterId: formData.get('cashRegisterId'),
        openingAmount: formData.get('openingAmount'),
      }),
    });
    closeOpenCashDialog();
    await loadPos();
    await syncPosWorkstation();
    showToast('Turno de caja abierto correctamente.');
  } catch (error) {
    elements.openCashFormError.textContent = error.message;
    elements.openCashFormError.hidden = false;
  } finally {
    elements.saveOpenCashButton.disabled = false;
    elements.saveOpenCashButton.textContent = 'Abrir turno de caja';
  }
}

function openCloseCashDialog() {
  if (!posSummary.openSession) return;
  if (saleCart.size) {
    showToast('Termina o vacía la venta actual antes de cerrar la caja.');
    return;
  }
  elements.closeCashForm.reset();
  elements.closeCashFormError.hidden = true;
  elements.closeCashDialog.showModal();
  elements.closeCashForm.elements.closingAmount.focus();
}

function closeCloseCashDialog() {
  elements.closeCashDialog.close();
}

async function submitCloseCash(event) {
  event.preventDefault();
  const formData = new FormData(elements.closeCashForm);
  elements.closeCashFormError.hidden = true;
  elements.saveCloseCashButton.disabled = true;
  elements.saveCloseCashButton.textContent = 'Cerrando turno…';
  try {
    await getJson(`/api/pos/sessions/${posSummary.openSession.id}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ closingAmount: formData.get('closingAmount') }),
    });
    closeCloseCashDialog();
    await loadPos();
    await syncPosWorkstation();
    showToast('Turno cerrado y efectivo registrado.');
  } catch (error) {
    elements.closeCashFormError.textContent = error.message;
    elements.closeCashFormError.hidden = false;
  } finally {
    elements.saveCloseCashButton.disabled = false;
    elements.saveCloseCashButton.textContent = 'Confirmar cierre';
  }
}

function showReceipt(receipt) {
  elements.receiptNumber.textContent = receipt.receiptNumber;
  elements.receiptLines.replaceChildren();
  for (const item of receipt.items) {
    const line = document.createElement('div');
    const description = document.createElement('span');
    description.textContent = `${item.quantity} × ${item.name}`;
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(item.lineTotal);
    line.append(description, amount);
    elements.receiptLines.append(line);
  }
  elements.receiptSubtotal.textContent = formatCurrency(receipt.subtotal);
  elements.receiptTax.textContent = formatCurrency(receipt.tax_total);
  elements.receiptTotal.textContent = formatCurrency(receipt.total);
  elements.receiptDialog.showModal();
}

function closeReceiptDialog() {
  elements.receiptDialog.close();
}

async function completeSale() {
  if (!posSummary.openSession || !saleCart.size) return;
  elements.posSaleError.hidden = true;
  elements.completeSaleButton.disabled = true;
  elements.completeSaleButton.textContent = 'Confirmando venta…';
  try {
    const receipt = await getJson('/api/pos/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        cashSessionId: posSummary.openSession.id,
        warehouseId: elements.posWarehouseSelect.value,
        paymentMethod: elements.posPaymentMethod.value,
        items: [...saleCart.values()].map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    });
    saleCart.clear();
    await loadPosCatalog();
    showReceipt(receipt);
    showToast('Venta registrada e inventario actualizado.');
  } catch (error) {
    elements.posSaleError.textContent = error.message;
    elements.posSaleError.hidden = false;
  } finally {
    elements.completeSaleButton.textContent = 'Cobrar y descontar inventario →';
    renderCart();
  }
}

document.querySelector('#currentDate').textContent = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date());

elements.refreshButton.addEventListener('click', () => refreshStatus({ notify: true }));
elements.moduleSearch.addEventListener('input', () => {
  filterModules();
  if (elements.moduleSearch.value.trim() && resolveView() !== 'modulos') {
    window.location.hash = 'modulos';
  }
});
elements.companySearch.addEventListener('input', renderCompanies);
elements.branchSearch.addEventListener('input', renderBranches);
elements.warehouseSearch.addEventListener('input', renderWarehouses);
elements.productSearch.addEventListener('input', renderProducts);
elements.companyContext.addEventListener('change', async () => {
  activeTenantId = elements.companyContext.value;
  saleCart.clear();
  posCatalog = [];
  selectedReceivable = null;
  selectedPhysicalCount = null;
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
elements.reloadCountsButton.addEventListener('click', () => {
  loadPhysicalCounts()
    .then(() => showToast('Conteos actualizados.'))
    .catch(() => showToast('No fue posible actualizar los conteos.'));
});
elements.newCountButton.addEventListener('click', openCountDialog);
elements.closeCountDialog.addEventListener('click', closeCountDialog);
elements.cancelCountButton.addEventListener('click', closeCountDialog);
elements.countForm.addEventListener('submit', submitPhysicalCount);
elements.countDialog.addEventListener('click', (event) => {
  if (event.target === elements.countDialog) closeCountDialog();
});
elements.countProductSearch.addEventListener('input', renderCountItems);
elements.countItemFilter.addEventListener('change', renderCountItems);
elements.startCountButton.addEventListener('click', startPhysicalCount);
elements.submitCountButton.addEventListener('click', submitPhysicalCountReview);
elements.completeCountButton.addEventListener('click', openCompleteCountDialog);
elements.closeCompleteCountDialog.addEventListener('click', closeCompleteCountDialog);
elements.cancelCompleteCountButton.addEventListener('click', closeCompleteCountDialog);
elements.completeCountForm.addEventListener('submit', completePhysicalCount);
elements.completeCountDialog.addEventListener('click', (event) => {
  if (event.target === elements.completeCountDialog) closeCompleteCountDialog();
});
elements.reloadProductsButton.addEventListener('click', () => {
  loadCatalog()
    .then(() => showToast('Catálogo sincronizado.'))
    .catch(() => showToast('No fue posible sincronizar el catálogo.'));
});
elements.newCategoryButton.addEventListener('click', openCategoryDialog);
elements.categoryPanelCreateButton.addEventListener('click', openCategoryDialog);
elements.closeCategoryDialog.addEventListener('click', closeCategoryDialog);
elements.cancelCategoryButton.addEventListener('click', closeCategoryDialog);
elements.categoryForm.addEventListener('submit', submitCategory);
elements.categoryDialog.addEventListener('click', (event) => {
  if (event.target === elements.categoryDialog) closeCategoryDialog();
});
elements.newBrandButton.addEventListener('click', openBrandDialog);
elements.brandPanelCreateButton.addEventListener('click', openBrandDialog);
elements.closeBrandDialog.addEventListener('click', closeBrandDialog);
elements.cancelBrandButton.addEventListener('click', closeBrandDialog);
elements.brandForm.addEventListener('submit', submitBrand);
elements.brandDialog.addEventListener('click', (event) => {
  if (event.target === elements.brandDialog) closeBrandDialog();
});
elements.newProductButton.addEventListener('click', openProductDialog);
elements.closeProductDialog.addEventListener('click', closeProductDialog);
elements.cancelProductButton.addEventListener('click', closeProductDialog);
elements.productForm.addEventListener('submit', submitProduct);
elements.productDialog.addEventListener('click', (event) => {
  if (event.target === elements.productDialog) closeProductDialog();
});
elements.productImageFile.addEventListener('change', previewProductImage);
elements.closeProductImageDialog.addEventListener('click', closeProductImageDialog);
elements.cancelProductImageButton.addEventListener('click', closeProductImageDialog);
elements.productImageForm.addEventListener('submit', submitProductImage);
elements.productImageDialog.addEventListener('click', (event) => {
  if (event.target === elements.productImageDialog) closeProductImageDialog();
});
elements.openCashButton.addEventListener('click', openCashDialog);
elements.closeCashButton.addEventListener('click', openCloseCashDialog);
elements.closeOpenCashDialog.addEventListener('click', closeOpenCashDialog);
elements.cancelOpenCashButton.addEventListener('click', closeOpenCashDialog);
elements.openCashForm.addEventListener('submit', submitOpenCash);
elements.openCashDialog.addEventListener('click', (event) => {
  if (event.target === elements.openCashDialog) closeOpenCashDialog();
});
elements.closeCloseCashDialog.addEventListener('click', closeCloseCashDialog);
elements.cancelCloseCashButton.addEventListener('click', closeCloseCashDialog);
elements.closeCashForm.addEventListener('submit', submitCloseCash);
elements.closeCashDialog.addEventListener('click', (event) => {
  if (event.target === elements.closeCashDialog) closeCloseCashDialog();
});
elements.posWarehouseSelect.addEventListener('change', async () => {
  saleCart.clear();
  await loadPosCatalog().catch(() => {});
});
elements.posProductSearch.addEventListener('input', renderPosCatalog);
elements.completeSaleButton.addEventListener('click', completeSale);
elements.closeReceiptDialog.addEventListener('click', closeReceiptDialog);
elements.finishReceiptButton.addEventListener('click', closeReceiptDialog);
elements.receiptDialog.addEventListener('click', (event) => {
  if (event.target === elements.receiptDialog) closeReceiptDialog();
});
elements.invoiceSearch.addEventListener('input', renderInvoiceList);
elements.invoiceStatusFilter.addEventListener('change', renderInvoiceList);
elements.reloadReceivablesButton.addEventListener('click', () => {
  loadReceivables()
    .then(() => showToast('Cartera actualizada.'))
    .catch(() => showToast('No fue posible actualizar la cartera.'));
});
elements.newCustomerButton.addEventListener('click', openCustomerDialog);
elements.closeCustomerDialog.addEventListener('click', closeCustomerDialog);
elements.cancelCustomerButton.addEventListener('click', closeCustomerDialog);
elements.customerForm.addEventListener('submit', submitCustomer);
elements.customerDialog.addEventListener('click', (event) => {
  if (event.target === elements.customerDialog) closeCustomerDialog();
});
elements.newInvoiceButton.addEventListener('click', openInvoiceDialog);
elements.closeInvoiceDialog.addEventListener('click', closeInvoiceDialog);
elements.cancelInvoiceButton.addEventListener('click', closeInvoiceDialog);
elements.invoiceForm.addEventListener('submit', submitInvoice);
elements.invoiceDialog.addEventListener('click', (event) => {
  if (event.target === elements.invoiceDialog) closeInvoiceDialog();
});
elements.addInvoiceItemButton.addEventListener('click', addInvoiceItemRow);
elements.newPaymentButton.addEventListener('click', openPaymentDialog);
elements.closePaymentDialog.addEventListener('click', closePaymentDialog);
elements.cancelPaymentButton.addEventListener('click', closePaymentDialog);
elements.paymentForm.addEventListener('submit', submitPayment);
elements.paymentDialog.addEventListener('click', (event) => {
  if (event.target === elements.paymentDialog) closePaymentDialog();
});
document.querySelectorAll('[data-catalog-tab]').forEach((tab) => {
  tab.addEventListener('click', () => showCatalogPanel(tab.dataset.catalogTab));
});
elements.menuButton.addEventListener('click', () => toggleMenu());
document.querySelectorAll('[data-view-link]').forEach((link) => {
  link.addEventListener('click', () => {
    showView(link.dataset.viewLink);
    if (elements.sidebar.contains(link)) toggleMenu(false);
  });
});
window.addEventListener('hashchange', () => showView(resolveView()));

showView(resolveView(), { scroll: false });

refreshStatus().catch(() => {
  elements.refreshButton.classList.remove('loading');
  elements.refreshButton.disabled = false;
  elements.overallIndicator.classList.add('error');
  elements.overallLabel.textContent = 'Sin conexión';
  setServiceState(elements.apiDot, elements.apiResult, 'error', 'Sin respuesta');
});
