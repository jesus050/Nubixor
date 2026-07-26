const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:4100' : '';

function resolvePublicAsset(path) {
  if (!path || window.location.protocol !== 'file:' || !path.startsWith('/')) return path;
  return `${API_BASE_URL}${path}`;
}

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
  reloadInventoryButton: document.querySelector('#reloadInventoryButton'),
  inventoryValue: document.querySelector('#inventoryValue'),
  inventoryStockedProducts: document.querySelector('#inventoryStockedProducts'),
  inventoryAvailableUnits: document.querySelector('#inventoryAvailableUnits'),
  inventoryReservedUnits: document.querySelector('#inventoryReservedUnits'),
  inventoryLowStock: document.querySelector('#inventoryLowStock'),
  inventoryMovementsMonth: document.querySelector('#inventoryMovementsMonth'),
  inventoryActiveCountBadge: document.querySelector('#inventoryActiveCountBadge'),
  inventorySearch: document.querySelector('#inventorySearch'),
  inventoryWarehouseFilter: document.querySelector('#inventoryWarehouseFilter'),
  inventoryBalanceCount: document.querySelector('#inventoryBalanceCount'),
  inventoryBalanceList: document.querySelector('#inventoryBalanceList'),
  inventoryDataState: document.querySelector('#inventoryDataState'),
  inventoryMovementCount: document.querySelector('#inventoryMovementCount'),
  inventoryMovementList: document.querySelector('#inventoryMovementList'),
  inventoryMovementState: document.querySelector('#inventoryMovementState'),
  newAdjustmentButton: document.querySelector('#newAdjustmentButton'),
  newTransferButton: document.querySelector('#newTransferButton'),
  openCountsPanelButton: document.querySelector('#openCountsPanelButton'),
  adjustmentDialog: document.querySelector('#adjustmentDialog'),
  adjustmentForm: document.querySelector('#adjustmentForm'),
  adjustmentFormError: document.querySelector('#adjustmentFormError'),
  adjustmentProductId: document.querySelector('#adjustmentProductId'),
  adjustmentWarehouseId: document.querySelector('#adjustmentWarehouseId'),
  closeAdjustmentDialog: document.querySelector('#closeAdjustmentDialog'),
  cancelAdjustmentButton: document.querySelector('#cancelAdjustmentButton'),
  saveAdjustmentButton: document.querySelector('#saveAdjustmentButton'),
  transferDialog: document.querySelector('#transferDialog'),
  transferForm: document.querySelector('#transferForm'),
  transferFormError: document.querySelector('#transferFormError'),
  transferProductId: document.querySelector('#transferProductId'),
  transferSourceWarehouseId: document.querySelector('#transferSourceWarehouseId'),
  transferDestinationWarehouseId: document.querySelector('#transferDestinationWarehouseId'),
  transferAvailability: document.querySelector('#transferAvailability'),
  closeTransferDialog: document.querySelector('#closeTransferDialog'),
  cancelTransferButton: document.querySelector('#cancelTransferButton'),
  saveTransferButton: document.querySelector('#saveTransferButton'),
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
  purchaseOpenOrders: document.querySelector('#purchaseOpenOrders'),
  purchasePendingUnits: document.querySelector('#purchasePendingUnits'),
  purchaseReceivedMonth: document.querySelector('#purchaseReceivedMonth'),
  purchaseSupplierCount: document.querySelector('#purchaseSupplierCount'),
  reloadPurchasesButton: document.querySelector('#reloadPurchasesButton'),
  purchaseSearch: document.querySelector('#purchaseSearch'),
  purchaseOrderList: document.querySelector('#purchaseOrderList'),
  purchaseDataState: document.querySelector('#purchaseDataState'),
  purchaseDetailEmpty: document.querySelector('#purchaseDetailEmpty'),
  purchaseDetailContent: document.querySelector('#purchaseDetailContent'),
  purchaseDetailNumber: document.querySelector('#purchaseDetailNumber'),
  purchaseDetailSupplier: document.querySelector('#purchaseDetailSupplier'),
  purchaseDetailBranch: document.querySelector('#purchaseDetailBranch'),
  purchaseDetailStatus: document.querySelector('#purchaseDetailStatus'),
  purchaseDetailIssue: document.querySelector('#purchaseDetailIssue'),
  purchaseDetailExpected: document.querySelector('#purchaseDetailExpected'),
  purchaseDetailTotal: document.querySelector('#purchaseDetailTotal'),
  purchaseDetailProgress: document.querySelector('#purchaseDetailProgress'),
  purchaseProgressBar: document.querySelector('#purchaseProgressBar'),
  purchasePendingLabel: document.querySelector('#purchasePendingLabel'),
  purchaseItemList: document.querySelector('#purchaseItemList'),
  purchaseReceiptCount: document.querySelector('#purchaseReceiptCount'),
  purchaseReceiptList: document.querySelector('#purchaseReceiptList'),
  receivePurchaseButton: document.querySelector('#receivePurchaseButton'),
  newSupplierButton: document.querySelector('#newSupplierButton'),
  supplierPanelCreateButton: document.querySelector('#supplierPanelCreateButton'),
  newPurchaseButton: document.querySelector('#newPurchaseButton'),
  supplierGrid: document.querySelector('#supplierGrid'),
  supplierDataState: document.querySelector('#supplierDataState'),
  supplierDialog: document.querySelector('#supplierDialog'),
  supplierForm: document.querySelector('#supplierForm'),
  supplierFormError: document.querySelector('#supplierFormError'),
  closeSupplierDialog: document.querySelector('#closeSupplierDialog'),
  cancelSupplierButton: document.querySelector('#cancelSupplierButton'),
  saveSupplierButton: document.querySelector('#saveSupplierButton'),
  purchaseDialog: document.querySelector('#purchaseDialog'),
  purchaseForm: document.querySelector('#purchaseForm'),
  purchaseFormError: document.querySelector('#purchaseFormError'),
  purchaseSupplierId: document.querySelector('#purchaseSupplierId'),
  purchaseBranchId: document.querySelector('#purchaseBranchId'),
  purchaseIssueDate: document.querySelector('#purchaseIssueDate'),
  purchaseExpectedDate: document.querySelector('#purchaseExpectedDate'),
  purchaseItemRows: document.querySelector('#purchaseItemRows'),
  purchaseItemTemplate: document.querySelector('#purchaseItemTemplate'),
  purchaseDraftTotal: document.querySelector('#purchaseDraftTotal'),
  addPurchaseItemButton: document.querySelector('#addPurchaseItemButton'),
  closePurchaseDialog: document.querySelector('#closePurchaseDialog'),
  cancelPurchaseButton: document.querySelector('#cancelPurchaseButton'),
  savePurchaseButton: document.querySelector('#savePurchaseButton'),
  receiptPurchaseDialog: document.querySelector('#receiptPurchaseDialog'),
  receiptPurchaseForm: document.querySelector('#receiptPurchaseForm'),
  receiptPurchaseFormError: document.querySelector('#receiptPurchaseFormError'),
  receiptPurchaseNumber: document.querySelector('#receiptPurchaseNumber'),
  receiptWarehouseId: document.querySelector('#receiptWarehouseId'),
  receiptPurchaseItems: document.querySelector('#receiptPurchaseItems'),
  closeReceiptPurchaseDialog: document.querySelector('#closeReceiptPurchaseDialog'),
  cancelReceiptPurchaseButton: document.querySelector('#cancelReceiptPurchaseButton'),
  saveReceiptPurchaseButton: document.querySelector('#saveReceiptPurchaseButton'),
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
let inventorySummary = {};
let inventoryBalances = [];
let inventoryMovements = [];
let suppliers = [];
let purchases = [];
let selectedPurchase = null;
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
      visual.src = resolvePublicAsset(product.image_url);
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
      visual.src = resolvePublicAsset(product.image_url);
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

const purchaseStatusLabels = {
  DRAFT: 'Borrador',
  ORDERED: 'Ordenada',
  PARTIAL: 'Recepción parcial',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
};

function setPurchaseSummary(summary = {}) {
  elements.purchaseOpenOrders.textContent = String(summary.open_orders || 0);
  elements.purchasePendingUnits.textContent = formatQuantity(summary.pending_units || 0);
  elements.purchaseReceivedMonth.textContent =
    formatCurrency(summary.received_value_month || 0);
  elements.purchaseSupplierCount.textContent = String(summary.active_suppliers || 0);
}

function showPurchasesError(message) {
  purchases = [];
  suppliers = [];
  selectedPurchase = null;
  setPurchaseSummary();
  elements.purchaseOrderList.replaceChildren();
  elements.supplierGrid.replaceChildren();
  elements.purchaseDataState.hidden = false;
  elements.purchaseDataState.classList.add('error');
  elements.purchaseDataState.querySelector('strong').textContent =
    'No pudimos consultar las compras';
  elements.purchaseDataState.querySelector('p').textContent = message;
  elements.supplierDataState.hidden = false;
  elements.purchaseDetailContent.hidden = true;
  elements.purchaseDetailEmpty.hidden = false;
}

function renderSuppliers() {
  elements.supplierGrid.replaceChildren();
  elements.supplierDataState.hidden = suppliers.length > 0;
  for (const supplier of suppliers) {
    const card = document.createElement('article');
    card.className = 'supplier-card';
    const top = document.createElement('div');
    const symbol = document.createElement('span');
    symbol.textContent = supplier.name.slice(0, 1).toLocaleUpperCase('es');
    const status = document.createElement('span');
    status.className = `table-status ${supplier.active ? 'active' : 'inactive'}`;
    status.textContent = supplier.active ? 'Activo' : 'Inactivo';
    top.append(symbol, status);
    const name = document.createElement('h4');
    name.textContent = supplier.name;
    const document = document.createElement('p');
    document.textContent = supplier.tax_id || 'Documento no registrado';
    const details = document.createElement('div');
    details.className = 'supplier-card-details';
    const contact = document.createElement('span');
    contact.textContent = supplier.email || supplier.phone || 'Sin contacto';
    const terms = document.createElement('span');
    terms.textContent = Number(supplier.payment_terms_days)
      ? `${supplier.payment_terms_days} días de plazo`
      : 'Pago de contado';
    details.append(contact, terms);
    const flags = document.createElement('small');
    flags.textContent = [
      supplier.obligated_to_invoice ? 'Obligado a facturar' : null,
      supplier.electronic_invoicer ? 'Factura electrónica' : null,
    ].filter(Boolean).join(' · ') || 'Condición tributaria pendiente';
    card.append(top, name, document, details, flags);
    elements.supplierGrid.append(card);
  }
}

function purchaseStatusMeta(status) {
  return {
    label: purchaseStatusLabels[status] || status,
    className: status.toLocaleLowerCase('es'),
  };
}

function renderPurchaseOrders() {
  const search = normalizeSearch(elements.purchaseSearch.value.trim());
  const filtered = purchases.filter((purchase) => !search || normalizeSearch([
    purchase.order_number,
    purchase.document_number,
    purchase.supplier_name,
    purchase.branch_name,
  ].filter(Boolean).join(' ')).includes(search));
  elements.purchaseOrderList.replaceChildren();
  elements.purchaseDataState.hidden = filtered.length > 0;
  elements.purchaseDataState.classList.remove('error');
  if (!filtered.length) {
    elements.purchaseDataState.querySelector('strong').textContent =
      search ? 'No encontramos órdenes' : 'Aún no hay órdenes';
    elements.purchaseDataState.querySelector('p').textContent =
      search
        ? 'Prueba con otro número, proveedor o sucursal.'
        : 'Emite la primera orden para organizar el abastecimiento.';
    return;
  }
  for (const purchase of filtered) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'purchase-order-card';
    if (selectedPurchase?.id === purchase.id) button.classList.add('selected');
    const top = document.createElement('div');
    const number = document.createElement('strong');
    number.textContent = purchase.order_number;
    const meta = purchaseStatusMeta(purchase.status);
    const status = document.createElement('span');
    status.className = `purchase-status ${meta.className}`;
    status.textContent = meta.label;
    top.append(number, status);
    const supplier = document.createElement('span');
    supplier.className = 'purchase-order-supplier';
    supplier.textContent = purchase.supplier_name;
    const branch = document.createElement('small');
    branch.textContent = `${purchase.branch_name} · ${formatShortDate(purchase.issue_date)}`;
    const progress = document.createElement('div');
    progress.className = 'purchase-order-progress';
    const units = document.createElement('span');
    units.textContent =
      `${formatQuantity(purchase.received_units)} de ${formatQuantity(purchase.ordered_units)} recibidas`;
    const total = document.createElement('strong');
    total.textContent = formatCurrency(purchase.total);
    progress.append(units, total);
    button.append(top, supplier, branch, progress);
    button.addEventListener('click', () => loadPurchaseDetail(purchase.id));
    elements.purchaseOrderList.append(button);
  }
}

function renderPurchaseDetail(purchase) {
  selectedPurchase = purchase;
  elements.purchaseDetailEmpty.hidden = true;
  elements.purchaseDetailContent.hidden = false;
  elements.purchaseDetailNumber.textContent = purchase.order_number;
  elements.purchaseDetailSupplier.textContent = purchase.supplier_name;
  elements.purchaseDetailBranch.textContent =
    `${purchase.branch_name} · ${purchase.branch_code}`;
  const status = purchaseStatusMeta(purchase.status);
  elements.purchaseDetailStatus.textContent = status.label;
  elements.purchaseDetailStatus.className = `purchase-status ${status.className}`;
  elements.purchaseDetailIssue.textContent = formatShortDate(purchase.issue_date);
  elements.purchaseDetailExpected.textContent =
    purchase.expected_date ? formatShortDate(purchase.expected_date) : 'Sin fecha';
  elements.purchaseDetailTotal.textContent = formatCurrency(purchase.total);
  const ordered = purchase.items.reduce(
    (total, item) => total + Number(item.ordered_quantity),
    0,
  );
  const received = purchase.items.reduce(
    (total, item) => total + Number(item.received_quantity),
    0,
  );
  const pending = ordered - received;
  elements.purchaseDetailProgress.textContent =
    `${formatQuantity(received)} de ${formatQuantity(ordered)}`;
  elements.purchaseProgressBar.style.width =
    `${ordered ? Math.min((received / ordered) * 100, 100) : 0}%`;
  elements.purchasePendingLabel.textContent = pending
    ? `${formatQuantity(pending)} unidades pendientes`
    : 'Orden recibida completamente';
  elements.receivePurchaseButton.hidden =
    !['ORDERED', 'PARTIAL'].includes(purchase.status);

  elements.purchaseItemList.replaceChildren();
  for (const item of purchase.items) {
    const card = document.createElement('article');
    card.className = 'purchase-item-card';
    const visual = document.createElement('div');
    visual.className = 'purchase-product-visual';
    if (item.image_url) {
      const image = document.createElement('img');
      image.src = resolvePublicAsset(item.image_url);
      image.alt = item.image_alt || item.product_name;
      visual.append(image);
    } else {
      visual.textContent = item.product_name.slice(0, 1).toLocaleUpperCase('es');
    }
    const identity = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.product_name;
    const sku = document.createElement('small');
    sku.textContent = `${item.sku} · ${formatCurrency(item.unit_cost)} c/u`;
    identity.append(name, sku);
    const quantities = document.createElement('div');
    quantities.className = 'purchase-item-quantities';
    const orderedBlock = document.createElement('span');
    orderedBlock.innerHTML =
      `Pedido <strong>${formatQuantity(item.ordered_quantity)}</strong>`;
    const receivedBlock = document.createElement('span');
    receivedBlock.innerHTML =
      `Recibido <strong>${formatQuantity(item.received_quantity)}</strong>`;
    const pendingBlock = document.createElement('span');
    pendingBlock.innerHTML =
      `Pendiente <strong>${formatQuantity(Number(item.ordered_quantity) - Number(item.received_quantity))}</strong>`;
    quantities.append(orderedBlock, receivedBlock, pendingBlock);
    const amount = document.createElement('strong');
    amount.className = 'purchase-item-amount';
    amount.textContent = formatCurrency(item.line_total);
    card.append(visual, identity, quantities, amount);
    elements.purchaseItemList.append(card);
  }

  elements.purchaseReceiptCount.textContent = String(purchase.receipts.length);
  elements.purchaseReceiptList.replaceChildren();
  if (!purchase.receipts.length) {
    const empty = document.createElement('p');
    empty.className = 'purchase-receipt-empty';
    empty.textContent = 'La mercancía todavía no ha ingresado a una bodega.';
    elements.purchaseReceiptList.append(empty);
  }
  for (const receipt of purchase.receipts) {
    const item = document.createElement('article');
    const symbol = document.createElement('span');
    symbol.textContent = '↓';
    const copy = document.createElement('div');
    const number = document.createElement('strong');
    number.textContent = receipt.receipt_number;
    const meta = document.createElement('small');
    meta.textContent =
      `${receipt.warehouse_name} · ${formatShortDate(receipt.received_at)}`;
    copy.append(number, meta);
    const value = document.createElement('div');
    const units = document.createElement('strong');
    units.textContent = `${formatQuantity(receipt.received_units)} und.`;
    const amount = document.createElement('small');
    amount.textContent = formatCurrency(receipt.received_value);
    value.append(units, amount);
    item.append(symbol, copy, value);
    elements.purchaseReceiptList.append(item);
  }
  renderPurchaseOrders();
}

async function loadPurchaseDetail(purchaseId) {
  try {
    const detail = await getJson(`/api/purchases/${purchaseId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderPurchaseDetail(detail);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadPurchases() {
  if (!activeTenantId) {
    showPurchasesError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  try {
    const [summary, supplierResult, purchaseResult] = await Promise.all([
      getJson('/api/purchases/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/purchases/suppliers', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/purchases', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    suppliers = supplierResult;
    purchases = purchaseResult;
    setPurchaseSummary(summary);
    renderSuppliers();
    renderPurchaseOrders();
    if (selectedPurchase) {
      const exists = purchases.some((purchase) => purchase.id === selectedPurchase.id);
      if (exists) await loadPurchaseDetail(selectedPurchase.id);
      else {
        selectedPurchase = null;
        elements.purchaseDetailContent.hidden = true;
        elements.purchaseDetailEmpty.hidden = false;
      }
    }
    elements.newPurchaseButton.disabled =
      !suppliers.some((supplier) => supplier.active) ||
      !products.length ||
      !branches.length;
    return purchaseResult;
  } catch (error) {
    showPurchasesError(error.message);
    throw error;
  }
}

function showPurchasePanel(panelName) {
  document.querySelectorAll('[data-purchase-tab]').forEach((button) => {
    const active = button.dataset.purchaseTab === panelName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-purchase-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.purchasePanel !== panelName;
  });
}

function openSupplierDialog() {
  elements.supplierForm.reset();
  elements.supplierFormError.hidden = true;
  elements.supplierDialog.showModal();
  elements.supplierForm.elements.name.focus();
}

function closeSupplierDialog() {
  elements.supplierDialog.close();
}

async function submitSupplier(event) {
  event.preventDefault();
  const formData = new FormData(elements.supplierForm);
  const payload = Object.fromEntries(formData);
  payload.obligatedToInvoice = formData.has('obligatedToInvoice');
  payload.electronicInvoicer = formData.has('electronicInvoicer');
  elements.supplierFormError.hidden = true;
  elements.saveSupplierButton.disabled = true;
  elements.saveSupplierButton.textContent = 'Registrando…';
  try {
    await getJson('/api/purchases/suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    closeSupplierDialog();
    await loadPurchases();
    showPurchasePanel('suppliers');
    showToast('Proveedor agregado al directorio.');
  } catch (error) {
    elements.supplierFormError.textContent = error.message;
    elements.supplierFormError.hidden = false;
  } finally {
    elements.saveSupplierButton.disabled = false;
    elements.saveSupplierButton.textContent = 'Registrar proveedor';
  }
}

function updatePurchaseDraftTotal() {
  const total = [...elements.purchaseItemRows.querySelectorAll('.purchase-form-item')]
    .reduce((sum, row) => {
      const quantity = Number(row.querySelector('[data-purchase-item="quantity"]').value) || 0;
      const unitCost = Number(row.querySelector('[data-purchase-item="unitCost"]').value) || 0;
      const taxRate = Number(row.querySelector('[data-purchase-item="taxRate"]').value) || 0;
      return sum + (quantity * unitCost * (1 + taxRate / 100));
    }, 0);
  elements.purchaseDraftTotal.textContent = formatCurrency(total);
}

function addPurchaseItemRow() {
  const fragment = elements.purchaseItemTemplate.content.cloneNode(true);
  const row = fragment.querySelector('.purchase-form-item');
  const select = row.querySelector('[data-purchase-item="productId"]');
  select.append(new Option('Selecciona un producto', ''));
  for (const product of products) {
    select.append(new Option(`${product.name} · ${product.sku}`, product.id));
  }
  select.addEventListener('change', () => {
    const product = products.find((item) => item.id === select.value);
    if (product) {
      row.querySelector('[data-purchase-item="unitCost"]').value =
        Number(product.cost || 0);
      row.querySelector('[data-purchase-item="taxRate"]').value =
        Number(product.tax_rate || 0);
    }
    updatePurchaseDraftTotal();
  });
  row.querySelectorAll('input').forEach((input) =>
    input.addEventListener('input', updatePurchaseDraftTotal));
  row.querySelector('[data-remove-purchase-item]').addEventListener('click', () => {
    if (elements.purchaseItemRows.children.length > 1) row.remove();
    updatePurchaseDraftTotal();
  });
  elements.purchaseItemRows.append(fragment);
}

function openPurchaseDialog() {
  if (!suppliers.some((supplier) => supplier.active)) {
    showToast('Registra un proveedor antes de crear una orden.');
    showPurchasePanel('suppliers');
    return;
  }
  if (!products.length || !branches.length) {
    showToast('Necesitas productos y una sucursal para crear la orden.');
    return;
  }
  elements.purchaseForm.reset();
  elements.purchaseFormError.hidden = true;
  fillInventorySelect(
    elements.purchaseSupplierId,
    'Selecciona un proveedor',
    suppliers.filter((supplier) => supplier.active),
    (supplier) => `${supplier.name}${supplier.tax_id ? ` · ${supplier.tax_id}` : ''}`,
  );
  fillInventorySelect(
    elements.purchaseBranchId,
    'Selecciona una sucursal',
    branches.filter((branch) => branch.active),
    (branch) => `${branch.name} · ${branch.code}`,
  );
  elements.purchaseIssueDate.value = isoDate();
  const expected = new Date();
  expected.setDate(expected.getDate() + 7);
  elements.purchaseExpectedDate.value = expected.toISOString().slice(0, 10);
  elements.purchaseItemRows.replaceChildren();
  addPurchaseItemRow();
  updatePurchaseDraftTotal();
  elements.purchaseDialog.showModal();
  elements.purchaseSupplierId.focus();
}

function closePurchaseDialog() {
  elements.purchaseDialog.close();
}

function collectPurchaseItems() {
  return [...elements.purchaseItemRows.querySelectorAll('.purchase-form-item')]
    .map((row) => ({
      productId: row.querySelector('[data-purchase-item="productId"]').value,
      quantity: row.querySelector('[data-purchase-item="quantity"]').value,
      unitCost: row.querySelector('[data-purchase-item="unitCost"]').value,
      taxRate: row.querySelector('[data-purchase-item="taxRate"]').value,
    }));
}

async function submitPurchase(event) {
  event.preventDefault();
  const formData = new FormData(elements.purchaseForm);
  elements.purchaseFormError.hidden = true;
  elements.savePurchaseButton.disabled = true;
  elements.savePurchaseButton.textContent = 'Emitiendo orden…';
  try {
    const purchase = await getJson('/api/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        ...Object.fromEntries(formData),
        items: collectPurchaseItems(),
      }),
    });
    closePurchaseDialog();
    await loadPurchases();
    await loadPurchaseDetail(purchase.id);
    showPurchasePanel('orders');
    showToast(`${purchase.order_number} emitida correctamente.`);
  } catch (error) {
    elements.purchaseFormError.textContent = error.message;
    elements.purchaseFormError.hidden = false;
  } finally {
    elements.savePurchaseButton.disabled = false;
    elements.savePurchaseButton.textContent = 'Emitir orden de compra';
  }
}

function openReceiptPurchaseDialog() {
  if (!selectedPurchase) return;
  elements.receiptPurchaseForm.reset();
  elements.receiptPurchaseFormError.hidden = true;
  elements.receiptPurchaseNumber.textContent = selectedPurchase.order_number;
  const eligibleWarehouses = warehouses.filter((warehouse) =>
    warehouse.active && warehouse.branch_id === selectedPurchase.branch_id);
  fillInventorySelect(
    elements.receiptWarehouseId,
    'Selecciona una bodega',
    eligibleWarehouses,
    (warehouse) => `${warehouse.name} · ${warehouse.code}`,
  );
  elements.receiptPurchaseItems.replaceChildren();
  for (const item of selectedPurchase.items) {
    const pending =
      Number(item.ordered_quantity) - Number(item.received_quantity);
    if (pending <= 0) continue;
    const row = document.createElement('label');
    row.className = 'receipt-purchase-row';
    const identity = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = item.product_name;
    const meta = document.createElement('small');
    meta.textContent = `${item.sku} · máximo ${formatQuantity(pending)}`;
    identity.append(name, meta);
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(pending);
    input.step = '0.0001';
    input.value = String(pending);
    input.dataset.purchaseItemId = item.id;
    input.setAttribute('aria-label', `Cantidad recibida de ${item.product_name}`);
    row.append(identity, input);
    elements.receiptPurchaseItems.append(row);
  }
  elements.receiptPurchaseDialog.showModal();
  elements.receiptWarehouseId.focus();
}

function closeReceiptPurchaseDialog() {
  elements.receiptPurchaseDialog.close();
}

async function submitPurchaseReceipt(event) {
  event.preventDefault();
  const formData = new FormData(elements.receiptPurchaseForm);
  const items = [...elements.receiptPurchaseItems.querySelectorAll('input')]
    .map((input) => ({
      purchaseItemId: input.dataset.purchaseItemId,
      quantity: Number(input.value),
    }))
    .filter((item) => item.quantity > 0);
  if (!items.length) {
    elements.receiptPurchaseFormError.textContent =
      'Indica al menos una cantidad recibida.';
    elements.receiptPurchaseFormError.hidden = false;
    return;
  }
  elements.receiptPurchaseFormError.hidden = true;
  elements.saveReceiptPurchaseButton.disabled = true;
  elements.saveReceiptPurchaseButton.textContent = 'Actualizando inventario…';
  try {
    const purchaseId = selectedPurchase.id;
    await getJson(`/api/purchases/${purchaseId}/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        warehouseId: formData.get('warehouseId'),
        notes: formData.get('notes'),
        items,
      }),
    });
    closeReceiptPurchaseDialog();
    await Promise.all([
      loadPurchases(),
      loadInventory(),
      loadCatalog(),
    ]);
    await loadPurchaseDetail(purchaseId);
    showToast('Mercancía recibida e inventario actualizado.');
  } catch (error) {
    elements.receiptPurchaseFormError.textContent = error.message;
    elements.receiptPurchaseFormError.hidden = false;
  } finally {
    elements.saveReceiptPurchaseButton.disabled = false;
    elements.saveReceiptPurchaseButton.textContent = 'Confirmar entrada a inventario';
  }
}

const inventoryMovementLabels = {
  PURCHASE: 'Entrada por compra',
  RETURN_IN: 'Devolución recibida',
  SALE: 'Salida por venta',
  TRANSFER_IN: 'Transferencia recibida',
  TRANSFER_OUT: 'Transferencia enviada',
  ADJUSTMENT_IN: 'Ajuste de entrada',
  ADJUSTMENT_OUT: 'Ajuste de salida',
  COUNT_ADJUSTMENT: 'Ajuste por conteo',
};

function formatQuantity(value, { sign = false } = {}) {
  return Number(value || 0).toLocaleString('es-CO', {
    maximumFractionDigits: 4,
    signDisplay: sign ? 'always' : 'auto',
  });
}

function setInventorySummary(summary = {}) {
  inventorySummary = summary;
  elements.inventoryValue.textContent = formatCurrency(summary.inventory_value || 0);
  elements.inventoryStockedProducts.textContent =
    `${summary.stocked_products || 0} productos con saldo`;
  elements.inventoryAvailableUnits.textContent =
    formatQuantity(summary.available_units || 0);
  elements.inventoryReservedUnits.textContent =
    `${formatQuantity(summary.reserved_units || 0)} reservadas`;
  elements.inventoryLowStock.textContent = String(summary.low_stock_balances || 0);
  elements.inventoryMovementsMonth.textContent = String(summary.movements_month || 0);
}

function showInventoryError(message) {
  inventoryBalances = [];
  inventoryMovements = [];
  setInventorySummary();
  elements.inventoryBalanceList.replaceChildren();
  elements.inventoryMovementList.replaceChildren();
  elements.inventoryDataState.hidden = false;
  elements.inventoryDataState.classList.add('error');
  elements.inventoryDataState.querySelector('strong').textContent =
    'No pudimos consultar el inventario';
  elements.inventoryDataState.querySelector('p').textContent = message;
  elements.inventoryMovementState.hidden = false;
  elements.inventoryBalanceCount.textContent = '—';
  elements.inventoryMovementCount.textContent = '—';
}

function renderInventoryBalances() {
  const query = normalizeSearch(elements.inventorySearch.value.trim());
  const warehouseId = elements.inventoryWarehouseFilter.value;
  const filtered = inventoryBalances.filter((balance) => {
    const matchesWarehouse = !warehouseId || balance.warehouse_id === warehouseId;
    const matchesSearch = !query || normalizeSearch([
      balance.name,
      balance.sku,
      balance.category_name,
      balance.brand_name,
      balance.warehouse_name,
      balance.branch_name,
    ].filter(Boolean).join(' ')).includes(query);
    return matchesWarehouse && matchesSearch;
  });
  elements.inventoryBalanceList.replaceChildren();
  elements.inventoryBalanceCount.textContent =
    `${filtered.length} ${filtered.length === 1 ? 'saldo' : 'saldos'}`;
  elements.inventoryDataState.hidden = filtered.length > 0;
  elements.inventoryDataState.classList.remove('error');
  if (!filtered.length) {
    elements.inventoryDataState.querySelector('strong').textContent =
      query || warehouseId ? 'No hay coincidencias' : 'Aún no hay existencias';
    elements.inventoryDataState.querySelector('p').textContent =
      query || warehouseId
        ? 'Cambia la búsqueda o consulta todas las bodegas.'
        : 'Registra una compra, ajuste autorizado o transferencia para iniciar.';
    return;
  }

  for (const balance of filtered) {
    const card = document.createElement('article');
    card.className = 'inventory-balance-card';
    const available = Number(balance.available);
    if (available <= 5 && Number(balance.on_hand) > 0) card.classList.add('low-stock');

    const visual = document.createElement('div');
    visual.className = 'inventory-product-visual';
    if (balance.image_url) {
      const image = document.createElement('img');
      image.src = resolvePublicAsset(balance.image_url);
      image.alt = balance.image_alt || balance.name;
      visual.append(image);
    } else {
      visual.textContent = balance.name.slice(0, 1).toLocaleUpperCase('es');
    }

    const identity = document.createElement('div');
    identity.className = 'inventory-product-identity';
    const name = document.createElement('strong');
    name.textContent = balance.name;
    const meta = document.createElement('small');
    meta.textContent = `${balance.sku} · ${balance.warehouse_name}`;
    const branch = document.createElement('span');
    branch.textContent = balance.branch_name;
    identity.append(name, meta, branch);

    const quantities = document.createElement('div');
    quantities.className = 'inventory-quantity-block';
    const onHand = document.createElement('div');
    onHand.innerHTML =
      `<span>Existencia</span><strong>${formatQuantity(balance.on_hand)}</strong>`;
    const availableBlock = document.createElement('div');
    availableBlock.innerHTML =
      `<span>Disponible</span><strong>${formatQuantity(balance.available)}</strong>`;
    quantities.append(onHand, availableBlock);

    const value = document.createElement('div');
    value.className = 'inventory-stock-value';
    const valueLabel = document.createElement('span');
    valueLabel.textContent = 'Valor al costo';
    const valueAmount = document.createElement('strong');
    valueAmount.textContent = formatCurrency(balance.stock_value);
    value.append(valueLabel, valueAmount);

    const adjust = document.createElement('button');
    adjust.type = 'button';
    adjust.className = 'inventory-row-action';
    adjust.textContent = 'Ajustar';
    adjust.addEventListener('click', () => openAdjustmentDialog(balance));
    card.append(visual, identity, quantities, value, adjust);
    elements.inventoryBalanceList.append(card);
  }
}

function renderInventoryMovements() {
  elements.inventoryMovementList.replaceChildren();
  elements.inventoryMovementCount.textContent = String(inventoryMovements.length);
  elements.inventoryMovementState.hidden = inventoryMovements.length > 0;
  for (const movement of inventoryMovements) {
    const item = document.createElement('article');
    item.className = 'inventory-movement-item';
    const quantity = Number(movement.quantity);
    item.classList.add(quantity > 0 ? 'incoming' : 'outgoing');
    const symbol = document.createElement('span');
    symbol.className = 'inventory-movement-symbol';
    symbol.textContent = quantity > 0 ? '↘' : '↗';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent =
      inventoryMovementLabels[movement.movement_type] || movement.movement_type;
    const product = document.createElement('span');
    product.textContent = movement.product_name;
    const meta = document.createElement('small');
    meta.textContent =
      `${movement.warehouse_name} · ${formatShortDate(movement.created_at)}`;
    copy.append(title, product, meta);
    const movementQuantity = document.createElement('strong');
    movementQuantity.className = 'inventory-movement-quantity';
    movementQuantity.textContent = formatQuantity(quantity, { sign: true });
    item.title = movement.reason;
    item.append(symbol, copy, movementQuantity);
    elements.inventoryMovementList.append(item);
  }
}

function syncInventoryWarehouseFilter() {
  const selected = elements.inventoryWarehouseFilter.value;
  elements.inventoryWarehouseFilter.replaceChildren(new Option('Todas las bodegas', ''));
  for (const warehouse of warehouses.filter((item) => item.active)) {
    elements.inventoryWarehouseFilter.append(
      new Option(`${warehouse.name} · ${warehouse.code}`, warehouse.id),
    );
  }
  if (warehouses.some((warehouse) => warehouse.id === selected)) {
    elements.inventoryWarehouseFilter.value = selected;
  }
}

async function loadInventory() {
  if (!activeTenantId) {
    showInventoryError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  try {
    const [summary, balances, movements] = await Promise.all([
      getJson('/api/inventory/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/inventory/balances', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/inventory/movements?limit=40', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    inventoryBalances = balances;
    inventoryMovements = movements;
    setInventorySummary(summary);
    syncInventoryWarehouseFilter();
    renderInventoryBalances();
    renderInventoryMovements();
    return balances;
  } catch (error) {
    showInventoryError(error.message);
    throw error;
  }
}

function fillInventorySelect(select, placeholder, records, label, value = '') {
  select.replaceChildren(new Option(placeholder, ''));
  for (const record of records) {
    select.append(new Option(label(record), record.id));
  }
  if (records.some((record) => record.id === value)) select.value = value;
}

function openAdjustmentDialog(balance = null) {
  if (!products.length || !warehouses.length) {
    showToast('Necesitas productos y bodegas para registrar un ajuste.');
    return;
  }
  elements.adjustmentForm.reset();
  elements.adjustmentFormError.hidden = true;
  fillInventorySelect(
    elements.adjustmentProductId,
    'Selecciona un producto',
    products,
    (product) => `${product.name} · ${product.sku}`,
    balance?.product_id,
  );
  fillInventorySelect(
    elements.adjustmentWarehouseId,
    'Selecciona una bodega',
    warehouses.filter((warehouse) => warehouse.active),
    (warehouse) => `${warehouse.name} · ${warehouse.code}`,
    balance?.warehouse_id,
  );
  elements.adjustmentDialog.showModal();
  (balance ? elements.adjustmentForm.elements.quantity : elements.adjustmentProductId).focus();
}

function closeAdjustmentDialog() {
  elements.adjustmentDialog.close();
}

async function submitAdjustment(event) {
  event.preventDefault();
  const formData = new FormData(elements.adjustmentForm);
  const quantity = Number(formData.get('quantity'));
  const signedQuantity = formData.get('direction') === 'OUT' ? -quantity : quantity;
  elements.adjustmentFormError.hidden = true;
  elements.saveAdjustmentButton.disabled = true;
  elements.saveAdjustmentButton.textContent = 'Registrando…';
  try {
    await getJson('/api/inventory/adjustments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        productId: formData.get('productId'),
        warehouseId: formData.get('warehouseId'),
        quantity: signedQuantity,
        reason: formData.get('reason'),
      }),
    });
    closeAdjustmentDialog();
    await Promise.all([loadInventory(), loadPosCatalog().catch(() => [])]);
    showToast('Ajuste registrado con trazabilidad.');
  } catch (error) {
    elements.adjustmentFormError.textContent = error.message;
    elements.adjustmentFormError.hidden = false;
  } finally {
    elements.saveAdjustmentButton.disabled = false;
    elements.saveAdjustmentButton.textContent = 'Registrar ajuste';
  }
}

function transferProducts() {
  const unique = new Map();
  for (const balance of inventoryBalances) {
    if (Number(balance.available) > 0 && !unique.has(balance.product_id)) {
      unique.set(balance.product_id, {
        id: balance.product_id,
        name: balance.name,
        sku: balance.sku,
      });
    }
  }
  return [...unique.values()];
}

function syncTransferWarehouses() {
  const productId = elements.transferProductId.value;
  const sources = inventoryBalances
    .filter((balance) => balance.product_id === productId && Number(balance.available) > 0)
    .map((balance) => ({
      id: balance.warehouse_id,
      name: balance.warehouse_name,
      code: balance.warehouse_code,
    }));
  fillInventorySelect(
    elements.transferSourceWarehouseId,
    'Selecciona origen',
    sources,
    (warehouse) => `${warehouse.name} · ${warehouse.code}`,
  );
  fillInventorySelect(
    elements.transferDestinationWarehouseId,
    'Selecciona destino',
    warehouses.filter((warehouse) => warehouse.active),
    (warehouse) => `${warehouse.name} · ${warehouse.code}`,
  );
  updateTransferAvailability();
}

function updateTransferAvailability() {
  const balance = inventoryBalances.find((item) =>
    item.product_id === elements.transferProductId.value &&
    item.warehouse_id === elements.transferSourceWarehouseId.value);
  elements.transferAvailability.querySelector('strong').textContent =
    balance ? `${formatQuantity(balance.available)} unidades` : '—';
  for (const option of elements.transferDestinationWarehouseId.options) {
    option.disabled =
      Boolean(option.value) && option.value === elements.transferSourceWarehouseId.value;
  }
  if (elements.transferDestinationWarehouseId.selectedOptions[0]?.disabled) {
    elements.transferDestinationWarehouseId.value = '';
  }
}

function openTransferDialog() {
  const transferable = transferProducts();
  if (!transferable.length || warehouses.filter((warehouse) => warehouse.active).length < 2) {
    showToast('Necesitas existencias disponibles y al menos dos bodegas activas.');
    return;
  }
  elements.transferForm.reset();
  elements.transferFormError.hidden = true;
  fillInventorySelect(
    elements.transferProductId,
    'Selecciona un producto',
    transferable,
    (product) => `${product.name} · ${product.sku}`,
  );
  syncTransferWarehouses();
  elements.transferDialog.showModal();
  elements.transferProductId.focus();
}

function closeTransferDialog() {
  elements.transferDialog.close();
}

async function submitTransfer(event) {
  event.preventDefault();
  const formData = new FormData(elements.transferForm);
  elements.transferFormError.hidden = true;
  elements.saveTransferButton.disabled = true;
  elements.saveTransferButton.textContent = 'Trasladando…';
  try {
    await getJson('/api/inventory/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    closeTransferDialog();
    await Promise.all([loadInventory(), loadPosCatalog().catch(() => [])]);
    showToast('Transferencia completada en ambas bodegas.');
  } catch (error) {
    elements.transferFormError.textContent = error.message;
    elements.transferFormError.hidden = false;
  } finally {
    elements.saveTransferButton.disabled = false;
    elements.saveTransferButton.textContent = 'Confirmar traslado';
  }
}

function selectInventoryPanel(panelName) {
  document.querySelectorAll('[data-inventory-tab]').forEach((button) => {
    const selected = button.dataset.inventoryTab === panelName;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('[data-inventory-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.inventoryPanel !== panelName;
  });
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
  elements.inventoryActiveCountBadge.textContent = String(summary.active_counts || 0);
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
      image.src = resolvePublicAsset(item.image_url);
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
    showInventoryError('Primero debes registrar o seleccionar una empresa.');
    showCountsError('Primero debes registrar o seleccionar una empresa.');
    showCatalogError('Primero debes registrar o seleccionar una empresa.');
    showPurchasesError('Primero debes registrar o seleccionar una empresa.');
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
    loadInventory(),
    loadPhysicalCounts(),
    loadCatalog(),
    loadPurchases(),
    loadPos(),
    loadReceivables(),
  ]);
  syncInventoryWarehouseFilter();
  renderInventoryBalances();
  elements.newPurchaseButton.disabled =
    !suppliers.some((supplier) => supplier.active) ||
    !products.length ||
    !branches.length;
  await syncPosWorkstation().catch(() => {});
  setMetric(elements.branchCount, elements.branchDetail, results[0], ['sucursal', 'sucursales']);
  setMetric(elements.warehouseCount, elements.warehouseDetail, results[1], ['bodega registrada', 'bodegas registradas']);
  setMetric(elements.productCount, elements.productDetail, results[4], ['producto registrado', 'productos registrados']);
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
  'inventario',
  'productos',
  'compras',
  'caja',
  'cartera',
  'modulos',
  'sistema',
]);

const viewAliases = {
  resumen: 'inicio',
  catalogos: 'productos',
  conteos: 'inventario',
};

const viewTitles = {
  inicio: 'Dashboard',
  empresas: 'Empresas',
  sucursales: 'Sucursales',
  bodegas: 'Bodegas',
  inventario: 'Inventario',
  productos: 'Catálogo',
  compras: 'Compras',
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
  if (view === 'inventario') {
    selectInventoryPanel(requestedView === 'conteos' ? 'counts' : 'stock');
  }
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
  selectedPurchase = null;
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
elements.reloadInventoryButton.addEventListener('click', () => {
  loadInventory()
    .then(() => showToast('Inventario sincronizado.'))
    .catch(() => showToast('No fue posible sincronizar el inventario.'));
});
elements.inventorySearch.addEventListener('input', renderInventoryBalances);
elements.inventoryWarehouseFilter.addEventListener('change', renderInventoryBalances);
document.querySelectorAll('[data-inventory-tab]').forEach((button) => {
  button.addEventListener('click', () => selectInventoryPanel(button.dataset.inventoryTab));
});
elements.openCountsPanelButton.addEventListener('click', () => {
  selectInventoryPanel('counts');
  elements.newCountButton.focus();
});
elements.newAdjustmentButton.addEventListener('click', () => openAdjustmentDialog());
elements.closeAdjustmentDialog.addEventListener('click', closeAdjustmentDialog);
elements.cancelAdjustmentButton.addEventListener('click', closeAdjustmentDialog);
elements.adjustmentForm.addEventListener('submit', submitAdjustment);
elements.adjustmentDialog.addEventListener('click', (event) => {
  if (event.target === elements.adjustmentDialog) closeAdjustmentDialog();
});
elements.newTransferButton.addEventListener('click', openTransferDialog);
elements.closeTransferDialog.addEventListener('click', closeTransferDialog);
elements.cancelTransferButton.addEventListener('click', closeTransferDialog);
elements.transferForm.addEventListener('submit', submitTransfer);
elements.transferProductId.addEventListener('change', syncTransferWarehouses);
elements.transferSourceWarehouseId.addEventListener('change', updateTransferAvailability);
elements.transferDialog.addEventListener('click', (event) => {
  if (event.target === elements.transferDialog) closeTransferDialog();
});
elements.reloadPurchasesButton.addEventListener('click', () => {
  loadPurchases()
    .then(() => showToast('Compras actualizadas.'))
    .catch(() => showToast('No fue posible actualizar las compras.'));
});
elements.purchaseSearch.addEventListener('input', renderPurchaseOrders);
document.querySelectorAll('[data-purchase-tab]').forEach((button) => {
  button.addEventListener('click', () => showPurchasePanel(button.dataset.purchaseTab));
});
elements.newSupplierButton.addEventListener('click', openSupplierDialog);
elements.supplierPanelCreateButton.addEventListener('click', openSupplierDialog);
elements.closeSupplierDialog.addEventListener('click', closeSupplierDialog);
elements.cancelSupplierButton.addEventListener('click', closeSupplierDialog);
elements.supplierForm.addEventListener('submit', submitSupplier);
elements.supplierDialog.addEventListener('click', (event) => {
  if (event.target === elements.supplierDialog) closeSupplierDialog();
});
elements.newPurchaseButton.addEventListener('click', openPurchaseDialog);
elements.addPurchaseItemButton.addEventListener('click', addPurchaseItemRow);
elements.closePurchaseDialog.addEventListener('click', closePurchaseDialog);
elements.cancelPurchaseButton.addEventListener('click', closePurchaseDialog);
elements.purchaseForm.addEventListener('submit', submitPurchase);
elements.purchaseDialog.addEventListener('click', (event) => {
  if (event.target === elements.purchaseDialog) closePurchaseDialog();
});
elements.receivePurchaseButton.addEventListener('click', openReceiptPurchaseDialog);
elements.closeReceiptPurchaseDialog.addEventListener('click', closeReceiptPurchaseDialog);
elements.cancelReceiptPurchaseButton.addEventListener('click', closeReceiptPurchaseDialog);
elements.receiptPurchaseForm.addEventListener('submit', submitPurchaseReceipt);
elements.receiptPurchaseDialog.addEventListener('click', (event) => {
  if (event.target === elements.receiptPurchaseDialog) closeReceiptPurchaseDialog();
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
window.addEventListener('hashchange', () => {
  showView(window.location.hash.replace(/^#/, '') || 'inicio');
});

showView(window.location.hash.replace(/^#/, '') || 'inicio', { scroll: false });

refreshStatus().catch(() => {
  elements.refreshButton.classList.remove('loading');
  elements.refreshButton.disabled = false;
  elements.overallIndicator.classList.add('error');
  elements.overallLabel.textContent = 'Sin conexión';
  setServiceState(elements.apiDot, elements.apiResult, 'error', 'Sin respuesta');
});
