if (window.location.protocol === 'file:') {
  window.location.replace(
    `http://localhost:4100/${window.location.search}${window.location.hash}`,
  );
}

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:4100' : '';

function resolvePublicAsset(path) {
  if (!path || window.location.protocol !== 'file:' || !path.startsWith('/')) return path;
  return `${API_BASE_URL}${path}`;
}

const elements = {
  authGate: document.querySelector('#authGate'),
  appShell: document.querySelector('#appShell'),
  authLoading: document.querySelector('#authLoading'),
  setupAccessPanel: document.querySelector('#setupAccessPanel'),
  setupAccessForm: document.querySelector('#setupAccessForm'),
  setupAccessError: document.querySelector('#setupAccessError'),
  setupAccessButton: document.querySelector('#setupAccessButton'),
  setupEmail: document.querySelector('#setupEmail'),
  loginAccessPanel: document.querySelector('#loginAccessPanel'),
  loginAccessForm: document.querySelector('#loginAccessForm'),
  loginAccessError: document.querySelector('#loginAccessError'),
  loginAccessButton: document.querySelector('#loginAccessButton'),
  loginEmail: document.querySelector('#loginEmail'),
  activateAccessPanel: document.querySelector('#activateAccessPanel'),
  activateAccessForm: document.querySelector('#activateAccessForm'),
  activateAccessError: document.querySelector('#activateAccessError'),
  activateAccessButton: document.querySelector('#activateAccessButton'),
  accountTrigger: document.querySelector('#accountTrigger'),
  accountMenu: document.querySelector('#accountMenu'),
  accountInitials: document.querySelector('#accountInitials'),
  accountName: document.querySelector('#accountName'),
  accountRole: document.querySelector('#accountRole'),
  accountMenuName: document.querySelector('#accountMenuName'),
  accountMenuEmail: document.querySelector('#accountMenuEmail'),
  logoutButton: document.querySelector('#logoutButton'),
  activationLinkDialog: document.querySelector('#activationLinkDialog'),
  activationLinkValue: document.querySelector('#activationLinkValue'),
  closeActivationLinkDialog: document.querySelector('#closeActivationLinkDialog'),
  finishActivationLinkButton: document.querySelector('#finishActivationLinkButton'),
  copyActivationLinkButton: document.querySelector('#copyActivationLinkButton'),
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
  dashboardReceivable: document.querySelector('#dashboardReceivable'),
  dashboardPayable: document.querySelector('#dashboardPayable'),
  dashboardInventoryValue: document.querySelector('#dashboardInventoryValue'),
  dashboardOpenPurchases: document.querySelector('#dashboardOpenPurchases'),
  dashboardSalesToday: document.querySelector('#dashboardSalesToday'),
  dashboardSalesMonth: document.querySelector('#dashboardSalesMonth'),
  dashboardGrossMargin: document.querySelector('#dashboardGrossMargin'),
  dashboardLowStock: document.querySelector('#dashboardLowStock'),
  dashboardPendingPurchases: document.querySelector('#dashboardPendingPurchases'),
  dashboardCashProjection: document.querySelector('#dashboardCashProjection'),
  dashboardCashProjectionDetail: document.querySelector('#dashboardCashProjectionDetail'),
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
  newTaxButton: document.querySelector('#newTaxButton'),
  newProductButton: document.querySelector('#newProductButton'),
  categoryCount: document.querySelector('#categoryCount'),
  brandCount: document.querySelector('#brandCount'),
  taxCount: document.querySelector('#taxCount'),
  categoryList: document.querySelector('#categoryList'),
  brandList: document.querySelector('#brandList'),
  taxList: document.querySelector('#taxList'),
  categoryPanelCreateButton: document.querySelector('#categoryPanelCreateButton'),
  brandPanelCreateButton: document.querySelector('#brandPanelCreateButton'),
  taxPanelCreateButton: document.querySelector('#taxPanelCreateButton'),
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
  taxDialog: document.querySelector('#taxDialog'),
  taxForm: document.querySelector('#taxForm'),
  taxFormError: document.querySelector('#taxFormError'),
  taxTreatment: document.querySelector('#taxTreatment'),
  taxRate: document.querySelector('#taxRate'),
  closeTaxDialog: document.querySelector('#closeTaxDialog'),
  cancelTaxButton: document.querySelector('#cancelTaxButton'),
  saveTaxButton: document.querySelector('#saveTaxButton'),
  productTaxDialog: document.querySelector('#productTaxDialog'),
  productTaxForm: document.querySelector('#productTaxForm'),
  productTaxFormError: document.querySelector('#productTaxFormError'),
  assignedProductTaxId: document.querySelector('#assignedProductTaxId'),
  taxProductName: document.querySelector('#taxProductName'),
  closeProductTaxDialog: document.querySelector('#closeProductTaxDialog'),
  cancelProductTaxButton: document.querySelector('#cancelProductTaxButton'),
  saveProductTaxButton: document.querySelector('#saveProductTaxButton'),
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
  cashExpectedAmount: document.querySelector('#cashExpectedAmount'),
  cashGuidance: document.querySelector('#cashGuidance'),
  openCashButton: document.querySelector('#openCashButton'),
  closeCashButton: document.querySelector('#closeCashButton'),
  newCashMovementButton: document.querySelector('#newCashMovementButton'),
  reloadCashControlButton: document.querySelector('#reloadCashControlButton'),
  cashSalesAmount: document.querySelector('#cashSalesAmount'),
  cashManualIncome: document.querySelector('#cashManualIncome'),
  cashOutflows: document.querySelector('#cashOutflows'),
  cashControlExpected: document.querySelector('#cashControlExpected'),
  cashMovementCount: document.querySelector('#cashMovementCount'),
  cashMovementList: document.querySelector('#cashMovementList'),
  cashMovementState: document.querySelector('#cashMovementState'),
  cashSessionCount: document.querySelector('#cashSessionCount'),
  cashSessionList: document.querySelector('#cashSessionList'),
  cashSessionState: document.querySelector('#cashSessionState'),
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
  cashCloseExpected: document.querySelector('#cashCloseExpected'),
  cashCloseCounted: document.querySelector('#cashCloseCounted'),
  cashCloseDifference: document.querySelector('#cashCloseDifference'),
  cashDenominationGrid: document.querySelector('#cashDenominationGrid'),
  closeCloseCashDialog: document.querySelector('#closeCloseCashDialog'),
  cancelCloseCashButton: document.querySelector('#cancelCloseCashButton'),
  saveCloseCashButton: document.querySelector('#saveCloseCashButton'),
  cashMovementDialog: document.querySelector('#cashMovementDialog'),
  cashMovementForm: document.querySelector('#cashMovementForm'),
  cashMovementFormError: document.querySelector('#cashMovementFormError'),
  closeCashMovementDialog: document.querySelector('#closeCashMovementDialog'),
  cancelCashMovementButton: document.querySelector('#cancelCashMovementButton'),
  saveCashMovementButton: document.querySelector('#saveCashMovementButton'),
  posWarehouseSelect: document.querySelector('#posWarehouseSelect'),
  openSalesHistoryButton: document.querySelector('#openSalesHistoryButton'),
  posSaleHistoryCount: document.querySelector('#posSaleHistoryCount'),
  posProductSearch: document.querySelector('#posProductSearch'),
  posCategoryStrip: document.querySelector('#posCategoryStrip'),
  posProductGrid: document.querySelector('#posProductGrid'),
  posCatalogState: document.querySelector('#posCatalogState'),
  cartItems: document.querySelector('#cartItems'),
  cartEmpty: document.querySelector('#cartEmpty'),
  cartItemCount: document.querySelector('#cartItemCount'),
  cartSubtotal: document.querySelector('#cartSubtotal'),
  cartTax: document.querySelector('#cartTax'),
  cartTotal: document.querySelector('#cartTotal'),
  clearCartButton: document.querySelector('#clearCartButton'),
  posCustomerSelect: document.querySelector('#posCustomerSelect'),
  posCustomerBalance: document.querySelector('#posCustomerBalance'),
  posNewCustomerButton: document.querySelector('#posNewCustomerButton'),
  posSaleTermButtons: document.querySelectorAll('[data-sale-terms]'),
  posCreditTerms: document.querySelector('#posCreditTerms'),
  posCreditDueDate: document.querySelector('#posCreditDueDate'),
  posPaymentPanel: document.querySelector('#posPaymentPanel'),
  posPaymentMethod: document.querySelector('#posPaymentMethod'),
  posPaymentButtons: document.querySelectorAll('[data-payment-method]'),
  posCashTender: document.querySelector('#posCashTender'),
  posCashReceived: document.querySelector('#posCashReceived'),
  cashTenderSuggestions: document.querySelector('#cashTenderSuggestions'),
  posCashChange: document.querySelector('#posCashChange'),
  posSaleError: document.querySelector('#posSaleError'),
  completeSaleButton: document.querySelector('#completeSaleButton'),
  posSaleLock: document.querySelector('#posSaleLock'),
  salesHistoryDialog: document.querySelector('#salesHistoryDialog'),
  closeSalesHistoryDialog: document.querySelector('#closeSalesHistoryDialog'),
  finishSalesHistoryButton: document.querySelector('#finishSalesHistoryButton'),
  posSalesHistoryList: document.querySelector('#posSalesHistoryList'),
  posSalesHistoryEmpty: document.querySelector('#posSalesHistoryEmpty'),
  receiptDialog: document.querySelector('#receiptDialog'),
  receiptNumber: document.querySelector('#receiptNumber'),
  receiptLines: document.querySelector('#receiptLines'),
  receiptSubtotal: document.querySelector('#receiptSubtotal'),
  receiptTax: document.querySelector('#receiptTax'),
  receiptTotal: document.querySelector('#receiptTotal'),
  receiptCustomer: document.querySelector('#receiptCustomer'),
  receiptPaymentMethod: document.querySelector('#receiptPaymentMethod'),
  receiptCreditRow: document.querySelector('#receiptCreditRow'),
  receiptCreditReference: document.querySelector('#receiptCreditReference'),
  receiptCashReceivedRow: document.querySelector('#receiptCashReceivedRow'),
  receiptCashReceived: document.querySelector('#receiptCashReceived'),
  receiptCashChangeRow: document.querySelector('#receiptCashChangeRow'),
  receiptCashChange: document.querySelector('#receiptCashChange'),
  closeReceiptDialog: document.querySelector('#closeReceiptDialog'),
  printReceiptButton: document.querySelector('#printReceiptButton'),
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
  apOutstanding: document.querySelector('#apOutstanding'),
  apOpenCount: document.querySelector('#apOpenCount'),
  apCurrent: document.querySelector('#apCurrent'),
  apOverdue30: document.querySelector('#apOverdue30'),
  apOverdue60: document.querySelector('#apOverdue60'),
  apOverdue61: document.querySelector('#apOverdue61'),
  apPaidMonth: document.querySelector('#apPaidMonth'),
  payableSearch: document.querySelector('#payableSearch'),
  payableStatusFilter: document.querySelector('#payableStatusFilter'),
  reloadPayablesButton: document.querySelector('#reloadPayablesButton'),
  payableRecordCount: document.querySelector('#payableRecordCount'),
  payableList: document.querySelector('#payableList'),
  payableDataState: document.querySelector('#payableDataState'),
  payableDetailEmpty: document.querySelector('#payableDetailEmpty'),
  payableDetailContent: document.querySelector('#payableDetailContent'),
  payableDetailNumber: document.querySelector('#payableDetailNumber'),
  payableDetailSupplier: document.querySelector('#payableDetailSupplier'),
  payableDetailDocument: document.querySelector('#payableDetailDocument'),
  payableDetailStatus: document.querySelector('#payableDetailStatus'),
  payableDetailIssue: document.querySelector('#payableDetailIssue'),
  payableDetailDue: document.querySelector('#payableDetailDue'),
  payableDetailTotal: document.querySelector('#payableDetailTotal'),
  payableDetailBalance: document.querySelector('#payableDetailBalance'),
  payableDetailOrigin: document.querySelector('#payableDetailOrigin'),
  payableDetailExternal: document.querySelector('#payableDetailExternal'),
  payablePaymentCount: document.querySelector('#payablePaymentCount'),
  payablePaymentList: document.querySelector('#payablePaymentList'),
  newPayableButton: document.querySelector('#newPayableButton'),
  newPayablePaymentButton: document.querySelector('#newPayablePaymentButton'),
  payableDialog: document.querySelector('#payableDialog'),
  payableForm: document.querySelector('#payableForm'),
  payableFormError: document.querySelector('#payableFormError'),
  payableSourceType: document.querySelector('#payableSourceType'),
  payablePurchaseFields: document.querySelector('#payablePurchaseFields'),
  payablePurchaseId: document.querySelector('#payablePurchaseId'),
  payableSourcePreview: document.querySelector('#payableSourcePreview'),
  payableManualFields: document.querySelector('#payableManualFields'),
  payableSupplierId: document.querySelector('#payableSupplierId'),
  payableSubtotal: document.querySelector('#payableSubtotal'),
  payableTaxTotal: document.querySelector('#payableTaxTotal'),
  payableIssueDate: document.querySelector('#payableIssueDate'),
  payableDueDate: document.querySelector('#payableDueDate'),
  closePayableDialog: document.querySelector('#closePayableDialog'),
  cancelPayableButton: document.querySelector('#cancelPayableButton'),
  savePayableButton: document.querySelector('#savePayableButton'),
  payablePaymentDialog: document.querySelector('#payablePaymentDialog'),
  payablePaymentForm: document.querySelector('#payablePaymentForm'),
  payablePaymentFormError: document.querySelector('#payablePaymentFormError'),
  payablePaymentNumber: document.querySelector('#payablePaymentNumber'),
  payablePaymentBalance: document.querySelector('#payablePaymentBalance'),
  payablePaymentAmount: document.querySelector('#payablePaymentAmount'),
  payablePaymentDate: document.querySelector('#payablePaymentDate'),
  closePayablePaymentDialog: document.querySelector('#closePayablePaymentDialog'),
  cancelPayablePaymentButton: document.querySelector('#cancelPayablePaymentButton'),
  savePayablePaymentButton: document.querySelector('#savePayablePaymentButton'),
  userTotalMembers: document.querySelector('#userTotalMembers'),
  userActiveMembers: document.querySelector('#userActiveMembers'),
  userPendingInvites: document.querySelector('#userPendingInvites'),
  userRolesInUse: document.querySelector('#userRolesInUse'),
  showTeamPanelButton: document.querySelector('#showTeamPanelButton'),
  showRolesPanelButton: document.querySelector('#showRolesPanelButton'),
  teamPanel: document.querySelector('#teamPanel'),
  rolesPanel: document.querySelector('#rolesPanel'),
  userSearch: document.querySelector('#userSearch'),
  userStatusFilter: document.querySelector('#userStatusFilter'),
  reloadUsersButton: document.querySelector('#reloadUsersButton'),
  userRecordCount: document.querySelector('#userRecordCount'),
  userList: document.querySelector('#userList'),
  userDataState: document.querySelector('#userDataState'),
  userDetailEmpty: document.querySelector('#userDetailEmpty'),
  userDetailContent: document.querySelector('#userDetailContent'),
  userDetailAvatar: document.querySelector('#userDetailAvatar'),
  userDetailRole: document.querySelector('#userDetailRole'),
  userDetailName: document.querySelector('#userDetailName'),
  userDetailEmail: document.querySelector('#userDetailEmail'),
  userDetailStatus: document.querySelector('#userDetailStatus'),
  userDetailJob: document.querySelector('#userDetailJob'),
  userDetailBranch: document.querySelector('#userDetailBranch'),
  userDetailJoined: document.querySelector('#userDetailJoined'),
  userDetailLastLogin: document.querySelector('#userDetailLastLogin'),
  userDetailPermissionCount: document.querySelector('#userDetailPermissionCount'),
  userDetailPermissions: document.querySelector('#userDetailPermissions'),
  inviteUserButton: document.querySelector('#inviteUserButton'),
  editUserButton: document.querySelector('#editUserButton'),
  resetUserAccessButton: document.querySelector('#resetUserAccessButton'),
  roleGrid: document.querySelector('#roleGrid'),
  roleDataState: document.querySelector('#roleDataState'),
  newRoleButton: document.querySelector('#newRoleButton'),
  userDialog: document.querySelector('#userDialog'),
  userForm: document.querySelector('#userForm'),
  userDialogEyebrow: document.querySelector('#userDialogEyebrow'),
  userDialogTitle: document.querySelector('#userDialogTitle'),
  userDialogCopy: document.querySelector('#userDialogCopy'),
  userEmailInput: document.querySelector('#userEmailInput'),
  userRoleId: document.querySelector('#userRoleId'),
  userBranchId: document.querySelector('#userBranchId'),
  userStatusField: document.querySelector('#userStatusField'),
  userStatus: document.querySelector('#userStatus'),
  userFormError: document.querySelector('#userFormError'),
  closeUserDialog: document.querySelector('#closeUserDialog'),
  cancelUserButton: document.querySelector('#cancelUserButton'),
  saveUserButton: document.querySelector('#saveUserButton'),
  roleDialog: document.querySelector('#roleDialog'),
  roleForm: document.querySelector('#roleForm'),
  roleDialogTitle: document.querySelector('#roleDialogTitle'),
  rolePermissionPicker: document.querySelector('#rolePermissionPicker'),
  roleFormError: document.querySelector('#roleFormError'),
  closeRoleDialog: document.querySelector('#closeRoleDialog'),
  cancelRoleButton: document.querySelector('#cancelRoleButton'),
  saveRoleButton: document.querySelector('#saveRoleButton'),
  reportSalesMonth: document.querySelector('#reportSalesMonth'),
  reportInventoryValue: document.querySelector('#reportInventoryValue'),
  reportPendingPurchases: document.querySelector('#reportPendingPurchases'),
  reportReceivables: document.querySelector('#reportReceivables'),
  reportPayables: document.querySelector('#reportPayables'),
  reportSearch: document.querySelector('#reportSearch'),
  reportBranchFilter: document.querySelector('#reportBranchFilter'),
  reportDateFrom: document.querySelector('#reportDateFrom'),
  reportDateTo: document.querySelector('#reportDateTo'),
  clearReportFilters: document.querySelector('#clearReportFilters'),
  exportReportButton: document.querySelector('#exportReportButton'),
  reportExportLabel: document.querySelector('#reportExportLabel'),
  activeReportTitle: document.querySelector('#activeReportTitle'),
  reportRecordCount: document.querySelector('#reportRecordCount'),
  reportTableHead: document.querySelector('#reportTableHead'),
  reportTableBody: document.querySelector('#reportTableBody'),
  reportDataState: document.querySelector('#reportDataState'),
  reportPreviousPage: document.querySelector('#reportPreviousPage'),
  reportNextPage: document.querySelector('#reportNextPage'),
  reportPageLabel: document.querySelector('#reportPageLabel'),
  auditToday: document.querySelector('#auditToday'),
  auditMonth: document.querySelector('#auditMonth'),
  auditWeek: document.querySelector('#auditWeek'),
  auditActors: document.querySelector('#auditActors'),
  auditActionTypes: document.querySelector('#auditActionTypes'),
  auditTotal: document.querySelector('#auditTotal'),
  auditSearch: document.querySelector('#auditSearch'),
  auditActorFilter: document.querySelector('#auditActorFilter'),
  auditEntityFilter: document.querySelector('#auditEntityFilter'),
  auditActionFilter: document.querySelector('#auditActionFilter'),
  auditDateFrom: document.querySelector('#auditDateFrom'),
  auditDateTo: document.querySelector('#auditDateTo'),
  clearAuditFilters: document.querySelector('#clearAuditFilters'),
  exportAuditButton: document.querySelector('#exportAuditButton'),
  auditRecordCount: document.querySelector('#auditRecordCount'),
  auditEventList: document.querySelector('#auditEventList'),
  auditDataState: document.querySelector('#auditDataState'),
  auditLoadMore: document.querySelector('#auditLoadMore'),
  auditDetailEmpty: document.querySelector('#auditDetailEmpty'),
  auditDetailContent: document.querySelector('#auditDetailContent'),
  auditDetailAction: document.querySelector('#auditDetailAction'),
  auditDetailEntity: document.querySelector('#auditDetailEntity'),
  auditDetailId: document.querySelector('#auditDetailId'),
  auditDetailActor: document.querySelector('#auditDetailActor'),
  auditDetailDate: document.querySelector('#auditDetailDate'),
  auditDetailReason: document.querySelector('#auditDetailReason'),
  auditBeforeData: document.querySelector('#auditBeforeData'),
  auditAfterData: document.querySelector('#auditAfterData'),
  auditMetadata: document.querySelector('#auditMetadata'),
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
let executiveSummary = {};
let posCatalog = [];
let posCustomers = [];
let posSaleTerms = 'IMMEDIATE';
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
let payableInvoices = [];
let payableSources = { suppliers: [], purchases: [] };
let selectedPayable = null;
let teamUsers = [];
let accessRoles = [];
let accessPermissions = [];
let selectedTeamUser = null;
let editingTeamUser = null;
let editingAccessRole = null;
let auditEvents = [];
let auditPagination = { page: 1, pageSize: 30, total: 0, totalPages: 1 };
let selectedAuditEventId = null;
let auditSearchTimer = null;
let auditFacetsLoadedForTenant = null;
let activeReportType = 'sales';
let reportColumns = [];
let reportItems = [];
let reportPagination = { page: 1, pageSize: 50, total: 0, totalPages: 1 };
let reportFacetsLoadedForTenant = null;
let reportSearchTimer = null;
let currentUser = null;
let csrfToken = null;
let pendingActivationToken = new URLSearchParams(window.location.search).get('activate');
const saleCart = new Map();
let activePosCategory = 'ALL';
let customerDialogSource = 'receivables';
let imageProduct = null;
let taxProduct = null;
let imagePreviewUrl = null;
let activeTenantId = readTenantPreference();

const warehouseTypeLabels = {
  AVAILABLE: 'Disponible',
  QUARANTINE: 'Cuarentena',
  DAMAGED: 'Averías',
  TRANSIT: 'En tránsito',
};

const paymentMethodLabels = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  CREDIT: 'Crédito',
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

function activeMembership() {
  return currentUser?.memberships?.find((membership) =>
    membership.tenantId === activeTenantId) || null;
}

function hasAnyPermission(...permissionCodes) {
  const permissions = activeMembership()?.permissions || [];
  return permissionCodes.some((permission) => permissions.includes(permission));
}

function accountInitials(name) {
  return (name || 'MegaSuite')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function applyAccessVisibility() {
  const membership = activeMembership();
  const cashierMode = membership?.roleCode === 'CASHIER';
  elements.appShell.classList.toggle('cashier-mode', cashierMode);
  const viewPermissions = {
    inicio: ['dashboard.view'],
    empresas: [],
    sucursales: ['branches.manage', 'dashboard.view', 'inventory.view', 'sales.operate'],
    bodegas: ['warehouses.manage', 'inventory.view', 'purchases.manage', 'sales.operate'],
    inventario: ['inventory.view', 'inventory.adjust'],
    productos: ['catalog.manage', 'inventory.view', 'purchases.manage', 'sales.operate'],
    compras: ['purchases.manage'],
    'cuentas-pagar': ['payables.manage'],
    caja: ['sales.operate'],
    cartera: ['receivables.manage'],
    usuarios: ['users.manage'],
    modulos: ['dashboard.view'],
    reportes: ['reports.view'],
    auditoria: ['audit.view'],
    sistema: ['audit.view', 'users.manage'],
  };
  document.querySelectorAll('[data-view-link]').forEach((link) => {
    const required = viewPermissions[link.dataset.viewLink] || [];
    const cashierRestricted = cashierMode && link.dataset.viewLink !== 'caja';
    const branchAuditRestricted =
      link.dataset.viewLink === 'auditoria' && Boolean(membership?.branchId);
    link.hidden = cashierRestricted || branchAuditRestricted ||
      (required.length > 0 && !hasAnyPermission(...required));
  });
  elements.accountRole.textContent = membership?.roleName || 'Sin acceso a empresa';
  elements.newCompanyButton.hidden = !hasAnyPermission('companies.manage');
  elements.newBranchButton.hidden = !hasAnyPermission('branches.manage');
  elements.newWarehouseButton.hidden = !hasAnyPermission('warehouses.manage');
  elements.newAdjustmentButton.hidden = !hasAnyPermission('inventory.adjust');
  elements.newTransferButton.hidden = !hasAnyPermission('inventory.adjust');
  elements.newCountButton.hidden = !hasAnyPermission('inventory.adjust');
  elements.newCategoryButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newBrandButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newTaxButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newProductButton.hidden = !hasAnyPermission('catalog.manage');
  elements.categoryPanelCreateButton.hidden = !hasAnyPermission('catalog.manage');
  elements.brandPanelCreateButton.hidden = !hasAnyPermission('catalog.manage');
  elements.taxPanelCreateButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newPurchaseButton.hidden = !hasAnyPermission('purchases.manage');
  elements.newSupplierButton.hidden = !hasAnyPermission('purchases.manage');
  elements.supplierPanelCreateButton.hidden = !hasAnyPermission('purchases.manage');
  elements.inviteUserButton.hidden = !hasAnyPermission('users.manage');
  elements.newRoleButton.hidden = !hasAnyPermission('users.manage');
}

function renderAuthenticatedUser() {
  const name = currentUser?.full_name || currentUser?.email || 'Usuario';
  elements.accountInitials.textContent = accountInitials(name);
  elements.accountName.textContent = name;
  elements.accountMenuName.textContent = name;
  elements.accountMenuEmail.textContent = currentUser?.email || '—';
  applyAccessVisibility();
}

function showAuthGate({ setupRequired = false, initialEmail = '' } = {}) {
  currentUser = null;
  csrfToken = null;
  elements.appShell.hidden = true;
  elements.authGate.hidden = false;
  elements.authLoading.hidden = true;
  elements.setupAccessPanel.hidden = !setupRequired;
  elements.loginAccessPanel.hidden = setupRequired;
  elements.activateAccessPanel.hidden = true;
  elements.accountMenu.hidden = true;
  if (setupRequired) {
    elements.setupEmail.value = initialEmail || 'admin@megasuite.local';
    queueMicrotask(() => elements.setupEmail.focus());
  } else {
    queueMicrotask(() => elements.loginEmail.focus());
  }
}

function showActivationGate() {
  currentUser = null;
  csrfToken = null;
  elements.appShell.hidden = true;
  elements.authGate.hidden = false;
  elements.authLoading.hidden = true;
  elements.setupAccessPanel.hidden = true;
  elements.loginAccessPanel.hidden = true;
  elements.activateAccessPanel.hidden = false;
  queueMicrotask(() => elements.activateAccessForm.elements.password.focus());
}

async function completeAuthentication(user, nextCsrfToken) {
  currentUser = user;
  csrfToken = nextCsrfToken;
  const memberships = user?.memberships || [];
  if (!memberships.some((membership) => membership.tenantId === activeTenantId)) {
    activeTenantId = memberships[0]?.tenantId || '';
  }
  saveTenantPreference(activeTenantId);
  elements.authGate.hidden = true;
  elements.appShell.hidden = false;
  renderAuthenticatedUser();
  showView(window.location.hash.replace(/^#/, '') || 'inicio', { scroll: false });
  await refreshStatus();
}

async function submitSetupAccess(event) {
  event.preventDefault();
  const formData = new FormData(elements.setupAccessForm);
  elements.setupAccessError.hidden = true;
  if (formData.get('password') !== formData.get('confirmPassword')) {
    elements.setupAccessError.textContent = 'Las contraseñas no coinciden.';
    elements.setupAccessError.hidden = false;
    return;
  }
  elements.setupAccessButton.disabled = true;
  elements.setupAccessButton.textContent = 'Protegiendo acceso…';
  try {
    const result = await getJson('/api/auth/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    });
    await completeAuthentication(result.user, result.csrfToken);
    showToast('Acceso principal configurado correctamente.');
  } catch (error) {
    elements.setupAccessError.textContent = error.message;
    elements.setupAccessError.hidden = false;
  } finally {
    elements.setupAccessButton.disabled = false;
    elements.setupAccessButton.textContent = 'Proteger y entrar →';
  }
}

async function submitLoginAccess(event) {
  event.preventDefault();
  const formData = new FormData(elements.loginAccessForm);
  elements.loginAccessError.hidden = true;
  elements.loginAccessButton.disabled = true;
  elements.loginAccessButton.textContent = 'Verificando…';
  try {
    const result = await getJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on',
      }),
    });
    elements.loginAccessForm.reset();
    await completeAuthentication(result.user, result.csrfToken);
    showToast(`Bienvenido, ${result.user.full_name}.`);
  } catch (error) {
    elements.loginAccessError.textContent = error.message;
    elements.loginAccessError.hidden = false;
  } finally {
    elements.loginAccessButton.disabled = false;
    elements.loginAccessButton.textContent = 'Iniciar sesión →';
  }
}

async function submitActivateAccess(event) {
  event.preventDefault();
  const formData = new FormData(elements.activateAccessForm);
  elements.activateAccessError.hidden = true;
  if (formData.get('password') !== formData.get('confirmPassword')) {
    elements.activateAccessError.textContent = 'Las contraseñas no coinciden.';
    elements.activateAccessError.hidden = false;
    return;
  }
  elements.activateAccessButton.disabled = true;
  elements.activateAccessButton.textContent = 'Activando…';
  try {
    const result = await getJson('/api/auth/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: pendingActivationToken,
        password: formData.get('password'),
      }),
    });
    pendingActivationToken = null;
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    await completeAuthentication(result.user, result.csrfToken);
    showToast('Cuenta activada. Tu acceso ya está listo.');
  } catch (error) {
    elements.activateAccessError.textContent = error.message;
    elements.activateAccessError.hidden = false;
  } finally {
    elements.activateAccessButton.disabled = false;
    elements.activateAccessButton.textContent = 'Activar y entrar →';
  }
}

async function logout() {
  elements.logoutButton.disabled = true;
  try {
    await getJson('/api/auth/logout', { method: 'POST' });
  } catch {
    // Aunque la sesión ya haya vencido, la interfaz debe volver al acceso.
  } finally {
    elements.logoutButton.disabled = false;
    showAuthGate();
  }
}

async function startApplication() {
  if (pendingActivationToken) {
    showActivationGate();
    return;
  }
  try {
    const status = await getJson('/api/auth/status');
    if (status.authenticated) {
      await completeAuthentication(status.user, status.csrfToken);
    } else {
      showAuthGate(status);
    }
  } catch (error) {
    elements.authLoading.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = 'No pudimos conectar con MegaSuite';
    const detail = document.createElement('span');
    detail.textContent = error.message;
    elements.authLoading.append(title, detail);
  }
}

function setServiceState(dot, result, state, message) {
  dot.classList.remove('ok', 'error');
  if (state) dot.classList.add(state);
  result.textContent = message;
}

async function getJson(url, options = {}) {
  const { headers = {}, ...requestOptions } = options;
  const requestHeaders = { Accept: 'application/json', ...headers };
  if (activeTenantId && !requestHeaders['x-tenant-id'] && !url.startsWith('/api/auth')) {
    requestHeaders['x-tenant-id'] = activeTenantId;
  }
  if (csrfToken && !['GET', 'HEAD'].includes((requestOptions.method || 'GET').toUpperCase())) {
    requestHeaders['x-csrf-token'] = csrfToken;
  }
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...requestOptions,
    credentials: 'include',
    headers: requestHeaders,
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(body.error || 'No fue posible consultar la API.');
    error.status = response.status;
    error.body = body;
    if (response.status === 401 && !url.startsWith('/api/auth')) {
      showAuthGate({ setupRequired: false });
    }
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
  elements.newTaxButton.disabled = !activeCompany;
  elements.newProductButton.disabled = !activeCompany;
  elements.categoryPanelCreateButton.disabled = !activeCompany;
  elements.brandPanelCreateButton.disabled = !activeCompany;
  elements.taxPanelCreateButton.disabled = !activeCompany;
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
    if (hasAnyPermission('catalog.manage')) {
      const taxButton = document.createElement('button');
      taxButton.className = 'tax-action';
      taxButton.type = 'button';
      taxButton.textContent = product.tax_name ? 'Cambiar tratamiento' : 'Configurar impuesto';
      taxButton.addEventListener('click', () => openProductTaxDialog(product));
      taxCell.append(taxButton);
    }
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
  renderTaxList();
}

function taxTreatmentLabel(treatment) {
  return {
    TAXED: 'Gravado',
    EXEMPT: 'Exento',
    EXCLUDED: 'Excluido',
    NON_TAXED: 'No gravado',
    OTHER: 'Otro',
  }[treatment] || treatment;
}

function renderTaxList() {
  elements.taxList.replaceChildren();
  if (!taxCategories.length) {
    const empty = document.createElement('div');
    empty.className = 'taxonomy-empty';
    empty.textContent = 'Todavía no hay impuestos registrados para esta empresa.';
    elements.taxList.append(empty);
    return;
  }
  for (const tax of taxCategories) {
    const card = document.createElement('article');
    const symbol = document.createElement('span');
    symbol.textContent = `${Number(tax.rate)}%`;
    const content = document.createElement('div');
    const code = document.createElement('small');
    code.textContent = [tax.code, tax.dian_code ? `DIAN ${tax.dian_code}` : null]
      .filter(Boolean)
      .join(' · ');
    const name = document.createElement('strong');
    name.textContent = tax.name;
    const description = document.createElement('p');
    description.textContent = `${taxTreatmentLabel(tax.treatment)} · Tarifa ${Number(tax.rate)}%`;
    content.append(code, name, description);
    const status = document.createElement('b');
    status.textContent = tax.active ? 'Disponible' : 'Inactivo';
    card.append(symbol, content, status);
    elements.taxList.append(card);
  }
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

function setExecutiveSummary(summary = {}) {
  executiveSummary = summary;
  elements.dashboardSalesToday.textContent = formatCurrency(summary.sales_today || 0);
  elements.dashboardSalesMonth.textContent = formatCurrency(summary.sales_month || 0);
  elements.dashboardGrossMargin.textContent =
    `Margen ${formatCurrency(summary.gross_margin_month || 0)}`;
  elements.dashboardLowStock.textContent = String(summary.low_stock_balances || 0);
  elements.dashboardPendingPurchases.textContent =
    formatCurrency(summary.pending_purchase_value || 0);
  elements.dashboardCashProjection.textContent =
    formatCurrency(summary.projected_cash_30_days || 0);
  elements.dashboardCashProjectionDetail.textContent =
    `${formatCurrency(summary.open_cash_position || 0)} en caja + ` +
    `${formatCurrency(summary.receivables_30_days || 0)} por cobrar − ` +
    `${formatCurrency(summary.payables_30_days || 0)} por pagar`;
}

async function loadExecutiveSummary() {
  if (!activeTenantId) {
    setExecutiveSummary();
    return {};
  }
  try {
    const summary = await getJson('/api/dashboard/executive', {
      headers: { 'x-tenant-id': activeTenantId },
    });
    setExecutiveSummary(summary);
    return summary;
  } catch (error) {
    setExecutiveSummary();
    throw error;
  }
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
    elements.cashExpectedAmount.textContent = formatCurrency(session.calculated_cash);
    elements.cashOpenedAt.textContent = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(session.opened_at));
    elements.cashGuidance.textContent =
      'El efectivo esperado se actualiza con ventas, ingresos, gastos y retiros del turno.';
    elements.openCashButton.hidden = true;
    elements.closeCashButton.hidden = false;
    elements.newCashMovementButton.hidden = false;
    renderCashControl();
    return;
  }

  elements.cashStatus.textContent = firstRegister ? 'Caja cerrada' : 'Sin cajas configuradas';
  elements.cashStatus.className = 'pos-state';
  elements.cashRegisterName.textContent = firstRegister?.name || 'Sin caja disponible';
  elements.cashBranchName.textContent = firstRegister?.branch_name || '—';
  elements.cashOpeningAmount.textContent = '—';
  elements.cashOpenedAt.textContent = '—';
  elements.cashExpectedAmount.textContent = '—';
  elements.cashGuidance.textContent = firstRegister
    ? 'Abre un turno para preparar el registro de ventas y movimientos de efectivo.'
    : 'Registra una caja física antes de comenzar la operación POS.';
  elements.openCashButton.hidden = false;
  elements.openCashButton.disabled = !firstRegister;
  elements.closeCashButton.hidden = true;
  elements.newCashMovementButton.hidden = true;
  renderCashControl();
}

function renderCashControl() {
  const session = posSummary.openSession;
  const detail = posSummary.currentDetail;
  const sessions = posSummary.sessions || [];
  const movements = detail?.movements || [];
  elements.cashSalesAmount.textContent = formatCurrency(session?.cash_sales || 0);
  elements.cashManualIncome.textContent = formatCurrency(session?.manual_income || 0);
  elements.cashOutflows.textContent = formatCurrency(
    Number(session?.expenses || 0) + Number(session?.withdrawals || 0),
  );
  elements.cashControlExpected.textContent = formatCurrency(session?.calculated_cash || 0);
  elements.cashMovementList.replaceChildren();
  elements.cashMovementCount.textContent = String(movements.length);
  elements.cashMovementState.hidden = movements.length > 0;
  for (const movement of movements) {
    const row = document.createElement('div');
    row.className = 'cash-movement-row';
    const icon = document.createElement('span');
    icon.className = `cash-movement-icon ${movement.movement_type.toLocaleLowerCase('es')}`;
    icon.textContent = movement.movement_type === 'INCOME' ? '+' : '−';
    const copy = document.createElement('div');
    copy.className = 'cash-movement-copy';
    const category = document.createElement('strong');
    category.textContent = movement.category;
    const notes = document.createElement('span');
    notes.textContent = movement.notes;
    const time = document.createElement('small');
    time.textContent = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(movement.created_at));
    copy.append(category, notes, time);
    const amount = document.createElement('strong');
    const incoming = movement.movement_type === 'INCOME';
    amount.className = `cash-movement-amount${incoming ? '' : ' out'}`;
    amount.textContent = `${incoming ? '+' : '−'} ${formatCurrency(movement.amount)}`;
    row.append(icon, copy, amount);
    elements.cashMovementList.append(row);
  }

  elements.cashSessionList.replaceChildren();
  elements.cashSessionCount.textContent = String(sessions.length);
  elements.cashSessionState.hidden = sessions.length > 0;
  for (const item of sessions.slice(0, 8)) {
    const row = document.createElement('div');
    row.className = 'cash-session-row';
    const copy = document.createElement('div');
    copy.className = 'cash-session-copy';
    const title = document.createElement('strong');
    title.textContent = `${item.register_name} · ${item.status === 'OPEN' ? 'Abierto' : 'Cerrado'}`;
    const date = document.createElement('span');
    date.textContent = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(item.opened_at));
    const activity = document.createElement('small');
    activity.textContent =
      `${item.sale_count} ventas · ${item.movement_count} movimientos`;
    copy.append(title, date, activity);
    const result = document.createElement('div');
    result.className = 'cash-session-result';
    const total = document.createElement('strong');
    total.textContent = formatCurrency(item.sales_total || 0);
    const difference = document.createElement('span');
    const differenceValue = Number(item.difference || 0);
    difference.className =
      Math.abs(differenceValue) < 0.01 ? 'difference-ok' : 'difference-alert';
    difference.textContent = item.status === 'OPEN'
      ? 'En operación'
      : `Diferencia ${formatCurrency(differenceValue)}`;
    result.append(total, difference);
    row.append(copy, result);
    elements.cashSessionList.append(row);
  }
}

function renderPosSalesHistory() {
  const sales = posSummary.currentDetail?.sales || [];
  elements.posSaleHistoryCount.textContent = String(sales.length);
  elements.openSalesHistoryButton.disabled = !posSummary.openSession;
  elements.posSalesHistoryList.replaceChildren();
  elements.posSalesHistoryEmpty.hidden = sales.length > 0;

  for (const sale of sales) {
    const row = document.createElement('article');
    row.className = 'pos-sale-history-row';
    const identity = document.createElement('div');
    identity.className = 'pos-sale-history-identity';
    const number = document.createElement('strong');
    number.textContent = `POS-${String(sale.sequence_number).padStart(6, '0')}`;
    const customer = document.createElement('span');
    customer.textContent = sale.customer_name;
    const detail = document.createElement('small');
    const time = new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(sale.created_at));
    detail.textContent =
      `${time} · ${sale.item_count} ${sale.item_count === 1 ? 'producto' : 'productos'} · ` +
      `${paymentMethodLabels[sale.payment_method] || sale.payment_method}`;
    identity.append(number, customer, detail);

    const result = document.createElement('div');
    result.className = 'pos-sale-history-result';
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(sale.total);
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.textContent = 'Ver comprobante';
    viewButton.addEventListener('click', () => openHistoricalReceipt(sale.id, viewButton));
    result.append(amount, viewButton);
    row.append(identity, result);
    elements.posSalesHistoryList.append(row);
  }
}

function openSalesHistoryDialog() {
  renderPosSalesHistory();
  elements.salesHistoryDialog.showModal();
}

function closeSalesHistoryDialog() {
  elements.salesHistoryDialog.close();
}

async function openHistoricalReceipt(saleId, button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Consultando…';
  try {
    const receipt = await getJson(`/api/pos/sales/${saleId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    closeSalesHistoryDialog();
    showReceipt(receipt);
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function showPosError(message) {
  posSummary = { registers: [], openSession: null, sessions: [], currentDetail: null };
  posCustomers = [];
  elements.cashStatus.textContent = 'Caja no disponible';
  elements.cashStatus.className = 'pos-state error';
  elements.cashRegisterName.textContent = 'No pudimos consultar la caja';
  elements.cashBranchName.textContent = '—';
  elements.cashOpeningAmount.textContent = '—';
  elements.cashOpenedAt.textContent = '—';
  elements.cashExpectedAmount.textContent = '—';
  elements.cashGuidance.textContent = message;
  elements.openCashButton.hidden = false;
  elements.openCashButton.disabled = true;
  elements.closeCashButton.hidden = true;
  elements.newCashMovementButton.hidden = true;
  renderCashControl();
  renderPosSalesHistory();
  syncCashRegisterOptions();
  syncPosCustomers();
}

function syncPosCustomers(preferredCustomerId = elements.posCustomerSelect.value) {
  elements.posCustomerSelect.replaceChildren(new Option('Consumidor final', ''));
  for (const customer of posCustomers) {
    const document = customer.document_number ? ` · ${customer.document_number}` : '';
    elements.posCustomerSelect.append(new Option(`${customer.name}${document}`, customer.id));
  }
  if (posCustomers.some((customer) => customer.id === preferredCustomerId)) {
    elements.posCustomerSelect.value = preferredCustomerId;
  }
  renderPosCustomerContext();
}

function renderPosCustomerContext() {
  const customer = posCustomers.find((item) => item.id === elements.posCustomerSelect.value);
  elements.posCustomerBalance.textContent = customer
    ? `${customer.document_number || 'Sin documento'} · saldo ${formatCurrency(customer.outstanding || 0)}`
    : 'Consumidor final · venta sin cartera';
}

async function loadPos() {
  if (!activeTenantId) {
    showPosError('Primero debes registrar o seleccionar una empresa.');
    return posSummary;
  }
  try {
    const headers = { 'x-tenant-id': activeTenantId };
    const [summary, sessions, customers] = await Promise.all([
      getJson('/api/pos/summary', { headers }),
      getJson('/api/pos/sessions', { headers }),
      getJson('/api/pos/customers', { headers }),
    ]);
    const currentDetail = summary.openSession
      ? await getJson(`/api/pos/sessions/${summary.openSession.id}`, { headers })
      : null;
    posSummary = { ...summary, sessions, currentDetail };
    posCustomers = customers;
    syncPosCustomers();
    renderPos();
    renderPosSalesHistory();
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

function cashTenderOptions(total) {
  if (total <= 0) return [];
  const values = new Set([total]);
  for (const denomination of [10000, 20000, 50000, 100000, 200000]) {
    const rounded = Math.ceil(total / denomination) * denomination;
    if (rounded >= total) values.add(rounded);
  }
  return [...values].sort((left, right) => left - right).slice(0, 4);
}

function updateCashSettlement(totals = calculateCartTotals(), { rebuild = false } = {}) {
  const cashPayment =
    posSaleTerms === 'IMMEDIATE' && elements.posPaymentMethod.value === 'CASH';
  elements.posCashTender.hidden = !cashPayment;
  if (!cashPayment) return;

  if (rebuild) {
    elements.cashTenderSuggestions.replaceChildren();
    for (const amount of cashTenderOptions(totals.total)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = amount === totals.total ? 'Exacto' : formatCurrency(amount);
      button.addEventListener('click', () => {
        elements.posCashReceived.value = String(amount);
        updateCashSettlement(calculateCartTotals());
      });
      elements.cashTenderSuggestions.append(button);
    }
  }

  const hasReceived = elements.posCashReceived.value !== '';
  const received = Number(elements.posCashReceived.value);
  const validReceived =
    hasReceived && Number.isFinite(received) && received >= totals.total;
  const difference = hasReceived && Number.isFinite(received) ? received - totals.total : 0;
  elements.posCashChange.classList.toggle('short', hasReceived && difference < 0);
  elements.posCashChange.textContent = hasReceived && difference < 0
    ? `Faltan ${formatCurrency(Math.abs(difference))}`
    : formatCurrency(difference);
  if (totals.itemCount > 0 && !validReceived) {
    elements.completeSaleButton.disabled = true;
    elements.completeSaleButton.textContent = hasReceived && difference < 0
      ? `Faltan ${formatCurrency(Math.abs(difference))}`
      : 'Registra el efectivo recibido';
  }
}

function renderPosCatalog() {
  const search = normalizeSearch(elements.posProductSearch.value.trim());
  const filtered = posCatalog.filter((product) => {
    const searchable = normalizeSearch(
      `${product.name} ${product.sku} ${product.barcode || ''} ${product.category_name || ''}`,
    );
    const matchesCategory =
      activePosCategory === 'ALL' || product.category_id === activePosCategory;
    return matchesCategory && (!search || searchable.includes(search));
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
    sku.textContent = product.category_name
      ? `${product.category_name} · ${product.sku}`
      : product.sku;
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
    addButton.textContent = stock <= 0 ? 'Sin existencias' : '+ Agregar';
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

function renderPosCategories() {
  const categoriesAvailable = [...new Map(
    posCatalog
      .filter((product) => product.category_id && product.category_name)
      .map((product) => [product.category_id, product.category_name]),
  )].sort((left, right) => left[1].localeCompare(right[1], 'es'));
  if (
    activePosCategory !== 'ALL' &&
    !categoriesAvailable.some(([categoryId]) => categoryId === activePosCategory)
  ) {
    activePosCategory = 'ALL';
  }
  elements.posCategoryStrip.replaceChildren();
  for (const [categoryId, categoryName] of [['ALL', 'Todos'], ...categoriesAvailable]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.posCategory = categoryId;
    button.classList.toggle('active', categoryId === activePosCategory);
    button.textContent = categoryName;
    button.addEventListener('click', () => {
      activePosCategory = categoryId;
      renderPosCategories();
      renderPosCatalog();
    });
    elements.posCategoryStrip.append(button);
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
  elements.clearCartButton.hidden = totals.itemCount === 0;
  elements.completeSaleButton.disabled =
    !posSummary.openSession || !elements.posWarehouseSelect.value || saleCart.size === 0;
  elements.completeSaleButton.textContent = totals.itemCount
    ? `Cobrar ${formatCurrency(totals.total)} →`
    : 'Selecciona productos →';
  updateCashSettlement(totals, { rebuild: true });
  const creditSale = posSaleTerms === 'CREDIT';
  elements.posPaymentPanel.hidden = creditSale;
  elements.posCreditTerms.hidden = !creditSale;
  if (creditSale) {
    const hasCustomer = Boolean(elements.posCustomerSelect.value);
    const hasDueDate = Boolean(elements.posCreditDueDate.value);
    elements.posCashTender.hidden = true;
    elements.completeSaleButton.disabled =
      elements.completeSaleButton.disabled || !hasCustomer || !hasDueDate;
    if (totals.itemCount > 0) {
      if (!hasCustomer) elements.completeSaleButton.textContent = 'Selecciona un cliente';
      else if (!hasDueDate) elements.completeSaleButton.textContent = 'Define el vencimiento';
      else elements.completeSaleButton.textContent =
        `Vender a crédito ${formatCurrency(totals.total)} →`;
    }
  }
  elements.posSaleError.hidden = true;
}

function clearCart() {
  saleCart.clear();
  elements.posCashReceived.value = '';
  renderCart();
  renderPosCatalog();
}

async function loadPosCatalog() {
  const warehouseId = elements.posWarehouseSelect.value;
  if (!posSummary.openSession || !warehouseId) {
    posCatalog = [];
    renderPosCategories();
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
    renderPosCategories();
    renderPosCatalog();
    renderCart();
    return posCatalog;
  } catch (error) {
    posCatalog = [];
    renderPosCategories();
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
  elements.dashboardReceivable.textContent = formatCurrency(summary.outstanding || 0);
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

function openCustomerDialog(source = 'receivables') {
  if (!activeTenantId) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  customerDialogSource = source;
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
    const endpoint = customerDialogSource === 'pos'
      ? '/api/pos/customers'
      : '/api/receivables/customers';
    const customer = await getJson(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    closeCustomerDialog();
    if (customerDialogSource === 'pos') {
      posCustomers = await getJson('/api/pos/customers', {
        headers: { 'x-tenant-id': activeTenantId },
      });
      syncPosCustomers(customer.id);
      renderCart();
      showToast('Cliente creado y seleccionado en la venta.');
    } else {
      await loadReceivables();
      showToast('Cliente registrado y disponible para facturar.');
    }
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
  elements.dashboardOpenPurchases.textContent = String(summary.open_orders || 0);
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

function payableStatus(invoice) {
  if (invoice.status === 'PAID') return { label: 'Pagada', className: 'paid' };
  if (Number(invoice.days_overdue) > 0) {
    return {
      label: `${invoice.days_overdue} d vencida`,
      className: Number(invoice.days_overdue) > 60 ? 'critical' : 'overdue',
    };
  }
  if (invoice.status === 'PARTIAL') return { label: 'Pago parcial', className: 'partial' };
  return { label: 'Por pagar', className: 'open' };
}

function setPayableSummary(summary = {}) {
  elements.apOutstanding.textContent = formatCurrency(summary.outstanding || 0);
  elements.dashboardPayable.textContent = formatCurrency(summary.outstanding || 0);
  elements.apOpenCount.textContent =
    `${summary.open_count || 0} ${Number(summary.open_count) === 1 ? 'obligación abierta' : 'obligaciones abiertas'}`;
  elements.apCurrent.textContent = formatCurrency(summary.current || 0);
  elements.apOverdue30.textContent = formatCurrency(summary.overdue_1_30 || 0);
  elements.apOverdue60.textContent = formatCurrency(summary.overdue_31_60 || 0);
  elements.apOverdue61.textContent = formatCurrency(summary.overdue_61_plus || 0);
  elements.apPaidMonth.textContent = formatCurrency(summary.paid_month || 0);
}

function showPayablesError(message) {
  payableInvoices = [];
  payableSources = { suppliers: [], purchases: [] };
  selectedPayable = null;
  setPayableSummary();
  elements.payableList.replaceChildren();
  elements.payableDataState.hidden = false;
  elements.payableDataState.classList.add('error');
  elements.payableDataState.querySelector('strong').textContent =
    'No pudimos consultar las cuentas por pagar';
  elements.payableDataState.querySelector('p').textContent = message;
  elements.payableRecordCount.textContent = 'Sin datos';
  elements.payableDetailContent.hidden = true;
  elements.payableDetailEmpty.hidden = false;
}

function renderPayableList() {
  const search = normalizeSearch(elements.payableSearch.value.trim());
  const filter = elements.payableStatusFilter.value;
  const filtered = payableInvoices.filter((invoice) => {
    const matchesSearch = !search || normalizeSearch([
      invoice.payable_number,
      invoice.supplier_invoice_number,
      invoice.order_number,
      invoice.supplier_name,
      invoice.tax_id,
    ].filter(Boolean).join(' ')).includes(search);
    const isOpen = ['ISSUED', 'PARTIAL'].includes(invoice.status);
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'OPEN' && isOpen) ||
      (filter === 'OVERDUE' && isOpen && Number(invoice.days_overdue) > 0) ||
      (filter === 'PAID' && invoice.status === 'PAID');
    return matchesSearch && matchesFilter;
  });
  elements.payableList.replaceChildren();
  elements.payableRecordCount.textContent = String(filtered.length);
  elements.payableDataState.hidden = filtered.length > 0;
  elements.payableDataState.classList.remove('error');
  if (!filtered.length) {
    elements.payableDataState.querySelector('strong').textContent =
      search || filter !== 'ALL' ? 'No hay coincidencias' : 'No hay obligaciones';
    elements.payableDataState.querySelector('p').textContent =
      search || filter !== 'ALL'
        ? 'Cambia la búsqueda o consulta todos los estados.'
        : 'Registra una cuenta desde una compra recibida o un proveedor.';
    return;
  }
  for (const invoice of filtered) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ar-invoice-card';
    if (selectedPayable?.id === invoice.id) button.classList.add('selected');
    const top = document.createElement('div');
    const number = document.createElement('strong');
    number.textContent = invoice.payable_number;
    const meta = payableStatus(invoice);
    const status = document.createElement('span');
    status.className = `ar-status ${meta.className}`;
    status.textContent = meta.label;
    top.append(number, status);
    const supplier = document.createElement('span');
    supplier.className = 'ar-customer-name';
    supplier.textContent = invoice.supplier_name;
    const reference = document.createElement('small');
    reference.textContent =
      invoice.order_number || invoice.supplier_invoice_number || 'Registro manual';
    const amounts = document.createElement('div');
    amounts.className = 'ar-invoice-amounts';
    const due = document.createElement('span');
    due.textContent = `Vence ${formatShortDate(invoice.due_date)}`;
    const balance = document.createElement('strong');
    balance.textContent = formatCurrency(invoice.balance);
    amounts.append(due, balance);
    button.append(top, supplier, reference, amounts);
    button.addEventListener('click', () => loadPayableDetail(invoice.id));
    elements.payableList.append(button);
  }
}

function renderPayableDetail(invoice) {
  selectedPayable = invoice;
  elements.payableDetailEmpty.hidden = true;
  elements.payableDetailContent.hidden = false;
  elements.payableDetailNumber.textContent = invoice.payable_number;
  elements.payableDetailSupplier.textContent = invoice.supplier_name;
  elements.payableDetailDocument.textContent =
    invoice.tax_id ? `NIT ${invoice.tax_id}` : 'Documento no registrado';
  const status = payableStatus(invoice);
  elements.payableDetailStatus.textContent = status.label;
  elements.payableDetailStatus.className = `ar-status ${status.className}`;
  elements.payableDetailIssue.textContent = formatShortDate(invoice.issue_date);
  elements.payableDetailDue.textContent = formatShortDate(invoice.due_date);
  elements.payableDetailTotal.textContent = formatCurrency(invoice.total);
  elements.payableDetailBalance.textContent = formatCurrency(invoice.balance);
  elements.payableDetailOrigin.textContent =
    invoice.order_number ? `Orden ${invoice.order_number}` : 'Registro manual';
  elements.payableDetailExternal.textContent =
    invoice.supplier_invoice_number
      ? `Factura proveedor: ${invoice.supplier_invoice_number}`
      : 'Sin referencia del proveedor';
  elements.payablePaymentList.replaceChildren();
  elements.payablePaymentCount.textContent =
    `${invoice.payments.length} ${invoice.payments.length === 1 ? 'pago' : 'pagos'}`;
  if (!invoice.payments.length) {
    const empty = document.createElement('p');
    empty.className = 'ar-no-payments';
    empty.textContent = 'Todavía no se han registrado pagos.';
    elements.payablePaymentList.append(empty);
  }
  for (const payment of invoice.payments) {
    const row = document.createElement('div');
    const info = document.createElement('div');
    const date = document.createElement('strong');
    date.textContent = formatShortDate(payment.payment_date);
    const reference = document.createElement('small');
    reference.textContent =
      payment.reference ||
      payment.payment_method.replaceAll('_', ' ').toLocaleLowerCase('es');
    info.append(date, reference);
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(payment.amount);
    row.append(info, amount);
    elements.payablePaymentList.append(row);
  }
  elements.newPayablePaymentButton.hidden = invoice.status === 'PAID';
  renderPayableList();
}

async function loadPayableDetail(invoiceId) {
  try {
    const detail = await getJson(`/api/payables/invoices/${invoiceId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderPayableDetail(detail);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadPayables() {
  if (!activeTenantId) {
    showPayablesError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  try {
    const [summary, sources, invoices] = await Promise.all([
      getJson('/api/payables/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/payables/sources', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/payables/invoices', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    payableSources = sources;
    payableInvoices = invoices;
    setPayableSummary(summary);
    renderPayableList();
    elements.newPayableButton.disabled = !sources.suppliers.length;
    if (selectedPayable) {
      const exists = invoices.some((invoice) => invoice.id === selectedPayable.id);
      if (exists) await loadPayableDetail(selectedPayable.id);
      else {
        selectedPayable = null;
        elements.payableDetailContent.hidden = true;
        elements.payableDetailEmpty.hidden = false;
      }
    }
    return invoices;
  } catch (error) {
    showPayablesError(error.message);
    throw error;
  }
}

function updatePayableSourceFields() {
  const purchaseMode = elements.payableSourceType.value === 'PURCHASE';
  if (purchaseMode && !payableSources.purchases.length) {
    elements.payableSourceType.value = 'MANUAL';
  }
  const resolvedPurchaseMode = elements.payableSourceType.value === 'PURCHASE';
  elements.payablePurchaseFields.hidden = !resolvedPurchaseMode;
  elements.payableManualFields.hidden = resolvedPurchaseMode;
  elements.payablePurchaseId.required = resolvedPurchaseMode;
  elements.payableSupplierId.required = !resolvedPurchaseMode;
  elements.payableSubtotal.required = !resolvedPurchaseMode;
}

function updatePayablePurchasePreview() {
  const purchase = payableSources.purchases.find(
    (item) => item.id === elements.payablePurchaseId.value,
  );
  const preview = elements.payableSourcePreview;
  preview.querySelector('strong').textContent =
    purchase ? formatCurrency(purchase.total) : '$0';
  preview.querySelector('small').textContent = purchase
    ? `${purchase.supplier_name} · ${purchase.order_number}`
    : 'Selecciona una orden recibida';
  if (purchase) {
    const due = new Date(`${elements.payableIssueDate.value}T12:00:00`);
    due.setDate(due.getDate() + Number(purchase.payment_terms_days || 30));
    elements.payableDueDate.value = due.toISOString().slice(0, 10);
  }
}

function openPayableDialog() {
  if (!payableSources.suppliers.length) {
    showToast('Registra un proveedor antes de crear una cuenta por pagar.');
    return;
  }
  elements.payableForm.reset();
  elements.payableFormError.hidden = true;
  fillInventorySelect(
    elements.payablePurchaseId,
    'Selecciona una orden recibida',
    payableSources.purchases,
    (purchase) =>
      `${purchase.order_number} · ${purchase.supplier_name} · ${formatCurrency(purchase.total)}`,
  );
  fillInventorySelect(
    elements.payableSupplierId,
    'Selecciona un proveedor',
    payableSources.suppliers,
    (supplier) => `${supplier.name}${supplier.tax_id ? ` · ${supplier.tax_id}` : ''}`,
  );
  elements.payableSourceType.value =
    payableSources.purchases.length ? 'PURCHASE' : 'MANUAL';
  elements.payableIssueDate.value = isoDate();
  const due = new Date();
  due.setDate(due.getDate() + 30);
  elements.payableDueDate.value = due.toISOString().slice(0, 10);
  updatePayableSourceFields();
  updatePayablePurchasePreview();
  elements.payableDialog.showModal();
  (elements.payableSourceType.value === 'PURCHASE'
    ? elements.payablePurchaseId
    : elements.payableSupplierId).focus();
}

function closePayableDialog() {
  elements.payableDialog.close();
}

async function submitPayable(event) {
  event.preventDefault();
  const formData = new FormData(elements.payableForm);
  const manual = formData.get('sourceType') === 'MANUAL';
  elements.payableFormError.hidden = true;
  elements.savePayableButton.disabled = true;
  elements.savePayableButton.textContent = 'Registrando…';
  try {
    const invoice = await getJson('/api/payables/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        purchaseId: manual ? null : formData.get('purchaseId'),
        supplierId: manual ? formData.get('supplierId') : null,
        subtotal: manual ? formData.get('subtotal') : null,
        taxTotal: manual ? formData.get('taxTotal') : null,
        supplierInvoiceNumber: formData.get('supplierInvoiceNumber'),
        issueDate: formData.get('issueDate'),
        dueDate: formData.get('dueDate'),
        notes: formData.get('notes'),
      }),
    });
    closePayableDialog();
    await loadPayables();
    await loadPayableDetail(invoice.id);
    showToast(`${invoice.payable_number} agregada a cuentas por pagar.`);
  } catch (error) {
    elements.payableFormError.textContent = error.message;
    elements.payableFormError.hidden = false;
  } finally {
    elements.savePayableButton.disabled = false;
    elements.savePayableButton.textContent = 'Crear cuenta por pagar';
  }
}

function openPayablePaymentDialog() {
  if (!selectedPayable || selectedPayable.status === 'PAID') return;
  elements.payablePaymentForm.reset();
  elements.payablePaymentFormError.hidden = true;
  elements.payablePaymentNumber.textContent = selectedPayable.payable_number;
  elements.payablePaymentBalance.textContent =
    `${formatCurrency(selectedPayable.balance)} pendientes`;
  elements.payablePaymentAmount.max = String(selectedPayable.balance);
  elements.payablePaymentAmount.value = String(selectedPayable.balance);
  elements.payablePaymentDate.value = isoDate();
  elements.payablePaymentDialog.showModal();
  elements.payablePaymentAmount.focus();
  elements.payablePaymentAmount.select();
}

function closePayablePaymentDialog() {
  elements.payablePaymentDialog.close();
}

async function submitPayablePayment(event) {
  event.preventDefault();
  const formData = new FormData(elements.payablePaymentForm);
  elements.payablePaymentFormError.hidden = true;
  elements.savePayablePaymentButton.disabled = true;
  elements.savePayablePaymentButton.textContent = 'Aplicando pago…';
  try {
    const invoiceId = selectedPayable.id;
    await getJson(`/api/payables/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    closePayablePaymentDialog();
    await loadPayables();
    await loadPayableDetail(invoiceId);
    showToast('Pago aplicado y saldo actualizado.');
  } catch (error) {
    elements.payablePaymentFormError.textContent = error.message;
    elements.payablePaymentFormError.hidden = false;
  } finally {
    elements.savePayablePaymentButton.disabled = false;
    elements.savePayablePaymentButton.textContent = 'Aplicar pago';
  }
}

function accessRequestHeaders() {
  return {
    'x-tenant-id': activeTenantId,
  };
}

function userInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'US';
}

function userStatusMeta(status) {
  const statuses = {
    ACTIVE: { label: 'Activo', className: 'active' },
    INVITED: { label: 'Invitado', className: 'invited' },
    SUSPENDED: { label: 'Suspendido', className: 'suspended' },
  };
  return statuses[status] || statuses.SUSPENDED;
}

function permissionName(code) {
  return accessPermissions.find((permission) => permission.code === code)?.name || code;
}

function roleForUser(user) {
  return accessRoles.find((role) => role.id === user.role_id) || null;
}

function setUserSummary(summary = {}) {
  elements.userTotalMembers.textContent = String(summary.total_members || 0);
  elements.userActiveMembers.textContent = String(summary.active_members || 0);
  elements.userPendingInvites.textContent = String(summary.pending_invites || 0);
  elements.userRolesInUse.textContent = String(summary.roles_in_use || 0);
}

function showUsersError(message) {
  teamUsers = [];
  accessRoles = [];
  accessPermissions = [];
  selectedTeamUser = null;
  setUserSummary();
  elements.userList.replaceChildren();
  elements.roleGrid.replaceChildren();
  elements.userDataState.hidden = false;
  elements.userDataState.classList.add('error');
  elements.userDataState.querySelector('strong').textContent =
    'No pudimos consultar el equipo';
  elements.userDataState.querySelector('p').textContent = message;
  elements.roleDataState.hidden = false;
  elements.roleDataState.classList.add('error');
  elements.roleDataState.querySelector('strong').textContent =
    'No pudimos consultar los roles';
  elements.roleDataState.querySelector('p').textContent = message;
  elements.userRecordCount.textContent = '—';
  elements.userDetailContent.hidden = true;
  elements.userDetailEmpty.hidden = false;
}

function renderUserList() {
  const search = normalizeSearch(elements.userSearch.value.trim());
  const filter = elements.userStatusFilter.value;
  const filtered = teamUsers.filter((user) => {
    const matchesSearch = !search || normalizeSearch([
      user.full_name,
      user.email,
      user.job_title,
      user.role_name,
      user.branch_name,
    ].filter(Boolean).join(' ')).includes(search);
    return matchesSearch && (filter === 'ALL' || user.status === filter);
  });
  elements.userList.replaceChildren();
  elements.userRecordCount.textContent = String(filtered.length);
  elements.userDataState.hidden = filtered.length > 0;
  elements.userDataState.classList.remove('error');
  if (!filtered.length) {
    elements.userDataState.querySelector('strong').textContent =
      search || filter !== 'ALL' ? 'No hay coincidencias' : 'No hay personas';
    elements.userDataState.querySelector('p').textContent =
      search || filter !== 'ALL'
        ? 'Cambia la búsqueda o consulta todos los estados.'
        : 'Invita a la primera persona para organizar el equipo.';
    return;
  }
  for (const user of filtered) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'user-card';
    if (selectedTeamUser?.id === user.id) button.classList.add('selected');
    const avatar = document.createElement('span');
    avatar.className = 'user-avatar';
    avatar.textContent = userInitials(user.full_name);
    const main = document.createElement('span');
    main.className = 'user-card-main';
    const name = document.createElement('strong');
    name.textContent = user.full_name;
    const email = document.createElement('span');
    email.textContent = user.email;
    const scope = document.createElement('small');
    scope.textContent =
      `${user.role_name} · ${user.branch_name || 'Toda la empresa'}`;
    main.append(name, email, scope);
    const side = document.createElement('span');
    side.className = 'user-card-side';
    const statusMeta = userStatusMeta(user.status);
    const status = document.createElement('span');
    status.className = `user-status ${statusMeta.className}`;
    status.textContent = statusMeta.label;
    const activity = document.createElement('small');
    activity.textContent = user.last_login_at ? 'Con actividad' : 'Sin ingreso';
    side.append(status, activity);
    button.append(avatar, main, side);
    button.addEventListener('click', () => selectTeamUser(user.id));
    elements.userList.append(button);
  }
}

function renderUserDetail(user) {
  selectedTeamUser = user;
  const role = roleForUser(user);
  const permissions = role?.permissions || [];
  const status = userStatusMeta(user.status);
  elements.userDetailEmpty.hidden = true;
  elements.userDetailContent.hidden = false;
  elements.userDetailAvatar.textContent = userInitials(user.full_name);
  elements.userDetailRole.textContent = user.role_name;
  elements.userDetailName.textContent = user.full_name;
  elements.userDetailEmail.textContent = user.email;
  elements.userDetailStatus.textContent = status.label;
  elements.userDetailStatus.className = `user-status ${status.className}`;
  elements.userDetailJob.textContent = user.job_title || 'Sin cargo registrado';
  elements.userDetailBranch.textContent = user.branch_name || 'Toda la empresa';
  elements.userDetailJoined.textContent =
    user.joined_at ? formatShortDate(user.joined_at) : 'Pendiente';
  elements.userDetailLastLogin.textContent =
    user.last_login_at ? formatShortDate(user.last_login_at) : 'Sin ingreso';
  elements.resetUserAccessButton.hidden = user.status === 'SUSPENDED';
  elements.userDetailPermissionCount.textContent =
    `${permissions.length} ${permissions.length === 1 ? 'acceso' : 'accesos'}`;
  elements.userDetailPermissions.replaceChildren();
  const visiblePermissions = permissions.slice(0, 6);
  for (const code of visiblePermissions) {
    const tag = document.createElement('span');
    tag.textContent = permissionName(code);
    elements.userDetailPermissions.append(tag);
  }
  if (permissions.length > visiblePermissions.length) {
    const more = document.createElement('span');
    more.textContent = `+${permissions.length - visiblePermissions.length} más`;
    elements.userDetailPermissions.append(more);
  }
  renderUserList();
}

function selectTeamUser(userId) {
  const user = teamUsers.find((item) => item.id === userId);
  if (user) renderUserDetail(user);
}

function renderRoles() {
  elements.roleGrid.replaceChildren();
  elements.roleDataState.hidden = accessRoles.length > 0;
  elements.roleDataState.classList.remove('error');
  if (!accessRoles.length) {
    elements.roleDataState.querySelector('strong').textContent = 'No hay roles';
    elements.roleDataState.querySelector('p').textContent =
      'Crea un rol para organizar los permisos.';
    return;
  }
  for (const role of accessRoles) {
    const card = document.createElement('article');
    card.className = 'role-card';
    const top = document.createElement('div');
    top.className = 'role-card-top';
    const icon = document.createElement('span');
    icon.className = `role-icon ${role.color.toLocaleLowerCase('es')}`;
    icon.textContent = role.code === 'OWNER' ? '★' : userInitials(role.name);
    const type = document.createElement('span');
    type.className = 'role-base-label';
    type.textContent = role.is_system ? 'Rol base' : 'Personalizado';
    top.append(icon, type);
    const name = document.createElement('h4');
    name.textContent = role.name;
    const description = document.createElement('p');
    description.textContent = role.description || 'Perfil de acceso personalizado.';
    const tags = document.createElement('div');
    tags.className = 'role-card-permissions';
    for (const permission of role.permissions.slice(0, 4)) {
      const tag = document.createElement('span');
      tag.textContent = permissionName(permission);
      tags.append(tag);
    }
    if (role.permissions.length > 4) {
      const tag = document.createElement('span');
      tag.textContent = `+${role.permissions.length - 4}`;
      tags.append(tag);
    }
    const footer = document.createElement('div');
    footer.className = 'role-card-footer';
    const members = document.createElement('span');
    members.textContent =
      `${role.member_count} ${Number(role.member_count) === 1 ? 'persona' : 'personas'}`;
    if (role.is_system) {
      const protectedLabel = document.createElement('span');
      protectedLabel.className = 'role-base-label';
      protectedLabel.textContent = 'Protegido';
      footer.append(members, protectedLabel);
    } else {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'role-edit-button';
      edit.textContent = 'Editar permisos';
      edit.addEventListener('click', () => openRoleDialog(role));
      footer.append(members, edit);
    }
    card.append(top, name, description, tags, footer);
    elements.roleGrid.append(card);
  }
}

async function loadUsers() {
  if (!activeTenantId) {
    showUsersError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  try {
    const headers = accessRequestHeaders();
    const [summary, roles, permissions, users] = await Promise.all([
      getJson('/api/users/summary', { headers }),
      getJson('/api/users/roles', { headers }),
      getJson('/api/users/permissions', { headers }),
      getJson('/api/users', { headers }),
    ]);
    accessRoles = roles;
    accessPermissions = permissions;
    teamUsers = users;
    setUserSummary(summary);
    renderRoles();
    renderUserList();
    if (selectedTeamUser) {
      const current = users.find((user) => user.id === selectedTeamUser.id);
      if (current) renderUserDetail(current);
      else selectedTeamUser = null;
    }
    if (!selectedTeamUser && users.length) selectTeamUser(users[0].id);
    return users;
  } catch (error) {
    showUsersError(error.message);
    throw error;
  }
}

function showUserPanel(panel) {
  const roles = panel === 'roles';
  elements.teamPanel.hidden = roles;
  elements.rolesPanel.hidden = !roles;
  elements.showTeamPanelButton.classList.toggle('active', !roles);
  elements.showRolesPanelButton.classList.toggle('active', roles);
  elements.showTeamPanelButton.setAttribute('aria-selected', String(!roles));
  elements.showRolesPanelButton.setAttribute('aria-selected', String(roles));
}

function fillUserFormSelects() {
  fillInventorySelect(
    elements.userRoleId,
    'Selecciona un rol',
    accessRoles,
    (role) => `${role.name} · ${role.permissions.length} accesos`,
  );
  fillInventorySelect(
    elements.userBranchId,
    'Toda la empresa',
    branches,
    (branch) => `${branch.name} · ${branch.code}`,
  );
}

function openInviteUserDialog() {
  editingTeamUser = null;
  elements.userForm.reset();
  elements.userFormError.hidden = true;
  elements.userDialogEyebrow.textContent = 'Nueva persona';
  elements.userDialogTitle.textContent = 'Invitar al equipo';
  elements.userDialogCopy.textContent =
    'Define su identidad, el rol que tendrá y si trabajará en toda la empresa o en una sucursal.';
  elements.userEmailInput.disabled = false;
  elements.userEmailInput.required = true;
  elements.userStatusField.hidden = true;
  elements.saveUserButton.textContent = 'Enviar invitación';
  fillUserFormSelects();
  elements.userDialog.showModal();
  elements.userForm.elements.fullName.focus();
}

function openEditUserDialog() {
  if (!selectedTeamUser) return;
  editingTeamUser = selectedTeamUser;
  elements.userForm.reset();
  elements.userFormError.hidden = true;
  elements.userDialogEyebrow.textContent = 'Membresía y alcance';
  elements.userDialogTitle.textContent = 'Editar acceso';
  elements.userDialogCopy.textContent =
    'Actualiza el perfil operativo sin cambiar la identidad del correo.';
  fillUserFormSelects();
  elements.userForm.elements.fullName.value = selectedTeamUser.full_name;
  elements.userEmailInput.value = selectedTeamUser.email;
  elements.userEmailInput.disabled = true;
  elements.userEmailInput.required = false;
  elements.userForm.elements.jobTitle.value = selectedTeamUser.job_title || '';
  elements.userForm.elements.phone.value = selectedTeamUser.phone || '';
  elements.userRoleId.value = selectedTeamUser.role_id;
  elements.userBranchId.value = selectedTeamUser.branch_id || '';
  elements.userStatus.value = selectedTeamUser.status;
  elements.userStatusField.hidden = false;
  elements.saveUserButton.textContent = 'Guardar acceso';
  elements.userDialog.showModal();
  elements.userForm.elements.fullName.focus();
}

function closeUserDialog() {
  elements.userDialog.close();
  editingTeamUser = null;
}

function showActivationLink(token) {
  const base = window.location.protocol === 'file:'
    ? 'http://localhost:4100/'
    : `${window.location.origin}${window.location.pathname}`;
  const url = new URL(base);
  url.searchParams.set('activate', token);
  elements.activationLinkValue.value = url.toString();
  elements.activationLinkDialog.showModal();
}

function closeActivationLinkDialog() {
  elements.activationLinkDialog.close();
}

async function generateUserAccessLink() {
  if (!selectedTeamUser) return;
  elements.resetUserAccessButton.disabled = true;
  try {
    const result = await getJson(`/api/users/${selectedTeamUser.id}/access-link`, {
      method: 'POST',
      headers: {
        ...accessRequestHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: selectedTeamUser.status === 'INVITED'
          ? 'Reenvío de invitación'
          : 'Recuperación de contraseña solicitada',
      }),
    });
    showActivationLink(result.activationToken);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.resetUserAccessButton.disabled = false;
  }
}

async function copyActivationLink() {
  try {
    await navigator.clipboard.writeText(elements.activationLinkValue.value);
    showToast('Enlace de activación copiado.');
  } catch {
    elements.activationLinkValue.select();
    document.execCommand('copy');
    showToast('Enlace de activación copiado.');
  }
}

async function submitUser(event) {
  event.preventDefault();
  const formData = new FormData(elements.userForm);
  const editing = Boolean(editingTeamUser);
  const payload = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    jobTitle: formData.get('jobTitle'),
    phone: formData.get('phone'),
    roleId: formData.get('roleId'),
    branchId: formData.get('branchId') || null,
    status: editing ? formData.get('status') : undefined,
    reason: formData.get('reason'),
  };
  elements.userFormError.hidden = true;
  elements.saveUserButton.disabled = true;
  elements.saveUserButton.textContent = editing ? 'Guardando…' : 'Invitando…';
  try {
    const targetId = editingTeamUser?.id;
    const savedUser = await getJson(editing ? `/api/users/${targetId}` : '/api/users/invite', {
      method: editing ? 'PATCH' : 'POST',
      headers: {
        ...accessRequestHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    elements.userDialog.close();
    editingTeamUser = null;
    await loadUsers();
    if (targetId) selectTeamUser(targetId);
    if (!editing && savedUser.activationToken) {
      showActivationLink(savedUser.activationToken);
    }
    showToast(editing ? 'Acceso actualizado correctamente.' : 'Invitación preparada.');
  } catch (error) {
    elements.userFormError.textContent = error.message;
    elements.userFormError.hidden = false;
  } finally {
    elements.saveUserButton.disabled = false;
    elements.saveUserButton.textContent = editing ? 'Guardar acceso' : 'Enviar invitación';
  }
}

function renderPermissionPicker(selected = []) {
  elements.rolePermissionPicker.replaceChildren();
  let currentGroup = '';
  for (const permission of accessPermissions) {
    if (permission.group !== currentGroup) {
      currentGroup = permission.group;
      const group = document.createElement('strong');
      group.className = 'permission-group-title';
      group.textContent = currentGroup;
      elements.rolePermissionPicker.append(group);
    }
    const label = document.createElement('label');
    label.className = 'permission-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'permissions';
    checkbox.value = permission.code;
    checkbox.checked = selected.includes(permission.code);
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = permission.name;
    const description = document.createElement('small');
    description.textContent = permission.description;
    copy.append(name, description);
    label.append(checkbox, copy);
    elements.rolePermissionPicker.append(label);
  }
}

function openRoleDialog(role = null) {
  editingAccessRole = role;
  elements.roleForm.reset();
  elements.roleFormError.hidden = true;
  elements.roleDialogTitle.textContent = role ? 'Editar rol personalizado' : 'Crear rol';
  if (role) {
    elements.roleForm.elements.name.value = role.name;
    elements.roleForm.elements.color.value = role.color;
    elements.roleForm.elements.description.value = role.description || '';
  }
  renderPermissionPicker(role?.permissions || []);
  elements.saveRoleButton.textContent = role ? 'Actualizar rol' : 'Guardar rol';
  elements.roleDialog.showModal();
  elements.roleForm.elements.name.focus();
}

function closeRoleDialog() {
  elements.roleDialog.close();
  editingAccessRole = null;
}

async function submitRole(event) {
  event.preventDefault();
  const formData = new FormData(elements.roleForm);
  const editing = Boolean(editingAccessRole);
  const payload = {
    name: formData.get('name'),
    color: formData.get('color'),
    description: formData.get('description'),
    permissions: formData.getAll('permissions'),
  };
  elements.roleFormError.hidden = true;
  elements.saveRoleButton.disabled = true;
  elements.saveRoleButton.textContent = 'Guardando…';
  try {
    await getJson(
      editing ? `/api/users/roles/${editingAccessRole.id}` : '/api/users/roles',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          ...accessRequestHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );
    closeRoleDialog();
    await loadUsers();
    showUserPanel('roles');
    showToast(editing ? 'Permisos del rol actualizados.' : 'Rol personalizado creado.');
  } catch (error) {
    elements.roleFormError.textContent = error.message;
    elements.roleFormError.hidden = false;
  } finally {
    elements.saveRoleButton.disabled = false;
    elements.saveRoleButton.textContent = editing ? 'Actualizar rol' : 'Guardar rol';
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
  elements.dashboardInventoryValue.textContent =
    formatCurrency(summary.inventory_value || 0);
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
    showPayablesError('Primero debes registrar o seleccionar una empresa.');
    showUsersError('Primero debes registrar o seleccionar una empresa.');
    showPosError('Primero debes registrar o seleccionar una empresa.');
    showReceivableError('Primero debes registrar o seleccionar una empresa.');
    showAuditError('Primero debes registrar o seleccionar una empresa.');
    showReportsError('Primero debes registrar o seleccionar una empresa.');
    setExecutiveSummary();
    setMetric(elements.branchCount, elements.branchDetail, { status: 'rejected' }, ['sucursal', 'sucursales']);
    setMetric(elements.warehouseCount, elements.warehouseDetail, { status: 'rejected' }, ['bodega registrada', 'bodegas registradas']);
    setMetric(elements.productCount, elements.productDetail, { status: 'rejected' }, ['producto registrado', 'productos registrados']);
    return;
  }

  const results = await Promise.allSettled([
    hasAnyPermission('dashboard.view', 'branches.manage', 'inventory.view', 'sales.operate')
      ? loadBranches() : Promise.resolve([]),
    hasAnyPermission('inventory.view', 'warehouses.manage', 'purchases.manage', 'sales.operate')
      ? loadWarehouses() : Promise.resolve([]),
    hasAnyPermission('inventory.view', 'inventory.adjust')
      ? loadInventory() : Promise.resolve([]),
    hasAnyPermission('inventory.view', 'inventory.adjust')
      ? loadPhysicalCounts() : Promise.resolve([]),
    hasAnyPermission('inventory.view', 'catalog.manage', 'purchases.manage', 'sales.operate')
      ? loadCatalog() : Promise.resolve([]),
    hasAnyPermission('purchases.manage') ? loadPurchases() : Promise.resolve([]),
    hasAnyPermission('payables.manage') ? loadPayables() : Promise.resolve([]),
    hasAnyPermission('sales.operate') ? loadPos() : Promise.resolve([]),
    hasAnyPermission('receivables.manage') ? loadReceivables() : Promise.resolve([]),
    hasAnyPermission('users.manage') ? loadUsers() : Promise.resolve([]),
    hasAnyPermission('dashboard.view') ? loadExecutiveSummary() : Promise.resolve({}),
    hasAnyPermission('audit.view') && !activeMembership()?.branchId
      ? loadAudit() : Promise.resolve({}),
    hasAnyPermission('reports.view') ? loadReports() : Promise.resolve({}),
  ]);
  syncInventoryWarehouseFilter();
  renderInventoryBalances();
  elements.newPurchaseButton.disabled =
    !suppliers.some((supplier) => supplier.active) ||
    !products.length ||
    !branches.length;
  if (hasAnyPermission('sales.operate')) {
    await syncPosWorkstation().catch(() => {});
  }
  setMetric(elements.branchCount, elements.branchDetail, results[0], ['sucursal', 'sucursales']);
  setMetric(elements.warehouseCount, elements.warehouseDetail, results[1], ['bodega registrada', 'bodegas registradas']);
  setMetric(elements.productCount, elements.productDetail, results[4], ['producto registrado', 'productos registrados']);
}

function reportQueryString({ includePage = true } = {}) {
  const params = new URLSearchParams();
  const filters = [
    ['q', elements.reportSearch.value.trim()],
    ['branchId', elements.reportBranchFilter.value],
    ['dateFrom', elements.reportDateFrom.value],
    ['dateTo', elements.reportDateTo.value],
  ];
  filters.forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (includePage) {
    params.set('page', String(reportPagination.page));
    params.set('pageSize', String(reportPagination.pageSize));
  }
  return params.toString();
}

function setReportOverview(overview = {}) {
  elements.reportSalesMonth.textContent = formatCurrency(overview.sales_month || 0);
  elements.reportInventoryValue.textContent = formatCurrency(overview.inventory_value || 0);
  elements.reportPendingPurchases.textContent = formatCurrency(overview.pending_purchases || 0);
  elements.reportReceivables.textContent = formatCurrency(overview.receivables || 0);
  elements.reportPayables.textContent = formatCurrency(overview.payables || 0);
}

function renderReportFacets(facets) {
  const current = elements.reportBranchFilter.value;
  elements.reportBranchFilter.replaceChildren();
  const all = document.createElement('option');
  all.value = '';
  all.textContent = facets.branchLocked ? 'Sucursal asignada' : 'Todas las sucursales';
  elements.reportBranchFilter.append(all);
  (facets.branches || []).forEach((branch) => {
    const option = document.createElement('option');
    option.value = branch.id;
    option.textContent = `${branch.name} · ${branch.code}`;
    elements.reportBranchFilter.append(option);
  });
  if ([...elements.reportBranchFilter.options].some((option) => option.value === current)) {
    elements.reportBranchFilter.value = current;
  }
  if (facets.branchLocked && facets.branches?.length) {
    elements.reportBranchFilter.value = facets.branches[0].id;
    elements.reportBranchFilter.disabled = true;
  } else {
    elements.reportBranchFilter.disabled = false;
  }
}

function reportNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits,
  }).format(Number(value || 0));
}

function formatReportValue(value, type) {
  if (value == null || value === '') return '—';
  if (type === 'currency') return formatCurrency(value);
  if (type === 'number') return reportNumber(value, 4);
  if (type === 'percent') return `${reportNumber(value, 1)} %`;
  if (type === 'date') return formatShortDate(value);
  if (type === 'dateTime') {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
  if (type === 'status') return auditHumanLabel(value);
  return String(value);
}

function renderReportTable() {
  elements.reportTableHead.replaceChildren();
  elements.reportTableBody.replaceChildren();
  reportColumns.forEach(([, label]) => {
    const heading = document.createElement('th');
    heading.scope = 'col';
    heading.textContent = label;
    elements.reportTableHead.append(heading);
  });

  reportItems.forEach((item) => {
    const row = document.createElement('tr');
    reportColumns.forEach(([key, _label, type]) => {
      const cell = document.createElement('td');
      cell.className = `report-cell-${type}`;
      const value = formatReportValue(item[key], type);
      if (type === 'status') {
        const badge = document.createElement('span');
        badge.textContent = value;
        cell.append(badge);
      } else {
        cell.textContent = value;
      }
      row.append(cell);
    });
    elements.reportTableBody.append(row);
  });

  elements.reportRecordCount.textContent =
    `${reportPagination.total} ${reportPagination.total === 1 ? 'registro' : 'registros'}`;
  elements.reportPageLabel.textContent =
    `Página ${reportPagination.page} de ${reportPagination.totalPages}`;
  elements.reportPreviousPage.disabled = reportPagination.page <= 1;
  elements.reportNextPage.disabled = reportPagination.page >= reportPagination.totalPages;

  if (!reportItems.length) {
    elements.reportDataState.hidden = false;
    elements.reportDataState.querySelector('strong').textContent = 'No hay datos para estos filtros';
    elements.reportDataState.querySelector('p').textContent =
      'Prueba con otra sucursal, amplía las fechas o limpia la búsqueda.';
  } else {
    elements.reportDataState.hidden = true;
  }
}

function setReportType(type) {
  activeReportType = type;
  reportPagination.page = 1;
  document.querySelectorAll('[data-report-type]').forEach((button) => {
    const active = button.dataset.reportType === type;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const inventorySelected = type === 'inventory';
  elements.reportDateFrom.disabled = inventorySelected;
  elements.reportDateTo.disabled = inventorySelected;
  if (inventorySelected) {
    elements.reportDateFrom.value = '';
    elements.reportDateTo.value = '';
  }
  loadReports().catch(() => {});
}

function showReportsError(message) {
  reportItems = [];
  reportColumns = [];
  reportPagination = { page: 1, pageSize: 50, total: 0, totalPages: 1 };
  renderReportTable();
  setReportOverview();
  elements.reportDataState.hidden = false;
  elements.reportDataState.querySelector('strong').textContent = 'Reportes no disponibles';
  elements.reportDataState.querySelector('p').textContent = message;
}

async function loadReports() {
  if (!activeTenantId) {
    showReportsError('Selecciona una empresa para consultar sus reportes.');
    return {};
  }
  elements.reportDataState.hidden = false;
  elements.reportDataState.querySelector('strong').textContent = 'Preparando reporte';
  elements.reportDataState.querySelector('p').textContent =
    'Estamos consolidando la información solicitada.';
  const branchQuery = elements.reportBranchFilter.value
    ? `?branchId=${encodeURIComponent(elements.reportBranchFilter.value)}`
    : '';
  const needsFacets = reportFacetsLoadedForTenant !== activeTenantId;
  try {
    const [overview, facets, result] = await Promise.all([
      getJson(`/api/reports/overview${branchQuery}`, {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      needsFacets
        ? getJson('/api/reports/facets', {
          headers: { 'x-tenant-id': activeTenantId },
        })
        : Promise.resolve(null),
      getJson(`/api/reports/${activeReportType}?${reportQueryString()}`, {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    if (facets) {
      renderReportFacets(facets);
      reportFacetsLoadedForTenant = activeTenantId;
    }
    setReportOverview(overview);
    reportColumns = result.report.columns;
    reportItems = result.items;
    reportPagination = result.pagination;
    elements.activeReportTitle.textContent = result.report.name;
    elements.reportExportLabel.textContent = result.report.name;
    renderReportTable();
    return result;
  } catch (error) {
    showReportsError(error.message);
    throw error;
  }
}

function scheduleReportReload() {
  window.clearTimeout(reportSearchTimer);
  reportSearchTimer = window.setTimeout(() => {
    reportPagination.page = 1;
    loadReports().catch(() => {});
  }, 260);
}

function clearReportFilters() {
  elements.reportSearch.value = '';
  if (!elements.reportBranchFilter.disabled) elements.reportBranchFilter.value = '';
  elements.reportDateFrom.value = '';
  elements.reportDateTo.value = '';
  reportPagination.page = 1;
  loadReports().catch(() => {});
}

async function exportActiveReport() {
  elements.exportReportButton.disabled = true;
  try {
    const queryString = reportQueryString({ includePage: false });
    const response = await fetch(
      `${API_BASE_URL}/api/reports/${activeReportType}/export.csv` +
      `${queryString ? `?${queryString}` : ''}`,
      {
        credentials: 'include',
        headers: {
          Accept: 'text/csv',
          'x-tenant-id': activeTenantId,
        },
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'No fue posible exportar el reporte.');
    }
    const disposition = response.headers.get('content-disposition') || '';
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ||
      `megasuite-${activeReportType}.csv`;
    const url = URL.createObjectURL(await response.blob());
    const download = document.createElement('a');
    download.href = url;
    download.download = filename;
    document.body.append(download);
    download.click();
    download.remove();
    URL.revokeObjectURL(url);
    showToast('Reporte exportado correctamente.');
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.exportReportButton.disabled = false;
  }
}

function auditHumanLabel(value) {
  if (!value) return 'Sin identificar';
  const words = String(value)
    .replaceAll('.', ' ')
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLocaleLowerCase('es');
  return words.charAt(0).toLocaleUpperCase('es') + words.slice(1);
}

function auditDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function auditFiltersQuery({ includePage = true } = {}) {
  const params = new URLSearchParams();
  const filters = [
    ['q', elements.auditSearch.value.trim()],
    ['actorId', elements.auditActorFilter.value],
    ['entityType', elements.auditEntityFilter.value],
    ['action', elements.auditActionFilter.value],
    ['dateFrom', elements.auditDateFrom.value],
    ['dateTo', elements.auditDateTo.value],
  ];
  filters.forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (includePage) {
    params.set('page', String(auditPagination.page));
    params.set('pageSize', String(auditPagination.pageSize));
  }
  return params.toString();
}

function setAuditSummary(summary = {}) {
  elements.auditToday.textContent = String(summary.today || 0);
  elements.auditMonth.textContent = String(summary.last_30_days || 0);
  elements.auditWeek.textContent = `${summary.last_7_days || 0} en los últimos 7 días`;
  elements.auditActors.textContent = String(summary.active_actors || 0);
  elements.auditActionTypes.textContent = String(summary.action_types || 0);
  elements.auditTotal.textContent =
    `${summary.total || 0} ${(summary.total || 0) === 1 ? 'evento histórico' : 'eventos históricos'}`;
}

function fillAuditSelect(select, placeholder, rows, valueKey, labelFor) {
  const current = select.value;
  select.replaceChildren();
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = placeholder;
  select.append(empty);
  rows.forEach((row) => {
    const option = document.createElement('option');
    option.value = row[valueKey];
    option.textContent = `${labelFor(row)} · ${row.event_count}`;
    select.append(option);
  });
  if ([...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

function renderAuditFacets(facets) {
  fillAuditSelect(
    elements.auditActorFilter,
    'Todas las personas',
    facets.actors || [],
    'id',
    (row) => row.full_name || row.email,
  );
  fillAuditSelect(
    elements.auditEntityFilter,
    'Todos los módulos',
    facets.entities || [],
    'entity_type',
    (row) => auditHumanLabel(row.entity_type),
  );
  fillAuditSelect(
    elements.auditActionFilter,
    'Todas las acciones',
    facets.actions || [],
    'action',
    (row) => auditHumanLabel(row.action),
  );
}

function auditEventSymbol(action) {
  const segment = String(action || 'A').split(/[._]/).filter(Boolean).at(-1) || 'A';
  return segment.slice(0, 2).toUpperCase();
}

function renderAuditEvents() {
  elements.auditEventList.replaceChildren();
  elements.auditRecordCount.textContent =
    `${auditPagination.total} ${auditPagination.total === 1 ? 'evento' : 'eventos'}`;
  if (!auditEvents.length) {
    const hasFilters = Boolean(
      elements.auditSearch.value.trim() ||
      elements.auditActorFilter.value ||
      elements.auditEntityFilter.value ||
      elements.auditActionFilter.value ||
      elements.auditDateFrom.value ||
      elements.auditDateTo.value,
    );
    elements.auditDataState.hidden = false;
    elements.auditDataState.querySelector('strong').textContent = hasFilters
      ? 'No hay eventos para estos filtros'
      : 'La bitácora está lista';
    elements.auditDataState.querySelector('p').textContent =
      hasFilters
        ? 'Amplía las fechas o limpia alguno de los criterios de búsqueda.'
        : 'Las próximas operaciones importantes aparecerán aquí con su responsable y detalle.';
  } else {
    elements.auditDataState.hidden = true;
  }

  auditEvents.forEach((event) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'audit-event';
    button.classList.toggle('active', String(event.id) === String(selectedAuditEventId));
    button.dataset.auditEventId = event.id;

    const symbol = document.createElement('span');
    symbol.className = 'audit-event-symbol';
    symbol.textContent = auditEventSymbol(event.action);

    const main = document.createElement('span');
    main.className = 'audit-event-main';
    const title = document.createElement('strong');
    title.textContent = auditHumanLabel(event.action);
    const description = document.createElement('span');
    const actor = event.actor_name || event.actor_email || 'Sistema';
    const entity = auditHumanLabel(event.entity_type);
    description.textContent = `${actor} · ${entity}${event.entity_id ? ` #${event.entity_id}` : ''}`;
    main.append(title, description);

    const time = document.createElement('span');
    time.className = 'audit-event-time';
    time.textContent = auditDateTime(event.created_at);
    button.append(symbol, main, time);
    button.addEventListener('click', () => showAuditDetail(event.id));
    elements.auditEventList.append(button);
  });

  elements.auditLoadMore.hidden =
    auditPagination.page >= auditPagination.totalPages || !auditEvents.length;
}

function displayAuditValue(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function renderAuditObject(container, data) {
  container.replaceChildren();
  const entries = data && typeof data === 'object' ? Object.entries(data) : [];
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'audit-change-empty';
    empty.textContent = 'Sin información registrada';
    container.append(empty);
    return;
  }
  entries.forEach(([key, value]) => {
    const row = document.createElement('div');
    row.className = 'audit-change-row';
    const label = document.createElement('span');
    label.textContent = auditHumanLabel(key);
    const content = document.createElement('span');
    content.textContent = displayAuditValue(value);
    row.append(label, content);
    container.append(row);
  });
}

async function showAuditDetail(eventId) {
  selectedAuditEventId = eventId;
  renderAuditEvents();
  try {
    const detail = await getJson(`/api/audit/events/${eventId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    if (String(selectedAuditEventId) !== String(eventId)) return;
    elements.auditDetailEmpty.hidden = true;
    elements.auditDetailContent.hidden = false;
    elements.auditDetailAction.textContent = auditHumanLabel(detail.action);
    elements.auditDetailEntity.textContent =
      `${auditHumanLabel(detail.entity_type)}${detail.entity_id ? ` · ${detail.entity_id}` : ''}`;
    elements.auditDetailId.textContent = `#${detail.id}`;
    elements.auditDetailActor.textContent =
      detail.actor_name || detail.actor_email || 'Sistema';
    elements.auditDetailDate.textContent = auditDateTime(detail.created_at);
    elements.auditDetailReason.textContent = detail.reason || 'Sin motivo registrado';
    renderAuditObject(elements.auditBeforeData, detail.before_data);
    renderAuditObject(elements.auditAfterData, detail.after_data);
    renderAuditObject(elements.auditMetadata, detail.metadata);
  } catch (error) {
    showToast(error.message);
  }
}

function showAuditError(message) {
  auditEvents = [];
  auditPagination = { page: 1, pageSize: 30, total: 0, totalPages: 1 };
  renderAuditEvents();
  elements.auditDataState.hidden = false;
  elements.auditDataState.querySelector('strong').textContent = 'Auditoría no disponible';
  elements.auditDataState.querySelector('p').textContent = message;
  setAuditSummary();
}

async function loadAudit({ append = false } = {}) {
  if (!activeTenantId) {
    showAuditError('Selecciona una empresa para consultar su trazabilidad.');
    return {};
  }
  if (!append) {
    auditPagination.page = 1;
    elements.auditDataState.hidden = false;
    elements.auditDataState.querySelector('strong').textContent = 'Consultando actividad';
    elements.auditDataState.querySelector('p').textContent =
      'Estamos organizando los eventos más recientes.';
  }
  try {
    const needsFacets = auditFacetsLoadedForTenant !== activeTenantId;
    const [summary, facets, page] = await Promise.all([
      getJson('/api/audit/summary', { headers: { 'x-tenant-id': activeTenantId } }),
      needsFacets
        ? getJson('/api/audit/facets', { headers: { 'x-tenant-id': activeTenantId } })
        : Promise.resolve(null),
      getJson(`/api/audit/events?${auditFiltersQuery()}`, {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    setAuditSummary(summary);
    if (facets) {
      renderAuditFacets(facets);
      auditFacetsLoadedForTenant = activeTenantId;
    }
    auditEvents = append ? [...auditEvents, ...page.items] : page.items;
    auditPagination = page.pagination;
    if (!append && selectedAuditEventId &&
        !auditEvents.some((event) => String(event.id) === String(selectedAuditEventId))) {
      selectedAuditEventId = null;
      elements.auditDetailEmpty.hidden = false;
      elements.auditDetailContent.hidden = true;
    }
    renderAuditEvents();
    return page;
  } catch (error) {
    showAuditError(error.message);
    throw error;
  }
}

function scheduleAuditReload() {
  window.clearTimeout(auditSearchTimer);
  auditSearchTimer = window.setTimeout(() => {
    loadAudit().catch(() => {});
  }, 260);
}

function clearAuditFilters() {
  elements.auditSearch.value = '';
  elements.auditActorFilter.value = '';
  elements.auditEntityFilter.value = '';
  elements.auditActionFilter.value = '';
  elements.auditDateFrom.value = '';
  elements.auditDateTo.value = '';
  loadAudit().catch(() => {});
}

async function exportAuditCsv() {
  elements.exportAuditButton.disabled = true;
  elements.exportAuditButton.textContent = 'Preparando archivo…';
  try {
    const queryString = auditFiltersQuery({ includePage: false });
    const response = await fetch(
      `${API_BASE_URL}/api/audit/export.csv${queryString ? `?${queryString}` : ''}`,
      {
        credentials: 'include',
        headers: {
          Accept: 'text/csv',
          'x-tenant-id': activeTenantId,
        },
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'No fue posible exportar la auditoría.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const download = document.createElement('a');
    download.href = url;
    download.download =
      `megasuite-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(download);
    download.click();
    download.remove();
    URL.revokeObjectURL(url);
    showToast('Auditoría exportada en CSV.');
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.exportAuditButton.disabled = false;
    elements.exportAuditButton.replaceChildren();
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '↓';
    elements.exportAuditButton.append(icon, ' Exportar CSV');
  }
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
  'cuentas-pagar',
  'usuarios',
  'caja',
  'cartera',
  'reportes',
  'modulos',
  'auditoria',
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
  'cuentas-pagar': 'Cuentas por pagar',
  usuarios: 'Usuarios y accesos',
  caja: 'Caja & POS',
  cartera: 'Cuentas por cobrar',
  reportes: 'Reportes',
  modulos: 'Mapa del ERP',
  auditoria: 'Auditoría',
  sistema: 'Sistema',
};

function resolveView(hash = window.location.hash) {
  const requested = hash.replace(/^#/, '') || 'inicio';
  const resolved = viewAliases[requested] || requested;
  return availableViews.has(resolved) ? resolved : 'inicio';
}

function showView(requestedView, { scroll = true } = {}) {
  const requestedLink = [...document.querySelectorAll(`[data-view-link="${requestedView}"]`)]
    .find((link) => !link.hidden);
  if (currentUser && !requestedLink) {
    requestedView = [...document.querySelectorAll('[data-view-link]')]
      .find((link) => !link.hidden)?.dataset.viewLink || 'empresas';
  }
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
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    closeCompanyDialog();
    currentUser = await getJson('/api/auth/me');
    activeTenantId = createdCompany.id;
    saleCart.clear();
    posCatalog = [];
    await loadCompanies();
    renderAuthenticatedUser();
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

function syncTaxRateField() {
  const isTaxed = elements.taxTreatment.value === 'TAXED';
  elements.taxRate.disabled = !isTaxed;
  if (!isTaxed) elements.taxRate.value = '0';
}

function openTaxDialog() {
  if (!getActiveCompany()) {
    showToast('Primero registra o selecciona una empresa.');
    return;
  }
  elements.taxForm.reset();
  elements.taxTreatment.value = 'TAXED';
  elements.taxRate.value = '19';
  syncTaxRateField();
  elements.taxFormError.hidden = true;
  elements.taxDialog.showModal();
  elements.taxForm.elements.name.focus();
}

function closeTaxDialog() {
  elements.taxDialog.close();
}

async function submitTax(event) {
  event.preventDefault();
  elements.taxFormError.hidden = true;
  elements.saveTaxButton.disabled = true;
  elements.saveTaxButton.textContent = 'Creando impuesto…';
  const formData = new FormData(elements.taxForm);

  try {
    await getJson('/api/taxes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        name: formData.get('name'),
        code: formData.get('code'),
        treatment: formData.get('treatment'),
        rate: elements.taxRate.value,
        dianCode: formData.get('dianCode') || null,
      }),
    });
    closeTaxDialog();
    await loadCatalog();
    showCatalogPanel('taxes');
    showToast('Impuesto creado y disponible para los productos.');
  } catch (error) {
    elements.taxFormError.textContent = error.message;
    elements.taxFormError.hidden = false;
  } finally {
    elements.saveTaxButton.disabled = false;
    elements.saveTaxButton.textContent = 'Crear impuesto';
  }
}

function openProductTaxDialog(product) {
  if (!taxCategories.length) {
    showCatalogPanel('taxes');
    openTaxDialog();
    showToast('Primero crea el impuesto que vas a asignar.');
    return;
  }
  taxProduct = product;
  elements.productTaxForm.reset();
  replaceCatalogOptions(
    elements.assignedProductTaxId,
    'Selecciona un impuesto',
    taxCategories,
    (tax) => `${tax.name} · ${Number(tax.rate)}% · ${taxTreatmentLabel(tax.treatment)}`,
  );
  elements.assignedProductTaxId.value = product.sales_tax_category_id || '';
  elements.taxProductName.textContent = product.name;
  elements.productTaxForm.elements.reason.value = product.tax_name
    ? 'Actualización de la clasificación tributaria'
    : 'Clasificación tributaria inicial del producto';
  elements.productTaxFormError.hidden = true;
  elements.productTaxDialog.showModal();
  elements.assignedProductTaxId.focus();
}

function closeProductTaxDialog() {
  elements.productTaxDialog.close();
  taxProduct = null;
}

async function submitProductTax(event) {
  event.preventDefault();
  if (!taxProduct) return;
  elements.productTaxFormError.hidden = true;
  elements.saveProductTaxButton.disabled = true;
  elements.saveProductTaxButton.textContent = 'Guardando tratamiento…';
  const formData = new FormData(elements.productTaxForm);

  try {
    await getJson(`/api/products/${taxProduct.id}/tax`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        taxCategoryId: formData.get('taxCategoryId'),
        reason: formData.get('reason'),
      }),
    });
    closeProductTaxDialog();
    await loadCatalog();
    showToast('Tratamiento tributario actualizado y auditado.');
  } catch (error) {
    elements.productTaxFormError.textContent = error.message;
    elements.productTaxFormError.hidden = false;
  } finally {
    elements.saveProductTaxButton.disabled = false;
    elements.saveProductTaxButton.textContent = 'Guardar tratamiento';
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
    await Promise.all([loadPos(), loadExecutiveSummary()]);
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
  elements.cashDenominationGrid.querySelectorAll('input').forEach((input) => {
    input.value = '0';
  });
  elements.closeCashFormError.hidden = true;
  updateCashClosePreview();
  elements.closeCashDialog.showModal();
  elements.cashDenominationGrid.querySelector('input').focus();
}

function closeCloseCashDialog() {
  elements.closeCashDialog.close();
}

function cashCountLines() {
  return [...elements.cashDenominationGrid.querySelectorAll('input')]
    .map((input) => ({
      denomination: Number(input.dataset.denomination),
      quantity: Number(input.value || 0),
    }));
}

function updateCashClosePreview() {
  const expected = Number(posSummary.openSession?.calculated_cash || 0);
  const counted = cashCountLines().reduce(
    (total, line) => total + line.denomination * line.quantity,
    0,
  );
  const difference = counted - expected;
  elements.cashCloseExpected.textContent = formatCurrency(expected);
  elements.cashCloseCounted.textContent = formatCurrency(counted);
  elements.cashCloseDifference.textContent = formatCurrency(difference);
  elements.cashCloseDifference.style.color =
    Math.abs(difference) < 0.01 ? '#126579' : 'var(--color-purple-strong)';
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
      body: JSON.stringify({
        counts: cashCountLines(),
        notes: formData.get('notes'),
      }),
    });
    closeCloseCashDialog();
    await Promise.all([loadPos(), loadExecutiveSummary()]);
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

function openCashMovementDialog() {
  if (!posSummary.openSession) {
    showToast('Abre un turno antes de registrar movimientos.');
    return;
  }
  elements.cashMovementForm.reset();
  elements.cashMovementFormError.hidden = true;
  elements.cashMovementDialog.showModal();
  elements.cashMovementForm.elements.movementType.focus();
}

function closeCashMovementDialog() {
  elements.cashMovementDialog.close();
}

async function submitCashMovement(event) {
  event.preventDefault();
  const formData = new FormData(elements.cashMovementForm);
  elements.cashMovementFormError.hidden = true;
  elements.saveCashMovementButton.disabled = true;
  elements.saveCashMovementButton.textContent = 'Registrando…';
  try {
    await getJson(`/api/pos/sessions/${posSummary.openSession.id}/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    closeCashMovementDialog();
    await Promise.all([loadPos(), loadExecutiveSummary()]);
    showToast('Movimiento registrado y efectivo esperado actualizado.');
  } catch (error) {
    elements.cashMovementFormError.textContent = error.message;
    elements.cashMovementFormError.hidden = false;
  } finally {
    elements.saveCashMovementButton.disabled = false;
    elements.saveCashMovementButton.textContent = 'Registrar movimiento';
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
  elements.receiptCustomer.textContent = receipt.customer?.name || 'Consumidor final';
  elements.receiptPaymentMethod.textContent =
    paymentMethodLabels[receipt.payment_method] || receipt.payment_method;
  const creditSale = receipt.sale_terms === 'CREDIT';
  elements.receiptCreditRow.hidden = !creditSale;
  elements.receiptCreditReference.textContent = creditSale
    ? `${receipt.receivable?.invoice_number || 'Generada'} · vence ${formatShortDate(receipt.due_date)}`
    : '—';
  const cashPayment = receipt.payment_method === 'CASH';
  elements.receiptCashReceivedRow.hidden = !cashPayment;
  elements.receiptCashChangeRow.hidden = !cashPayment;
  elements.receiptCashReceived.textContent = formatCurrency(receipt.cash_received || 0);
  elements.receiptCashChange.textContent = formatCurrency(receipt.cash_change || 0);
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
        saleTerms: posSaleTerms,
        customerId: elements.posCustomerSelect.value || null,
        dueDate: posSaleTerms === 'CREDIT' ? elements.posCreditDueDate.value : null,
        cashReceived: elements.posPaymentMethod.value === 'CASH'
          && posSaleTerms === 'IMMEDIATE'
          ? Number(elements.posCashReceived.value)
          : null,
        items: [...saleCart.values()].map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    });
    saleCart.clear();
    elements.posCashReceived.value = '';
    elements.posCustomerSelect.value = '';
    posSaleTerms = 'IMMEDIATE';
    elements.posSaleTermButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.saleTerms === posSaleTerms);
    });
    renderPosCustomerContext();
    await Promise.all([
      loadPos(),
      loadExecutiveSummary(),
      loadPosCatalog(),
    ]);
    showReceipt(receipt);
    showToast('Venta registrada e inventario actualizado.');
  } catch (error) {
    elements.posSaleError.textContent = error.message;
    elements.posSaleError.hidden = false;
  } finally {
    renderCart();
  }
}

document.querySelector('#currentDate').textContent = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date());

elements.refreshButton.addEventListener('click', () => refreshStatus({ notify: true }));
elements.setupAccessForm.addEventListener('submit', submitSetupAccess);
elements.loginAccessForm.addEventListener('submit', submitLoginAccess);
elements.activateAccessForm.addEventListener('submit', submitActivateAccess);
elements.accountTrigger.addEventListener('click', () => {
  elements.accountMenu.hidden = !elements.accountMenu.hidden;
  elements.accountTrigger.setAttribute('aria-expanded', String(!elements.accountMenu.hidden));
});
elements.logoutButton.addEventListener('click', logout);
elements.closeActivationLinkDialog.addEventListener('click', closeActivationLinkDialog);
elements.finishActivationLinkButton.addEventListener('click', closeActivationLinkDialog);
elements.copyActivationLinkButton.addEventListener('click', copyActivationLink);
elements.activationLinkDialog.addEventListener('click', (event) => {
  if (event.target === elements.activationLinkDialog) closeActivationLinkDialog();
});
document.addEventListener('click', (event) => {
  if (!elements.accountMenu.hidden && !event.target.closest('.account-control')) {
    elements.accountMenu.hidden = true;
    elements.accountTrigger.setAttribute('aria-expanded', 'false');
  }
});
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
  selectedPayable = null;
  selectedTeamUser = null;
  selectedAuditEventId = null;
  auditEvents = [];
  auditFacetsLoadedForTenant = null;
  reportItems = [];
  reportFacetsLoadedForTenant = null;
  saveTenantPreference(activeTenantId);
  syncCompanyContext(activeTenantId);
  renderAuthenticatedUser();
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
elements.reloadPayablesButton.addEventListener('click', () => {
  loadPayables()
    .then(() => showToast('Cuentas por pagar actualizadas.'))
    .catch(() => showToast('No fue posible actualizar las obligaciones.'));
});
elements.payableSearch.addEventListener('input', renderPayableList);
elements.payableStatusFilter.addEventListener('change', renderPayableList);
elements.newPayableButton.addEventListener('click', openPayableDialog);
elements.closePayableDialog.addEventListener('click', closePayableDialog);
elements.cancelPayableButton.addEventListener('click', closePayableDialog);
elements.payableSourceType.addEventListener('change', updatePayableSourceFields);
elements.payablePurchaseId.addEventListener('change', updatePayablePurchasePreview);
elements.payableIssueDate.addEventListener('change', updatePayablePurchasePreview);
elements.payableForm.addEventListener('submit', submitPayable);
elements.payableDialog.addEventListener('click', (event) => {
  if (event.target === elements.payableDialog) closePayableDialog();
});
elements.newPayablePaymentButton.addEventListener('click', openPayablePaymentDialog);
elements.closePayablePaymentDialog.addEventListener('click', closePayablePaymentDialog);
elements.cancelPayablePaymentButton.addEventListener('click', closePayablePaymentDialog);
elements.payablePaymentForm.addEventListener('submit', submitPayablePayment);
elements.payablePaymentDialog.addEventListener('click', (event) => {
  if (event.target === elements.payablePaymentDialog) closePayablePaymentDialog();
});
elements.showTeamPanelButton.addEventListener('click', () => showUserPanel('team'));
elements.showRolesPanelButton.addEventListener('click', () => showUserPanel('roles'));
elements.userSearch.addEventListener('input', renderUserList);
elements.userStatusFilter.addEventListener('change', renderUserList);
elements.reloadUsersButton.addEventListener('click', () => {
  loadUsers()
    .then(() => showToast('Equipo y accesos actualizados.'))
    .catch(() => showToast('No fue posible actualizar los usuarios.'));
});
elements.inviteUserButton.addEventListener('click', openInviteUserDialog);
elements.editUserButton.addEventListener('click', openEditUserDialog);
elements.resetUserAccessButton.addEventListener('click', generateUserAccessLink);
elements.closeUserDialog.addEventListener('click', closeUserDialog);
elements.cancelUserButton.addEventListener('click', closeUserDialog);
elements.userForm.addEventListener('submit', submitUser);
elements.userDialog.addEventListener('click', (event) => {
  if (event.target === elements.userDialog) closeUserDialog();
});
elements.newRoleButton.addEventListener('click', () => openRoleDialog());
elements.closeRoleDialog.addEventListener('click', closeRoleDialog);
elements.cancelRoleButton.addEventListener('click', closeRoleDialog);
elements.roleForm.addEventListener('submit', submitRole);
elements.roleDialog.addEventListener('click', (event) => {
  if (event.target === elements.roleDialog) closeRoleDialog();
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
elements.newTaxButton.addEventListener('click', openTaxDialog);
elements.taxPanelCreateButton.addEventListener('click', openTaxDialog);
elements.taxTreatment.addEventListener('change', syncTaxRateField);
elements.closeTaxDialog.addEventListener('click', closeTaxDialog);
elements.cancelTaxButton.addEventListener('click', closeTaxDialog);
elements.taxForm.addEventListener('submit', submitTax);
elements.taxDialog.addEventListener('click', (event) => {
  if (event.target === elements.taxDialog) closeTaxDialog();
});
elements.closeProductTaxDialog.addEventListener('click', closeProductTaxDialog);
elements.cancelProductTaxButton.addEventListener('click', closeProductTaxDialog);
elements.productTaxForm.addEventListener('submit', submitProductTax);
elements.productTaxDialog.addEventListener('click', (event) => {
  if (event.target === elements.productTaxDialog) closeProductTaxDialog();
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
elements.newCashMovementButton.addEventListener('click', openCashMovementDialog);
elements.reloadCashControlButton.addEventListener('click', () => {
  Promise.all([loadPos(), loadExecutiveSummary()])
    .then(() => showToast('Control de caja actualizado.'))
    .catch(() => showToast('No fue posible actualizar el control de caja.'));
});
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
elements.cashDenominationGrid.addEventListener('input', updateCashClosePreview);
elements.closeCashMovementDialog.addEventListener('click', closeCashMovementDialog);
elements.cancelCashMovementButton.addEventListener('click', closeCashMovementDialog);
elements.cashMovementForm.addEventListener('submit', submitCashMovement);
elements.cashMovementDialog.addEventListener('click', (event) => {
  if (event.target === elements.cashMovementDialog) closeCashMovementDialog();
});
elements.openSalesHistoryButton.addEventListener('click', openSalesHistoryDialog);
elements.closeSalesHistoryDialog.addEventListener('click', closeSalesHistoryDialog);
elements.finishSalesHistoryButton.addEventListener('click', closeSalesHistoryDialog);
elements.salesHistoryDialog.addEventListener('click', (event) => {
  if (event.target === elements.salesHistoryDialog) closeSalesHistoryDialog();
});
elements.posWarehouseSelect.addEventListener('change', async () => {
  saleCart.clear();
  activePosCategory = 'ALL';
  await loadPosCatalog().catch(() => {});
});
elements.posProductSearch.addEventListener('input', renderPosCatalog);
elements.posProductSearch.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const query = normalizeSearch(elements.posProductSearch.value.trim());
  if (!query) return;
  const exactProduct = posCatalog.find((product) =>
    normalizeSearch(product.sku) === query ||
    normalizeSearch(product.barcode || '') === query);
  if (!exactProduct) {
    showToast('No encontramos un SKU o código de barras exacto.');
    return;
  }
  addProductToCart(exactProduct);
  elements.posProductSearch.value = '';
  renderPosCatalog();
  showToast(`${exactProduct.name} agregado a la venta.`);
});
elements.clearCartButton.addEventListener('click', clearCart);
elements.posCustomerSelect.addEventListener('change', () => {
  renderPosCustomerContext();
  renderCart();
});
elements.posNewCustomerButton.addEventListener('click', () => openCustomerDialog('pos'));
elements.posSaleTermButtons.forEach((button) => {
  button.addEventListener('click', () => {
    posSaleTerms = button.dataset.saleTerms;
    elements.posSaleTermButtons.forEach((option) => {
      option.classList.toggle('active', option === button);
    });
    if (posSaleTerms === 'CREDIT' && !elements.posCreditDueDate.value) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      elements.posCreditDueDate.value = isoDate(dueDate);
    }
    renderCart();
  });
});
elements.posCreditDueDate.addEventListener('change', renderCart);
elements.posCashReceived.addEventListener('input', () => {
  updateCashSettlement(calculateCartTotals());
});
elements.posPaymentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    elements.posPaymentMethod.value = button.dataset.paymentMethod;
    elements.posPaymentButtons.forEach((option) => {
      option.classList.toggle('active', option === button);
    });
    renderCart();
  });
});
document.addEventListener('keydown', (event) => {
  if (
    event.key === '/' &&
    document.body.dataset.activeView === 'caja' &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
  ) {
    event.preventDefault();
    elements.posProductSearch.focus();
  }
});
elements.completeSaleButton.addEventListener('click', completeSale);
elements.closeReceiptDialog.addEventListener('click', closeReceiptDialog);
elements.printReceiptButton.addEventListener('click', () => window.print());
elements.finishReceiptButton.addEventListener('click', closeReceiptDialog);
elements.receiptDialog.addEventListener('click', (event) => {
  if (event.target === elements.receiptDialog) closeReceiptDialog();
});
document.querySelectorAll('[data-report-type]').forEach((button) => {
  button.addEventListener('click', () => setReportType(button.dataset.reportType));
});
elements.reportSearch.addEventListener('input', scheduleReportReload);
[
  elements.reportBranchFilter,
  elements.reportDateFrom,
  elements.reportDateTo,
].forEach((filter) => filter.addEventListener('change', () => {
  reportPagination.page = 1;
  loadReports().catch(() => {});
}));
elements.clearReportFilters.addEventListener('click', clearReportFilters);
elements.exportReportButton.addEventListener('click', exportActiveReport);
elements.reportPreviousPage.addEventListener('click', () => {
  if (reportPagination.page <= 1) return;
  reportPagination.page -= 1;
  loadReports().catch(() => {
    reportPagination.page += 1;
  });
});
elements.reportNextPage.addEventListener('click', () => {
  if (reportPagination.page >= reportPagination.totalPages) return;
  reportPagination.page += 1;
  loadReports().catch(() => {
    reportPagination.page -= 1;
  });
});
elements.auditSearch.addEventListener('input', scheduleAuditReload);
[
  elements.auditActorFilter,
  elements.auditEntityFilter,
  elements.auditActionFilter,
  elements.auditDateFrom,
  elements.auditDateTo,
].forEach((filter) => filter.addEventListener('change', () => {
  loadAudit().catch(() => {});
}));
elements.clearAuditFilters.addEventListener('click', clearAuditFilters);
elements.exportAuditButton.addEventListener('click', exportAuditCsv);
elements.auditLoadMore.addEventListener('click', () => {
  auditPagination.page += 1;
  loadAudit({ append: true }).catch(() => {
    auditPagination.page = Math.max(1, auditPagination.page - 1);
  });
});
elements.invoiceSearch.addEventListener('input', renderInvoiceList);
elements.invoiceStatusFilter.addEventListener('change', renderInvoiceList);
elements.reloadReceivablesButton.addEventListener('click', () => {
  loadReceivables()
    .then(() => showToast('Cartera actualizada.'))
    .catch(() => showToast('No fue posible actualizar la cartera.'));
});
elements.newCustomerButton.addEventListener('click', () => openCustomerDialog('receivables'));
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

startApplication();
