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
  forgotPasswordButton: document.querySelector('#forgotPasswordButton'),
  recoveryRequestPanel: document.querySelector('#recoveryRequestPanel'),
  recoveryRequestForm: document.querySelector('#recoveryRequestForm'),
  recoveryEmail: document.querySelector('#recoveryEmail'),
  recoveryRequestError: document.querySelector('#recoveryRequestError'),
  recoveryRequestSuccess: document.querySelector('#recoveryRequestSuccess'),
  recoveryRequestButton: document.querySelector('#recoveryRequestButton'),
  backToLoginButton: document.querySelector('#backToLoginButton'),
  resetPasswordPanel: document.querySelector('#resetPasswordPanel'),
  resetPasswordForm: document.querySelector('#resetPasswordForm'),
  resetPasswordError: document.querySelector('#resetPasswordError'),
  resetPasswordButton: document.querySelector('#resetPasswordButton'),
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
  billingEnvironmentBadge: document.querySelector('#billingEnvironmentBadge'),
  billingConnector: document.querySelector('.billing-connector'),
  billingReadiness: document.querySelector('#billingReadiness'),
  billingProviderName: document.querySelector('#billingProviderName'),
  billingConnectionStatus: document.querySelector('#billingConnectionStatus'),
  billingProviderEnvironment: document.querySelector('#billingProviderEnvironment'),
  billingCredentialsStatus: document.querySelector('#billingCredentialsStatus'),
  billingLastTest: document.querySelector('#billingLastTest'),
  billingConnectionMessage: document.querySelector('#billingConnectionMessage'),
  testBillingConnectionButton: document.querySelector('#testBillingConnectionButton'),
  configureBillingConnectionButton:
    document.querySelector('#configureBillingConnectionButton'),
  billingResolutionName: document.querySelector('#billingResolutionName'),
  billingResolutionStatus: document.querySelector('#billingResolutionStatus'),
  billingResolutionValidity: document.querySelector('#billingResolutionValidity'),
  billingResolutionNext: document.querySelector('#billingResolutionNext'),
  billingResolutionRemaining: document.querySelector('#billingResolutionRemaining'),
  newBillingResolutionButton: document.querySelector('#newBillingResolutionButton'),
  billingDiagnosticsStrip: document.querySelector('#billingDiagnosticsStrip'),
  billingDiagnosticsLabel: document.querySelector('#billingDiagnosticsLabel'),
  billingDiagnosticsSummary: document.querySelector('#billingDiagnosticsSummary'),
  billingDiagnosticsDetail: document.querySelector('#billingDiagnosticsDetail'),
  refreshBillingDiagnosticsButton: document.querySelector('#refreshBillingDiagnosticsButton'),
  billingPendingCount: document.querySelector('#billingPendingCount'),
  billingAcceptedCount: document.querySelector('#billingAcceptedCount'),
  billingRejectedCount: document.querySelector('#billingRejectedCount'),
  billingContingencyButton: document.querySelector('#billingContingencyButton'),
  billingContingencyStrip: document.querySelector('#billingContingencyStrip'),
  billingContingencyReason: document.querySelector('#billingContingencyReason'),
  billingContingencyStarted: document.querySelector('#billingContingencyStarted'),
  closeBillingContingencyButton:
    document.querySelector('#closeBillingContingencyButton'),
  billingDocumentList: document.querySelector('#billingDocumentList'),
  billingDocumentState: document.querySelector('#billingDocumentState'),
  billingFlowQuoteCount: document.querySelector('#billingFlowQuoteCount'),
  billingFlowOrderCount: document.querySelector('#billingFlowOrderCount'),
  billingFlowNoteCount: document.querySelector('#billingFlowNoteCount'),
  billingFlowAcceptedCount: document.querySelector('#billingFlowAcceptedCount'),
  billingCommercialList: document.querySelector('#billingCommercialList'),
  billingCommercialState: document.querySelector('#billingCommercialState'),
  billingFiscalList: document.querySelector('#billingFiscalList'),
  billingFiscalState: document.querySelector('#billingFiscalState'),
  reloadBillingWorkflowButton: document.querySelector('#reloadBillingWorkflowButton'),
  newQuoteButton: document.querySelector('#newQuoteButton'),
  newBillingNoteButton: document.querySelector('#newBillingNoteButton'),
  quoteDialog: document.querySelector('#quoteDialog'),
  quoteForm: document.querySelector('#quoteForm'),
  quoteBranchId: document.querySelector('#quoteBranchId'),
  quoteCustomerId: document.querySelector('#quoteCustomerId'),
  quoteValidUntil: document.querySelector('#quoteValidUntil'),
  quoteItems: document.querySelector('#quoteItems'),
  addQuoteItemButton: document.querySelector('#addQuoteItemButton'),
  quoteFormError: document.querySelector('#quoteFormError'),
  closeQuoteDialog: document.querySelector('#closeQuoteDialog'),
  cancelQuoteButton: document.querySelector('#cancelQuoteButton'),
  saveQuoteButton: document.querySelector('#saveQuoteButton'),
  billingNoteDialog: document.querySelector('#billingNoteDialog'),
  billingNoteForm: document.querySelector('#billingNoteForm'),
  billingNoteDocumentId: document.querySelector('#billingNoteDocumentId'),
  billingNoteItems: document.querySelector('#billingNoteItems'),
  billingNoteFormError: document.querySelector('#billingNoteFormError'),
  closeBillingNoteDialog: document.querySelector('#closeBillingNoteDialog'),
  cancelBillingNoteButton: document.querySelector('#cancelBillingNoteButton'),
  saveBillingNoteButton: document.querySelector('#saveBillingNoteButton'),
  billingConnectionDialog: document.querySelector('#billingConnectionDialog'),
  billingConnectionForm: document.querySelector('#billingConnectionForm'),
  billingConnectionFormError: document.querySelector('#billingConnectionFormError'),
  billingProviderCode: document.querySelector('#billingProviderCode'),
  billingProviderDisplayName: document.querySelector('#billingProviderDisplayName'),
  billingProviderEnvironmentInput:
    document.querySelector('#billingProviderEnvironmentInput'),
  billingProviderBaseUrl: document.querySelector('#billingProviderBaseUrl'),
  factusCredentialFields: document.querySelector('#factusCredentialFields'),
  billingFactusUsername: document.querySelector('#billingFactusUsername'),
  billingFactusPassword: document.querySelector('#billingFactusPassword'),
  billingFactusClientId: document.querySelector('#billingFactusClientId'),
  billingFactusClientSecret: document.querySelector('#billingFactusClientSecret'),
  closeBillingConnectionDialog: document.querySelector('#closeBillingConnectionDialog'),
  cancelBillingConnectionButton: document.querySelector('#cancelBillingConnectionButton'),
  saveBillingConnectionButton: document.querySelector('#saveBillingConnectionButton'),
  billingResolutionDialog: document.querySelector('#billingResolutionDialog'),
  billingResolutionForm: document.querySelector('#billingResolutionForm'),
  billingResolutionFormError: document.querySelector('#billingResolutionFormError'),
  billingResolutionBranchId: document.querySelector('#billingResolutionBranchId'),
  factusRangeField: document.querySelector('#factusRangeField'),
  factusNumberingRangeSelect: document.querySelector('#factusNumberingRangeSelect'),
  closeBillingResolutionDialog: document.querySelector('#closeBillingResolutionDialog'),
  cancelBillingResolutionButton: document.querySelector('#cancelBillingResolutionButton'),
  saveBillingResolutionButton: document.querySelector('#saveBillingResolutionButton'),
  companyContext: document.querySelector('#companyContext'),
  companyCount: document.querySelector('#companyCount'),
  companyDetail: document.querySelector('#companyDetail'),
  dashboardReceivable: document.querySelector('#dashboardReceivable'),
  dashboardReceivableSnapshot: document.querySelector('#dashboardReceivableSnapshot'),
  dashboardPayable: document.querySelector('#dashboardPayable'),
  dashboardPayableSnapshot: document.querySelector('#dashboardPayableSnapshot'),
  dashboardInventoryValue: document.querySelector('#dashboardInventoryValue'),
  dashboardOpenPurchases: document.querySelector('#dashboardOpenPurchases'),
  dashboardCompanyName: document.querySelector('#dashboardCompanyName'),
  dashboardSalesToday: document.querySelector('#dashboardSalesToday'),
  dashboardSalesMonth: document.querySelector('#dashboardSalesMonth'),
  dashboardSalesCount: document.querySelector('#dashboardSalesCount'),
  dashboardAverageTicket: document.querySelector('#dashboardAverageTicket'),
  dashboardSalesComparison: document.querySelector('#dashboardSalesComparison'),
  dashboardSalesTrend: document.querySelector('#dashboardSalesTrend'),
  dashboardGrossMargin: document.querySelector('#dashboardGrossMargin'),
  dashboardLowStock: document.querySelector('#dashboardLowStock'),
  dashboardPendingPurchases: document.querySelector('#dashboardPendingPurchases'),
  dashboardCashProjection: document.querySelector('#dashboardCashProjection'),
  dashboardCashProjectionDetail: document.querySelector('#dashboardCashProjectionDetail'),
  dashboardOverdueReceivable: document.querySelector('#dashboardOverdueReceivable'),
  dashboardOverdueReceivableCount:
    document.querySelector('#dashboardOverdueReceivableCount'),
  dashboardOverduePayable: document.querySelector('#dashboardOverduePayable'),
  dashboardOverduePayableCount: document.querySelector('#dashboardOverduePayableCount'),
  dashboardPriorityCount: document.querySelector('#dashboardPriorityCount'),
  dashboardUpdatedAt: document.querySelector('#dashboardUpdatedAt'),
  onboardingCenter: document.querySelector('#onboardingCenter'),
  onboardingDescription: document.querySelector('#onboardingDescription'),
  onboardingPercent: document.querySelector('#onboardingPercent'),
  onboardingProgressCopy: document.querySelector('#onboardingProgressCopy'),
  onboardingScoreRing: document.querySelector('#onboardingScoreRing'),
  onboardingDemoNotice: document.querySelector('#onboardingDemoNotice'),
  onboardingSteps: document.querySelector('#onboardingSteps'),
  warehouseCount: document.querySelector('#warehouseCount'),
  warehouseDetail: document.querySelector('#warehouseDetail'),
  productCount: document.querySelector('#productCount'),
  productDetail: document.querySelector('#productDetail'),
  branchCount: document.querySelector('#branchCount'),
  branchDetail: document.querySelector('#branchDetail'),
  menuButton: document.querySelector('#menuButton'),
  sidebar: document.querySelector('#sidebar'),
  sidebarScrim: document.querySelector('#sidebarScrim'),
  moduleSearch: document.querySelector('#moduleSearch'),
  quickLookupButton: document.querySelector('#quickLookupButton'),
  quickLookupShortcut: document.querySelector('#quickLookupShortcut'),
  quickLookupDialog: document.querySelector('#quickLookupDialog'),
  quickLookupCompany: document.querySelector('#quickLookupCompany'),
  quickLookupSearch: document.querySelector('#quickLookupSearch'),
  quickLookupState: document.querySelector('#quickLookupState'),
  quickLookupResults: document.querySelector('#quickLookupResults'),
  closeQuickLookup: document.querySelector('#closeQuickLookup'),
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
  companyIdentityDialog: document.querySelector('#companyIdentityDialog'),
  companyIdentityForm: document.querySelector('#companyIdentityForm'),
  companyIdentityName: document.querySelector('#companyIdentityName'),
  companyLogoPreview: document.querySelector('#companyLogoPreview'),
  companyLogoPlaceholder: document.querySelector('#companyLogoPlaceholder'),
  companyLogoFile: document.querySelector('#companyLogoFile'),
  companyIdentityError: document.querySelector('#companyIdentityError'),
  closeCompanyIdentityDialog: document.querySelector('#closeCompanyIdentityDialog'),
  cancelCompanyIdentityButton: document.querySelector('#cancelCompanyIdentityButton'),
  removeCompanyLogoButton: document.querySelector('#removeCompanyLogoButton'),
  saveCompanyLogoButton: document.querySelector('#saveCompanyLogoButton'),
  taxProfileDialog: document.querySelector('#taxProfileDialog'),
  taxProfileForm: document.querySelector('#taxProfileForm'),
  taxProfileCompanyName: document.querySelector('#taxProfileCompanyName'),
  taxpayerType: document.querySelector('#taxpayerType'),
  vatResponsibility: document.querySelector('#vatResponsibility'),
  taxRegime: document.querySelector('#taxRegime'),
  taxDocumentType: document.querySelector('#taxDocumentType'),
  electronicInvoicingRequired: document.querySelector('#electronicInvoicingRequired'),
  taxRutFile: document.querySelector('#taxRutFile'),
  taxValidationStatus: document.querySelector('#taxValidationStatus'),
  taxValidationNotes: document.querySelector('#taxValidationNotes'),
  taxProfileError: document.querySelector('#taxProfileError'),
  closeTaxProfileDialog: document.querySelector('#closeTaxProfileDialog'),
  cancelTaxProfileButton: document.querySelector('#cancelTaxProfileButton'),
  saveTaxProfileButton: document.querySelector('#saveTaxProfileButton'),
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
  logisticsViewStatus: document.querySelector('#logisticsViewStatus'),
  reloadLogisticsButton: document.querySelector('#reloadLogisticsButton'),
  logisticsModuleStatus: document.querySelector('#logisticsModuleStatus'),
  logisticsModuleToggle: document.querySelector('#logisticsModuleToggle'),
  payrollModuleStatus: document.querySelector('#payrollModuleStatus'),
  payrollModuleToggle: document.querySelector('#payrollModuleToggle'),
  moduleSettingMessage: document.querySelector('#moduleSettingMessage'),
  logisticsWorkflowAlertBadge: document.querySelector('#logisticsWorkflowAlertBadge'),
  logisticsCountingCount: document.querySelector('#logisticsCountingCount'),
  logisticsPricingCount: document.querySelector('#logisticsPricingCount'),
  logisticsApprovalCount: document.querySelector('#logisticsApprovalCount'),
  logisticsLabelsPending: document.querySelector('#logisticsLabelsPending'),
  logisticsLabelTabBadge: document.querySelector('#logisticsLabelTabBadge'),
  logisticsFlowValue: document.querySelector('#logisticsFlowValue'),
  logisticsFlowUnits: document.querySelector('#logisticsFlowUnits'),
  logisticsBatchSearch: document.querySelector('#logisticsBatchSearch'),
  logisticsBatchStatusFilter: document.querySelector('#logisticsBatchStatusFilter'),
  newLogisticsBatchButton: document.querySelector('#newLogisticsBatchButton'),
  logisticsBatchCount: document.querySelector('#logisticsBatchCount'),
  logisticsBatchList: document.querySelector('#logisticsBatchList'),
  logisticsBatchState: document.querySelector('#logisticsBatchState'),
  logisticsDetailEmpty: document.querySelector('#logisticsDetailEmpty'),
  logisticsDetailContent: document.querySelector('#logisticsDetailContent'),
  logisticsDetailNumber: document.querySelector('#logisticsDetailNumber'),
  logisticsDetailTitle: document.querySelector('#logisticsDetailTitle'),
  logisticsDetailMeta: document.querySelector('#logisticsDetailMeta'),
  logisticsDetailStatus: document.querySelector('#logisticsDetailStatus'),
  logisticsDetailActions: document.querySelector('#logisticsDetailActions'),
  logisticsScanForm: document.querySelector('#logisticsScanForm'),
  logisticsScanSku: document.querySelector('#logisticsScanSku'),
  logisticsConnectionState: document.querySelector('#logisticsConnectionState'),
  logisticsScanError: document.querySelector('#logisticsScanError'),
  logisticsItemCount: document.querySelector('#logisticsItemCount'),
  logisticsItemList: document.querySelector('#logisticsItemList'),
  logisticsTimeline: document.querySelector('#logisticsTimeline'),
  logisticsLabelSize: document.querySelector('#logisticsLabelSize'),
  logisticsLabelShowCompany: document.querySelector('#logisticsLabelShowCompany'),
  logisticsLabelShowProduct: document.querySelector('#logisticsLabelShowProduct'),
  logisticsLabelShowPrice: document.querySelector('#logisticsLabelShowPrice'),
  logisticsLabelShowSku: document.querySelector('#logisticsLabelShowSku'),
  logisticsLabelShowBarcode: document.querySelector('#logisticsLabelShowBarcode'),
  logisticsLabelFooter: document.querySelector('#logisticsLabelFooter'),
  logisticsLabelPreview: document.querySelector('#logisticsLabelPreview'),
  logisticsLabelPreviewCompany: document.querySelector('#logisticsLabelPreviewCompany'),
  logisticsLabelPreviewProduct: document.querySelector('#logisticsLabelPreviewProduct'),
  logisticsLabelPreviewPrice: document.querySelector('#logisticsLabelPreviewPrice'),
  logisticsLabelPreviewBarcode: document.querySelector('#logisticsLabelPreviewBarcode'),
  logisticsLabelPreviewSku: document.querySelector('#logisticsLabelPreviewSku'),
  logisticsLabelPreviewFooter: document.querySelector('#logisticsLabelPreviewFooter'),
  saveLogisticsLabelSettings: document.querySelector('#saveLogisticsLabelSettings'),
  logisticsLabelBatchCount: document.querySelector('#logisticsLabelBatchCount'),
  logisticsLabelBatchList: document.querySelector('#logisticsLabelBatchList'),
  logisticsLabelSelectedBatch: document.querySelector('#logisticsLabelSelectedBatch'),
  logisticsLabelEmpty: document.querySelector('#logisticsLabelEmpty'),
  logisticsLabelProductList: document.querySelector('#logisticsLabelProductList'),
  printLogisticsBatchLabels: document.querySelector('#printLogisticsBatchLabels'),
  logisticsBatchDialog: document.querySelector('#logisticsBatchDialog'),
  logisticsBatchForm: document.querySelector('#logisticsBatchForm'),
  logisticsBatchBranchId: document.querySelector('#logisticsBatchBranchId'),
  logisticsBatchWarehouseId: document.querySelector('#logisticsBatchWarehouseId'),
  logisticsBatchSupplierId: document.querySelector('#logisticsBatchSupplierId'),
  logisticsBatchFormError: document.querySelector('#logisticsBatchFormError'),
  closeLogisticsBatchDialog: document.querySelector('#closeLogisticsBatchDialog'),
  cancelLogisticsBatchButton: document.querySelector('#cancelLogisticsBatchButton'),
  saveLogisticsBatchButton: document.querySelector('#saveLogisticsBatchButton'),
  inventoryValue: document.querySelector('#inventoryValue'),
  inventoryStockedProducts: document.querySelector('#inventoryStockedProducts'),
  inventoryStorageUnits: document.querySelector('#inventoryStorageUnits'),
  inventoryDisplayUnits: document.querySelector('#inventoryDisplayUnits'),
  inventoryReservedUnits: document.querySelector('#inventoryReservedUnits'),
  inventoryLowStock: document.querySelector('#inventoryLowStock'),
  inventoryMovementsMonth: document.querySelector('#inventoryMovementsMonth'),
  inventoryActiveCountBadge: document.querySelector('#inventoryActiveCountBadge'),
  inventoryOperationAlertBadge: document.querySelector('#inventoryOperationAlertBadge'),
  advancedInventoryAlertBadge: document.querySelector('#advancedInventoryAlertBadge'),
  reloadAdvancedInventoryButton: document.querySelector('#reloadAdvancedInventoryButton'),
  advancedLocationCount: document.querySelector('#advancedLocationCount'),
  advancedUnitCount: document.querySelector('#advancedUnitCount'),
  advancedLotCount: document.querySelector('#advancedLotCount'),
  advancedExpiringCount: document.querySelector('#advancedExpiringCount'),
  advancedSerialCount: document.querySelector('#advancedSerialCount'),
  advancedReservedCount: document.querySelector('#advancedReservedCount'),
  advancedLocationRecordCount: document.querySelector('#advancedLocationRecordCount'),
  advancedLotRecordCount: document.querySelector('#advancedLotRecordCount'),
  advancedReservationRecordCount: document.querySelector('#advancedReservationRecordCount'),
  advancedClosureRecordCount: document.querySelector('#advancedClosureRecordCount'),
  advancedLabelRecordCount: document.querySelector('#advancedLabelRecordCount'),
  advancedPermissionRecordCount: document.querySelector('#advancedPermissionRecordCount'),
  advancedLocationList: document.querySelector('#advancedLocationList'),
  advancedLotList: document.querySelector('#advancedLotList'),
  advancedReservationList: document.querySelector('#advancedReservationList'),
  advancedClosureList: document.querySelector('#advancedClosureList'),
  advancedLabelList: document.querySelector('#advancedLabelList'),
  advancedPermissionList: document.querySelector('#advancedPermissionList'),
  advancedInventoryDialog: document.querySelector('#advancedInventoryDialog'),
  advancedInventoryForm: document.querySelector('#advancedInventoryForm'),
  advancedInventoryFields: document.querySelector('#advancedInventoryFields'),
  advancedInventoryFormError: document.querySelector('#advancedInventoryFormError'),
  advancedInventoryDialogEyebrow: document.querySelector('#advancedInventoryDialogEyebrow'),
  advancedInventoryDialogTitle: document.querySelector('#advancedInventoryDialogTitle'),
  advancedInventoryDialogCopy: document.querySelector('#advancedInventoryDialogCopy'),
  closeAdvancedInventoryDialog: document.querySelector('#closeAdvancedInventoryDialog'),
  cancelAdvancedInventoryButton: document.querySelector('#cancelAdvancedInventoryButton'),
  saveAdvancedInventoryButton: document.querySelector('#saveAdvancedInventoryButton'),
  inventorySearch: document.querySelector('#inventorySearch'),
  inventoryWarehouseFilter: document.querySelector('#inventoryWarehouseFilter'),
  inventoryBalanceCount: document.querySelector('#inventoryBalanceCount'),
  inventoryBalanceList: document.querySelector('#inventoryBalanceList'),
  inventoryDataState: document.querySelector('#inventoryDataState'),
  inventoryMovementCount: document.querySelector('#inventoryMovementCount'),
  inventoryMovementList: document.querySelector('#inventoryMovementList'),
  inventoryMovementState: document.querySelector('#inventoryMovementState'),
  inventoryIncidentCount: document.querySelector('#inventoryIncidentCount'),
  inventoryIncidentList: document.querySelector('#inventoryIncidentList'),
  inventoryIncidentState: document.querySelector('#inventoryIncidentState'),
  inventoryTransferOrderCount:
    document.querySelector('#inventoryTransferOrderCount'),
  inventoryTransferOrderList:
    document.querySelector('#inventoryTransferOrderList'),
  inventoryTransferOrderState:
    document.querySelector('#inventoryTransferOrderState'),
  newInventoryIncidentButton:
    document.querySelector('#newInventoryIncidentButton'),
  inventoryIncidentDialog: document.querySelector('#inventoryIncidentDialog'),
  inventoryIncidentForm: document.querySelector('#inventoryIncidentForm'),
  inventoryIncidentFormError:
    document.querySelector('#inventoryIncidentFormError'),
  inventoryIncidentType: document.querySelector('#inventoryIncidentType'),
  inventoryIncidentProductId:
    document.querySelector('#inventoryIncidentProductId'),
  inventoryIncidentWarehouseId:
    document.querySelector('#inventoryIncidentWarehouseId'),
  inventoryIncidentWarehouseLabel:
    document.querySelector('#inventoryIncidentWarehouseLabel'),
  inventoryIncidentDestinationField:
    document.querySelector('#inventoryIncidentDestinationField'),
  inventoryIncidentDestinationId:
    document.querySelector('#inventoryIncidentDestinationId'),
  inventoryIncidentGuidance:
    document.querySelector('#inventoryIncidentGuidance'),
  inventoryIncidentImpact: document.querySelector('#inventoryIncidentImpact'),
  closeInventoryIncidentDialog:
    document.querySelector('#closeInventoryIncidentDialog'),
  cancelInventoryIncidentButton:
    document.querySelector('#cancelInventoryIncidentButton'),
  saveInventoryIncidentButton:
    document.querySelector('#saveInventoryIncidentButton'),
  openKardexButton: document.querySelector('#openKardexButton'),
  kardexDialog: document.querySelector('#kardexDialog'),
  kardexForm: document.querySelector('#kardexForm'),
  kardexProduct: document.querySelector('#kardexProduct'),
  kardexWarehouse: document.querySelector('#kardexWarehouse'),
  kardexDateFrom: document.querySelector('#kardexDateFrom'),
  kardexDateTo: document.querySelector('#kardexDateTo'),
  closeKardexDialog: document.querySelector('#closeKardexDialog'),
  loadKardexButton: document.querySelector('#loadKardexButton'),
  kardexTableBody: document.querySelector('#kardexTableBody'),
  kardexState: document.querySelector('#kardexState'),
  replenishmentAlertCount: document.querySelector('#replenishmentAlertCount'),
  replenishmentReadyCount: document.querySelector('#replenishmentReadyCount'),
  replenishmentList: document.querySelector('#replenishmentList'),
  replenishmentState: document.querySelector('#replenishmentState'),
  newAdjustmentButton: document.querySelector('#newAdjustmentButton'),
  newTransferButton: document.querySelector('#newTransferButton'),
  openCountsPanelButton: document.querySelector('#openCountsPanelButton'),
  adjustmentDialog: document.querySelector('#adjustmentDialog'),
  adjustmentForm: document.querySelector('#adjustmentForm'),
  adjustmentFormError: document.querySelector('#adjustmentFormError'),
  adjustmentProductId: document.querySelector('#adjustmentProductId'),
  adjustmentWarehouseId: document.querySelector('#adjustmentWarehouseId'),
  adjustmentEvidenceFile: document.querySelector('#adjustmentEvidenceFile'),
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
  transferRequiresReception:
    document.querySelector('#transferRequiresReception'),
  transferDispatchReferenceField:
    document.querySelector('#transferDispatchReferenceField'),
  closeTransferDialog: document.querySelector('#closeTransferDialog'),
  cancelTransferButton: document.querySelector('#cancelTransferButton'),
  saveTransferButton: document.querySelector('#saveTransferButton'),
  replenishmentDialog: document.querySelector('#replenishmentDialog'),
  replenishmentForm: document.querySelector('#replenishmentForm'),
  replenishmentFormError: document.querySelector('#replenishmentFormError'),
  replenishmentProductId: document.querySelector('#replenishmentProductId'),
  replenishmentProductName: document.querySelector('#replenishmentProductName'),
  replenishmentProductSku: document.querySelector('#replenishmentProductSku'),
  replenishmentSourceWarehouseId:
    document.querySelector('#replenishmentSourceWarehouseId'),
  replenishmentDisplayWarehouseId:
    document.querySelector('#replenishmentDisplayWarehouseId'),
  replenishmentMinimumQuantity:
    document.querySelector('#replenishmentMinimumQuantity'),
  replenishmentMaximumQuantity:
    document.querySelector('#replenishmentMaximumQuantity'),
  closeReplenishmentDialog: document.querySelector('#closeReplenishmentDialog'),
  cancelReplenishmentButton: document.querySelector('#cancelReplenishmentButton'),
  saveReplenishmentButton: document.querySelector('#saveReplenishmentButton'),
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
  countEvidenceFile: document.querySelector('#countEvidenceFile'),
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
  openCatalogImportButton: document.querySelector('#openCatalogImportButton'),
  catalogImportDialog: document.querySelector('#catalogImportDialog'),
  catalogImportCompany: document.querySelector('#catalogImportCompany'),
  closeCatalogImportDialog: document.querySelector('#closeCatalogImportDialog'),
  cancelCatalogImport: document.querySelector('#cancelCatalogImport'),
  downloadCatalogTemplate: document.querySelector('#downloadCatalogTemplate'),
  catalogImportFile: document.querySelector('#catalogImportFile'),
  catalogImportFileLabel: document.querySelector('#catalogImportFileLabel'),
  previewCatalogImport: document.querySelector('#previewCatalogImport'),
  catalogImportSummary: document.querySelector('#catalogImportSummary'),
  catalogImportTotal: document.querySelector('#catalogImportTotal'),
  catalogImportCreates: document.querySelector('#catalogImportCreates'),
  catalogImportUpdates: document.querySelector('#catalogImportUpdates'),
  catalogImportErrors: document.querySelector('#catalogImportErrors'),
  catalogImportPreview: document.querySelector('#catalogImportPreview'),
  catalogImportStatus: document.querySelector('#catalogImportStatus'),
  catalogImportTableBody: document.querySelector('#catalogImportTableBody'),
  catalogImportError: document.querySelector('#catalogImportError'),
  commitCatalogImport: document.querySelector('#commitCatalogImport'),
  categoryCount: document.querySelector('#categoryCount'),
  brandCount: document.querySelector('#brandCount'),
  taxCount: document.querySelector('#taxCount'),
  newComboProductButton: document.querySelector('#newComboProductButton'),
  comboCatalogGrid: document.querySelector('#comboCatalogGrid'),
  comboCatalogState: document.querySelector('#comboCatalogState'),
  productPriceForm: document.querySelector('#productPriceForm'),
  pricingProductId: document.querySelector('#pricingProductId'),
  pricingPriceListId: document.querySelector('#pricingPriceListId'),
  productPriceError: document.querySelector('#productPriceError'),
  customerPriceListForm: document.querySelector('#customerPriceListForm'),
  pricingCustomerId: document.querySelector('#pricingCustomerId'),
  customerPriceListId: document.querySelector('#customerPriceListId'),
  customerPriceListError: document.querySelector('#customerPriceListError'),
  promotionForm: document.querySelector('#promotionForm'),
  promotionProductId: document.querySelector('#promotionProductId'),
  promotionStartsAt: document.querySelector('#promotionStartsAt'),
  promotionEndsAt: document.querySelector('#promotionEndsAt'),
  promotionError: document.querySelector('#promotionError'),
  productPriceList: document.querySelector('#productPriceList'),
  promotionList: document.querySelector('#promotionList'),
  commercialTargetRevenue: document.querySelector('#commercialTargetRevenue'),
  commercialActualRevenue: document.querySelector('#commercialActualRevenue'),
  commercialProgress: document.querySelector('#commercialProgress'),
  commercialOpenInitiatives: document.querySelector('#commercialOpenInitiatives'),
  commercialActualMargin: document.querySelector('#commercialActualMargin'),
  commercialOpenPlans: document.querySelector('#commercialOpenPlans'),
  commercialCurrentPlanName: document.querySelector('#commercialCurrentPlanName'),
  commercialCurrentPlanStatus: document.querySelector('#commercialCurrentPlanStatus'),
  commercialCurrentPlanPeriod: document.querySelector('#commercialCurrentPlanPeriod'),
  commercialCurrentPlanOwner: document.querySelector('#commercialCurrentPlanOwner'),
  commercialCurrentPlanNotes: document.querySelector('#commercialCurrentPlanNotes'),
  commercialPlanCount: document.querySelector('#commercialPlanCount'),
  commercialPlanList: document.querySelector('#commercialPlanList'),
  commercialInitiativeCount: document.querySelector('#commercialInitiativeCount'),
  commercialInitiativeList: document.querySelector('#commercialInitiativeList'),
  commercialPlanningState: document.querySelector('#commercialPlanningState'),
  commercialOpportunityCount: document.querySelector('#commercialOpportunityCount'),
  commercialOpportunityRotation: document.querySelector('#commercialOpportunityRotation'),
  commercialOpportunityPriority: document.querySelector('#commercialOpportunityPriority'),
  commercialOpportunityCampaign: document.querySelector('#commercialOpportunityCampaign'),
  commercialOpportunityList: document.querySelector('#commercialOpportunityList'),
  commercialOpportunityState: document.querySelector('#commercialOpportunityState'),
  commercialBudgetCount: document.querySelector('#commercialBudgetCount'),
  commercialBudgetTotal: document.querySelector('#commercialBudgetTotal'),
  commercialBudgetCommitted: document.querySelector('#commercialBudgetCommitted'),
  commercialBudgetSpent: document.querySelector('#commercialBudgetSpent'),
  commercialBudgetAvailable: document.querySelector('#commercialBudgetAvailable'),
  commercialBudgetList: document.querySelector('#commercialBudgetList'),
  commercialCampaignCount: document.querySelector('#commercialCampaignCount'),
  commercialCampaignList: document.querySelector('#commercialCampaignList'),
  commercialExpenseCount: document.querySelector('#commercialExpenseCount'),
  commercialExpenseSpent: document.querySelector('#commercialExpenseSpent'),
  commercialExpenseCommitted: document.querySelector('#commercialExpenseCommitted'),
  commercialExpenseList: document.querySelector('#commercialExpenseList'),
  reloadCommercialPlanningButton: document.querySelector('#reloadCommercialPlanningButton'),
  newCommercialPlanButton: document.querySelector('#newCommercialPlanButton'),
  newCommercialInitiativeButton: document.querySelector('#newCommercialInitiativeButton'),
  commercialPlanDialog: document.querySelector('#commercialPlanDialog'),
  commercialPlanForm: document.querySelector('#commercialPlanForm'),
  commercialPlanBranchId: document.querySelector('#commercialPlanBranchId'),
  commercialPlanOwnerId: document.querySelector('#commercialPlanOwnerId'),
  commercialPlanFormError: document.querySelector('#commercialPlanFormError'),
  closeCommercialPlanDialog: document.querySelector('#closeCommercialPlanDialog'),
  cancelCommercialPlanButton: document.querySelector('#cancelCommercialPlanButton'),
  saveCommercialPlanButton: document.querySelector('#saveCommercialPlanButton'),
  commercialInitiativeDialog: document.querySelector('#commercialInitiativeDialog'),
  commercialInitiativeForm: document.querySelector('#commercialInitiativeForm'),
  commercialInitiativePlanId: document.querySelector('#commercialInitiativePlanId'),
  commercialInitiativeResponsibleId: document.querySelector('#commercialInitiativeResponsibleId'),
  commercialInitiativeFormError: document.querySelector('#commercialInitiativeFormError'),
  closeCommercialInitiativeDialog: document.querySelector('#closeCommercialInitiativeDialog'),
  cancelCommercialInitiativeButton: document.querySelector('#cancelCommercialInitiativeButton'),
  saveCommercialInitiativeButton: document.querySelector('#saveCommercialInitiativeButton'),
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
  productBillingPolicy: document.querySelector('#productBillingPolicy'),
  productExcludeFromEinvoice: document.querySelector('#productExcludeFromEinvoice'),
  newProductImage: document.querySelector('#newProductImage'),
  closeProductDialog: document.querySelector('#closeProductDialog'),
  cancelProductButton: document.querySelector('#cancelProductButton'),
  saveProductButton: document.querySelector('#saveProductButton'),
  productStructureDialog: document.querySelector('#productStructureDialog'),
  productStructureProduct: document.querySelector('#productStructureProduct'),
  closeProductStructureDialog: document.querySelector('#closeProductStructureDialog'),
  productVariantList: document.querySelector('#productVariantList'),
  productVariantForm: document.querySelector('#productVariantForm'),
  productVariantWarehouse: document.querySelector('#productVariantWarehouse'),
  productVariantError: document.querySelector('#productVariantError'),
  saveProductVariant: document.querySelector('#saveProductVariant'),
  productComboForm: document.querySelector('#productComboForm'),
  productComboComponents: document.querySelector('#productComboComponents'),
  addComboComponent: document.querySelector('#addComboComponent'),
  productComboError: document.querySelector('#productComboError'),
  saveProductCombo: document.querySelector('#saveProductCombo'),
  productComboAssemblyForm: document.querySelector('#productComboAssemblyForm'),
  productComboWarehouse: document.querySelector('#productComboWarehouse'),
  productComboAssemblyError: document.querySelector('#productComboAssemblyError'),
  assembleProductCombo: document.querySelector('#assembleProductCombo'),
  productComboAssemblyList: document.querySelector('#productComboAssemblyList'),
  productImageDialog: document.querySelector('#productImageDialog'),
  productImageForm: document.querySelector('#productImageForm'),
  productImageFormError: document.querySelector('#productImageFormError'),
  productImageFile: document.querySelector('#productImageFile'),
  productImagePreview: document.querySelector('#productImagePreview'),
  productImagePlaceholder: document.querySelector('#productImagePlaceholder'),
  productImageAlt: document.querySelector('#productImageAlt'),
  productImageMakePrimary: document.querySelector('#productImageMakePrimary'),
  imageProductName: document.querySelector('#imageProductName'),
  captureProductImageButton: document.querySelector('#captureProductImageButton'),
  productMediaGallery: document.querySelector('#productMediaGallery'),
  productMediaGalleryState: document.querySelector('#productMediaGalleryState'),
  closeProductImageDialog: document.querySelector('#closeProductImageDialog'),
  cancelProductImageButton: document.querySelector('#cancelProductImageButton'),
  saveProductImageButton: document.querySelector('#saveProductImageButton'),
  thirdPartyTotal: document.querySelector('#thirdPartyTotal'),
  thirdPartyCustomers: document.querySelector('#thirdPartyCustomers'),
  thirdPartySuppliers: document.querySelector('#thirdPartySuppliers'),
  thirdPartyDual: document.querySelector('#thirdPartyDual'),
  thirdPartySearch: document.querySelector('#thirdPartySearch'),
  thirdPartyRoleFilter: document.querySelector('#thirdPartyRoleFilter'),
  thirdPartyStatusFilter: document.querySelector('#thirdPartyStatusFilter'),
  reloadThirdPartiesButton: document.querySelector('#reloadThirdPartiesButton'),
  newThirdPartyButton: document.querySelector('#newThirdPartyButton'),
  thirdPartyList: document.querySelector('#thirdPartyList'),
  thirdPartyDataState: document.querySelector('#thirdPartyDataState'),
  thirdPartyDetailEmpty: document.querySelector('#thirdPartyDetailEmpty'),
  thirdPartyDetailContent: document.querySelector('#thirdPartyDetailContent'),
  thirdPartyDetailDocument: document.querySelector('#thirdPartyDetailDocument'),
  thirdPartyDetailName: document.querySelector('#thirdPartyDetailName'),
  thirdPartyDetailRoles: document.querySelector('#thirdPartyDetailRoles'),
  thirdPartyDetailContact: document.querySelector('#thirdPartyDetailContact'),
  thirdPartyDetailAddress: document.querySelector('#thirdPartyDetailAddress'),
  thirdPartyDetailReceivable: document.querySelector('#thirdPartyDetailReceivable'),
  thirdPartyDetailPayable: document.querySelector('#thirdPartyDetailPayable'),
  thirdPartyDetailPurchases: document.querySelector('#thirdPartyDetailPurchases'),
  thirdPartyActivityCount: document.querySelector('#thirdPartyActivityCount'),
  thirdPartyActivityList: document.querySelector('#thirdPartyActivityList'),
  editThirdPartyButton: document.querySelector('#editThirdPartyButton'),
  thirdPartyDialog: document.querySelector('#thirdPartyDialog'),
  thirdPartyForm: document.querySelector('#thirdPartyForm'),
  thirdPartyFormError: document.querySelector('#thirdPartyFormError'),
  thirdPartyDialogEyebrow: document.querySelector('#thirdPartyDialogEyebrow'),
  thirdPartyDialogTitle: document.querySelector('#thirdPartyDialogTitle'),
  thirdPartyDialogCopy: document.querySelector('#thirdPartyDialogCopy'),
  thirdPartyActiveField: document.querySelector('#thirdPartyActiveField'),
  closeThirdPartyDialog: document.querySelector('#closeThirdPartyDialog'),
  cancelThirdPartyButton: document.querySelector('#cancelThirdPartyButton'),
  saveThirdPartyButton: document.querySelector('#saveThirdPartyButton'),
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
  purchaseElectronicStatus: document.querySelector('#purchaseElectronicStatus'),
  purchaseElectronicCopy: document.querySelector('#purchaseElectronicCopy'),
  purchaseElectronicMeta: document.querySelector('#purchaseElectronicMeta'),
  purchaseElectronicEventList: document.querySelector('#purchaseElectronicEventList'),
  uploadPurchaseElectronicButton: document.querySelector('#uploadPurchaseElectronicButton'),
  emitPurchaseRadianEventButton: document.querySelector('#emitPurchaseRadianEventButton'),
  purchaseSupportDocumentBlock: document.querySelector('#purchaseSupportDocumentBlock'),
  purchaseSupportDocumentStatus: document.querySelector('#purchaseSupportDocumentStatus'),
  purchaseSupportDocumentCopy: document.querySelector('#purchaseSupportDocumentCopy'),
  purchaseSupportDocumentRequirements: document.querySelector('#purchaseSupportDocumentRequirements'),
  checkPurchaseSupportDocumentButton: document.querySelector('#checkPurchaseSupportDocumentButton'),
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
  purchaseElectronicDialog: document.querySelector('#purchaseElectronicDialog'),
  purchaseElectronicForm: document.querySelector('#purchaseElectronicForm'),
  purchaseElectronicTrackId: document.querySelector('#purchaseElectronicTrackId'),
  purchaseElectronicFormError: document.querySelector('#purchaseElectronicFormError'),
  closePurchaseElectronicDialog: document.querySelector('#closePurchaseElectronicDialog'),
  cancelPurchaseElectronicButton: document.querySelector('#cancelPurchaseElectronicButton'),
  savePurchaseElectronicButton: document.querySelector('#savePurchaseElectronicButton'),
  purchaseRadianDialog: document.querySelector('#purchaseRadianDialog'),
  purchaseRadianForm: document.querySelector('#purchaseRadianForm'),
  purchaseRadianEventType: document.querySelector('#purchaseRadianEventType'),
  purchaseRadianPayload: document.querySelector('#purchaseRadianPayload'),
  purchaseRadianFormError: document.querySelector('#purchaseRadianFormError'),
  closePurchaseRadianDialog: document.querySelector('#closePurchaseRadianDialog'),
  cancelPurchaseRadianButton: document.querySelector('#cancelPurchaseRadianButton'),
  savePurchaseRadianButton: document.querySelector('#savePurchaseRadianButton'),
  receiptPurchaseForm: document.querySelector('#receiptPurchaseForm'),
  receiptPurchaseFormError: document.querySelector('#receiptPurchaseFormError'),
  receiptPurchaseNumber: document.querySelector('#receiptPurchaseNumber'),
  receiptWarehouseId: document.querySelector('#receiptWarehouseId'),
  receiptPurchaseItems: document.querySelector('#receiptPurchaseItems'),
  closeReceiptPurchaseDialog: document.querySelector('#closeReceiptPurchaseDialog'),
  cancelReceiptPurchaseButton: document.querySelector('#cancelReceiptPurchaseButton'),
  saveReceiptPurchaseButton: document.querySelector('#saveReceiptPurchaseButton'),
  cashStatus: document.querySelector('#cashStatus'),
  billingModeName: document.querySelector('#billingModeName'),
  billingModeDetail: document.querySelector('#billingModeDetail'),
  billingModeStatus: document.querySelector('#billingModeStatus'),
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
  cashCloseSalesTotal: document.querySelector('#cashCloseSalesTotal'),
  cashCloseCardTotal: document.querySelector('#cashCloseCardTotal'),
  cashCloseTransferTotal: document.querySelector('#cashCloseTransferTotal'),
  cashDenominationGrid: document.querySelector('#cashDenominationGrid'),
  closeCloseCashDialog: document.querySelector('#closeCloseCashDialog'),
  cancelCloseCashButton: document.querySelector('#cancelCloseCashButton'),
  saveCloseCashButton: document.querySelector('#saveCloseCashButton'),
  cashCloseReceiptDialog: document.querySelector('#cashCloseReceiptDialog'),
  closeCashCloseReceipt: document.querySelector('#closeCashCloseReceipt'),
  finishCashCloseReceipt: document.querySelector('#finishCashCloseReceipt'),
  printCashCloseReceipt: document.querySelector('#printCashCloseReceipt'),
  cashCloseReceiptPeriod: document.querySelector('#cashCloseReceiptPeriod'),
  cashCloseReceiptSales: document.querySelector('#cashCloseReceiptSales'),
  cashCloseReceiptCount: document.querySelector('#cashCloseReceiptCount'),
  cashCloseReceiptExpected: document.querySelector('#cashCloseReceiptExpected'),
  cashCloseReceiptCounted: document.querySelector('#cashCloseReceiptCounted'),
  cashCloseReceiptDifference: document.querySelector('#cashCloseReceiptDifference'),
  cashCloseReceiptCards: document.querySelector('#cashCloseReceiptCards'),
  cashCloseReceiptTransfers: document.querySelector('#cashCloseReceiptTransfers'),
  cashCloseReceiptDenominations: document.querySelector('#cashCloseReceiptDenominations'),
  cashCloseReceiptNote: document.querySelector('#cashCloseReceiptNote'),
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
  openPosScannerButton: document.querySelector('#openPosScannerButton'),
  posScannerDialog: document.querySelector('#posScannerDialog'),
  closePosScannerDialog: document.querySelector('#closePosScannerDialog'),
  cancelPosScannerButton: document.querySelector('#cancelPosScannerButton'),
  posScannerVideo: document.querySelector('#posScannerVideo'),
  posScannerState: document.querySelector('#posScannerState'),
  posCategoryStrip: document.querySelector('#posCategoryStrip'),
  posProductGrid: document.querySelector('#posProductGrid'),
  posCatalogState: document.querySelector('#posCatalogState'),
  cartItems: document.querySelector('#cartItems'),
  cartEmpty: document.querySelector('#cartEmpty'),
  cartItemCount: document.querySelector('#cartItemCount'),
  cartSubtotal: document.querySelector('#cartSubtotal'),
  cartTax: document.querySelector('#cartTax'),
  cartTotal: document.querySelector('#cartTotal'),
  posDiscountType: document.querySelector('#posDiscountType'),
  posDiscountAmount: document.querySelector('#posDiscountAmount'),
  posDiscountReason: document.querySelector('#posDiscountReason'),
  cartDiscountTotal: document.querySelector('#cartDiscountTotal'),
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
  toggleMixedPaymentButton: document.querySelector('#toggleMixedPaymentButton'),
  posMixedPaymentPanel: document.querySelector('#posMixedPaymentPanel'),
  posMixedCashAmount: document.querySelector('#posMixedCashAmount'),
  posMixedCardAmount: document.querySelector('#posMixedCardAmount'),
  posMixedTransferAmount: document.querySelector('#posMixedTransferAmount'),
  posMixedRemaining: document.querySelector('#posMixedRemaining'),
  posCashTender: document.querySelector('#posCashTender'),
  posCashReceived: document.querySelector('#posCashReceived'),
  cashTenderSuggestions: document.querySelector('#cashTenderSuggestions'),
  posCashChange: document.querySelector('#posCashChange'),
  posTransferDetails: document.querySelector('#posTransferDetails'),
  posTransferCompany: document.querySelector('#posTransferCompany'),
  posTransferBankAccount: document.querySelector('#posTransferBankAccount'),
  posTransferAccountHelp: document.querySelector('#posTransferAccountHelp'),
  posTransferReference: document.querySelector('#posTransferReference'),
  posSaleError: document.querySelector('#posSaleError'),
  completeSaleButton: document.querySelector('#completeSaleButton'),
  posSaleLock: document.querySelector('#posSaleLock'),
  salesHistoryDialog: document.querySelector('#salesHistoryDialog'),
  closeSalesHistoryDialog: document.querySelector('#closeSalesHistoryDialog'),
  finishSalesHistoryButton: document.querySelector('#finishSalesHistoryButton'),
  posSalesHistoryList: document.querySelector('#posSalesHistoryList'),
  posSalesHistoryEmpty: document.querySelector('#posSalesHistoryEmpty'),
  posDocumentCompanyFilter: document.querySelector('#posDocumentCompanyFilter'),
  posDocumentPaymentFilter: document.querySelector('#posDocumentPaymentFilter'),
  posTransferSummary: document.querySelector('#posTransferSummary'),
  receiptDialog: document.querySelector('#receiptDialog'),
  receiptBrandLogo: document.querySelector('#receiptBrandLogo'),
  receiptNumber: document.querySelector('#receiptNumber'),
  receiptDocumentType: document.querySelector('#receiptDocumentType'),
  receiptDocumentStatus: document.querySelector('#receiptDocumentStatus'),
  receiptSplitActions: document.querySelector('#receiptSplitActions'),
  receiptLines: document.querySelector('#receiptLines'),
  receiptSubtotal: document.querySelector('#receiptSubtotal'),
  receiptTax: document.querySelector('#receiptTax'),
  receiptDiscountRow: document.querySelector('#receiptDiscountRow'),
  receiptDiscount: document.querySelector('#receiptDiscount'),
  receiptTotal: document.querySelector('#receiptTotal'),
  receiptCustomer: document.querySelector('#receiptCustomer'),
  receiptPaymentMethod: document.querySelector('#receiptPaymentMethod'),
  receiptPaymentBreakdown: document.querySelector('#receiptPaymentBreakdown'),
  receiptTransferRow: document.querySelector('#receiptTransferRow'),
  receiptTransferReference: document.querySelector('#receiptTransferReference'),
  receiptCreditRow: document.querySelector('#receiptCreditRow'),
  receiptCreditReference: document.querySelector('#receiptCreditReference'),
  receiptCashReceivedRow: document.querySelector('#receiptCashReceivedRow'),
  receiptCashReceived: document.querySelector('#receiptCashReceived'),
  receiptCashChangeRow: document.querySelector('#receiptCashChangeRow'),
  receiptCashChange: document.querySelector('#receiptCashChange'),
  receiptDianQrBlock: document.querySelector('#receiptDianQrBlock'),
  receiptQrTitle: document.querySelector('#receiptQrTitle'),
  receiptQrImage: document.querySelector('#receiptQrImage'),
  receiptQrCodeRow: document.querySelector('#receiptQrCodeRow'),
  receiptQrCodeLabel: document.querySelector('#receiptQrCodeLabel'),
  receiptCufeText: document.querySelector('#receiptCufeText'),
  receiptQrNotice: document.querySelector('#receiptQrNotice'),
  receiptOfficialPdfLink: document.querySelector('#receiptOfficialPdfLink'),
  openReturnDialogButton: document.querySelector('#openReturnDialogButton'),
  returnDialog: document.querySelector('#returnDialog'),
  returnForm: document.querySelector('#returnForm'),
  closeReturnDialog: document.querySelector('#closeReturnDialog'),
  cancelReturnButton: document.querySelector('#cancelReturnButton'),
  saveReturnButton: document.querySelector('#saveReturnButton'),
  returnItems: document.querySelector('#returnItems'),
  returnRefundMethod: document.querySelector('#returnRefundMethod'),
  returnBankAccountField: document.querySelector('#returnBankAccountField'),
  returnBankAccount: document.querySelector('#returnBankAccount'),
  returnReferenceField: document.querySelector('#returnReferenceField'),
  returnRefundReference: document.querySelector('#returnRefundReference'),
  returnCorrectionField: document.querySelector('#returnCorrectionField'),
  returnCorrectionConcept: document.querySelector('#returnCorrectionConcept'),
  returnReason: document.querySelector('#returnReason'),
  returnEstimatedTotal: document.querySelector('#returnEstimatedTotal'),
  returnFormError: document.querySelector('#returnFormError'),
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
  receivablePaymentMethod: document.querySelector('#receivablePaymentMethod'),
  receivablePaymentBankField: document.querySelector('#receivablePaymentBankField'),
  receivablePaymentBankAccountId: document.querySelector('#receivablePaymentBankAccountId'),
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
  payablePaymentMethod: document.querySelector('#payablePaymentMethod'),
  payablePaymentBankField: document.querySelector('#payablePaymentBankField'),
  payablePaymentBankAccountId: document.querySelector('#payablePaymentBankAccountId'),
  closePayablePaymentDialog: document.querySelector('#closePayablePaymentDialog'),
  cancelPayablePaymentButton: document.querySelector('#cancelPayablePaymentButton'),
  savePayablePaymentButton: document.querySelector('#savePayablePaymentButton'),
  expenseMonthTotal: document.querySelector('#expenseMonthTotal'),
  expensePendingApproval: document.querySelector('#expensePendingApproval'),
  expensePendingPayment: document.querySelector('#expensePendingPayment'),
  expenseRecurringTotal: document.querySelector('#expenseRecurringTotal'),
  expenseUnsupportedTotal: document.querySelector('#expenseUnsupportedTotal'),
  expenseCenterStrip: document.querySelector('#expenseCenterStrip'),
  expenseSearch: document.querySelector('#expenseSearch'),
  expenseStatusFilter: document.querySelector('#expenseStatusFilter'),
  reloadExpensesButton: document.querySelector('#reloadExpensesButton'),
  expenseRecordCount: document.querySelector('#expenseRecordCount'),
  expenseList: document.querySelector('#expenseList'),
  expenseDataState: document.querySelector('#expenseDataState'),
  expenseDetailEmpty: document.querySelector('#expenseDetailEmpty'),
  expenseDetailContent: document.querySelector('#expenseDetailContent'),
  expenseDetailNumber: document.querySelector('#expenseDetailNumber'),
  expenseDetailDescription: document.querySelector('#expenseDetailDescription'),
  expenseDetailBeneficiary: document.querySelector('#expenseDetailBeneficiary'),
  expenseDetailStatus: document.querySelector('#expenseDetailStatus'),
  expenseDetailDate: document.querySelector('#expenseDetailDate'),
  expenseDetailCategory: document.querySelector('#expenseDetailCategory'),
  expenseDetailCenter: document.querySelector('#expenseDetailCenter'),
  expenseDetailBranch: document.querySelector('#expenseDetailBranch'),
  expenseDetailTotal: document.querySelector('#expenseDetailTotal'),
  expenseDetailBalance: document.querySelector('#expenseDetailBalance'),
  expenseDetailSupport: document.querySelector('#expenseDetailSupport'),
  expenseDetailDocument: document.querySelector('#expenseDetailDocument'),
  expenseSupportLink: document.querySelector('#expenseSupportLink'),
  expenseDecisionOwner: document.querySelector('#expenseDecisionOwner'),
  expenseDecisionNotes: document.querySelector('#expenseDecisionNotes'),
  approveExpenseButton: document.querySelector('#approveExpenseButton'),
  rejectExpenseButton: document.querySelector('#rejectExpenseButton'),
  payExpenseButton: document.querySelector('#payExpenseButton'),
  expensePaymentCount: document.querySelector('#expensePaymentCount'),
  expensePaymentList: document.querySelector('#expensePaymentList'),
  newExpenseButton: document.querySelector('#newExpenseButton'),
  newCostCenterButton: document.querySelector('#newCostCenterButton'),
  newExpenseCategoryButton: document.querySelector('#newExpenseCategoryButton'),
  expenseDialog: document.querySelector('#expenseDialog'),
  expenseForm: document.querySelector('#expenseForm'),
  expenseFormError: document.querySelector('#expenseFormError'),
  expenseBranchId: document.querySelector('#expenseBranchId'),
  expenseCostCenterId: document.querySelector('#expenseCostCenterId'),
  expenseCategoryId: document.querySelector('#expenseCategoryId'),
  expenseSupplierId: document.querySelector('#expenseSupplierId'),
  expenseBeneficiaryField: document.querySelector('#expenseBeneficiaryField'),
  expenseBeneficiaryName: document.querySelector('#expenseBeneficiaryName'),
  expenseIssueDate: document.querySelector('#expenseIssueDate'),
  expenseDueDate: document.querySelector('#expenseDueDate'),
  expenseSubtotal: document.querySelector('#expenseSubtotal'),
  expenseTaxTotal: document.querySelector('#expenseTaxTotal'),
  expenseSupportDocumentId: document.querySelector('#expenseSupportDocumentId'),
  expenseRecurring: document.querySelector('#expenseRecurring'),
  expenseRecurrenceField: document.querySelector('#expenseRecurrenceField'),
  expenseRecurrenceRule: document.querySelector('#expenseRecurrenceRule'),
  expenseDraftTotal: document.querySelector('#expenseDraftTotal'),
  closeExpenseDialog: document.querySelector('#closeExpenseDialog'),
  cancelExpenseButton: document.querySelector('#cancelExpenseButton'),
  saveExpenseButton: document.querySelector('#saveExpenseButton'),
  payrollActiveEmployees: document.querySelector('#payrollActiveEmployees'),
  payrollActiveContracts: document.querySelector('#payrollActiveContracts'),
  payrollOpenPeriods: document.querySelector('#payrollOpenPeriods'),
  payrollPendingNovelties: document.querySelector('#payrollPendingNovelties'),
  payrollFactusTitle: document.querySelector('#payrollFactusTitle'),
  payrollFactusMessage: document.querySelector('#payrollFactusMessage'),
  payrollFactusStatus: document.querySelector('#payrollFactusStatus'),
  configurePayrollFactusButton: document.querySelector('#configurePayrollFactusButton'),
  testPayrollFactusButton: document.querySelector('#testPayrollFactusButton'),
  reloadPayrollButton: document.querySelector('#reloadPayrollButton'),
  newPayrollEmployeeButton: document.querySelector('#newPayrollEmployeeButton'),
  newPayrollPeriodButton: document.querySelector('#newPayrollPeriodButton'),
  payrollEmployeeList: document.querySelector('#payrollEmployeeList'),
  payrollEmployeeState: document.querySelector('#payrollEmployeeState'),
  payrollPeriodEmpty: document.querySelector('#payrollPeriodEmpty'),
  payrollPeriodContent: document.querySelector('#payrollPeriodContent'),
  payrollPeriodNumber: document.querySelector('#payrollPeriodNumber'),
  payrollPeriodDates: document.querySelector('#payrollPeriodDates'),
  payrollPeriodMeta: document.querySelector('#payrollPeriodMeta'),
  payrollPeriodStatus: document.querySelector('#payrollPeriodStatus'),
  payrollPeriodEarnings: document.querySelector('#payrollPeriodEarnings'),
  payrollPeriodDeductions: document.querySelector('#payrollPeriodDeductions'),
  payrollPeriodPaymentDate: document.querySelector('#payrollPeriodPaymentDate'),
  payrollPeriodNoveltyCount: document.querySelector('#payrollPeriodNoveltyCount'),
  payrollNoveltyCount: document.querySelector('#payrollNoveltyCount'),
  payrollNoveltyList: document.querySelector('#payrollNoveltyList'),
  newPayrollNoveltyButton: document.querySelector('#newPayrollNoveltyButton'),
  approvePayrollPeriodButton: document.querySelector('#approvePayrollPeriodButton'),
  payrollEmployeeDialog: document.querySelector('#payrollEmployeeDialog'),
  payrollEmployeeForm: document.querySelector('#payrollEmployeeForm'),
  payrollEmployeeBranchId: document.querySelector('#payrollEmployeeBranchId'),
  payrollEmployeeFormError: document.querySelector('#payrollEmployeeFormError'),
  closePayrollEmployeeDialog: document.querySelector('#closePayrollEmployeeDialog'),
  cancelPayrollEmployeeButton: document.querySelector('#cancelPayrollEmployeeButton'),
  savePayrollEmployeeButton: document.querySelector('#savePayrollEmployeeButton'),
  payrollContractDialog: document.querySelector('#payrollContractDialog'),
  payrollContractForm: document.querySelector('#payrollContractForm'),
  payrollContractEmployeeName: document.querySelector('#payrollContractEmployeeName'),
  payrollContractFormError: document.querySelector('#payrollContractFormError'),
  closePayrollContractDialog: document.querySelector('#closePayrollContractDialog'),
  cancelPayrollContractButton: document.querySelector('#cancelPayrollContractButton'),
  savePayrollContractButton: document.querySelector('#savePayrollContractButton'),
  payrollPeriodDialog: document.querySelector('#payrollPeriodDialog'),
  payrollPeriodForm: document.querySelector('#payrollPeriodForm'),
  payrollPeriodFormError: document.querySelector('#payrollPeriodFormError'),
  closePayrollPeriodDialog: document.querySelector('#closePayrollPeriodDialog'),
  cancelPayrollPeriodButton: document.querySelector('#cancelPayrollPeriodButton'),
  savePayrollPeriodButton: document.querySelector('#savePayrollPeriodButton'),
  payrollNoveltyDialog: document.querySelector('#payrollNoveltyDialog'),
  payrollNoveltyForm: document.querySelector('#payrollNoveltyForm'),
  payrollNoveltyEmployeeId: document.querySelector('#payrollNoveltyEmployeeId'),
  payrollNoveltyEffectiveDate: document.querySelector('#payrollNoveltyEffectiveDate'),
  payrollNoveltyPeriodName: document.querySelector('#payrollNoveltyPeriodName'),
  payrollNoveltyFormError: document.querySelector('#payrollNoveltyFormError'),
  closePayrollNoveltyDialog: document.querySelector('#closePayrollNoveltyDialog'),
  cancelPayrollNoveltyButton: document.querySelector('#cancelPayrollNoveltyButton'),
  savePayrollNoveltyButton: document.querySelector('#savePayrollNoveltyButton'),
  expenseDecisionDialog: document.querySelector('#expenseDecisionDialog'),
  expenseDecisionForm: document.querySelector('#expenseDecisionForm'),
  expenseDecisionKicker: document.querySelector('#expenseDecisionKicker'),
  expenseDecisionTitle: document.querySelector('#expenseDecisionTitle'),
  expenseDecisionCopy: document.querySelector('#expenseDecisionCopy'),
  expenseDecisionAction: document.querySelector('#expenseDecisionAction'),
  expenseDecisionInput: document.querySelector('#expenseDecisionInput'),
  expenseDecisionError: document.querySelector('#expenseDecisionError'),
  closeExpenseDecisionDialog: document.querySelector('#closeExpenseDecisionDialog'),
  cancelExpenseDecision: document.querySelector('#cancelExpenseDecision'),
  saveExpenseDecision: document.querySelector('#saveExpenseDecision'),
  expensePaymentDialog: document.querySelector('#expensePaymentDialog'),
  expensePaymentForm: document.querySelector('#expensePaymentForm'),
  expensePaymentNumber: document.querySelector('#expensePaymentNumber'),
  expensePaymentBalance: document.querySelector('#expensePaymentBalance'),
  expensePaymentAmount: document.querySelector('#expensePaymentAmount'),
  expensePaymentDate: document.querySelector('#expensePaymentDate'),
  expensePaymentMethod: document.querySelector('#expensePaymentMethod'),
  expenseBankAccountField: document.querySelector('#expenseBankAccountField'),
  expenseBankAccountId: document.querySelector('#expenseBankAccountId'),
  expenseCashSessionField: document.querySelector('#expenseCashSessionField'),
  expenseCashSessionId: document.querySelector('#expenseCashSessionId'),
  expensePaymentError: document.querySelector('#expensePaymentError'),
  closeExpensePaymentDialog: document.querySelector('#closeExpensePaymentDialog'),
  cancelExpensePayment: document.querySelector('#cancelExpensePayment'),
  saveExpensePayment: document.querySelector('#saveExpensePayment'),
  costCenterDialog: document.querySelector('#costCenterDialog'),
  costCenterForm: document.querySelector('#costCenterForm'),
  costCenterBranchId: document.querySelector('#costCenterBranchId'),
  costCenterFormError: document.querySelector('#costCenterFormError'),
  closeCostCenterDialog: document.querySelector('#closeCostCenterDialog'),
  cancelCostCenter: document.querySelector('#cancelCostCenter'),
  saveCostCenter: document.querySelector('#saveCostCenter'),
  expenseCategoryDialog: document.querySelector('#expenseCategoryDialog'),
  expenseCategoryForm: document.querySelector('#expenseCategoryForm'),
  expenseAccountingAccountId: document.querySelector('#expenseAccountingAccountId'),
  expenseCategoryFormError: document.querySelector('#expenseCategoryFormError'),
  closeExpenseCategoryDialog: document.querySelector('#closeExpenseCategoryDialog'),
  cancelExpenseCategory: document.querySelector('#cancelExpenseCategory'),
  saveExpenseCategory: document.querySelector('#saveExpenseCategory'),
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
  revokeUserSessionsButton: document.querySelector('#revokeUserSessionsButton'),
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
  auditPeriodFrom: document.querySelector('#auditPeriodFrom'),
  auditPeriodTo: document.querySelector('#auditPeriodTo'),
  auditReadinessScore: document.querySelector('#auditReadinessScore'),
  auditControlGrid: document.querySelector('#auditControlGrid'),
  accountingBalanceBadge: document.querySelector('#accountingBalanceBadge'),
  accountingPostedCount: document.querySelector('#accountingPostedCount'),
  accountingDebitTotal: document.querySelector('#accountingDebitTotal'),
  accountingCreditTotal: document.querySelector('#accountingCreditTotal'),
  accountingPendingAccounts: document.querySelector('#accountingPendingAccounts'),
  accountingEntryList: document.querySelector('#accountingEntryList'),
  bankTransactionCount: document.querySelector('#bankTransactionCount'),
  bankMatchedCount: document.querySelector('#bankMatchedCount'),
  bankUnmatchedCount: document.querySelector('#bankUnmatchedCount'),
  trialBalanceState: document.querySelector('#trialBalanceState'),
  bankTransactionList: document.querySelector('#bankTransactionList'),
  trialBalanceList: document.querySelector('#trialBalanceList'),
  newBankAccountButton: document.querySelector('#newBankAccountButton'),
  newBankTransactionButton: document.querySelector('#newBankTransactionButton'),
  completeBankReconciliationButton:
    document.querySelector('#completeBankReconciliationButton'),
  downloadMonthlyPackageButton:
    document.querySelector('#downloadMonthlyPackageButton'),
  bankAccountDialog: document.querySelector('#bankAccountDialog'),
  bankAccountForm: document.querySelector('#bankAccountForm'),
  bankAccountingAccountId: document.querySelector('#bankAccountingAccountId'),
  bankName: document.querySelector('#bankName'),
  bankAccountName: document.querySelector('#bankAccountName'),
  bankMaskedAccount: document.querySelector('#bankMaskedAccount'),
  bankOpeningBalance: document.querySelector('#bankOpeningBalance'),
  bankAccountError: document.querySelector('#bankAccountError'),
  closeBankAccountDialog: document.querySelector('#closeBankAccountDialog'),
  cancelBankAccount: document.querySelector('#cancelBankAccount'),
  saveBankAccount: document.querySelector('#saveBankAccount'),
  bankTransactionDialog: document.querySelector('#bankTransactionDialog'),
  bankTransactionForm: document.querySelector('#bankTransactionForm'),
  bankTransactionAccountId: document.querySelector('#bankTransactionAccountId'),
  bankTransactionDate: document.querySelector('#bankTransactionDate'),
  bankTransactionReference: document.querySelector('#bankTransactionReference'),
  bankTransactionAmount: document.querySelector('#bankTransactionAmount'),
  bankStatementBalance: document.querySelector('#bankStatementBalance'),
  bankTransactionDescription:
    document.querySelector('#bankTransactionDescription'),
  bankTransactionError: document.querySelector('#bankTransactionError'),
  closeBankTransactionDialog:
    document.querySelector('#closeBankTransactionDialog'),
  cancelBankTransaction: document.querySelector('#cancelBankTransaction'),
  saveBankTransaction: document.querySelector('#saveBankTransaction'),
  bankReconciliationDialog: document.querySelector('#bankReconciliationDialog'),
  bankReconciliationForm: document.querySelector('#bankReconciliationForm'),
  bankReconciliationAccountId:
    document.querySelector('#bankReconciliationAccountId'),
  bankReconciliationBalance:
    document.querySelector('#bankReconciliationBalance'),
  bankReconciliationNotes: document.querySelector('#bankReconciliationNotes'),
  bankReconciliationError: document.querySelector('#bankReconciliationError'),
  closeBankReconciliationDialog:
    document.querySelector('#closeBankReconciliationDialog'),
  cancelBankReconciliation: document.querySelector('#cancelBankReconciliation'),
  saveBankReconciliation: document.querySelector('#saveBankReconciliation'),
  accountingGovernance: document.querySelector('#accountingGovernance'),
  accountingPeriodList: document.querySelector('#accountingPeriodList'),
  accountingMappingList: document.querySelector('#accountingMappingList'),
  accountingAccountList: document.querySelector('#accountingAccountList'),
  newAccountingAccount: document.querySelector('#newAccountingAccount'),
  accountingActionDialog: document.querySelector('#accountingActionDialog'),
  accountingActionForm: document.querySelector('#accountingActionForm'),
  accountingActionKicker: document.querySelector('#accountingActionKicker'),
  accountingActionTitle: document.querySelector('#accountingActionTitle'),
  accountingActionDescription: document.querySelector('#accountingActionDescription'),
  accountingActionType: document.querySelector('#accountingActionType'),
  accountingActionId: document.querySelector('#accountingActionId'),
  accountingActionDateField: document.querySelector('#accountingActionDateField'),
  accountingActionDate: document.querySelector('#accountingActionDate'),
  accountingActionNotes: document.querySelector('#accountingActionNotes'),
  accountingActionError: document.querySelector('#accountingActionError'),
  closeAccountingAction: document.querySelector('#closeAccountingAction'),
  cancelAccountingAction: document.querySelector('#cancelAccountingAction'),
  saveAccountingAction: document.querySelector('#saveAccountingAction'),
  accountingAccountDialog: document.querySelector('#accountingAccountDialog'),
  accountingAccountForm: document.querySelector('#accountingAccountForm'),
  accountingAccountCode: document.querySelector('#accountingAccountCode'),
  accountingAccountName: document.querySelector('#accountingAccountName'),
  accountingAccountType: document.querySelector('#accountingAccountType'),
  accountingNormalBalance: document.querySelector('#accountingNormalBalance'),
  accountingAccountReason: document.querySelector('#accountingAccountReason'),
  accountingAccountError: document.querySelector('#accountingAccountError'),
  closeAccountingAccount: document.querySelector('#closeAccountingAccount'),
  cancelAccountingAccount: document.querySelector('#cancelAccountingAccount'),
  saveAccountingAccount: document.querySelector('#saveAccountingAccount'),
  runAuditControls: document.querySelector('#runAuditControls'),
  openAccountantReview: document.querySelector('#openAccountantReview'),
  exportAuditEvidence: document.querySelector('#exportAuditEvidence'),
  accountantReviewDialog: document.querySelector('#accountantReviewDialog'),
  accountantReviewForm: document.querySelector('#accountantReviewForm'),
  accountantReviewType: document.querySelector('#accountantReviewType'),
  accountantReviewStatus: document.querySelector('#accountantReviewStatus'),
  accountantReviewerName: document.querySelector('#accountantReviewerName'),
  accountantReviewerDocument: document.querySelector('#accountantReviewerDocument'),
  accountantProfessionalCard: document.querySelector('#accountantProfessionalCard'),
  accountantEvidenceReference: document.querySelector('#accountantEvidenceReference'),
  accountantReviewNotes: document.querySelector('#accountantReviewNotes'),
  accountantReviewError: document.querySelector('#accountantReviewError'),
  closeAccountantReview: document.querySelector('#closeAccountantReview'),
  cancelAccountantReview: document.querySelector('#cancelAccountantReview'),
  saveAccountantReview: document.querySelector('#saveAccountantReview'),
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
let comboCatalog = [];
let pricingOverview = {
  lists: [], prices: [], promotions: [], products: [], customers: [],
};
let commercialPlanningOverview = {
  current_plan: null,
  plans: [],
  initiatives: [],
  actual_revenue: 0,
  actual_margin: 0,
  open_plans: 0,
};
let commercialPlanningPeople = [];
let commercialOpportunities = [];
let commercialBudgets = [];
let commercialCampaigns = [];
let commercialExpenses = [];
let posSummary = { registers: [], openSession: null };
let executiveSummary = {};
let posCatalog = [];
let posDocuments = [];
let posTransferSummary = [];
let posBankAccounts = [];
let posCustomers = [];
let posSaleTerms = 'IMMEDIATE';
let posMixedPayment = false;
let selectedReceiptForReturn = null;
let receivableCustomers = [];
let receivableInvoices = [];
let receivableBankAccounts = [];
let selectedReceivable = null;
let physicalCounts = [];
let selectedPhysicalCount = null;
let inventorySummary = {};
let inventoryBalances = [];
let inventoryMovements = [];
let inventoryReplenishments = [];
let inventoryIncidents = [];
let inventoryTransferOrders = [];
let advancedInventory = {
  summary: {}, locations: [], units: [], variants: [], lots: [], serials: [],
  reservations: [], labels: [], closures: [], permissions: [], users: [],
};
let advancedInventoryAction = null;
let thirdParties = [];
let selectedThirdParty = null;
let editingThirdParty = null;
let thirdPartySearchTimer = null;
let suppliers = [];
let purchases = [];
let selectedPurchase = null;
let payableInvoices = [];
let payableSources = { suppliers: [], purchases: [] };
let payableBankAccounts = [];
let selectedPayable = null;
let businessExpenses = [];
let expenseSetup = {
  branches: [],
  suppliers: [],
  categories: [],
  costCenters: [],
  bankAccounts: [],
  cashSessions: [],
  documents: [],
  expenseAccounts: [],
};
let selectedExpense = null;
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
let auditReadiness = null;
let accountingGovernanceData = { accounts: [], mappings: [], periods: [] };
let bankReconciliationData = {
  accounts: [],
  transactions: [],
  runs: [],
  summary: {},
};
let trialBalanceData = { accounts: [], totals: {}, balanced: true };
let pendingAccountingAction = null;
let activeReportType = 'sales';
let reportColumns = [];
let reportItems = [];
let reportPagination = { page: 1, pageSize: 50, total: 0, totalPages: 1 };
let reportFacetsLoadedForTenant = null;
let reportSearchTimer = null;
let electronicBillingOverview = null;
let billingWorkflowOverview = {
  documents: [],
  notes: [],
  invoices: [],
  counts: {},
};
let currentUser = null;
let csrfToken = null;
let pendingActivationToken = new URLSearchParams(window.location.search).get('activate');
let pendingPasswordResetToken = new URLSearchParams(window.location.search).get('reset');
const saleCart = new Map();
let activePosCategory = 'ALL';
let customerDialogSource = 'receivables';
let imageProduct = null;
let imageProductEntityType = 'PRODUCT';
let posScannerStream = null;
let posScannerFrame = null;
let posScannerLastValue = null;
let posScannerLastAt = 0;
let taxProduct = null;
let structuredProduct = null;
let productStructure = null;
let imagePreviewUrl = null;
let catalogImportCsv = null;
let catalogImportPreview = null;
let quickLookupTimer = null;
let quickLookupSequence = 0;
let activeTenantId = readTenantPreference();
let taxProfileCompany = null;
let identityCompany = null;
let tenantModules = { LOGISTICS: true, PAYROLL: false };
let logisticsOverview = {
  summary: {},
  batches: [],
  labelSettings: {},
};
let selectedLogisticsBatch = null;
let logisticsLabelBatchId = null;
let payrollEmployees = [];
let payrollPeriods = [];
let selectedPayrollEmployee = null;
let selectedPayrollPeriod = null;
let payrollNovelties = [];

function isTenantModuleEnabled(moduleCode) {
  return tenantModules[moduleCode] !== false;
}

const warehouseTypeLabels = {
  AVAILABLE: 'Disponible',
  DISPLAY: 'Exhibición',
  QUARANTINE: 'Cuarentena',
  DAMAGED: 'Averías',
  TRANSIT: 'En tránsito',
};

const paymentMethodLabels = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  MIXED: 'Pago mixto',
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
  return (name || 'Nubixor')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function renderTenantModules() {
  const logisticsEnabled = isTenantModuleEnabled('LOGISTICS');
  const payrollEnabled = isTenantModuleEnabled('PAYROLL');
  const canManageModules = hasAnyPermission('users.manage', 'user.manage');
  const logisticsCard = document.querySelector('[data-module-setting="LOGISTICS"]');
  const payrollCard = document.querySelector('[data-module-setting="PAYROLL"]');

  elements.logisticsModuleToggle.checked = logisticsEnabled;
  elements.logisticsModuleToggle.disabled = !canManageModules;
  elements.logisticsModuleStatus.textContent =
    logisticsEnabled ? 'Activo para esta empresa' : 'Desactivado';
  elements.logisticsViewStatus.classList.toggle('disabled', !logisticsEnabled);
  elements.logisticsViewStatus.innerHTML = logisticsEnabled
    ? '<i aria-hidden="true"></i> Módulo activo'
    : '<i aria-hidden="true"></i> Módulo desactivado';
  logisticsCard?.classList.toggle('module-disabled', !logisticsEnabled);
  elements.payrollModuleToggle.checked = payrollEnabled;
  elements.payrollModuleToggle.disabled = !canManageModules;
  elements.payrollModuleStatus.textContent = payrollEnabled
    ? 'Activo para esta empresa' : 'Desactivado';
  payrollCard?.classList.toggle('module-disabled', !payrollEnabled);
}

async function loadTenantModules() {
  if (!activeTenantId) return [];
  const modules = await getJson('/api/module-settings', {
    headers: { 'x-tenant-id': activeTenantId },
  });
  tenantModules = Object.fromEntries(
    modules.map((module) => [module.code, Boolean(module.enabled)]),
  );
  elements.moduleSettingMessage.hidden = true;
  renderTenantModules();
  applyAccessVisibility();
  if (!isTenantModuleEnabled('LOGISTICS') && resolveView() === 'logistica') {
    window.location.hash = 'inventario';
    showView('inventario');
  }
  return modules;
}

const logisticsStatusLabels = {
  COUNTING: 'En recepción',
  PRICING: 'En valoración',
  APPROVAL: 'Por aprobar',
  COMPLETED: 'Completado',
  REJECTED: 'Rechazado',
};

function logisticsOfflineKey(batchId) {
  return `nubixor.logistics.scans.${activeTenantId}.${batchId}`;
}

function readOfflineScans(batchId) {
  try {
    return JSON.parse(window.localStorage.getItem(logisticsOfflineKey(batchId)) || '[]');
  } catch {
    return [];
  }
}

function writeOfflineScans(batchId, scans) {
  try {
    window.localStorage.setItem(logisticsOfflineKey(batchId), JSON.stringify(scans));
  } catch {
    // El almacenamiento local es una ayuda de resiliencia, no la fuente oficial.
  }
}

function syncLogisticsConnectionState() {
  const pending = selectedLogisticsBatch
    ? readOfflineScans(selectedLogisticsBatch.batch.id).length
    : 0;
  elements.logisticsConnectionState.textContent = navigator.onLine
    ? pending
      ? `${pending} lectura(s) pendientes de sincronizar`
      : 'Conexión disponible'
    : `Modo sin conexión · ${pending} lectura(s) en cola`;
  elements.logisticsConnectionState.classList.toggle('offline', !navigator.onLine || pending > 0);
}

function renderLogisticsOverview() {
  const summary = logisticsOverview.summary || {};
  elements.logisticsCountingCount.textContent = String(summary.counting || 0);
  elements.logisticsPricingCount.textContent = String(summary.pricing || 0);
  elements.logisticsApprovalCount.textContent = String(summary.approval || 0);
  elements.logisticsLabelsPending.textContent = String(summary.labels_pending || 0);
  elements.logisticsLabelTabBadge.textContent = String(summary.labels_pending || 0);
  elements.logisticsFlowValue.textContent = formatCurrency(summary.value_in_flow);
  elements.logisticsFlowUnits.textContent =
    `${Number(summary.units_in_flow || 0).toLocaleString('es-CO')} unidades recibidas`;
  elements.logisticsWorkflowAlertBadge.textContent =
    String(Number(summary.counting || 0) +
      Number(summary.pricing || 0) +
      Number(summary.approval || 0));
  renderLogisticsBatches();
  syncLogisticsLabelSettings();
  renderLogisticsLabelCenter();
}

function resolvedLogisticsLabelSettings() {
  return {
    widthMm: 50,
    heightMm: 25,
    showCompany: true,
    showProduct: true,
    showPrice: true,
    showSku: true,
    showBarcode: true,
    footerText: 'Gracias por su compra',
    ...(logisticsOverview.labelSettings || {}),
  };
}

function readLogisticsLabelSettings() {
  const [widthMm, heightMm] = elements.logisticsLabelSize.value
    .split('x')
    .map(Number);
  return {
    widthMm,
    heightMm,
    showCompany: elements.logisticsLabelShowCompany.checked,
    showProduct: elements.logisticsLabelShowProduct.checked,
    showPrice: elements.logisticsLabelShowPrice.checked,
    showSku: elements.logisticsLabelShowSku.checked,
    showBarcode: elements.logisticsLabelShowBarcode.checked,
    footerText: elements.logisticsLabelFooter.value.trim(),
  };
}

function updateLogisticsLabelPreview() {
  const settings = readLogisticsLabelSettings();
  const company = getActiveCompany();
  elements.logisticsLabelPreview.style.aspectRatio =
    `${settings.widthMm} / ${settings.heightMm}`;
  elements.logisticsLabelPreviewCompany.textContent =
    company?.trade_name || company?.legal_name || 'Mi empresa';
  elements.logisticsLabelPreviewCompany.hidden = !settings.showCompany;
  elements.logisticsLabelPreviewProduct.hidden = !settings.showProduct;
  elements.logisticsLabelPreviewPrice.hidden = !settings.showPrice;
  elements.logisticsLabelPreviewBarcode.hidden = !settings.showBarcode;
  elements.logisticsLabelPreviewSku.hidden = !settings.showSku;
  elements.logisticsLabelPreviewFooter.textContent = settings.footerText;
  elements.logisticsLabelPreviewFooter.hidden = !settings.footerText;
}

function syncLogisticsLabelSettings() {
  const settings = resolvedLogisticsLabelSettings();
  const size = `${settings.widthMm}x${settings.heightMm}`;
  if ([...elements.logisticsLabelSize.options].some((option) => option.value === size)) {
    elements.logisticsLabelSize.value = size;
  }
  elements.logisticsLabelShowCompany.checked = settings.showCompany;
  elements.logisticsLabelShowProduct.checked = settings.showProduct;
  elements.logisticsLabelShowPrice.checked = settings.showPrice;
  elements.logisticsLabelShowSku.checked = settings.showSku;
  elements.logisticsLabelShowBarcode.checked = settings.showBarcode;
  elements.logisticsLabelFooter.value = settings.footerText || '';
  updateLogisticsLabelPreview();
}

function renderLogisticsLabelCenter() {
  const batches = logisticsOverview.batches.filter((batch) =>
    batch.status === 'COMPLETED');
  elements.logisticsLabelBatchList.replaceChildren();
  elements.logisticsLabelBatchCount.textContent =
    `${batches.length} ${batches.length === 1 ? 'lote' : 'lotes'}`;
  if (logisticsLabelBatchId &&
      !batches.some((batch) => batch.id === logisticsLabelBatchId)) {
    logisticsLabelBatchId = null;
  }
  batches.forEach((batch) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'logistics-label-batch';
    button.classList.toggle('active', batch.id === logisticsLabelBatchId);
    button.dataset.logisticsLabelBatch = batch.id;
    const copy = document.createElement('span');
    const number = document.createElement('small');
    number.textContent = batch.batch_number;
    const title = document.createElement('strong');
    title.textContent = batch.title;
    const meta = document.createElement('em');
    meta.textContent = `${Number(batch.item_count || 0)} productos · ` +
      `${Number(batch.units || 0).toLocaleString('es-CO')} etiquetas`;
    copy.append(number, title, meta);
    const pending = document.createElement('b');
    pending.textContent = Number(batch.labels_pending || 0)
      ? `${batch.labels_pending} pendientes`
      : 'Impreso';
    pending.classList.toggle('complete', !Number(batch.labels_pending || 0));
    button.append(copy, pending);
    elements.logisticsLabelBatchList.append(button);
  });

  const detailReady = logisticsLabelBatchId &&
    selectedLogisticsBatch?.batch?.id === logisticsLabelBatchId &&
    selectedLogisticsBatch.batch.status === 'COMPLETED';
  elements.logisticsLabelEmpty.hidden = Boolean(detailReady);
  elements.logisticsLabelProductList.replaceChildren();
  elements.printLogisticsBatchLabels.disabled = !detailReady;
  if (!detailReady) {
    elements.logisticsLabelSelectedBatch.textContent = batches.length
      ? 'Selecciona un lote'
      : 'Aún no hay lotes aprobados';
    return;
  }

  const { batch, items } = selectedLogisticsBatch;
  elements.logisticsLabelSelectedBatch.textContent =
    `${batch.batch_number} · ${batch.title}`;
  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'logistics-label-product';
    row.dataset.logisticsLabelProduct = item.id;
    const identity = document.createElement('div');
    const icon = document.createElement('span');
    icon.textContent = (item.product_name || item.sku).slice(0, 1).toUpperCase();
    const copy = document.createElement('p');
    const name = document.createElement('strong');
    name.textContent = item.product_name;
    const meta = document.createElement('small');
    meta.textContent = `${item.sku} · ${formatCurrency(
      item.approved_price || item.proposed_price,
    )}`;
    const status = document.createElement('em');
    status.textContent = item.label_status === 'PRINTED'
      ? `${Number(item.label_quantity_printed || 0)} impresas en ${item.print_count} envío(s)`
      : 'Pendiente de impresión';
    copy.append(name, meta, status);
    identity.append(icon, copy);
    const controls = document.createElement('div');
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Copias';
    const quantity = document.createElement('input');
    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = '10000';
    quantity.step = '1';
    quantity.value = String(Math.max(1, Math.trunc(Number(item.counted_quantity) || 1)));
    quantity.dataset.logisticsLabelQuantity = item.id;
    quantityLabel.append(quantity);
    const print = document.createElement('button');
    print.type = 'button';
    print.className = 'secondary-button compact';
    print.dataset.logisticsPrintItem = item.id;
    print.textContent = item.label_status === 'PRINTED' ? 'Reimprimir' : 'Imprimir';
    controls.append(quantityLabel, print);
    row.append(identity, controls);
    elements.logisticsLabelProductList.append(row);
  });
}

async function selectLogisticsLabelBatch(batchId) {
  logisticsLabelBatchId = batchId;
  await loadLogisticsBatch(batchId);
  renderLogisticsLabelCenter();
}

function logisticsLabelJobItems(itemId = null) {
  if (!selectedLogisticsBatch ||
      selectedLogisticsBatch.batch.id !== logisticsLabelBatchId) return [];
  return selectedLogisticsBatch.items
    .filter((item) => !itemId || item.id === itemId)
    .map((item) => {
      const input = elements.logisticsLabelProductList.querySelector(
        `[data-logistics-label-quantity="${item.id}"]`,
      );
      return {
        itemId: item.id,
        productName: item.product_name,
        sku: item.sku,
        barcode: item.barcode || item.sku,
        price: item.approved_price || item.proposed_price,
        quantity: Math.max(1, Math.trunc(Number(input?.value) || 1)),
      };
    });
}

function openLogisticsLabelPrint(itemId = null) {
  const items = logisticsLabelJobItems(itemId);
  if (!items.length) {
    showToast('Selecciona un lote aprobado para imprimir.');
    return;
  }
  if (items.reduce((total, item) => total + item.quantity, 0) > 10000) {
    showToast('El trabajo supera 10.000 etiquetas. Divide la impresión en partes.');
    return;
  }
  const jobId = window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const company = getActiveCompany();
  window.localStorage.setItem(`nubixor.label-job.${jobId}`, JSON.stringify({
    batchId: selectedLogisticsBatch.batch.id,
    batchNumber: selectedLogisticsBatch.batch.batch_number,
    companyName: company?.trade_name || company?.legal_name || 'Mi empresa',
    settings: readLogisticsLabelSettings(),
    items,
  }));
  const printWindow = window.open(
    `/label-print.html?job=${encodeURIComponent(jobId)}`,
    `nubixor-labels-${jobId}`,
  );
  if (!printWindow) {
    showToast('El navegador bloqueó la ventana. Permite ventanas emergentes para imprimir.');
  }
}

async function saveLogisticsLabelConfiguration() {
  elements.saveLogisticsLabelSettings.disabled = true;
  try {
    logisticsOverview.labelSettings = await getJson('/api/logistics/labels/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(readLogisticsLabelSettings()),
    });
    syncLogisticsLabelSettings();
    showToast('Diseño de etiqueta guardado para esta empresa.');
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.saveLogisticsLabelSettings.disabled = false;
  }
}

function renderLogisticsBatches() {
  const search = normalizeSearch(elements.logisticsBatchSearch.value.trim());
  const status = elements.logisticsBatchStatusFilter.value;
  const batches = logisticsOverview.batches.filter((batch) => {
    const searchable = normalizeSearch([
      batch.batch_number,
      batch.title,
      batch.supplier_name,
      batch.supplier_invoice_number,
      batch.warehouse_name,
    ].filter(Boolean).join(' '));
    return (!search || searchable.includes(search)) &&
      (!status || batch.status === status);
  });
  elements.logisticsBatchList.replaceChildren();
  elements.logisticsBatchCount.textContent =
    `${batches.length} ${batches.length === 1 ? 'lote' : 'lotes'}`;
  elements.logisticsBatchState.hidden = batches.length > 0;
  if (!batches.length) {
    elements.logisticsBatchState.querySelector('strong').textContent =
      logisticsOverview.batches.length
        ? 'Sin coincidencias'
        : 'Aún no hay recepciones';
    elements.logisticsBatchState.querySelector('p').textContent =
      logisticsOverview.batches.length
        ? 'Ajusta la búsqueda o el estado.'
        : 'Crea el primer lote para comenzar a recibir mercancía.';
    return;
  }
  batches.forEach((batch) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'logistics-batch-card';
    button.classList.toggle(
      'active',
      selectedLogisticsBatch?.batch?.id === batch.id,
    );
    button.dataset.logisticsBatchId = batch.id;
    const header = document.createElement('div');
    const identity = document.createElement('span');
    identity.textContent = batch.batch_number;
    const badge = document.createElement('b');
    badge.dataset.status = batch.status;
    badge.textContent = logisticsStatusLabels[batch.status] || batch.status;
    header.append(identity, badge);
    const title = document.createElement('strong');
    title.textContent = batch.title;
    const meta = document.createElement('small');
    meta.textContent = [
      batch.supplier_name || 'Sin proveedor',
      batch.warehouse_name,
    ].filter(Boolean).join(' · ');
    const metrics = document.createElement('div');
    metrics.innerHTML = `
      <span><b>${Number(batch.item_count || 0)}</b> referencias</span>
      <span><b>${Number(batch.units || 0).toLocaleString('es-CO')}</b> unidades</span>
      <span><b>${formatCurrency(batch.total_cost)}</b> valor</span>
    `;
    button.append(header, title, meta, metrics);
    button.addEventListener('click', () => loadLogisticsBatch(batch.id));
    elements.logisticsBatchList.append(button);
  });
}

function logisticsActionButton(label, action, className = 'secondary-button') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${className} compact`;
  button.dataset.logisticsAction = action;
  button.textContent = label;
  return button;
}

function renderLogisticsDetail() {
  const detail = selectedLogisticsBatch;
  elements.logisticsDetailEmpty.hidden = Boolean(detail);
  elements.logisticsDetailContent.hidden = !detail;
  if (!detail) return;
  const { batch, items, comments } = detail;
  elements.logisticsDetailNumber.textContent = batch.batch_number;
  elements.logisticsDetailTitle.textContent = batch.title;
  elements.logisticsDetailMeta.textContent = [
    batch.supplier_invoice_number && `Factura ${batch.supplier_invoice_number}`,
    new Date(`${String(batch.received_on).slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO'),
  ].filter(Boolean).join(' · ') || 'Recepción logística';
  elements.logisticsDetailStatus.textContent =
    logisticsStatusLabels[batch.status] || batch.status;
  elements.logisticsDetailStatus.dataset.status = batch.status;
  elements.logisticsScanForm.hidden =
    batch.status !== 'COUNTING' || !hasAnyPermission('logistics.count');
  elements.logisticsDetailActions.replaceChildren();

  if (batch.status === 'COUNTING' && hasAnyPermission('logistics.count')) {
    elements.logisticsDetailActions.append(
      logisticsActionButton('Finalizar conteo →', 'finish-count', 'primary-button'),
    );
  }
  if (batch.status === 'PRICING' && hasAnyPermission('logistics.price')) {
    elements.logisticsDetailActions.append(
      logisticsActionButton('Enviar a jefatura →', 'submit-approval', 'primary-button'),
    );
  }
  if (batch.status === 'APPROVAL' && hasAnyPermission('logistics.approve')) {
    elements.logisticsDetailActions.append(
      logisticsActionButton('Devolver a precios', 'reject'),
      logisticsActionButton('Aprobar y cargar inventario ✓', 'approve', 'primary-button'),
    );
  }
  if (batch.status === 'COMPLETED') {
    elements.logisticsDetailActions.append(
      logisticsActionButton('Imprimir etiquetas ▥', 'open-labels', 'primary-button'),
      logisticsActionButton('Exportar lote CSV ↓', 'export'),
    );
  }

  elements.logisticsItemCount.textContent =
    `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`;
  elements.logisticsItemList.replaceChildren();
  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'logistics-item-card';
    article.dataset.itemId = item.id;
    const identity = document.createElement('div');
    identity.className = 'logistics-item-identity';
    const symbol = document.createElement('span');
    symbol.textContent = (item.product_name || item.sku).slice(0, 1).toUpperCase();
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.product_name;
    const meta = document.createElement('small');
    meta.textContent = `${item.sku} · ${Number(item.counted_quantity).toLocaleString('es-CO')} contadas` +
      (Number(item.expected_quantity) > 0
        ? ` / ${Number(item.expected_quantity).toLocaleString('es-CO')} esperadas`
        : '');
    copy.append(title, meta);
    if (item.tax_review_status === 'PENDING') {
      const provisional = document.createElement('em');
      provisional.textContent = 'Producto nuevo · revisar en Catálogo';
      copy.append(provisional);
    }
    identity.append(symbol, copy);
    article.append(identity);

    if (batch.status === 'PRICING' && hasAnyPermission('logistics.price')) {
      const pricing = document.createElement('div');
      pricing.className = 'logistics-pricing-fields';
      pricing.innerHTML = `
        <label><span>Costo unitario</span>
          <input data-logistics-price="cost" type="number" min="0" step="0.01"
            value="${Number(item.unit_cost || 0)}"></label>
        <label><span>Precio propuesto</span>
          <input data-logistics-price="price" type="number" min="0" step="0.01"
            value="${Number(item.proposed_price || 0)}"></label>
        <label><span>Actualizar existencia</span>
          <select data-logistics-price="mode">
            <option value="ADD"${item.movement_mode === 'ADD' ? ' selected' : ''}>Sumar</option>
            <option value="REPLACE"${item.movement_mode === 'REPLACE' ? ' selected' : ''}>Reemplazar</option>
          </select></label>
        <button class="secondary-button compact" type="button"
          data-logistics-price-save="${item.id}">Guardar</button>
      `;
      article.append(pricing);
    } else {
      const values = document.createElement('div');
      values.className = 'logistics-item-values';
      values.innerHTML = `
        <span><small>Costo</small><strong>${formatCurrency(item.unit_cost)}</strong></span>
        <span><small>Precio</small><strong>${formatCurrency(item.approved_price || item.proposed_price)}</strong></span>
        <span><small>Movimiento</small><strong>${item.movement_mode === 'REPLACE' ? 'Reemplazar' : 'Sumar'}</strong></span>
      `;
      article.append(values);
    }

    if (batch.status === 'COMPLETED' && hasAnyPermission('logistics.labels')) {
      const labelButton = document.createElement('button');
      labelButton.type = 'button';
      labelButton.className = 'logistics-label-button';
      labelButton.dataset.logisticsLabelItem = item.id;
      labelButton.textContent = item.label_status === 'PENDING'
        ? 'Imprimir etiqueta'
        : `Reimprimir · ${item.print_count}`;
      article.append(labelButton);
    }
    elements.logisticsItemList.append(article);
  });

  elements.logisticsTimeline.replaceChildren();
  if (!comments.length) {
    const empty = document.createElement('p');
    empty.className = 'logistics-timeline-empty';
    empty.textContent = 'Sin eventos registrados.';
    elements.logisticsTimeline.append(empty);
  }
  comments.forEach((comment) => {
    const event = document.createElement('article');
    const dot = document.createElement('span');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = comment.event_type.replaceAll('_', ' ');
    const message = document.createElement('p');
    message.textContent = comment.comment;
    const meta = document.createElement('small');
    meta.textContent = `${comment.user_name || 'Sistema'} · ${
      new Date(comment.created_at).toLocaleString('es-CO')
    }`;
    copy.append(title, message, meta);
    event.append(dot, copy);
    elements.logisticsTimeline.append(event);
  });
  syncLogisticsConnectionState();
  renderLogisticsBatches();
  renderLogisticsLabelCenter();
}

async function loadLogisticsOverview() {
  if (!activeTenantId || !isTenantModuleEnabled('LOGISTICS') ||
      !hasAnyPermission('logistics.view')) {
    logisticsOverview = { summary: {}, batches: [], labelSettings: {} };
    renderLogisticsOverview();
    return logisticsOverview;
  }
  logisticsOverview = await getJson('/api/logistics/overview', {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderLogisticsOverview();
  if (selectedLogisticsBatch &&
      !logisticsOverview.batches.some((batch) =>
        batch.id === selectedLogisticsBatch.batch.id)) {
    selectedLogisticsBatch = null;
    renderLogisticsDetail();
  }
  return logisticsOverview;
}

async function loadLogisticsBatch(batchId) {
  selectedLogisticsBatch = await getJson(`/api/logistics/batches/${batchId}`, {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderLogisticsDetail();
  return selectedLogisticsBatch;
}

function syncLogisticsBatchWarehouses() {
  const branchId = elements.logisticsBatchBranchId.value;
  const current = elements.logisticsBatchWarehouseId.value;
  elements.logisticsBatchWarehouseId.replaceChildren(
    new Option('Selecciona la bodega', ''),
  );
  warehouses
    .filter((warehouse) => warehouse.active && warehouse.branch_id === branchId)
    .forEach((warehouse) => {
      elements.logisticsBatchWarehouseId.append(
        new Option(`${warehouse.name} · ${warehouse.code}`, warehouse.id),
      );
    });
  if ([...elements.logisticsBatchWarehouseId.options]
    .some((option) => option.value === current)) {
    elements.logisticsBatchWarehouseId.value = current;
  }
}

function openLogisticsBatchDialog() {
  elements.logisticsBatchForm.reset();
  elements.logisticsBatchFormError.hidden = true;
  elements.logisticsBatchBranchId.replaceChildren(
    new Option('Selecciona la sucursal', ''),
  );
  branches.filter((branch) => branch.active).forEach((branch) => {
    elements.logisticsBatchBranchId.append(
      new Option(`${branch.name} · ${branch.code}`, branch.id),
    );
  });
  elements.logisticsBatchSupplierId.replaceChildren(
    new Option('Sin proveedor asociado', ''),
  );
  suppliers.filter((supplier) => supplier.active).forEach((supplier) => {
    elements.logisticsBatchSupplierId.append(
      new Option(supplier.name, supplier.id),
    );
  });
  if (branches.length) elements.logisticsBatchBranchId.value = branches[0].id;
  syncLogisticsBatchWarehouses();
  const date = elements.logisticsBatchForm.querySelector('[name="receivedOn"]');
  date.value = new Date().toISOString().slice(0, 10);
  elements.logisticsBatchDialog.showModal();
  elements.logisticsBatchForm.querySelector('[name="title"]').focus();
}

function closeLogisticsBatchDialog() {
  elements.logisticsBatchDialog.close();
}

async function submitLogisticsBatch(event) {
  event.preventDefault();
  elements.logisticsBatchFormError.hidden = true;
  elements.saveLogisticsBatchButton.disabled = true;
  const form = new FormData(elements.logisticsBatchForm);
  const payload = Object.fromEntries(form.entries());
  payload.supplierId ||= null;
  try {
    const batch = await getJson('/api/logistics/batches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    closeLogisticsBatchDialog();
    await loadLogisticsOverview();
    await loadLogisticsBatch(batch.id);
    elements.logisticsScanSku.focus();
    showToast('Lote abierto para recepción y conteo.');
  } catch (error) {
    elements.logisticsBatchFormError.textContent = error.message;
    elements.logisticsBatchFormError.hidden = false;
  } finally {
    elements.saveLogisticsBatchButton.disabled = false;
  }
}

async function submitLogisticsScan(event) {
  event.preventDefault();
  if (!selectedLogisticsBatch) return;
  const form = new FormData(elements.logisticsScanForm);
  const payload = {
    sku: form.get('sku'),
    quantity: Number(form.get('quantity')),
    expectedQuantity: Number(form.get('expectedQuantity') || 0),
    createIfMissing: form.get('createIfMissing') === 'on',
    productName: form.get('productName') || null,
  };
  elements.logisticsScanError.hidden = true;
  if (!navigator.onLine) {
    const pending = readOfflineScans(selectedLogisticsBatch.batch.id);
    pending.push(payload);
    writeOfflineScans(selectedLogisticsBatch.batch.id, pending);
    elements.logisticsScanForm.reset();
    elements.logisticsScanForm.querySelector('[name="quantity"]').value = '1';
    elements.logisticsScanForm.querySelector('[name="expectedQuantity"]').value = '0';
    syncLogisticsConnectionState();
    showToast('Lectura guardada en el dispositivo para sincronizar después.');
    return;
  }
  try {
    await getJson(
      `/api/logistics/batches/${selectedLogisticsBatch.batch.id}/scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify(payload),
      },
    );
    const batchId = selectedLogisticsBatch.batch.id;
    elements.logisticsScanForm.reset();
    elements.logisticsScanForm.querySelector('[name="quantity"]').value = '1';
    elements.logisticsScanForm.querySelector('[name="expectedQuantity"]').value = '0';
    await Promise.all([loadLogisticsOverview(), loadLogisticsBatch(batchId)]);
    elements.logisticsScanSku.focus();
  } catch (error) {
    if (!error.status) {
      const pending = readOfflineScans(selectedLogisticsBatch.batch.id);
      pending.push(payload);
      writeOfflineScans(selectedLogisticsBatch.batch.id, pending);
      syncLogisticsConnectionState();
      showToast('Sin conexión. La lectura quedó protegida en la cola local.');
      return;
    }
    elements.logisticsScanError.textContent = error.message;
    elements.logisticsScanError.hidden = false;
  }
}

async function flushLogisticsOfflineScans() {
  if (!selectedLogisticsBatch || !navigator.onLine) {
    syncLogisticsConnectionState();
    return;
  }
  const batchId = selectedLogisticsBatch.batch.id;
  const pending = readOfflineScans(batchId);
  if (!pending.length) {
    syncLogisticsConnectionState();
    return;
  }
  const remaining = [...pending];
  while (remaining.length) {
    try {
      await getJson(`/api/logistics/batches/${batchId}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify(remaining[0]),
      });
      remaining.shift();
      writeOfflineScans(batchId, remaining);
    } catch {
      break;
    }
  }
  syncLogisticsConnectionState();
  await Promise.all([loadLogisticsOverview(), loadLogisticsBatch(batchId)]);
  if (!remaining.length) showToast('Lecturas sin conexión sincronizadas.');
}

async function runLogisticsAction(action) {
  if (!selectedLogisticsBatch) return;
  const batchId = selectedLogisticsBatch.batch.id;
  if (action === 'open-labels') {
    logisticsLabelBatchId = batchId;
    selectInventoryPanel('labels');
    renderLogisticsLabelCenter();
    return;
  }
  if (action === 'export') {
    const response = await fetch(
      `${API_BASE_URL}/api/logistics/batches/${batchId}/export.csv`,
      {
        credentials: 'include',
        headers: { 'x-tenant-id': activeTenantId },
      },
    );
    if (!response.ok) throw new Error('No fue posible exportar el lote.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedLogisticsBatch.batch.batch_number}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  const actions = {
    'finish-count': { path: 'finish-count', body: {} },
    'submit-approval': { path: 'submit-approval', body: {} },
    approve: {
      path: 'approve',
      body: { reason: 'Revisión y aprobación final desde Logística' },
    },
  };
  if (action === 'reject') {
    const reason = window.prompt('Explica qué debe corregirse antes de aprobar:');
    if (!reason) return;
    actions.reject = { path: 'reject', body: { reason } };
  }
  const selected = actions[action];
  if (!selected) return;
  if (action === 'approve' && !window.confirm(
    'Esta aprobación cargará existencias, costos y precios y bloqueará el lote. ¿Continuar?',
  )) return;
  await getJson(`/api/logistics/batches/${batchId}/${selected.path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': activeTenantId,
    },
    body: JSON.stringify(selected.body),
  });
  await Promise.all([loadLogisticsOverview(), loadLogisticsBatch(batchId), loadInventory()]);
  showToast('Etapa logística actualizada.');
}

async function saveLogisticsPricing(button) {
  const item = button.closest('.logistics-item-card');
  const batchId = selectedLogisticsBatch.batch.id;
  button.disabled = true;
  try {
    await getJson(
      `/api/logistics/batches/${batchId}/items/${button.dataset.logisticsPriceSave}/pricing`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({
          unitCost: Number(item.querySelector('[data-logistics-price="cost"]').value),
          proposedPrice: Number(item.querySelector('[data-logistics-price="price"]').value),
          movementMode: item.querySelector('[data-logistics-price="mode"]').value,
        }),
      },
    );
    await loadLogisticsBatch(batchId);
    await loadLogisticsOverview();
    showToast('Costo y precio guardados.');
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
}

async function markLogisticsLabelsPrinted(batchId, items) {
  if (!items?.length) return;
  if (!batchId) return;
  await Promise.all(items.map((item) =>
    getJson(
      `/api/logistics/batches/${batchId}/items/${item.itemId}/label-printed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ quantity: item.quantity }),
      },
    )));
  logisticsLabelBatchId = batchId;
  await Promise.all([loadLogisticsOverview(), loadLogisticsBatch(batchId)]);
  showToast('Impresión registrada con cantidades e historial.');
}

async function toggleTenantModule(event) {
  const desiredState = event.currentTarget.checked;
  const previousState = isTenantModuleEnabled('LOGISTICS');
  elements.logisticsModuleToggle.disabled = true;
  elements.moduleSettingMessage.hidden = true;
  try {
    const module = await getJson('/api/module-settings/LOGISTICS', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ enabled: desiredState }),
    });
    tenantModules.LOGISTICS = Boolean(module.enabled);
    renderTenantModules();
    applyAccessVisibility();
    if (!module.enabled && resolveView() === 'logistica') {
      window.location.hash = 'inventario';
      showView('inventario');
    }
    if (!module.enabled) {
      selectedLogisticsBatch = null;
      logisticsLabelBatchId = null;
      logisticsOverview = { summary: {}, batches: [], labelSettings: {} };
      renderLogisticsOverview();
      renderLogisticsDetail();
    }
    await Promise.all([
      loadInventory(),
      module.enabled ? loadLogisticsOverview() : Promise.resolve({}),
    ]);
    showToast(module.enabled
      ? 'Logística activada para esta empresa.'
      : 'Logística desactivada. Sus datos permanecen guardados.');
  } catch (error) {
    tenantModules.LOGISTICS = previousState;
    renderTenantModules();
    elements.moduleSettingMessage.textContent = error.message;
    elements.moduleSettingMessage.hidden = false;
  } finally {
    elements.logisticsModuleToggle.disabled = !hasAnyPermission('users.manage');
  }
}

async function togglePayrollModule(event) {
  const desiredState = event.currentTarget.checked;
  const previousState = isTenantModuleEnabled('PAYROLL');
  elements.payrollModuleToggle.disabled = true;
  elements.moduleSettingMessage.hidden = true;
  try {
    const module = await getJson('/api/module-settings/PAYROLL', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify({ enabled: desiredState }),
    });
    tenantModules.PAYROLL = Boolean(module.enabled);
    renderTenantModules();
    showToast(module.enabled
      ? 'Nómina activada. Configura empleados y contratos antes de liquidar.'
      : 'Nómina desactivada. Los datos permanecen guardados.');
  } catch (error) {
    tenantModules.PAYROLL = previousState;
    renderTenantModules();
    elements.moduleSettingMessage.textContent = error.message;
    elements.moduleSettingMessage.hidden = false;
  } finally {
    elements.payrollModuleToggle.disabled = !hasAnyPermission('users.manage');
  }
}

function applyAccessVisibility() {
  const membership = activeMembership();
  const cashierMode = membership?.roleCode === 'CASHIER';
  elements.appShell.classList.toggle('cashier-mode', cashierMode);
  elements.billingConnector.hidden = !hasAnyPermission('billing.manage');
  const viewPermissions = {
    inicio: ['dashboard.view'],
    empresas: [],
    sucursales: ['branches.manage', 'branch.view', 'dashboard.view', 'inventory.view', 'sales.operate'],
    terceros: ['parties.view', 'parties.manage', 'customer.view', 'supplier.view'],
    bodegas: ['warehouses.manage', 'warehouse.view', 'inventory.view', 'purchases.manage', 'sales.operate'],
    inventario: ['inventory.view', 'inventory.count.view', 'inventory.adjust'],
    logistica: ['logistics.view', 'inventory.receive', 'inventory.transfer'],
    productos: ['product.view', 'catalog.manage', 'inventory.view', 'purchases.manage', 'sales.operate'],
    compras: ['purchase.view', 'purchase.create', 'purchases.manage'],
    'cuentas-pagar': ['payable.view', 'payable.manage', 'payables.manage'],
    gastos: ['expenses.view', 'expenses.manage', 'expenses.approve', 'expenses.pay'],
    nomina: ['payroll.view', 'payroll.manage', 'payroll.approve'],
    caja: ['pos.use', 'cash.view', 'sales.operate'],
    cartera: ['receivable.view', 'receivable.manage', 'receivables.manage'],
    facturacion: ['billing.view', 'billing.manage'],
    usuarios: ['user.view', 'user.manage', 'users.manage'],
    modulos: ['dashboard.view'],
    reportes: ['reports.view', 'report.export'],
    auditoria: ['audit.view'],
    sistema: ['audit.view', 'users.manage', 'billing.manage'],
  };
  document.querySelectorAll('[data-view-link]').forEach((link) => {
    const required = viewPermissions[link.dataset.viewLink] || [];
    const requiredModule = link.dataset.tenantModuleLink;
    const moduleRestricted =
      requiredModule && !isTenantModuleEnabled(requiredModule);
    const cashierRestricted = cashierMode && link.dataset.viewLink !== 'caja';
    const branchAuditRestricted =
      link.dataset.viewLink === 'auditoria' && Boolean(membership?.branchId);
    link.hidden = moduleRestricted || cashierRestricted || branchAuditRestricted ||
      (required.length > 0 && !hasAnyPermission(...required));
  });
  updateSidebarGroupVisibility();
  elements.accountRole.textContent = membership?.roleName || 'Sin acceso a empresa';
  elements.newCompanyButton.hidden = !hasAnyPermission('companies.manage');
  elements.newBranchButton.hidden = !hasAnyPermission('branches.manage');
  elements.newWarehouseButton.hidden = !hasAnyPermission('warehouses.manage', 'warehouse.manage');
  elements.newAdjustmentButton.hidden = !hasAnyPermission('inventory.adjust', 'inventory.adjustment.request');
  elements.newTransferButton.hidden =
    !isTenantModuleEnabled('LOGISTICS') || !hasAnyPermission('inventory.adjust', 'inventory.transfer');
  elements.newLogisticsBatchButton.hidden = !hasAnyPermission('logistics.count');
  elements.newCountButton.hidden = !hasAnyPermission('inventory.adjust', 'inventory.count.perform');
  elements.newCategoryButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newBrandButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newTaxButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newProductButton.hidden = !hasAnyPermission('catalog.manage', 'product.create');
  elements.openCatalogImportButton.hidden = !hasAnyPermission('catalog.manage');
  elements.categoryPanelCreateButton.hidden = !hasAnyPermission('catalog.manage');
  elements.brandPanelCreateButton.hidden = !hasAnyPermission('catalog.manage');
  elements.taxPanelCreateButton.hidden = !hasAnyPermission('catalog.manage');
  elements.newPurchaseButton.hidden = !hasAnyPermission('purchases.manage', 'purchase.create');
  elements.newSupplierButton.hidden = !hasAnyPermission('purchases.manage', 'supplier.manage');
  elements.supplierPanelCreateButton.hidden = !hasAnyPermission('purchases.manage');
  elements.newExpenseButton.hidden = !hasAnyPermission('expenses.manage');
  elements.newCostCenterButton.hidden = !hasAnyPermission('expenses.manage');
  elements.newExpenseCategoryButton.hidden = !hasAnyPermission('expenses.manage');
  elements.newPayrollEmployeeButton.hidden = !hasAnyPermission('payroll.manage');
  elements.newPayrollPeriodButton.hidden = !hasAnyPermission('payroll.manage');
  elements.newThirdPartyButton.hidden = !hasAnyPermission('parties.manage');
  elements.editThirdPartyButton.hidden = !hasAnyPermission('parties.manage');
  elements.inviteUserButton.hidden = !hasAnyPermission('users.manage', 'user.manage');
  elements.newRoleButton.hidden = !hasAnyPermission('users.manage', 'user.manage');
  renderTenantModules();
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
  elements.recoveryRequestPanel.hidden = true;
  elements.resetPasswordPanel.hidden = true;
  elements.accountMenu.hidden = true;
  if (setupRequired) {
    elements.setupEmail.value = initialEmail || 'admin@nubixor.tech';
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
  elements.recoveryRequestPanel.hidden = true;
  elements.resetPasswordPanel.hidden = true;
  queueMicrotask(() => elements.activateAccessForm.elements.password.focus());
}

function showRecoveryGate() {
  elements.setupAccessPanel.hidden = true;
  elements.loginAccessPanel.hidden = true;
  elements.activateAccessPanel.hidden = true;
  elements.resetPasswordPanel.hidden = true;
  elements.recoveryRequestPanel.hidden = false;
  elements.recoveryRequestError.hidden = true;
  elements.recoveryRequestSuccess.hidden = true;
  elements.recoveryEmail.value = elements.loginEmail.value;
  queueMicrotask(() => elements.recoveryEmail.focus());
}

function showResetPasswordGate() {
  currentUser = null;
  csrfToken = null;
  elements.appShell.hidden = true;
  elements.authGate.hidden = false;
  elements.authLoading.hidden = true;
  elements.setupAccessPanel.hidden = true;
  elements.loginAccessPanel.hidden = true;
  elements.activateAccessPanel.hidden = true;
  elements.recoveryRequestPanel.hidden = true;
  elements.resetPasswordPanel.hidden = false;
  queueMicrotask(() => elements.resetPasswordForm.elements.password.focus());
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

async function submitRecoveryRequest(event) {
  event.preventDefault();
  elements.recoveryRequestError.hidden = true;
  elements.recoveryRequestSuccess.hidden = true;
  elements.recoveryRequestButton.disabled = true;
  try {
    const result = await getJson('/api/auth/password-recovery/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: elements.recoveryEmail.value }),
    });
    if (result.resetUrl) {
      pendingPasswordResetToken =
        new URL(result.resetUrl).searchParams.get('reset');
      showResetPasswordGate();
      return;
    }
    elements.recoveryRequestSuccess.textContent = result.message;
    elements.recoveryRequestSuccess.hidden = false;
  } catch (error) {
    elements.recoveryRequestError.textContent = error.message;
    elements.recoveryRequestError.hidden = false;
  } finally {
    elements.recoveryRequestButton.disabled = false;
  }
}

async function submitResetPassword(event) {
  event.preventDefault();
  const formData = new FormData(elements.resetPasswordForm);
  elements.resetPasswordError.hidden = true;
  if (formData.get('password') !== formData.get('confirmPassword')) {
    elements.resetPasswordError.textContent = 'Las contraseñas no coinciden.';
    elements.resetPasswordError.hidden = false;
    return;
  }
  elements.resetPasswordButton.disabled = true;
  try {
    const result = await getJson('/api/auth/password-recovery/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: pendingPasswordResetToken,
        password: formData.get('password'),
      }),
    });
    pendingPasswordResetToken = null;
    window.history.replaceState({}, '', window.location.pathname);
    await completeAuthentication(result.user, result.csrfToken);
    showToast('Contraseña actualizada y sesiones anteriores cerradas.');
  } catch (error) {
    elements.resetPasswordError.textContent = error.message;
    elements.resetPasswordError.hidden = false;
  } finally {
    elements.resetPasswordButton.disabled = false;
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
  if (pendingPasswordResetToken) {
    showResetPasswordGate();
    return;
  }
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
    title.textContent = 'No pudimos conectar con Nubixor';
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
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      ...requestOptions,
      credentials: 'include',
      headers: requestHeaders,
    });
  } catch (cause) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const error = new Error(
      offline
        ? 'Este equipo está sin conexión. Conéctate a internet y vuelve a intentarlo.'
        : 'No pudimos enviar la solicitud. Tu información sigue intacta; espera unos segundos y vuelve a intentarlo.',
      { cause },
    );
    error.code = 'NETWORK_REQUEST_FAILED';
    throw error;
  }

  let body = null;
  if (response.status !== 204) {
    try {
      body = await response.json();
    } catch (cause) {
      const error = new Error(
        response.ok
          ? 'El servidor respondió en un formato inesperado. Actualiza la página y vuelve a intentarlo.'
          : 'El servicio está temporalmente ocupado. Espera unos segundos y vuelve a intentarlo.',
        { cause },
      );
      error.status = response.status;
      error.code = 'INVALID_API_RESPONSE';
      throw error;
    }
  }
  if (!response.ok) {
    const error = new Error(body?.error || 'No fue posible consultar la API.');
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]);
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

function setQuickLookupState(title, detail, symbol = 'P') {
  elements.quickLookupState.hidden = false;
  elements.quickLookupState.replaceChildren();
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = symbol;
  const strong = document.createElement('strong');
  strong.textContent = title;
  const paragraph = document.createElement('p');
  paragraph.textContent = detail;
  elements.quickLookupState.append(icon, strong, paragraph);
}

function openQuickLookup() {
  const company = getActiveCompany();
  if (!company) {
    showToast('Selecciona una empresa para consultar su catálogo.');
    return;
  }
  quickLookupSequence += 1;
  clearTimeout(quickLookupTimer);
  elements.quickLookupSearch.value = '';
  elements.quickLookupResults.replaceChildren();
  elements.quickLookupCompany.textContent =
    company.trade_name || company.legal_name || 'Empresa activa';
  setQuickLookupState(
    'Consulta cualquier producto',
    'Escribe al menos dos caracteres para ver precio, impuesto y existencias.',
  );
  if (!elements.quickLookupDialog.open) elements.quickLookupDialog.showModal();
  requestAnimationFrame(() => elements.quickLookupSearch.focus());
}

function closeQuickLookup() {
  quickLookupSequence += 1;
  clearTimeout(quickLookupTimer);
  if (elements.quickLookupDialog.open) elements.quickLookupDialog.close();
  elements.quickLookupSearch.value = '';
  elements.quickLookupResults.replaceChildren();
}

function openLookupProductInWorkspace(product) {
  closeQuickLookup();
  if (hasAnyPermission('sales.operate')) {
    showView('caja');
    elements.posProductSearch.value = product.sku;
    renderPosCatalog();
    elements.posProductSearch.focus();
    showToast(
      posCatalog.some((item) => item.id === product.id)
        ? 'Producto ubicado en Caja. Enter agrega un SKU exacto.'
        : 'El producto no está disponible en el origen seleccionado de Caja.',
    );
    return;
  }
  if (hasAnyPermission('inventory.view', 'inventory.adjust')) {
    showView('inventario');
    elements.inventorySearch.value = product.sku;
    renderInventoryBalances();
    elements.inventorySearch.focus();
    return;
  }
  showView('productos');
  elements.productSearch.value = product.sku;
  renderProducts();
  elements.productSearch.focus();
}

function renderQuickLookupResults(payload) {
  elements.quickLookupResults.replaceChildren();
  const records = payload.products || [];
  if (!records.length) {
    setQuickLookupState(
      'Sin coincidencias',
      `No encontramos productos para “${payload.query}” en la empresa activa.`,
      '0',
    );
    return;
  }
  elements.quickLookupState.hidden = true;
  records.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'quick-product-card';
    const visual = document.createElement('div');
    visual.className = 'quick-product-visual';
    if (product.image_url) {
      const image = document.createElement('img');
      image.src = resolvePublicAsset(product.image_url);
      image.alt = '';
      visual.append(image);
    } else {
      visual.textContent = product.name.slice(0, 1).toUpperCase();
    }
    const identity = document.createElement('div');
    identity.className = 'quick-product-identity';
    const heading = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = product.name;
    const meta = document.createElement('small');
    meta.textContent = [
      product.sku,
      product.barcode ? `Código ${product.barcode}` : null,
      product.category_name,
      product.brand_name,
    ].filter(Boolean).join(' · ');
    heading.append(name, meta);
    const locations = document.createElement('div');
    locations.className = 'quick-product-locations';
    if (product.locations?.length) {
      product.locations.forEach((location) => {
        const badge = document.createElement('span');
        badge.className = location.type === 'DISPLAY' ? 'display' : '';
        badge.textContent =
          `${location.warehouse}: ${Number(location.available).toLocaleString('es-CO')}`;
        locations.append(badge);
      });
    } else {
      const empty = document.createElement('span');
      empty.className = 'empty';
      empty.textContent = payload.scope === 'DISPLAY_ONLY'
        ? 'Sin unidades disponibles en exhibición'
        : 'Sin existencias registradas';
      locations.append(empty);
    }
    identity.append(heading, locations);
    const commercial = document.createElement('div');
    commercial.className = 'quick-product-commercial';
    const price = document.createElement('strong');
    price.textContent = formatCurrency(product.sale_price);
    const tax = document.createElement('small');
    tax.textContent = product.tax_name
      ? `${product.tax_name} · ${Number(product.tax_rate)}%`
      : 'Impuesto pendiente';
    const stock = document.createElement('span');
    stock.textContent =
      `${Number(product.available_stock).toLocaleString('es-CO')} disponibles`;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'secondary-button compact';
    open.textContent = hasAnyPermission('sales.operate')
      ? 'Buscar en Caja →'
      : 'Abrir detalle →';
    open.addEventListener('click', () => openLookupProductInWorkspace(product));
    commercial.append(price, tax, stock, open);
    card.append(visual, identity, commercial);
    elements.quickLookupResults.append(card);
  });
}

function scheduleQuickLookup() {
  clearTimeout(quickLookupTimer);
  const search = elements.quickLookupSearch.value.trim();
  if (search.length < 2) {
    elements.quickLookupResults.replaceChildren();
    setQuickLookupState(
      'Escribe al menos dos caracteres',
      'Puedes consultar por nombre, SKU, código de barras, categoría o marca.',
    );
    return;
  }
  const sequence = ++quickLookupSequence;
  setQuickLookupState('Consultando productos…', 'Buscando dentro de la empresa activa.', '…');
  quickLookupTimer = setTimeout(async () => {
    try {
      const payload = await getJson(
        `/api/products/lookup?q=${encodeURIComponent(search)}`,
      );
      if (sequence !== quickLookupSequence) return;
      renderQuickLookupResults(payload);
    } catch (error) {
      if (sequence !== quickLookupSequence) return;
      setQuickLookupState('No fue posible consultar', error.message, '!');
    }
  }, 180);
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

    const identityCell = document.createElement('td');
    identityCell.dataset.label = 'Identidad';
    const identity = document.createElement('div');
    identity.className = 'company-identity-cell';
    if (company.logo_url) {
      const logo = document.createElement('img');
      logo.src = company.logo_url;
      logo.alt = `Logo de ${company.trade_name || company.legal_name}`;
      identity.append(logo);
    } else {
      const logoPlaceholder = document.createElement('span');
      logoPlaceholder.className = 'company-logo-table-placeholder';
      logoPlaceholder.textContent = company.legal_name.slice(0, 1).toUpperCase();
      identity.append(logoPlaceholder);
    }
    const identityInfo = document.createElement('div');
    const identityStatus = document.createElement('strong');
    identityStatus.textContent = company.logo_url ? 'Logo configurado' : 'Sin logo';
    identityInfo.append(identityStatus);
    if (hasAnyPermission('companies.manage')) {
      const configureIdentity = document.createElement('button');
      configureIdentity.type = 'button';
      configureIdentity.className = 'accounting-row-action';
      configureIdentity.textContent = company.logo_url ? 'Cambiar' : 'Configurar';
      configureIdentity.addEventListener('click', () =>
        openCompanyIdentityDialog(company));
      identityInfo.append(configureIdentity);
    }
    identity.append(identityInfo);
    identityCell.append(identity);
    row.append(identityCell);

    const billingCell = document.createElement('td');
    billingCell.dataset.label = 'Facturación';
    const billing = document.createElement('span');
    const electronic = company.default_document_type === 'ELECTRONIC_INVOICE';
    const connected = company.billing_account_configured && company.billing_resolution_configured;
    billing.className = `table-status ${electronic && !connected ? 'pending' : 'active'}`;
    billing.textContent = electronic
      ? (connected ? 'DIAN conectada' : 'DIAN por conectar')
      : 'Comprobante interno';
    billingCell.append(billing);
    row.append(billingCell);

    const taxCell = document.createElement('td');
    taxCell.dataset.label = 'Tributación';
    const taxState = document.createElement('span');
    taxState.className = `table-status ${
      company.validation_status === 'VALIDATED' ? 'active' : 'pending'
    }`;
    taxState.textContent = company.validation_status === 'VALIDATED'
      ? 'Validada'
      : company.validation_status === 'OBSERVED'
        ? 'Observada'
        : 'Por validar';
    taxCell.append(taxState);
    if (hasAnyPermission('companies.manage')) {
      const configure = document.createElement('button');
      configure.type = 'button';
      configure.className = 'accounting-row-action';
      configure.textContent = company.validation_status === 'PENDING'
        ? 'Configurar'
        : 'Revisar';
      configure.addEventListener('click', () => openTaxProfileDialog(company));
      taxCell.append(configure);
    }
    row.append(taxCell);

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

function getColorSwatchHtml(colorNameStr) {
  const normalized = (colorNameStr || '').toString().trim().toLowerCase();
  const colorMap = {
    'rojo': '#ef4444',
    'red': '#ef4444',
    'verde': '#10b981',
    'green': '#10b981',
    'azul': '#3b82f6',
    'blue': '#3b82f6',
    'negro': '#1e293b',
    'black': '#1e293b',
    'blanco': '#f8fafc',
    'white': '#f8fafc',
    'amarillo': '#f59e0b',
    'yellow': '#f59e0b',
    'rosado': '#ec4899',
    'pink': '#ec4899',
    'morado': '#8b5cf6',
    'purple': '#8b5cf6',
    'naranja': '#f97316',
    'orange': '#f97316',
    'gris': '#64748b',
    'gray': '#64748b',
    'grey': '#64748b',
    'cafe': '#78350f',
    'brown': '#78350f',
  };

  let hexColor = '#6366f1';
  for (const [key, hex] of Object.entries(colorMap)) {
    if (normalized.includes(key)) {
      hexColor = hex;
      break;
    }
  }

  const isWhite = hexColor === '#f8fafc';
  const borderCss = isWhite ? 'border: 1px solid #cbd5e1;' : 'border: 1px solid rgba(0,0,0,0.12);';

  return `<span style="display:inline-block; width:11px; height:11px; border-radius:50%; background:${hexColor}; ${borderCss} margin-right:5px; box-shadow: 0 0 0 1px rgba(255,255,255,0.9); flex-shrink:0;"></span>`;
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
      product.product_kind,
      ...Object.values(product.variant_attributes || {}),
    ].filter(Boolean).join(' '));
    return !query || searchable.includes(query);
  });

  const parentMap = new Map();
  const standalone = [];

  for (const prod of filtered) {
    if (prod.parent_product_id) {
      if (!parentMap.has(prod.parent_product_id)) {
        parentMap.set(prod.parent_product_id, []);
      }
      parentMap.get(prod.parent_product_id).push(prod);
    } else {
      standalone.push(prod);
    }
  }

  const skuMap = new Map();
  for (const prod of standalone) {
    const baseSku = (prod.sku || '').trim().toUpperCase();
    if (!skuMap.has(baseSku)) {
      skuMap.set(baseSku, []);
    }
    skuMap.get(baseSku).push(prod);
  }

  const finalUnifiedList = [];
  for (const [baseSku, items] of skuMap.entries()) {
    const master = items[0];
    const childVariants = [
      ...(parentMap.get(master.id) || []),
      ...items.slice(1),
    ];

    finalUnifiedList.push({
      master,
      variants: childVariants,
      totalCount: 1 + childVariants.length,
    });
  }

  elements.productTableBody.replaceChildren();
  elements.productDataState.hidden = finalUnifiedList.length > 0;
  elements.productDataState.classList.remove('error');

  if (!finalUnifiedList.length) {
    const hasSearch = Boolean(query);
    elements.productDataState.querySelector('strong').textContent =
      hasSearch ? 'No encontramos productos' : 'Esta empresa todavía no tiene productos';
    elements.productDataState.querySelector('p').textContent =
      hasSearch
        ? 'Prueba con otro nombre, SKU, categoría o marca.'
        : 'Agrega el primer producto para comenzar a construir el catálogo.';
  }

  for (const group of finalUnifiedList) {
    const product = group.master;
    const variants = group.variants;
    const hasVariants = variants.length > 0;

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
    name.textContent = hasVariants
      ? product.name.replace(/[-–(]\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+)\s*\)?$/i, '').trim()
      : product.name;

    const nameCopy = document.createElement('div');
    nameCopy.className = 'product-name-copy';
    nameCopy.append(name);

    if (hasVariants || product.product_kind === 'VARIANT_PARENT' || product.product_kind === 'COMBO') {
      const kind = document.createElement('small');
      kind.className = `product-kind-badge ${product.product_kind ? product.product_kind.toLowerCase() : 'variant_parent'}`;
      if (product.product_kind === 'COMBO') {
        kind.textContent = 'Combo';
      } else {
        const optionCount = 1 + variants.length;
        const allVariantItems = [product, ...variants];
        const swatchesHtml = allVariantItems.slice(0, 4).map(v => {
          const cName = v.variant_attributes?.Color || v.color || v.name;
          return getColorSwatchHtml(cName);
        }).join('');
        const colorNames = allVariantItems.map(v => v.variant_attributes?.Color || v.color || v.name).slice(0, 3).join(', ');
        kind.innerHTML = `<span style="display:inline-flex; align-items:center; margin-right:4px;">${swatchesHtml}</span>${optionCount} Colores (${colorNames}${optionCount > 3 ? '...' : ''})`;
      }
      nameCopy.append(kind);
    }

    nameWrap.append(visual, nameCopy);

    const productActions = document.createElement('div');
    productActions.className = 'product-row-actions';
    const imageButton = document.createElement('button');
    imageButton.className = 'photo-action';
    imageButton.type = 'button';
    imageButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px;"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> ${product.image_url ? 'Cambiar foto' : 'Adjuntar foto'}`;
    imageButton.addEventListener('click', () => openProductImageDialog(product));
    productActions.append(imageButton);

    if (hasAnyPermission('catalog.manage')) {
      const organizeButton = document.createElement('button');
      organizeButton.className = 'product-structure-action';
      organizeButton.type = 'button';
      const labelText = product.product_kind === 'COMBO'
        ? 'Configurar combo'
        : (hasVariants || product.product_kind === 'VARIANT_PARENT')
          ? 'Administrar colores'
          : 'Colores o combo';
      organizeButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px;"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.71 1.7-1.63 0-.44-.18-.85-.47-1.16-.29-.3-.47-.72-.47-1.21 0-.92.74-1.67 1.67-1.67H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/></svg> ${labelText}`;
      organizeButton.addEventListener(
        'click',
        () => openProductStructureDialog(product),
      );
      productActions.append(organizeButton);

      const einvoiceButton = document.createElement('button');
      einvoiceButton.className = 'photo-action';
      einvoiceButton.type = 'button';
      const excludedFromEinvoice = Boolean(product.exclude_from_einvoice);
      einvoiceButton.textContent = excludedFromEinvoice
        ? 'Comprobante interno'
        : 'Factura electrónica';
      einvoiceButton.title = excludedFromEinvoice
        ? 'Volver a incluir este producto en factura electrónica'
        : 'Separar este producto de la factura electrónica';
      einvoiceButton.classList.toggle('is-active', excludedFromEinvoice);
      einvoiceButton.addEventListener('click', async () => {
        const nextExclusion = !excludedFromEinvoice;
        const confirmation = nextExclusion
          ? `¿Separar “${product.name}” de factura electrónica? En Caja se emitirá como comprobante interno cuando se mezcle con artículos facturables.`
          : `¿Incluir “${product.name}” nuevamente en factura electrónica?`;
        if (!confirm(confirmation)) return;
        einvoiceButton.disabled = true;
        try {
          await getJson(`/api/products/${product.id}/einvoice-exclusion`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': activeTenantId,
            },
            body: JSON.stringify({ excludeFromEinvoice: nextExclusion }),
          });
          await loadCatalog();
          showToast(nextExclusion
            ? 'Producto separado de la factura electrónica.'
            : 'Producto habilitado para factura electrónica.');
        } catch (error) {
          showToast(error.message);
          einvoiceButton.disabled = false;
        }
      });
      productActions.append(einvoiceButton);

      const deleteButton = document.createElement('button');
      deleteButton.className = 'photo-action danger-action';
      deleteButton.type = 'button';
      deleteButton.style.cssText = 'color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); margin-left: 4px; display: inline-flex; align-items: center; gap: 4px;';
      deleteButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Eliminar`;
      deleteButton.addEventListener('click', async () => {
        if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
          try {
            await getJson(`/api/products/${product.id}`, {
              method: 'DELETE',
              headers: { 'x-tenant-id': activeTenantId },
            });
            showToast(`Producto "${product.name}" eliminado correctamente.`);
            await Promise.all([loadCatalog(), loadInventory()]);
          } catch (err) {
            showToast(err.message);
          }
        }
      });
      productActions.append(deleteButton);
    }

    nameCell.append(nameWrap, productActions);
    row.append(nameCell);
    row.append(createCell('SKU', product.sku));
    row.append(createCell('Categoría', product.category_name));
    row.append(createCell('Marca', product.brand_name));

    let priceText = formatCurrency(product.sale_price);
    if (hasVariants) {
      const prices = [product, ...variants].map(v => Number(v.sale_price)).filter(Boolean);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      priceText = minP === maxP ? formatCurrency(minP) : `${formatCurrency(minP)} - ${formatCurrency(maxP)}`;
    }
    row.append(createCell('Precio de venta', priceText));

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
      const taxLabel = product.tax_name ? 'Cambiar tratamiento' : 'Configurar impuesto';
      taxButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px;"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> ${taxLabel}`;
      taxButton.addEventListener('click', () => openProductTaxDialog(product));
      taxCell.append(taxButton);
    }
    row.append(taxCell);

    elements.productTableBody.append(row);

    if (hasVariants) {
      for (const variant of variants) {
        const vRow = document.createElement('tr');
        vRow.className = 'variant-child-row';
        vRow.style.cssText = 'background: rgba(248, 250, 252, 0.75); font-size: 13px; border-top: 1px dashed #e2e8f0;';
        
        const vNameCell = document.createElement('td');
        vNameCell.style.paddingLeft = '28px';
        const vWrap = document.createElement('div');
        vWrap.className = 'company-name';
        vWrap.style.display = 'flex';
        vWrap.style.alignItems = 'center';
        
        const treeConnector = document.createElement('span');
        treeConnector.style.cssText = 'color:#94a3b8; font-weight:700; font-family:monospace; font-size:14px; margin-right:8px; user-select:none;';
        treeConnector.textContent = '└─';

        const vBadge = document.createElement('span');
        vBadge.style.cssText = 'font-weight:700; color:#334155; background:#ffffff; border: 1px solid #e2e8f0; padding:3px 10px; border-radius:12px; font-size:11px; margin-right:8px; display:inline-flex; align-items:center; box-shadow: 0 1px 3px rgba(0,0,0,0.04);';
        const colorName = variant.variant_attributes?.Color || variant.color || variant.name;
        vBadge.innerHTML = `${getColorSwatchHtml(colorName)} <span>${colorName}</span>`;
        
        const vName = document.createElement('strong');
        vName.textContent = variant.name;
        vWrap.append(treeConnector, vBadge, vName);

        if (hasAnyPermission('catalog.manage')) {
          const vImageBtn = document.createElement('button');
          vImageBtn.type = 'button';
          vImageBtn.className = 'photo-action';
          vImageBtn.style.cssText = 'margin-left:8px; font-size:11px; padding:4px 7px;';
          vImageBtn.textContent = variant.image_url ? 'Cambiar foto' : 'Foto del color';
          vImageBtn.addEventListener('click', () => openProductImageDialog(variant));
          const vDeleteBtn = document.createElement('button');
          vDeleteBtn.type = 'button';
          vDeleteBtn.style.cssText = 'color:#ef4444; background:none; border:none; cursor:pointer; font-size:12px; margin-left:8px; font-weight:600; display:inline-flex; align-items:center; gap:3px;';
          vDeleteBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Eliminar`;
          vDeleteBtn.addEventListener('click', async () => {
            if (confirm(`¿Eliminar la opción "${variant.name}"?`)) {
              try {
                await getJson(`/api/products/${variant.id}`, {
                  method: 'DELETE',
                  headers: { 'x-tenant-id': activeTenantId },
                });
                showToast(`Opción "${variant.name}" eliminada.`);
                await Promise.all([loadCatalog(), loadInventory()]);
              } catch (err) {
                showToast(err.message);
              }
            }
          });
          vWrap.append(vImageBtn, vDeleteBtn);
        }

        vNameCell.append(vWrap);

        vRow.append(vNameCell);
        vRow.append(createCell(
          'SKU',
          `${variant.sku} · Factura: ${variant.invoice_code || product.sku}`,
        ));
        vRow.append(createCell('Categoría', variant.category_name || product.category_name));
        vRow.append(createCell('Marca', variant.brand_name || product.brand_name));
        vRow.append(createCell('Precio de venta', formatCurrency(variant.sale_price)));

        const vTaxCell = document.createElement('td');
        const vTaxStatus = document.createElement('span');
        vTaxStatus.className = `table-status ${variant.tax_review_status === 'REVIEWED' ? 'active' : 'pending'}`;
        vTaxStatus.textContent = variant.tax_name
          ? `${variant.tax_name} · ${Number(variant.tax_rate)}%`
          : 'Pendiente';
        vTaxCell.append(vTaxStatus);
        vRow.append(vTaxCell);

        elements.productTableBody.append(vRow);
      }
    }
  }

  elements.productRecordCount.textContent =
    `${finalUnifiedList.length} ${finalUnifiedList.length === 1 ? 'producto unificado' : 'productos unificados'}`;
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
  if (panelName === 'pricing') defaultPromotionDates();
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

function renderComboCatalog() {
  elements.comboCatalogGrid.replaceChildren();
  elements.comboCatalogState.hidden = comboCatalog.length > 0;
  for (const combo of comboCatalog) {
    const card = document.createElement('article');
    card.className = `combo-catalog-card ${combo.cashier_ready ? 'ready' : ''}`;
    const heading = document.createElement('div');
    heading.className = 'combo-catalog-heading';
    const identity = document.createElement('div');
    const eyebrow = document.createElement('small');
    eyebrow.textContent = `${combo.sku} · ${combo.component_count} componentes`;
    const name = document.createElement('h4');
    name.textContent = combo.name;
    identity.append(eyebrow, name);
    const status = document.createElement('span');
    status.className = `combo-ready-status ${combo.cashier_ready ? 'active' : 'pending'}`;
    status.textContent = combo.cashier_ready ? 'Visible en Caja' : 'Requiere preparación';
    heading.append(identity, status);

    const stock = document.createElement('div');
    stock.className = 'combo-stock-grid';
    for (const [label, value] of [
      ['Exhibición', combo.display_stock],
      ['Bodega', combo.warehouse_stock],
      ['Precio', formatCurrency(combo.sale_price)],
    ]) {
      const item = document.createElement('div');
      item.innerHTML = `<span>${label}</span><strong>${
        label === 'Precio' ? value : formatQuantity(value)
      }</strong>`;
      stock.append(item);
    }
    const checklist = document.createElement('ul');
    checklist.className = 'combo-checklist';
    const checks = [
      [Number(combo.component_count) > 0, 'Composición guardada'],
      [combo.tax_review_status === 'REVIEWED', 'Impuesto revisado'],
      [Number(combo.total_stock) > 0, 'Combo armado'],
      [Number(combo.display_stock) > 0, 'Unidades en Exhibición'],
    ];
    for (const [ready, label] of checks) {
      const item = document.createElement('li');
      item.classList.toggle('ready', ready);
      item.textContent = `${ready ? '✓' : '○'} ${label}`;
      checklist.append(item);
    }
    const actions = document.createElement('div');
    actions.className = 'combo-card-actions';
    const product = products.find((item) => item.id === combo.id) || combo;
    const manage = document.createElement('button');
    manage.className = 'secondary-button compact';
    manage.type = 'button';
    manage.textContent = Number(combo.component_count)
      ? 'Composición y armado'
      : 'Configurar componentes';
    manage.addEventListener('click', () => openProductStructureDialog(product));
    actions.append(manage);
    if (combo.tax_review_status !== 'REVIEWED') {
      const tax = document.createElement('button');
      tax.className = 'secondary-button compact';
      tax.type = 'button';
      tax.textContent = 'Configurar impuesto';
      tax.addEventListener('click', () => openProductTaxDialog(product));
      actions.append(tax);
    }
    const source = combo.stock_by_warehouse.find(
      (item) => item.warehouseType === 'AVAILABLE' && Number(item.onHand) > 0,
    );
    const destination = combo.stock_by_warehouse.find(
      (item) => item.warehouseType === 'DISPLAY',
    ) || warehouses.find((item) => item.warehouse_type === 'DISPLAY');
    if (source && destination && !combo.cashier_ready) {
      const transfer = document.createElement('button');
      transfer.className = 'primary-button compact';
      transfer.type = 'button';
      transfer.textContent = 'Mover a Exhibición →';
      transfer.addEventListener('click', () => openTransferDialog({
        productId: combo.id,
        sourceWarehouseId: source.warehouseId,
        destinationWarehouseId: destination.warehouseId || destination.id,
        quantity: Math.min(Number(source.onHand), 1),
        reason: `Publicación del combo ${combo.name} en Caja`,
      }));
      actions.append(transfer);
    }
    card.append(heading, stock, checklist, actions);
    elements.comboCatalogGrid.append(card);
  }
}

function fillPricingSelect(select, placeholder, items, label) {
  const current = select.value;
  select.replaceChildren(new Option(placeholder, ''));
  for (const item of items) select.append(new Option(label(item), item.id));
  if (items.some((item) => item.id === current)) select.value = current;
}

function renderPricingOverview() {
  const sellable = pricingOverview.products.filter((product) => product.active);
  fillPricingSelect(
    elements.pricingProductId,
    'Selecciona un producto',
    sellable,
    (item) => `${item.name} · ${item.sku}`,
  );
  fillPricingSelect(
    elements.promotionProductId,
    'Selecciona un producto',
    sellable,
    (item) => `${item.name} · ${item.sku}`,
  );
  fillPricingSelect(
    elements.pricingPriceListId,
    'Selecciona una lista',
    pricingOverview.lists,
    (item) => item.name,
  );
  fillPricingSelect(
    elements.pricingCustomerId,
    'Selecciona un cliente',
    pricingOverview.customers,
    (item) => `${item.name}${item.price_list_name ? ` · ${item.price_list_name}` : ''}`,
  );
  const currentCustomerList = elements.customerPriceListId.value;
  elements.customerPriceListId.replaceChildren(
    new Option('Precio unitario (sin lista)', ''),
  );
  for (const list of pricingOverview.lists) {
    elements.customerPriceListId.append(new Option(list.name, list.id));
  }
  elements.customerPriceListId.value = [...elements.customerPriceListId.options]
    .some((option) => option.value === currentCustomerList)
    ? currentCustomerList
    : '';

  elements.productPriceList.replaceChildren();
  if (!pricingOverview.prices.length) {
    elements.productPriceList.innerHTML =
      '<p class="product-structure-empty">Todavía no hay escalas especiales.</p>';
  }
  for (const price of pricingOverview.prices) {
    const row = document.createElement('article');
    row.className = 'pricing-rule-row';
    const copy = document.createElement('div');
    copy.innerHTML = `<strong>${escapeHtml(price.product_name)}</strong>` +
      `<small>${escapeHtml(price.price_list_name)} · desde ${formatQuantity(price.min_quantity)}</small>`;
    const value = document.createElement('b');
    value.textContent = formatCurrency(price.unit_price);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-button';
    remove.textContent = '×';
    remove.addEventListener('click', async () => {
      await getJson(`/api/pricing/product-prices/${price.id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': activeTenantId },
      });
      await loadCommercialCatalog();
      showToast('Escala de precio desactivada.');
    });
    row.append(copy, value, remove);
    elements.productPriceList.append(row);
  }

  elements.promotionList.replaceChildren();
  if (!pricingOverview.promotions.length) {
    elements.promotionList.innerHTML =
      '<p class="product-structure-empty">No hay promociones programadas.</p>';
  }
  for (const promotion of pricingOverview.promotions) {
    const row = document.createElement('article');
    row.className = 'promotion-list-row';
    const copy = document.createElement('div');
    const discount = promotion.discount_type === 'PERCENT'
      ? `${Number(promotion.discount_value)}%`
      : formatCurrency(promotion.discount_value);
    copy.innerHTML = `<strong>${escapeHtml(promotion.name)}</strong>` +
      `<small>${escapeHtml(promotion.product_name)} · ${discount} · hasta ${
        new Date(promotion.ends_at).toLocaleString('es-CO')
      }</small>`;
    const status = document.createElement('span');
    status.className = `promotion-status ${promotion.status.toLowerCase()}`;
    status.textContent = {
      ACTIVE: 'Activa',
      SCHEDULED: 'Programada',
      EXPIRED: 'Finalizada',
      INACTIVE: 'Pausada',
    }[promotion.status] || promotion.status;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'secondary-button compact';
    toggle.textContent = promotion.active ? 'Pausar' : 'Activar';
    toggle.addEventListener('click', async () => {
      await getJson(`/api/pricing/promotions/${promotion.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ active: !promotion.active }),
      });
      await loadCommercialCatalog();
    });
    row.append(copy, status, toggle);
    elements.promotionList.append(row);
  }
}

async function loadCommercialCatalog() {
  if (!activeTenantId || !hasAnyPermission('catalog.manage')) {
    comboCatalog = [];
    pricingOverview = {
      lists: [], prices: [], promotions: [], products: [], customers: [],
    };
    renderComboCatalog();
    renderPricingOverview();
    return;
  }
  const headers = { 'x-tenant-id': activeTenantId };
  [comboCatalog, pricingOverview] = await Promise.all([
    getJson('/api/product-structures/combos', { headers }),
    getJson('/api/pricing/overview', { headers }),
  ]);
  renderComboCatalog();
  renderPricingOverview();
}

function commercialStatusLabel(status) {
  return {
    DRAFT: 'Borrador',
    ACTIVE: 'Activo',
    REVIEW: 'En revisión',
    CLOSED: 'Cerrado',
    CANCELLED: 'Cancelado',
    TODO: 'Pendiente',
    IN_PROGRESS: 'En curso',
    BLOCKED: 'Bloqueada',
    DONE: 'Completada',
  }[status] || status || 'Pendiente';
}

function commercialChannelLabel(channel) {
  return {
    STORE: 'Tienda',
    WHOLESALE: 'Mayorista',
    DIGITAL: 'Digital',
    FIELD: 'Campo',
    OTHER: 'Otro',
  }[channel] || channel || 'Canal';
}

function commercialRotationLabel(rotation) {
  return {
    HIGH: 'Alta rotación',
    MEDIUM: 'Rotación media',
    LOW: 'Baja rotación',
    NONE: 'Sin rotación',
  }[rotation] || rotation || 'Sin datos';
}

function commercialCampaignStatusLabel(status) {
  return {
    DRAFT: 'Borrador',
    PLANNED: 'Planeada',
    APPROVED: 'Aprobada',
    ACTIVE: 'Activa',
    FINISHED: 'Finalizada',
    EVALUATED: 'Evaluada',
    CANCELLED: 'Cancelada',
  }[status] || commercialStatusLabel(status);
}

function commercialExpenseStatusLabel(status) {
  return {
    COMMITTED: 'Comprometido',
    SPENT: 'Gastado',
    VOID: 'Anulado',
  }[status] || status || 'Pendiente';
}

function syncCommercialPlanningOptions() {
  const branchValue = elements.commercialPlanBranchId.value;
  elements.commercialPlanBranchId.replaceChildren(new Option('Toda la empresa', ''));
  for (const branch of branches.filter((item) => item.active !== false)) {
    elements.commercialPlanBranchId.append(new Option(branch.name, branch.id));
  }
  if ([...elements.commercialPlanBranchId.options].some((option) => option.value === branchValue)) {
    elements.commercialPlanBranchId.value = branchValue;
  }

  for (const select of [
    elements.commercialPlanOwnerId,
    elements.commercialInitiativeResponsibleId,
  ]) {
    const current = select.value;
    select.replaceChildren(new Option('Sin asignar', ''));
    for (const person of commercialPlanningPeople) {
      select.append(new Option(person.full_name, person.id));
    }
    if ([...select.options].some((option) => option.value === current)) {
      select.value = current;
    }
  }

  const planValue = elements.commercialInitiativePlanId.value;
  elements.commercialInitiativePlanId.replaceChildren();
  for (const plan of commercialPlanningOverview.plans || []) {
    if (!['CLOSED', 'CANCELLED'].includes(plan.status)) {
      elements.commercialInitiativePlanId.append(new Option(plan.name, plan.id));
    }
  }
  if ([...elements.commercialInitiativePlanId.options].some((option) => option.value === planValue)) {
    elements.commercialInitiativePlanId.value = planValue;
  } else if (commercialPlanningOverview.current_plan?.id) {
    elements.commercialInitiativePlanId.value = commercialPlanningOverview.current_plan.id;
  }
}

function renderCommercialCompactList(container, items, emptyMessage, buildRow) {
  if (!container) return;
  container.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'product-structure-empty';
    empty.textContent = emptyMessage;
    container.append(empty);
    return;
  }
  for (const item of items.slice(0, 6)) {
    container.append(buildRow(item));
  }
}

function commercialCompactRow({ title, meta, value, status }) {
  const row = document.createElement('article');
  row.className = 'commercial-compact-row';
  const copy = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = title || 'Sin nombre';
  const small = document.createElement('small');
  small.textContent = meta || '—';
  copy.append(strong, small);
  const aside = document.createElement('span');
  if (value) {
    const amount = document.createElement('b');
    amount.textContent = value;
    aside.append(amount);
  }
  if (status) {
    const badge = document.createElement('em');
    badge.textContent = status;
    aside.append(badge);
  }
  row.append(copy, aside);
  return row;
}

function renderCommercialMarketing() {
  const budgets = commercialBudgets || [];
  const campaigns = commercialCampaigns || [];
  const expenses = commercialExpenses || [];

  const budgetTotals = budgets.reduce((total, budget) => ({
    total: total.total + Number(budget.total_budget || 0),
    committed: total.committed + Number(budget.committed_budget || 0),
    spent: total.spent + Number(budget.actual_spend || 0),
    available: total.available + Number(budget.available_budget || 0),
  }), { total: 0, committed: 0, spent: 0, available: 0 });
  const expenseSpent = expenses
    .filter((expense) => expense.status === 'SPENT')
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const expenseCommitted = expenses
    .filter((expense) => expense.status === 'COMMITTED')
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  elements.commercialBudgetCount.textContent = String(budgets.length);
  elements.commercialBudgetTotal.textContent = formatCurrency(budgetTotals.total);
  elements.commercialBudgetCommitted.textContent = formatCurrency(budgetTotals.committed);
  elements.commercialBudgetSpent.textContent = formatCurrency(budgetTotals.spent);
  elements.commercialBudgetAvailable.textContent = formatCurrency(budgetTotals.available);
  elements.commercialCampaignCount.textContent = String(campaigns.length);
  elements.commercialExpenseCount.textContent = String(expenses.length);
  elements.commercialExpenseSpent.textContent = formatCurrency(expenseSpent);
  elements.commercialExpenseCommitted.textContent = formatCurrency(expenseCommitted);

  renderCommercialCompactList(
    elements.commercialBudgetList,
    budgets,
    'Todavía no hay presupuestos comerciales registrados.',
    (budget) => commercialCompactRow({
      title: budget.name,
      meta: [
        `${formatShortDate(budget.period_start)} – ${formatShortDate(budget.period_end)}`,
        budget.responsible_name || 'Sin responsable',
      ].join(' · '),
      value: formatCurrency(budget.available_budget || 0),
      status: commercialStatusLabel(budget.status),
    }),
  );

  renderCommercialCompactList(
    elements.commercialCampaignList,
    campaigns,
    'Todavía no hay campañas comerciales registradas.',
    (campaign) => commercialCompactRow({
      title: campaign.name,
      meta: [
        campaign.branch_name || 'Toda la empresa',
        campaign.responsible_name || 'Sin responsable',
        `${Number(campaign.product_count || 0)} productos`,
      ].join(' · '),
      value: formatCurrency(campaign.approved_budget || 0),
      status: commercialCampaignStatusLabel(campaign.status),
    }),
  );

  renderCommercialCompactList(
    elements.commercialExpenseList,
    expenses,
    'Todavía no hay gastos de marketing registrados.',
    (expense) => commercialCompactRow({
      title: expense.description,
      meta: [
        expense.campaign_name || expense.budget_name || 'Sin campaña',
        formatShortDate(expense.expense_date),
      ].filter(Boolean).join(' · '),
      value: formatCurrency(expense.amount || 0),
      status: commercialExpenseStatusLabel(expense.status),
    }),
  );
}

function renderCommercialOpportunities() {
  elements.commercialOpportunityList.replaceChildren();
  elements.commercialOpportunityCount.textContent = String(commercialOpportunities.length);
  elements.commercialOpportunityState.hidden = Boolean(commercialOpportunities.length);
  if (!commercialOpportunities.length) return;
  for (const opportunity of commercialOpportunities.slice(0, 20)) {
    const row = document.createElement('article');
    row.className = `commercial-opportunity-row ${opportunity.rotation_class?.toLowerCase() || 'none'}`;
    const identity = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = opportunity.product_name;
    const meta = document.createElement('small');
    meta.textContent = [
      opportunity.sku,
      opportunity.category_name || 'Sin categoría',
      opportunity.season_names || null,
      `${formatQuantity(opportunity.stock_on_hand)} en stock`,
    ].filter(Boolean).join(' · ');
    const recommendation = document.createElement('p');
    recommendation.textContent = opportunity.recommendation ||
      'Revisar comportamiento comercial antes de programar campaña.';
    identity.append(title, meta, recommendation);

    const metrics = document.createElement('div');
    metrics.className = 'commercial-opportunity-metrics';
    for (const [label, value] of [
      ['Ventas', formatQuantity(opportunity.net_units_sold)],
      ['Margen', `${Number(opportunity.gross_margin_percent || 0).toFixed(1)}%`],
      ['Cobertura', opportunity.coverage_days ? `${Number(opportunity.coverage_days).toFixed(0)} días` : '—'],
      ['Rotación', commercialRotationLabel(opportunity.rotation_class)],
    ]) {
      const item = document.createElement('span');
      item.innerHTML = `<small>${label}</small><b>${value}</b>`;
      metrics.append(item);
    }

    const actions = document.createElement('div');
    actions.className = 'commercial-opportunity-actions';
    const campaign = document.createElement('button');
    campaign.type = 'button';
    campaign.className = 'primary-button compact';
    campaign.textContent = 'Crear campaña';
    campaign.addEventListener('click', () => {
      openCommercialInitiativeDialog();
      showToast('Crea una iniciativa y asóciala a una campaña en la siguiente fase.');
    });
    const follow = document.createElement('button');
    follow.type = 'button';
    follow.className = 'secondary-button compact';
    follow.textContent = 'Seguimiento';
    follow.addEventListener('click', async () => {
      await getJson(`/api/commercial-planning/opportunities/${opportunity.product_id}/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ reason: opportunity.recommendation || 'Seguimiento comercial' }),
      });
      showToast('Producto marcado para seguimiento comercial.');
    });
    actions.append(campaign, follow);
    row.append(identity, metrics, actions);
    elements.commercialOpportunityList.append(row);
  }
}

function renderCommercialPlanning() {
  const overview = commercialPlanningOverview || {};
  const plan = overview.current_plan;
  const canManage = hasAnyPermission('commercial_planning.manage');
  const targetRevenue = Number(plan?.target_revenue || 0);
  const actualRevenue = Number(overview.actual_revenue || 0);
  const actualMargin = Number(overview.actual_margin || 0);
  const progress = targetRevenue > 0
    ? Math.min(999, Math.round((actualRevenue / targetRevenue) * 100))
    : 0;
  const openInitiatives = (overview.initiatives || [])
    .filter((initiative) => !['DONE', 'CANCELLED'].includes(initiative.status)).length;

  elements.commercialTargetRevenue.textContent = formatCurrency(targetRevenue);
  elements.commercialActualRevenue.textContent = formatCurrency(actualRevenue);
  elements.commercialActualMargin.textContent = formatCurrency(actualMargin);
  elements.commercialProgress.textContent = `${progress}%`;
  elements.commercialOpenPlans.textContent = String(overview.open_plans || 0);
  elements.commercialOpenInitiatives.textContent = String(openInitiatives);
  elements.commercialCurrentPlanName.textContent = plan?.name || 'Sin plan activo';
  elements.commercialCurrentPlanStatus.textContent = commercialStatusLabel(plan?.status);
  elements.commercialCurrentPlanPeriod.textContent = plan
    ? `${formatShortDate(plan.period_start)} – ${formatShortDate(plan.period_end)}`
    : '—';
  elements.commercialCurrentPlanOwner.textContent = plan?.owner_name || 'Sin asignar';
  elements.commercialCurrentPlanNotes.textContent =
    plan?.notes || 'Crea un plan para activar seguimiento comercial por empresa o sucursal.';
  elements.newCommercialPlanButton.disabled = !canManage;
  elements.newCommercialInitiativeButton.disabled = !canManage;
  renderCommercialMarketing();
  renderCommercialOpportunities();

  elements.commercialPlanList.replaceChildren();
  elements.commercialPlanCount.textContent = String((overview.plans || []).length);
  if (!(overview.plans || []).length) {
    const empty = document.createElement('p');
    empty.className = 'product-structure-empty';
    empty.textContent = 'Todavía no hay planes comerciales registrados.';
    elements.commercialPlanList.append(empty);
  }
  for (const item of overview.plans || []) {
    const row = document.createElement('article');
    row.className = 'commercial-plan-row';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = item.name;
    const meta = document.createElement('small');
    meta.textContent = [
      item.branch_name || 'Toda la empresa',
      `${formatShortDate(item.period_start)} – ${formatShortDate(item.period_end)}`,
      `${Number(item.initiative_count || 0)} iniciativas`,
    ].join(' · ');
    copy.append(title, meta);
    const value = document.createElement('b');
    value.textContent = formatCurrency(item.target_revenue);
    const status = document.createElement('span');
    status.textContent = commercialStatusLabel(item.status);
    row.append(copy, value, status);
    elements.commercialPlanList.append(row);
  }

  elements.commercialInitiativeList.replaceChildren();
  elements.commercialInitiativeCount.textContent = String((overview.initiatives || []).length);
  elements.commercialPlanningState.hidden = Boolean((overview.initiatives || []).length);
  for (const initiative of overview.initiatives || []) {
    const row = document.createElement('article');
    row.className = `commercial-initiative-row ${initiative.priority?.toLowerCase() || 'medium'}`;
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = initiative.title;
    const meta = document.createElement('small');
    meta.textContent = [
      commercialChannelLabel(initiative.channel),
      initiative.responsible_name || 'Sin responsable',
      initiative.due_date ? `vence ${formatShortDate(initiative.due_date)}` : null,
      formatCurrency(initiative.expected_revenue || 0),
    ].filter(Boolean).join(' · ');
    copy.append(title, meta);
    const status = document.createElement('select');
    status.className = 'commercial-status-select';
    for (const value of ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']) {
      status.append(new Option(commercialStatusLabel(value), value));
    }
    status.value = initiative.status;
    status.addEventListener('change', async () => {
      await getJson(`/api/commercial-planning/initiatives/${initiative.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ status: status.value }),
      });
      await loadCommercialPlanning();
      showToast('Estado de iniciativa actualizado.');
    });
    row.append(copy, status);
    elements.commercialInitiativeList.append(row);
  }
  syncCommercialPlanningOptions();
}

function showCommercialPlanningError(message) {
  commercialPlanningOverview = {
    current_plan: null,
    plans: [],
    initiatives: [],
    actual_revenue: 0,
    actual_margin: 0,
    open_plans: 0,
  };
  commercialBudgets = [];
  commercialCampaigns = [];
  commercialExpenses = [];
  renderCommercialPlanning();
  elements.commercialPlanningState.hidden = false;
  elements.commercialPlanningState.classList.add('error');
  elements.commercialPlanningState.querySelector('strong').textContent =
    'No pudimos cargar la planificación comercial';
  elements.commercialPlanningState.querySelector('p').textContent = message;
}

async function loadCommercialPlanning() {
  if (!activeTenantId ||
      !hasAnyPermission(
        'commercial_planning.view',
        'commercial_planning.manage',
        'commercial_planning.marketing',
        'commercial_planning.supervise',
        'reports.view',
        'sales.operate',
      )) {
    commercialPlanningPeople = [];
    commercialOpportunities = [];
    commercialBudgets = [];
    commercialCampaigns = [];
    commercialExpenses = [];
    showCommercialPlanningError('Tu usuario no tiene permiso para consultar planificación comercial.');
    return null;
  }
  try {
    const headers = { 'x-tenant-id': activeTenantId };
    const opportunityParams = new URLSearchParams();
    if (elements.commercialOpportunityRotation.value) {
      opportunityParams.set('rotation', elements.commercialOpportunityRotation.value);
    }
    if (elements.commercialOpportunityPriority.value) {
      opportunityParams.set('priority', elements.commercialOpportunityPriority.value);
    }
    if (elements.commercialOpportunityCampaign.value) {
      opportunityParams.set('campaign', elements.commercialOpportunityCampaign.value);
    }
    const opportunityUrl = `/api/commercial-planning/opportunities${
      opportunityParams.toString() ? `?${opportunityParams}` : ''
    }`;
    [
      commercialPlanningOverview,
      commercialPlanningPeople,
      commercialOpportunities,
      commercialBudgets,
      commercialCampaigns,
      commercialExpenses,
    ] = await Promise.all([
      getJson('/api/commercial-planning/overview', { headers }),
      getJson('/api/commercial-planning/people', { headers }),
      getJson(opportunityUrl, { headers }),
      getJson('/api/commercial-planning/budgets', { headers }),
      getJson('/api/commercial-planning/campaigns', { headers }),
      getJson('/api/commercial-planning/expenses', { headers }),
    ]);
    elements.commercialPlanningState.classList.remove('error');
    renderCommercialPlanning();
    return commercialPlanningOverview;
  } catch (error) {
    showCommercialPlanningError(error.message);
    return null;
  }
}

function openCommercialPlanDialog() {
  elements.commercialPlanForm.reset();
  elements.commercialPlanFormError.hidden = true;
  syncCommercialPlanningOptions();
  const today = new Date();
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0));
  elements.commercialPlanForm.elements.periodStart.value = start.toISOString().slice(0, 10);
  elements.commercialPlanForm.elements.periodEnd.value = end.toISOString().slice(0, 10);
  elements.commercialPlanForm.elements.targetRevenue.value = '0';
  elements.commercialPlanDialog.showModal();
}

function closeCommercialPlanDialog() {
  elements.commercialPlanDialog.close();
}

async function submitCommercialPlan(event) {
  event.preventDefault();
  elements.commercialPlanFormError.hidden = true;
  elements.saveCommercialPlanButton.disabled = true;
  try {
    const data = new FormData(elements.commercialPlanForm);
    await getJson('/api/commercial-planning/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(data)),
    });
    closeCommercialPlanDialog();
    await loadCommercialPlanning();
    showToast('Plan comercial creado.');
  } catch (error) {
    elements.commercialPlanFormError.textContent = error.message;
    elements.commercialPlanFormError.hidden = false;
  } finally {
    elements.saveCommercialPlanButton.disabled = false;
  }
}

function openCommercialInitiativeDialog() {
  if (!(commercialPlanningOverview.plans || []).some((plan) => !['CLOSED', 'CANCELLED'].includes(plan.status))) {
    showToast('Crea un plan comercial antes de agregar iniciativas.');
    return;
  }
  elements.commercialInitiativeForm.reset();
  elements.commercialInitiativeFormError.hidden = true;
  syncCommercialPlanningOptions();
  elements.commercialInitiativeDialog.showModal();
}

function closeCommercialInitiativeDialog() {
  elements.commercialInitiativeDialog.close();
}

async function submitCommercialInitiative(event) {
  event.preventDefault();
  elements.commercialInitiativeFormError.hidden = true;
  elements.saveCommercialInitiativeButton.disabled = true;
  try {
    const data = new FormData(elements.commercialInitiativeForm);
    await getJson('/api/commercial-planning/initiatives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(data)),
    });
    closeCommercialInitiativeDialog();
    await loadCommercialPlanning();
    showToast('Iniciativa comercial creada.');
  } catch (error) {
    elements.commercialInitiativeFormError.textContent = error.message;
    elements.commercialInitiativeFormError.hidden = false;
  } finally {
    elements.saveCommercialInitiativeButton.disabled = false;
  }
}

async function submitProductPrice(event) {
  event.preventDefault();
  const data = new FormData(elements.productPriceForm);
  elements.productPriceError.hidden = true;
  try {
    await getJson('/api/pricing/product-prices', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(data)),
    });
    await loadCommercialCatalog();
    showToast('Escala guardada. Caja la aplicará por cliente y cantidad.');
  } catch (error) {
    elements.productPriceError.textContent = error.message;
    elements.productPriceError.hidden = false;
  }
}

async function submitCustomerPriceList(event) {
  event.preventDefault();
  const data = new FormData(elements.customerPriceListForm);
  elements.customerPriceListError.hidden = true;
  try {
    await getJson(`/api/pricing/customers/${data.get('customerId')}/price-list`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ priceListId: data.get('priceListId') || null }),
    });
    await Promise.all([loadCommercialCatalog(), loadPos()]);
    showToast('Política de precio asignada al cliente.');
  } catch (error) {
    elements.customerPriceListError.textContent = error.message;
    elements.customerPriceListError.hidden = false;
  }
}

function defaultPromotionDates() {
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const localValue = (date) => {
    const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return adjusted.toISOString().slice(0, 16);
  };
  elements.promotionStartsAt.value ||= localValue(now);
  elements.promotionEndsAt.value ||= localValue(end);
}

async function submitPromotion(event) {
  event.preventDefault();
  const data = new FormData(elements.promotionForm);
  elements.promotionError.hidden = true;
  try {
    await getJson('/api/pricing/promotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(data)),
    });
    elements.promotionForm.reset();
    defaultPromotionDates();
    await loadCommercialCatalog();
    showToast('Promoción programada y protegida por su vigencia.');
  } catch (error) {
    elements.promotionError.textContent = error.message;
    elements.promotionError.hidden = false;
  }
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
    await loadCommercialCatalog();
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
  const salesTodayCount = Number(summary.sales_today_count || 0);
  const salesMonth = Number(summary.sales_month || 0);
  const previousMonth = Number(summary.sales_previous_month_to_date || 0);
  const overdueReceivables = Number(summary.overdue_receivables_count || 0);
  const overduePayables = Number(summary.overdue_payables_count || 0);
  const lowStock = Number(summary.low_stock_balances || 0);
  const pendingPurchases = Number(summary.pending_purchase_value || 0);
  const priorityCount =
    overdueReceivables + overduePayables + lowStock + (pendingPurchases > 0 ? 1 : 0);
  const activeCompany = getActiveCompany();

  elements.dashboardCompanyName.textContent =
    activeCompany?.trade_name || activeCompany?.legal_name || 'la empresa activa';
  elements.dashboardSalesToday.textContent = formatCurrency(summary.sales_today || 0);
  elements.dashboardSalesMonth.textContent = formatCurrency(salesMonth);
  elements.dashboardSalesCount.textContent =
    `${salesTodayCount} ${salesTodayCount === 1 ? 'transacción registrada' : 'transacciones registradas'}`;
  elements.dashboardAverageTicket.textContent =
    formatCurrency(summary.average_ticket_today || 0);
  elements.dashboardGrossMargin.textContent =
    formatCurrency(summary.gross_margin_month || 0);
  elements.dashboardLowStock.textContent = String(lowStock);
  elements.dashboardPendingPurchases.textContent =
    formatCurrency(pendingPurchases);
  elements.dashboardCashProjection.textContent =
    formatCurrency(summary.projected_cash_30_days || 0);
  elements.dashboardCashProjectionDetail.textContent =
    `${formatCurrency(summary.open_cash_position || 0)} en caja + ` +
    `${formatCurrency(summary.receivables_30_days || 0)} por cobrar − ` +
    `${formatCurrency(summary.payables_30_days || 0)} por pagar`;
  elements.dashboardOverdueReceivable.textContent =
    formatCurrency(summary.overdue_receivables || 0);
  elements.dashboardOverdueReceivableCount.textContent =
    `${overdueReceivables} ${overdueReceivables === 1 ? 'documento' : 'documentos'}`;
  elements.dashboardOverduePayable.textContent =
    formatCurrency(summary.overdue_payables || 0);
  elements.dashboardOverduePayableCount.textContent =
    `${overduePayables} ${overduePayables === 1 ? 'documento' : 'documentos'}`;
  elements.dashboardPriorityCount.textContent =
    `${priorityCount} ${priorityCount === 1 ? 'alerta' : 'alertas'}`;
  elements.dashboardPriorityCount.classList.toggle('clear', priorityCount === 0);

  if (previousMonth > 0) {
    const difference = ((salesMonth - previousMonth) / previousMonth) * 100;
    elements.dashboardSalesComparison.textContent =
      `${difference >= 0 ? '↑' : '↓'} ${Math.abs(difference).toLocaleString('es-CO', {
        maximumFractionDigits: 1,
      })}% vs. mes anterior`;
    elements.dashboardSalesComparison.className =
      difference >= 0 ? 'positive' : 'negative';
  } else {
    elements.dashboardSalesComparison.textContent = 'Sin base anterior';
    elements.dashboardSalesComparison.className = '';
  }
  renderDashboardSalesTrend(summary.sales_last_7_days || []);
  elements.dashboardUpdatedAt.textContent =
    `Actualizado hoy a las ${new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())}. Datos de la empresa activa.`;
}

function renderDashboardSalesTrend(points = []) {
  elements.dashboardSalesTrend.replaceChildren();
  const values = points.map((point) => Number(point.total || 0));
  const maximum = Math.max(...values, 1);
  points.forEach((point, index) => {
    const bar = document.createElement('span');
    const value = values[index];
    const height = value > 0 ? Math.max(12, (value / maximum) * 100) : 5;
    bar.style.setProperty('--bar-height', `${height}%`);
    bar.title = `${formatShortDate(point.date)} · ${formatCurrency(value)}`;
    bar.setAttribute('aria-label', bar.title);
    if (index === points.length - 1) bar.classList.add('today');
    elements.dashboardSalesTrend.append(bar);
  });
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

function onboardingPlan(status = {}) {
  const structureReady =
    Number(status.branch_count) > 0 &&
    Number(status.storage_count) > 0 &&
    Number(status.display_count) > 0 &&
    Number(status.register_count) > 0;
  const electronic = status.electronic_invoicing_required === true;
  return [
    {
      code: '01',
      title: 'Identidad y perfil tributario',
      detail: status.validation_status === 'VALIDATED'
        ? 'RUT y tratamiento tributario validados.'
        : 'Confirma RUT, régimen, IVA y documento de venta.',
      complete: status.validation_status === 'VALIDATED',
      href: '#empresas',
      action: 'Validar empresa',
    },
    {
      code: '02',
      title: 'Sucursales, bodega, exhibición y caja',
      detail: structureReady
        ? 'La estructura operativa mínima está disponible.'
        : 'Organiza dónde almacenas, exhibes y vendes.',
      complete: structureReady,
      href: '#sucursales',
      action: 'Revisar estructura',
    },
    {
      code: '03',
      title: 'Productos listos para operar',
      detail: Number(status.product_count) > 0
        ? `${status.product_count} productos configurados.`
        : 'Crea categorías, impuestos, unidades, precios y productos.',
      complete: Number(status.product_count) > 0,
      href: '#catalogo',
      action: 'Abrir catálogo',
    },
    {
      code: '04',
      title: 'Inventario inicial verificado',
      detail: Number(status.inventory_units) > 0
        ? `${Number(status.inventory_units).toLocaleString('es-CO')} unidades registradas.`
        : 'Cuenta existencias y separa bodega de exhibición.',
      complete: Number(status.inventory_units) > 0,
      href: '#inventario',
      action: 'Cargar inventario',
    },
    {
      code: '05',
      title: 'Dinero y transferencias',
      detail: Number(status.bank_account_count) > 0
        ? `${status.bank_account_count} cuentas bancarias activas.`
        : 'Registra las cuentas que recibirán transferencias.',
      complete: Number(status.bank_account_count) > 0,
      href: '#auditoria',
      action: 'Configurar cuentas',
    },
    {
      code: '06',
      title: 'Equipo y permisos',
      detail: Number(status.active_user_count) > 1
        ? `${status.active_user_count} usuarios activos.`
        : 'Crea al menos el usuario de caja con acceso limitado.',
      complete: Number(status.active_user_count) > 1,
      href: '#usuarios',
      action: 'Organizar equipo',
    },
    {
      code: '07',
      title: electronic ? 'Facturación electrónica' : 'Documento de venta',
      detail: electronic
        ? (
          status.billing_connection_ready && status.billing_resolution_ready
            ? 'Proveedor y numeración electrónica listos.'
            : 'Conecta Factus y selecciona un rango autorizado.'
        )
        : 'La empresa emitirá comprobantes internos.',
      complete: !electronic ||
        (status.billing_connection_ready && status.billing_resolution_ready),
      href: '#sistema',
      action: electronic ? 'Preparar Factus' : 'Revisar documento',
    },
    {
      code: '08',
      title: 'Primera venta controlada',
      detail: Number(status.completed_sale_count) > 0
        ? `${status.completed_sale_count} ventas completadas.`
        : 'Haz una venta de prueba y verifica inventario, pago y comprobante.',
      complete: Number(status.completed_sale_count) > 0,
      href: '#caja',
      action: 'Ir a caja',
    },
  ];
}

function renderOnboarding(status = {}) {
  const steps = onboardingPlan(status);
  const completed = steps.filter((step) => step.complete).length;
  const percent = Math.round((completed / steps.length) * 100);
  const activeCompany = getActiveCompany();
  const isDemo =
    !status.tax_id &&
    (status.trade_name === 'Nubixor Demo' || status.legal_name === 'Empresa demostración');

  elements.onboardingDescription.textContent =
    `${activeCompany?.trade_name || activeCompany?.legal_name || 'Empresa activa'} · ` +
    `${completed} de ${steps.length} etapas completas.`;
  elements.onboardingPercent.textContent = `${percent}%`;
  elements.onboardingProgressCopy.textContent = percent === 100
    ? 'Empresa lista para una operación controlada'
    : 'Completa primero los datos marcados como pendientes';
  elements.onboardingScoreRing.style.setProperty(
    '--onboarding-progress',
    `${percent * 3.6}deg`,
  );
  elements.onboardingDemoNotice.hidden = !isDemo;
  elements.onboardingSteps.replaceChildren();

  steps.forEach((step) => {
    const item = document.createElement('article');
    item.className = `onboarding-step ${step.complete ? 'complete' : 'pending'}`;
    const number = document.createElement('span');
    number.className = 'onboarding-step-number';
    number.textContent = step.complete ? '✓' : step.code;
    const copy = document.createElement('div');
    const statusLabel = document.createElement('small');
    statusLabel.textContent = step.complete ? 'COMPLETO' : 'SIGUIENTE ACCIÓN';
    const title = document.createElement('strong');
    title.textContent = step.title;
    const detail = document.createElement('p');
    detail.textContent = step.detail;
    copy.append(statusLabel, title, detail);
    const action = document.createElement('a');
    action.href = step.href;
    action.textContent = step.complete ? 'Revisar' : `${step.action} →`;
    item.append(number, copy, action);
    elements.onboardingSteps.append(item);
  });
}

async function loadOnboardingStatus() {
  if (!activeTenantId || !hasAnyPermission('dashboard.view')) return null;
  const status = await getJson('/api/dashboard/onboarding', {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderOnboarding(status || {});
  return status;
}

function renderPos() {
  const session = posSummary.openSession;
  const firstRegister = posSummary.registers[0] || null;
  const fiscal = posSummary.fiscalProfile || {};
  const electronic = fiscal.default_document_type === 'ELECTRONIC_INVOICE';
  const dianReady =
    Boolean(fiscal.billing_account_configured) &&
    Boolean(fiscal.billing_resolution_configured);
  elements.billingModeName.textContent = electronic
    ? 'Factura electrónica'
    : 'Comprobante interno';
  elements.billingModeDetail.textContent = electronic
    ? (dianReady
      ? 'La empresa tiene cuenta tecnológica y resolución vigentes.'
      : 'Las ventas quedarán pendientes de envío hasta conectar proveedor y resolución DIAN.')
    : 'Las ventas generan comprobante local y no se envían a la DIAN.';
  elements.billingModeStatus.textContent = electronic
    ? (dianReady ? 'DIAN lista' : 'Configuración pendiente')
    : 'Operación local';
  elements.billingModeStatus.className =
    `table-status ${electronic && !dianReady ? 'pending' : 'active'}`;
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
  const companyFilter = elements.posDocumentCompanyFilter.value;
  const paymentFilter = elements.posDocumentPaymentFilter.value;
  const sales = posDocuments.filter((sale) =>
    (!companyFilter || sale.company_id === companyFilter) &&
    (!paymentFilter || sale.payment_method === paymentFilter));
  elements.posSaleHistoryCount.textContent = String(sales.length);
  elements.openSalesHistoryButton.disabled = posDocuments.length === 0;
  elements.posSalesHistoryList.replaceChildren();
  elements.posSalesHistoryEmpty.hidden = sales.length > 0;
  elements.posTransferSummary.replaceChildren();
  for (const summary of posTransferSummary) {
    const card = document.createElement('article');
    const name = document.createElement('span');
    name.textContent = `Recibido en ${summary.company_name}`;
    const total = document.createElement('strong');
    total.textContent = formatCurrency(summary.total_received);
    const count = document.createElement('small');
    count.textContent = `${summary.transfer_count} transferencias`;
    card.append(name, total, count);
    elements.posTransferSummary.append(card);
  }

  for (const sale of sales) {
    const row = document.createElement('article');
    row.className = 'pos-sale-history-row';
    const identity = document.createElement('div');
    identity.className = 'pos-sale-history-identity';
    const number = document.createElement('strong');
    number.textContent = sale.receipt_number;
    const customer = document.createElement('span');
    customer.textContent = sale.customer_name;
    const detail = document.createElement('small');
    const time = new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(sale.created_at));
    detail.textContent =
      `${sale.company_name ? `${sale.company_name} · ` : ''}${time} · ` +
      `${sale.item_count} ${sale.item_count === 1 ? 'producto' : 'productos'} · ` +
      `${paymentMethodLabels[sale.payment_method] || sale.payment_method}`;
    if (sale.payment_method === 'TRANSFER') {
      const transfer = document.createElement('small');
      transfer.className = 'sale-transfer-detail';
      transfer.textContent =
        `Recibido en ${sale.receiving_company_name || sale.company_name}` +
        ` · ${sale.payment_reference || 'Sin referencia'}`;
      identity.append(number, customer, detail, transfer);
    } else {
      identity.append(number, customer, detail);
    }

    const result = document.createElement('div');
    result.className = 'pos-sale-history-result';
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(sale.total);
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.textContent = 'Ver comprobante';
    viewButton.addEventListener('click', () =>
      openHistoricalReceipt(sale.id, sale.company_id, viewButton));
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

async function openHistoricalReceipt(saleId, companyId, button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Consultando…';
  try {
    const receipt = await getJson(`/api/pos/sales/${saleId}`, {
      headers: { 'x-tenant-id': companyId || activeTenantId },
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
    ? `${customer.document_number || 'Sin documento'} · ${
      customer.price_list_name || 'Precio unitario'
    } · saldo ${formatCurrency(customer.outstanding || 0)}`
    : 'Consumidor final · venta sin cartera';
}

async function loadPos() {
  if (!activeTenantId) {
    showPosError('Primero debes registrar o seleccionar una empresa.');
    return posSummary;
  }
  try {
    const headers = { 'x-tenant-id': activeTenantId };
    const [summary, sessions, customers, documents] = await Promise.all([
      getJson('/api/pos/summary', { headers }),
      getJson('/api/pos/sessions', { headers }),
      getJson('/api/pos/customers', { headers }),
      getJson('/api/pos/documents', { headers }),
    ]);
    const currentDetail = summary.openSession
      ? await getJson(`/api/pos/sessions/${summary.openSession.id}`, { headers })
      : null;
    posBankAccounts = summary.openSession
      ? await getJson(
        `/api/pos/bank-accounts?cashSessionId=${encodeURIComponent(summary.openSession.id)}`,
        { headers },
      )
      : [];
    posSummary = { ...summary, sessions, currentDetail };
    posCustomers = customers;
    posDocuments = documents.items;
    posTransferSummary = documents.transferSummary;
    const previousCompanyFilter = elements.posDocumentCompanyFilter.value;
    elements.posDocumentCompanyFilter.replaceChildren(new Option('Todos los negocios', ''));
    for (const company of [...new Map(
      posDocuments.map((sale) => [sale.company_id, sale.company_name]),
    )]) {
      elements.posDocumentCompanyFilter.append(new Option(company[1], company[0]));
    }
    if ([...elements.posDocumentCompanyFilter.options]
      .some((option) => option.value === previousCompanyFilter)) {
      elements.posDocumentCompanyFilter.value = previousCompanyFilter;
    }
    syncPosCustomers();
    renderPos();
    renderPosSalesHistory();
    return posSummary;
  } catch (error) {
    posBankAccounts = [];
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

function productCommercialPrice(product, quantity = 1) {
  const basePrice = Number(product.sale_price) || 0;
  const scale = [...(product.price_rules || [])]
    .filter((item) => Number(item.minQuantity) <= quantity)
    .sort((left, right) => Number(right.minQuantity) - Number(left.minQuantity))[0];
  let unitPrice = scale ? Number(scale.unitPrice) : basePrice;
  let label = scale?.priceListName || 'Precio unitario';
  let source = scale ? 'PRICE_LIST' : 'BASE';
  for (const promotion of product.promotions || []) {
    if (Number(promotion.minQuantity) > quantity) continue;
    const promotionalPrice = promotion.discountType === 'FIXED_PRICE'
      ? Number(promotion.discountValue)
      : Math.round(
        unitPrice * (1 - Number(promotion.discountValue) / 100) * 100,
      ) / 100;
    if (promotionalPrice <= unitPrice) {
      unitPrice = promotionalPrice;
      label = promotion.name;
      source = 'PROMOTION';
    }
  }
  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    basePrice,
    label,
    source,
  };
}

function calculateCartTotals() {
  let total = 0;
  let tax = 0;
  let itemCount = 0;
  for (const item of saleCart.values()) {
    const lineTotal =
      productCommercialPrice(item.product, item.quantity).unitPrice * item.quantity;
    const taxRate = Number(item.product.tax_rate) || 0;
    total += lineTotal;
    tax += taxRate > 0 ? lineTotal * taxRate / (100 + taxRate) : 0;
    itemCount += item.quantity;
  }
  const discount = posManualDiscountDraft(total);
  if (discount.amount > 0) {
    const appliedAmount = Math.min(discount.amount, total);
    const ratio = (total - appliedAmount) / total;
    tax *= ratio;
    total -= appliedAmount;
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

function posManualDiscountDraft(grossTotal = 0) {
  const type = elements.posDiscountType?.value || 'PERCENT';
  const value = Number(elements.posDiscountAmount?.value) || 0;
  if (value <= 0 || grossTotal <= 0) return { amount: 0, type, value: 0, reason: null };
  const amount = type === 'PERCENT' ? Math.round(grossTotal * value) / 100 : value;
  return { amount: Math.round(amount * 100) / 100, type, value, reason: elements.posDiscountReason?.value.trim() || null };
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

function mixedPaymentState(totals = calculateCartTotals()) {
  const cash = Math.max(0, Number(elements.posMixedCashAmount.value) || 0);
  const card = Math.max(0, Number(elements.posMixedCardAmount.value) || 0);
  const transfer = Math.max(0, Number(elements.posMixedTransferAmount.value) || 0);
  const assigned = Math.round((cash + card + transfer) * 100) / 100;
  const remaining = Math.round((totals.total - assigned) * 100) / 100;
  return { cash, card, transfer, assigned, remaining };
}

function syncTransferBankAccounts() {
  const previous = elements.posTransferBankAccount.value;
  const sellerCompanyIds = new Set(
    [...saleCart.values()].map((item) =>
      item.product.seller_company_id || activeTenantId),
  );
  const available = posBankAccounts.filter((account) =>
    sellerCompanyIds.has(account.company_id));
  elements.posTransferBankAccount.replaceChildren(
    new Option(
      available.length ? 'Selecciona una cuenta bancaria' : 'No hay cuentas configuradas',
      '',
    ),
  );
  elements.posTransferCompany.replaceChildren();
  for (const account of available) {
    const label = `${account.company_name} · ${account.bank_name} · ${account.masked_account}`;
    const option = new Option(label, account.id);
    option.dataset.companyId = account.company_id;
    elements.posTransferBankAccount.append(option);
  }
  if (available.some((account) => account.id === previous)) {
    elements.posTransferBankAccount.value = previous;
  }
  const selected = available.find((account) =>
    account.id === elements.posTransferBankAccount.value);
  if (selected) {
    elements.posTransferCompany.append(
      new Option(selected.company_name, selected.company_id),
    );
    elements.posTransferCompany.value = selected.company_id;
    elements.posTransferAccountHelp.textContent =
      `${selected.bank_name} · ${selected.account_name} · ${selected.masked_account}`;
  } else {
    elements.posTransferAccountHelp.textContent = available.length
      ? 'Selecciona la cuenta exacta donde se recibió el dinero.'
      : 'Configura una cuenta bancaria desde Contabilidad y auditoría antes de aceptar transferencias.';
  }
  return available;
}

function updateCashSettlement(totals = calculateCartTotals(), { rebuild = false } = {}) {
  const mixed = mixedPaymentState(totals);
  const cashDue = posMixedPayment ? mixed.cash : totals.total;
  const cashPayment =
    posSaleTerms === 'IMMEDIATE' &&
    (posMixedPayment ? cashDue > 0 : elements.posPaymentMethod.value === 'CASH');
  elements.posCashTender.hidden = !cashPayment;
  if (!cashPayment) return;

  if (rebuild) {
    elements.cashTenderSuggestions.replaceChildren();
    for (const amount of cashTenderOptions(cashDue)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = amount === cashDue ? 'Exacto' : formatCurrency(amount);
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
    hasReceived && Number.isFinite(received) && received >= cashDue;
  const difference = hasReceived && Number.isFinite(received) ? received - cashDue : 0;
  elements.posCashChange.classList.toggle('short', hasReceived && difference < 0);
  elements.posCashChange.textContent = hasReceived && difference < 0
    ? `Faltan ${formatCurrency(Math.abs(difference))}`
    : formatCurrency(difference);
  if (totals.itemCount > 0) {
    const operationReady =
      Boolean(posSummary.openSession) &&
      Boolean(elements.posWarehouseSelect.value) &&
      saleCart.size > 0;
    elements.completeSaleButton.disabled = !operationReady || !validReceived;
    if (!validReceived) {
      elements.completeSaleButton.textContent = hasReceived && difference < 0
        ? `Faltan ${formatCurrency(Math.abs(difference))}`
        : 'Registra el efectivo recibido';
    } else {
      elements.completeSaleButton.textContent =
        `Confirmar cobro ${formatCurrency(totals.total)} →`;
    }
  }
}

function getPosVariantLabel(product) {
  const attributes = Object.entries(product.variant_attributes || {})
    .filter(([, value]) => String(value || '').trim())
    .map(([attribute, value]) => `${attribute}: ${value}`);
  if (attributes.length) return attributes.join(' · ');
  if (product.color || product.variant_name) return product.color || product.variant_name;
  const match = String(product.name || '').match(/[-–(]\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+)\s*\)?$/i);
  return match ? match[1].trim() : 'Presentación estándar';
}

function buildPosCatalogGroups(products) {
  const families = new Map();
  for (const item of products) {
    // Las variantes comparten una tarjeta de venta por producto padre. La empresa
    // forma parte de la llave para no combinar catálogos de compañías distintas.
    const rootId = item.parent_product_id || item.id;
    const key = `${item.seller_company_id || 'local'}:${rootId}`;
    if (!families.has(key)) {
      families.set(key, {
        rootId,
        variants: [],
        hasVariantFamily: false,
        parentName: item.parent_name || null,
        parentSku: item.parent_sku || item.invoice_code || null,
      });
    }
    const family = families.get(key);
    family.variants.push({ ...item, colorLabel: getPosVariantLabel(item) });
    family.hasVariantFamily ||= Boolean(item.parent_product_id);
    family.parentName ||= item.parent_name || null;
    family.parentSku ||= item.parent_sku || item.invoice_code || null;
  }

  return [...families.values()].map((family) => {
    const parentItem = family.variants.find((item) => item.id === family.rootId);
    const mainItem = parentItem || family.variants[0];
    return {
      ...mainItem,
      name: family.parentName || mainItem.name,
      sku: family.parentSku || mainItem.invoice_code || mainItem.sku,
      invoice_code: family.parentSku || mainItem.invoice_code || mainItem.sku,
      isGrouped: family.hasVariantFamily,
      totalStock: family.variants.reduce((sum, item) => sum + Number(item.on_hand || 0), 0),
      variants: family.variants,
    };
  });
}

function renderPosCatalog() {
  const search = normalizeSearch(elements.posProductSearch.value.trim());
  const filtered = posCatalog.filter((product) => {
    const searchable = normalizeSearch(
      `${product.name} ${product.sku} ${product.barcode || ''} ${product.category_name || ''} ` +
      `${product.seller_company_name || ''} ${product.color || ''} ${product.parent_name || ''} ` +
      `${product.parent_sku || ''} ${product.invoice_code || ''} ${Object.values(product.variant_attributes || {}).join(' ')}`,
    );
    const matchesCategory =
      activePosCategory === 'ALL' || product.category_id === activePosCategory;
    return matchesCategory && (!search || searchable.includes(search));
  });

  const groupedProducts = buildPosCatalogGroups(filtered);

  elements.posProductGrid.replaceChildren();
  elements.posCatalogState.hidden = groupedProducts.length > 0;
  elements.posCatalogState.classList.remove('error');

  if (!groupedProducts.length) {
    elements.posCatalogState.querySelector('strong').textContent =
      search ? 'No encontramos ese producto' : 'No hay productos disponibles';
    elements.posCatalogState.querySelector('p').textContent =
      search
        ? 'Prueba con otro nombre o SKU.'
        : 'Registra existencias en esta bodega para habilitar la venta.';
  }

  for (const group of groupedProducts) {
    const card = document.createElement('article');
    card.className = 'pos-product-card';
    card.classList.toggle('combo', group.product_kind === 'COMBO');

    let activeVariant = group.variants[0];

    const visual = group.image_url
      ? document.createElement('img')
      : document.createElement('span');
    visual.className = 'pos-product-visual';
    if (group.image_url) {
      visual.src = resolvePublicAsset(group.image_url);
      visual.alt = group.image_alt || group.name;
    } else {
      visual.textContent = group.name.slice(0, 1).toUpperCase();
    }

    const info = document.createElement('div');
    info.className = 'pos-product-info';
    const sku = document.createElement('small');
    sku.textContent = [
      group.seller_company_name,
      group.category_name,
      group.sku,
    ].filter(Boolean).join(' · ');

    const name = document.createElement('strong');
    name.textContent = group.name;

    if (group.product_kind === 'COMBO') {
      const comboBadge = document.createElement('em');
      comboBadge.className = 'pos-combo-badge';
      comboBadge.textContent = 'Combo';
      info.append(sku, name, comboBadge);
    } else {
      info.append(sku, name);
    }

    if (group.isGrouped && group.variants.length > 1) {
      const variantBadge = document.createElement('div');
      variantBadge.style.cssText = 'margin-top:6px; font-size:12px; font-weight:700; color:#6366f1; background:#e0e7ff; padding:4px 8px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; width:fit-content;';
      variantBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.71 1.7-1.63 0-.44-.18-.85-.47-1.16-.29-.3-.47-.72-.47-1.21 0-.92.74-1.67 1.67-1.67H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/></svg> ${group.variants.length} colores disponibles`;
      info.append(variantBadge);
    }

    const price = document.createElement('b');
    const commercialPrice = productCommercialPrice(group, 1);
    price.textContent = formatCurrency(commercialPrice.unitPrice);
    if (commercialPrice.source !== 'BASE') {
      const offer = document.createElement('small');
      offer.className = 'pos-product-offer';
      offer.textContent = commercialPrice.label;
      info.append(price, offer);
    } else {
      info.append(price);
    }

    const footer = document.createElement('div');
    footer.className = 'pos-product-footer';
    const stockLabel = document.createElement('span');
    const addButton = document.createElement('button');
    addButton.type = 'button';

    const hasMultipleVariants = group.isGrouped && group.variants.length > 1;

    function updateCardState() {
      const targetProduct = activeVariant || group;
      const stock = hasMultipleVariants ? group.totalStock : Number(targetProduct.on_hand || 0);
      stockLabel.textContent = hasMultipleVariants
        ? `${stock} un. en ${group.variants.length} colores`
        : `${stock} · ${warehouseTypeLabels[targetProduct.warehouse_type] || 'Disponible'}`;
      
      if (hasMultipleVariants) {
        addButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.71 1.7-1.63 0-.44-.18-.85-.47-1.16-.29-.3-.47-.72-.47-1.21 0-.92.74-1.67 1.67-1.67H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/></svg> Elegir color`;
        addButton.style.cssText = 'background: linear-gradient(135deg, #6366f1, #8b5cf6); color:#fff; border:none; display:inline-flex; align-items:center; justify-content:center;';
      } else {
        const currentQuantity = saleCart.get(targetProduct.id)?.quantity || 0;
        addButton.textContent = stock <= 0 ? 'Sin existencias' : '+ Agregar';
        addButton.disabled =
          stock <= 0 ||
          currentQuantity >= stock ||
          targetProduct.tax_review_status !== 'REVIEWED';
      }
    }

    addButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (hasMultipleVariants) {
        openPosVariantSelectorModal(group);
      } else {
        const targetProduct = activeVariant || group;
        addProductToCart(targetProduct);
        updateCardState();
      }
    });

    card.addEventListener('click', () => {
      if (hasMultipleVariants) {
        openPosVariantSelectorModal(group);
      } else {
        const targetProduct = activeVariant || group;
        if (Number(targetProduct.on_hand || 0) > 0) {
          addProductToCart(targetProduct);
          updateCardState();
        }
      }
    });

    updateCardState();
    footer.append(stockLabel, addButton);
    card.append(visual, info, footer);
    elements.posProductGrid.append(card);
  }
}

function openPosVariantSelectorModal(group) {
  const dialog = document.querySelector('#posVariantSelectorDialog');
  const title = document.querySelector('#posVariantSelectorTitle');
  const sub = document.querySelector('#posVariantSelectorSub');
  const list = document.querySelector('#posVariantSelectorList');
  const closeBtn = document.querySelector('#closePosVariantSelectorDialog');
  const cancelBtn = document.querySelector('#cancelPosVariantSelectorButton');

  if (!dialog || !list) return;

  title.textContent = group.name;
  sub.textContent = `Selecciona el color o presentación para agregar a la venta:`;

  list.replaceChildren();

  group.variants.forEach((variant) => {
    const colorName = variant.colorLabel || variant.color || variant.name;
    const stock = Number(variant.on_hand || 0);
    const inCart = saleCart.get(variant.id)?.quantity || 0;
    const available = stock - inCart;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pos-variant-option-btn';
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid ${available > 0 ? '#cbd5e1' : '#f1f5f9'};
      background: ${available > 0 ? '#ffffff' : '#f8fafc'};
      cursor: ${available > 0 ? 'pointer' : 'not-allowed'};
      opacity: ${available > 0 ? '1' : '0.6'};
      transition: all 0.2s ease;
      text-align: left;
    `;

    const left = document.createElement('div');
    const colorTitle = document.createElement('strong');
    colorTitle.style.cssText = 'display:block; font-size:14px; color:#0f172a;';
    colorTitle.textContent = `🎨 Color: ${colorName}`;

    const meta = document.createElement('small');
    meta.style.cssText = 'color:#64748b; font-size:12px;';
    meta.textContent = `SKU: ${variant.sku} · ${stock} en bodega`;

    left.append(colorTitle, meta);

    const right = document.createElement('div');
    right.style.cssText = 'text-align:right;';
    const price = document.createElement('strong');
    price.style.cssText = 'display:block; font-size:14px; color:#4f46e5;';
    price.textContent = formatCurrency(variant.sale_price);

    const badge = document.createElement('span');
    badge.style.cssText = `font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; ${available > 0 ? 'background:#dcfce7; color:#15803d;' : 'background:#fee2e2; color:#b91c1c;'}`;
    badge.textContent = available > 0 ? `${available} disp.` : 'Agotado';

    right.append(price, badge);
    button.append(left, right);

    if (available > 0) {
      button.addEventListener('click', () => {
        addProductToCart(variant);
        showToast(`🎨 Color ${colorName} agregado al carrito.`);
        dialog.close();
        renderPosCatalog();
      });
    }

    list.append(button);
  });

  const closeHandler = () => dialog.close();
  if (closeBtn) closeBtn.onclick = closeHandler;
  if (cancelBtn) cancelBtn.onclick = closeHandler;

  dialog.showModal();
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

  let currentSeller = null;
  const cartLines = [...saleCart.values()].sort((left, right) =>
    (left.product.seller_company_name || '').localeCompare(
      right.product.seller_company_name || '',
      'es',
    ));
  for (const item of cartLines) {
    const sellerName = item.product.seller_company_name || getActiveCompany()?.trade_name || '';
    if (sellerName && sellerName !== currentSeller) {
      currentSeller = sellerName;
      const companyHeading = document.createElement('div');
      companyHeading.className = 'cart-company-heading';
      companyHeading.textContent = `Vende ${sellerName}`;
      elements.cartItems.append(companyHeading);
    }
    const row = document.createElement('div');
    row.className = 'cart-item';
    const info = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.product.name;
    const detail = document.createElement('small');
    const commercialPrice = productCommercialPrice(item.product, item.quantity);
    detail.textContent =
      `${item.product.sku} · ${item.product.warehouse_name || 'Ubicación asignada'} · ` +
      `${formatCurrency(commercialPrice.unitPrice)} · ${commercialPrice.label}`;
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
    lineTotal.textContent = formatCurrency(
      commercialPrice.unitPrice * item.quantity,
    );
    row.append(info, controls, lineTotal);
    elements.cartItems.append(row);
  }

  const totals = calculateCartTotals();
  const billingPolicies = new Set(
    [...saleCart.values()].map(({ product }) =>
      product.billing_policy || 'ELECTRONIC_INVOICE'),
  );
  if (document.getElementById("posSplitWarning")) {
    document.getElementById("posSplitWarning").hidden =
      billingPolicies.size <= 1 && ![...billingPolicies]
        .some((policy) => policy !== 'ELECTRONIC_INVOICE');
  }
  elements.cartItemCount.textContent =
    `${totals.itemCount} ${totals.itemCount === 1 ? 'artículo' : 'artículos'}`;
  elements.cartSubtotal.textContent = formatCurrency(totals.subtotal);
  elements.cartTax.textContent = formatCurrency(totals.tax);
  elements.cartTotal.textContent = formatCurrency(totals.total);
  const grossTotal = [...saleCart.values()].reduce((sum, item) =>
    sum + productCommercialPrice(item.product, item.quantity).unitPrice * item.quantity, 0);
  const discount = posManualDiscountDraft(grossTotal);
  elements.cartDiscountTotal.hidden = discount.amount <= 0;
  elements.cartDiscountTotal.querySelector('strong').textContent = `−${formatCurrency(
    Math.min(discount.amount, grossTotal),
  )}`;
  elements.clearCartButton.hidden = totals.itemCount === 0;
  elements.completeSaleButton.disabled =
    !posSummary.openSession || !elements.posWarehouseSelect.value || saleCart.size === 0;
  elements.completeSaleButton.textContent = totals.itemCount
    ? `Cobrar ${formatCurrency(totals.total)} →`
    : 'Selecciona productos →';
  updateCashSettlement(totals, { rebuild: true });
  const creditSale = posSaleTerms === 'CREDIT';
  const sellerCompanies = new Set(
    [...saleCart.values()].map((item) => item.product.seller_company_id || activeTenantId),
  );
  const multiCompanySale = sellerCompanies.size > 1 ||
    (sellerCompanies.size === 1 && !sellerCompanies.has(activeTenantId));
  const mixed = mixedPaymentState(totals);
  const transferSale =
    posSaleTerms === 'IMMEDIATE' &&
    (posMixedPayment ? mixed.transfer > 0 : elements.posPaymentMethod.value === 'TRANSFER');
  elements.posTransferDetails.hidden = !transferSale;
  syncTransferBankAccounts();
  elements.posPaymentPanel.hidden = creditSale;
  elements.posMixedPaymentPanel.hidden = creditSale || !posMixedPayment;
  elements.toggleMixedPaymentButton.classList.toggle('active', posMixedPayment);
  elements.posPaymentButtons.forEach((button) => {
    button.disabled = posMixedPayment;
  });
  elements.posMixedRemaining.textContent = Math.abs(mixed.remaining) < 0.01
    ? 'Total distribuido'
    : mixed.remaining > 0
      ? `${formatCurrency(mixed.remaining)} pendientes`
      : `${formatCurrency(Math.abs(mixed.remaining))} de más`;
  elements.posMixedRemaining.classList.toggle('ready', Math.abs(mixed.remaining) < 0.01);
  elements.posCreditTerms.hidden = !creditSale;
  if (creditSale) {
    const hasCustomer = Boolean(elements.posCustomerSelect.value);
    const hasDueDate = Boolean(elements.posCreditDueDate.value);
    elements.posCashTender.hidden = true;
    elements.completeSaleButton.disabled =
      elements.completeSaleButton.disabled || !hasCustomer || !hasDueDate;
    if (totals.itemCount > 0) {
      if (multiCompanySale) {
        elements.completeSaleButton.disabled = true;
        elements.completeSaleButton.textContent = 'Crédito: vende por empresa';
      } else if (!hasCustomer) elements.completeSaleButton.textContent = 'Selecciona un cliente';
      else if (!hasDueDate) elements.completeSaleButton.textContent = 'Define el vencimiento';
      else elements.completeSaleButton.textContent =
        `Vender a crédito ${formatCurrency(totals.total)} →`;
    }
  } else if (posMixedPayment && totals.itemCount > 0) {
    const positiveMethods = [mixed.cash, mixed.card, mixed.transfer]
      .filter((amount) => amount > 0).length;
    const paymentsMatch = Math.abs(mixed.remaining) < 0.01 && positiveMethods >= 2;
    elements.completeSaleButton.disabled =
      elements.completeSaleButton.disabled || !paymentsMatch;
    if (!paymentsMatch) {
      elements.completeSaleButton.textContent = positiveMethods < 2
        ? 'Usa al menos dos medios de pago'
        : mixed.remaining > 0
          ? `Faltan por distribuir ${formatCurrency(mixed.remaining)}`
          : `Reduce ${formatCurrency(Math.abs(mixed.remaining))}`;
    }
  }
  if (transferSale && totals.itemCount > 0) {
    const transferReady =
      Boolean(elements.posTransferBankAccount.value) &&
      Boolean(elements.posTransferCompany.value) &&
      Boolean(elements.posTransferReference.value.trim());
    elements.completeSaleButton.disabled =
      elements.completeSaleButton.disabled || !transferReady;
    if (!transferReady) {
      elements.completeSaleButton.textContent = 'Completa los datos de transferencia';
    }
  }
  elements.posSaleError.hidden = true;
}

function clearCart() {
  saleCart.clear();
  elements.posCashReceived.value = '';
  elements.posTransferReference.value = '';
  elements.posMixedCashAmount.value = '0';
  elements.posMixedCardAmount.value = '0';
  elements.posMixedTransferAmount.value = '0';
  elements.posDiscountAmount.value = '';
  elements.posDiscountReason.value = '';
  renderCart();
  renderPosCatalog();
}

async function loadPosCatalog() {
  if (!posSummary.openSession) {
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
    posCatalog = await getJson(
      `/api/pos/shared-catalog?cashSessionId=${encodeURIComponent(posSummary.openSession.id)}` +
      `&stockSource=${encodeURIComponent(elements.posWarehouseSelect.value || 'DISPLAY')}` +
      `&customerId=${encodeURIComponent(elements.posCustomerSelect.value || '')}`,
      {
      headers: { 'x-tenant-id': activeTenantId },
      },
    );
    for (const [productId, item] of saleCart) {
      const refreshed = posCatalog.find((product) => product.id === productId);
      if (refreshed) saleCart.set(productId, { ...item, product: refreshed });
      else saleCart.delete(productId);
    }
    const sellers = new Set(posCatalog.map((product) => product.seller_company_id));
    if (sellers.size > 1) {
      elements.billingModeName.textContent = 'Cobro multiempresa';
      elements.billingModeDetail.textContent =
        'Puedes combinar productos; Nubixor separa inventario, impuestos y comprobantes.';
      elements.billingModeStatus.textContent = `${sellers.size} empresas activas`;
      elements.billingModeStatus.className = 'table-status active';
    }
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

function stopPosScanner() {
  if (posScannerFrame) cancelAnimationFrame(posScannerFrame);
  posScannerFrame = null;
  if (posScannerStream) {
    posScannerStream.getTracks().forEach((track) => track.stop());
  }
  posScannerStream = null;
  if (elements.posScannerVideo) elements.posScannerVideo.srcObject = null;
}

function closePosScanner() {
  stopPosScanner();
  if (elements.posScannerDialog?.open) elements.posScannerDialog.close();
}

function findScannedProduct(value) {
  const normalized = normalizeSearch(value);
  const exact = posCatalog.filter((product) =>
    normalizeSearch(product.barcode || '') === normalized ||
    normalizeSearch(product.sku || '') === normalized,
  );
  if (exact.length === 1) return { product: exact[0] };
  const families = buildPosCatalogGroups(posCatalog).filter((group) =>
    normalizeSearch(group.sku || '') === normalized ||
    normalizeSearch(group.invoice_code || '') === normalized,
  );
  if (families.length === 1) return { family: families[0] };
  return null;
}

async function scanPosFrame(detector) {
  if (!posScannerStream || !elements.posScannerDialog?.open) return;
  try {
    const detections = await detector.detect(elements.posScannerVideo);
    const value = detections.find((item) => item.rawValue)?.rawValue?.trim();
    if (value) {
      const now = Date.now();
      if (value !== posScannerLastValue || now - posScannerLastAt > 1800) {
        posScannerLastValue = value;
        posScannerLastAt = now;
        const match = findScannedProduct(value);
        if (match?.product) {
          addProductToCart(match.product);
          elements.posScannerState.textContent = `${match.product.name} agregado a la venta.`;
          if (navigator.vibrate) navigator.vibrate(80);
          setTimeout(closePosScanner, 500);
          return;
        }
        if (match?.family) {
          elements.posScannerState.textContent = 'Código encontrado. Elige el color o presentación.';
          closePosScanner();
          if (match.family.isGrouped && match.family.variants.length > 1) {
            openPosVariantSelectorModal(match.family);
          } else {
            addProductToCart(match.family.variants[0]);
          }
          return;
        }
        elements.posScannerState.textContent = `No encontramos el código ${value}. Intenta con el buscador.`;
        if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
      }
    }
  } catch (error) {
    elements.posScannerState.textContent = 'No pudimos leer este código. Alinea la cámara e intenta de nuevo.';
  }
  posScannerFrame = requestAnimationFrame(() => scanPosFrame(detector));
}

async function openPosScanner() {
  if (!posSummary.openSession || !elements.posWarehouseSelect.value) {
    showToast('Abre un turno y selecciona una bodega antes de escanear.');
    return;
  }
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
    showToast('Este navegador no permite escanear desde cámara. Usa el buscador de SKU o código.');
    elements.posProductSearch.focus();
    return;
  }
  stopPosScanner();
  elements.posScannerState.textContent = 'Solicitando acceso a la cámara…';
  elements.posScannerDialog.showModal();
  try {
    posScannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    elements.posScannerVideo.srcObject = posScannerStream;
    await elements.posScannerVideo.play();
    const detector = new BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
    });
    posScannerLastValue = null;
    posScannerLastAt = 0;
    elements.posScannerState.textContent = 'Apunta al código de barras o QR del producto.';
    scanPosFrame(detector);
  } catch (error) {
    closePosScanner();
    showToast(error?.name === 'NotAllowedError'
      ? 'Permiso de cámara denegado. Puedes usar el buscador manual.'
      : 'No pudimos abrir la cámara. Usa el buscador manual.');
  }
}

async function syncPosWorkstation() {
  const session = posSummary.openSession;
  const currentSource = elements.posWarehouseSelect.value;
  const cashierMode = activeMembership()?.roleCode === 'CASHIER';
  const eligibleSources = session
    ? [
      { value: 'DISPLAY', label: 'Exhibición · venta normal' },
      ...(!cashierMode
        ? [{ value: 'AVAILABLE', label: 'Bodega · acceso avanzado' }]
        : []),
    ]
    : [];
  elements.posWarehouseSelect.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = eligibleSources.length
    ? 'Selecciona el origen'
    : 'Sin origen disponible';
  elements.posWarehouseSelect.append(placeholder);
  for (const source of eligibleSources) {
    const option = document.createElement('option');
    option.value = source.value;
    option.textContent = source.label;
    elements.posWarehouseSelect.append(option);
  }
  elements.posWarehouseSelect.value = eligibleSources.some(
    (source) => source.value === currentSource,
  ) ? currentSource : (eligibleSources[0]?.value || '');
  elements.posWarehouseSelect.disabled = !session || eligibleSources.length <= 1;
  elements.posProductSearch.disabled = !session;
  elements.posSaleLock.hidden = Boolean(session);
  if (!session) {
    posCatalog = [];
    clearCart();
    setPosCatalogState(
      'Abre un turno y selecciona una ubicación',
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
  elements.dashboardReceivableSnapshot.textContent =
    formatCurrency(summary.outstanding || 0);
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
      const paymentMethod = payment.payment_method.replaceAll('_', ' ').toLocaleLowerCase('es');
      const bankAccount = payment.bank_name
        ? ` · ${payment.bank_name}${payment.masked_account ? ` (${payment.masked_account})` : ''}`
        : '';
      reference.textContent = payment.reference || `${paymentMethod}${bankAccount}`;
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
    const [summary, customersResult, invoicesResult, bankAccounts] = await Promise.all([
      getJson('/api/receivables/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/receivables/customers', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/receivables/invoices', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/receivables/bank-accounts', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    receivableCustomers = customersResult;
    receivableInvoices = invoicesResult;
    receivableBankAccounts = bankAccounts;
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

function setPaymentBankOptions(select, accounts) {
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = accounts.length
    ? 'Selecciona la cuenta bancaria'
    : 'No hay cuentas bancarias activas';
  select.append(placeholder);
  accounts.forEach((account) => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${account.bank_name} · ${account.account_name} · ${account.masked_account}`;
    select.append(option);
  });
}

function syncReceivablePaymentBankField() {
  const required = ['BANK_TRANSFER', 'CARD'].includes(elements.receivablePaymentMethod.value);
  elements.receivablePaymentBankField.hidden = !required;
  elements.receivablePaymentBankAccountId.required = required;
  elements.receivablePaymentBankAccountId.disabled = !required;
  if (!required) elements.receivablePaymentBankAccountId.value = '';
}

function syncPayablePaymentBankField() {
  const required = ['BANK_TRANSFER', 'CARD', 'CHECK'].includes(elements.payablePaymentMethod.value);
  elements.payablePaymentBankField.hidden = !required;
  elements.payablePaymentBankAccountId.required = required;
  elements.payablePaymentBankAccountId.disabled = !required;
  if (!required) elements.payablePaymentBankAccountId.value = '';
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
  setPaymentBankOptions(elements.receivablePaymentBankAccountId, receivableBankAccounts);
  syncReceivablePaymentBankField();
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

function setThirdPartySummary(summary = {}) {
  elements.thirdPartyTotal.textContent = String(summary.total || 0);
  elements.thirdPartyCustomers.textContent = String(summary.customers || 0);
  elements.thirdPartySuppliers.textContent = String(summary.suppliers || 0);
  elements.thirdPartyDual.textContent = String(summary.dual_role || 0);
}

function showThirdPartiesError(message) {
  thirdParties = [];
  selectedThirdParty = null;
  setThirdPartySummary();
  elements.thirdPartyList.replaceChildren();
  elements.thirdPartyDataState.hidden = false;
  elements.thirdPartyDataState.classList.add('error');
  elements.thirdPartyDataState.querySelector('strong').textContent =
    'No pudimos consultar los terceros';
  elements.thirdPartyDataState.querySelector('p').textContent = message;
  elements.thirdPartyDetailContent.hidden = true;
  elements.thirdPartyDetailEmpty.hidden = false;
}

function appendThirdPartyRole(container, label, className) {
  const badge = document.createElement('span');
  badge.className = `party-role-badge ${className}`;
  badge.textContent = label;
  container.append(badge);
}

function renderThirdPartyList() {
  elements.thirdPartyList.replaceChildren();
  elements.thirdPartyDataState.hidden = thirdParties.length > 0;
  elements.thirdPartyDataState.classList.remove('error');
  if (!thirdParties.length) {
    elements.thirdPartyDataState.querySelector('strong').textContent =
      'No encontramos terceros';
    elements.thirdPartyDataState.querySelector('p').textContent =
      'Registra un cliente o proveedor, o cambia los filtros.';
    return;
  }
  for (const party of thirdParties) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'party-list-card';
    if (selectedThirdParty?.id === party.id) button.classList.add('selected');

    const avatar = document.createElement('span');
    avatar.className = 'party-avatar';
    avatar.textContent = accountInitials(party.name);
    const identity = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = party.name;
    const documentLabel = document.createElement('small');
    documentLabel.textContent = party.document_number
      ? `${party.document_type} ${party.document_number}`
      : 'Documento pendiente';
    const roles = document.createElement('div');
    roles.className = 'party-role-row';
    if (party.is_customer) appendThirdPartyRole(roles, 'Cliente', 'customer');
    if (party.is_supplier) appendThirdPartyRole(roles, 'Proveedor', 'supplier');
    identity.append(name, documentLabel, roles);

    const balances = document.createElement('div');
    balances.className = 'party-card-balances';
    const receivable = document.createElement('span');
    receivable.textContent = `Cobra ${formatCurrency(party.receivable_balance || 0)}`;
    const payable = document.createElement('span');
    payable.textContent = `Paga ${formatCurrency(party.payable_balance || 0)}`;
    balances.append(receivable, payable);
    button.append(avatar, identity, balances);
    button.addEventListener('click', () => loadThirdPartyDetail(party.id));
    elements.thirdPartyList.append(button);
  }
}

const thirdPartyActivityLabels = {
  RECEIVABLE: 'Cuenta por cobrar',
  PAYABLE: 'Cuenta por pagar',
  PURCHASE: 'Orden de compra',
  EXPENSE: 'Gasto',
};

function renderThirdPartyDetail(party) {
  selectedThirdParty = party;
  elements.thirdPartyDetailEmpty.hidden = true;
  elements.thirdPartyDetailContent.hidden = false;
  elements.thirdPartyDetailDocument.textContent = party.document_number
    ? `${party.document_type} ${party.document_number}${party.verification_digit
      ? `-${party.verification_digit}` : ''}`
    : 'Documento pendiente';
  elements.thirdPartyDetailName.textContent = party.name;
  elements.thirdPartyDetailRoles.replaceChildren();
  if (party.is_customer) {
    appendThirdPartyRole(elements.thirdPartyDetailRoles, 'Cliente', 'customer');
  }
  if (party.is_supplier) {
    appendThirdPartyRole(elements.thirdPartyDetailRoles, 'Proveedor', 'supplier');
  }
  if (!party.active) {
    appendThirdPartyRole(elements.thirdPartyDetailRoles, 'Inactivo', 'inactive');
  }
  elements.thirdPartyDetailContact.textContent =
    party.email || party.phone || 'Sin datos de contacto';
  elements.thirdPartyDetailAddress.textContent =
    [party.phone, party.address].filter(Boolean).join(' · ') || 'Sin dirección';
  elements.thirdPartyDetailReceivable.textContent =
    formatCurrency(party.receivable_balance || 0);
  elements.thirdPartyDetailPayable.textContent =
    formatCurrency(party.payable_balance || 0);
  elements.thirdPartyDetailPurchases.textContent = formatCurrency(
    Number(party.purchase_total || 0) + Number(party.expense_total || 0),
  );
  const activity = party.activity || [];
  elements.thirdPartyActivityCount.textContent =
    `${activity.length} ${activity.length === 1 ? 'movimiento' : 'movimientos'}`;
  elements.thirdPartyActivityList.replaceChildren();
  if (!activity.length) {
    const empty = document.createElement('p');
    empty.className = 'party-activity-empty';
    empty.textContent = 'Este tercero todavía no tiene movimientos comerciales.';
    elements.thirdPartyActivityList.append(empty);
  }
  for (const movement of activity) {
    const row = document.createElement('article');
    const symbol = document.createElement('span');
    symbol.className = 'party-activity-symbol';
    symbol.textContent = movement.kind === 'RECEIVABLE' ? '↙' : '↗';
    const identity = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = thirdPartyActivityLabels[movement.kind] || movement.kind;
    const reference = document.createElement('small');
    reference.textContent =
      `${movement.reference} · ${formatShortDate(movement.activity_date)}`;
    identity.append(title, reference);
    const value = document.createElement('div');
    const total = document.createElement('strong');
    total.textContent = formatCurrency(movement.total || 0);
    const status = document.createElement('small');
    status.textContent = movement.status;
    value.append(total, status);
    row.append(symbol, identity, value);
    elements.thirdPartyActivityList.append(row);
  }
  renderThirdPartyList();
}

async function loadThirdPartyDetail(partyId) {
  try {
    const detail = await getJson(`/api/third-parties/${partyId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderThirdPartyDetail(detail);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadThirdParties() {
  if (!activeTenantId) {
    showThirdPartiesError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  const params = new URLSearchParams({
    role: elements.thirdPartyRoleFilter.value,
    status: elements.thirdPartyStatusFilter.value,
  });
  const search = elements.thirdPartySearch.value.trim();
  if (search) params.set('search', search);
  try {
    const [summary, parties] = await Promise.all([
      getJson('/api/third-parties/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson(`/api/third-parties?${params}`, {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    thirdParties = parties;
    setThirdPartySummary(summary);
    renderThirdPartyList();
    if (selectedThirdParty) {
      const stillVisible = parties.some((party) => party.id === selectedThirdParty.id);
      if (stillVisible) await loadThirdPartyDetail(selectedThirdParty.id);
      else {
        selectedThirdParty = null;
        elements.thirdPartyDetailContent.hidden = true;
        elements.thirdPartyDetailEmpty.hidden = false;
      }
    }
    return parties;
  } catch (error) {
    showThirdPartiesError(error.message);
    throw error;
  }
}

function setThirdPartyFormValue(name, value) {
  const field = elements.thirdPartyForm.elements[name];
  if (field) field.value = value ?? '';
}

function openThirdPartyDialog(party = null) {
  editingThirdParty = party;
  elements.thirdPartyForm.reset();
  elements.thirdPartyFormError.hidden = true;
  elements.thirdPartyActiveField.hidden = !party;
  elements.thirdPartyDialogEyebrow.textContent =
    party ? 'Identidad consolidada' : 'Directorio comercial';
  elements.thirdPartyDialogTitle.textContent =
    party ? 'Editar tercero' : 'Registrar tercero';
  elements.thirdPartyDialogCopy.textContent = party
    ? 'Los cambios se reflejarán en sus perfiles de cliente y proveedor.'
    : 'Una sola identidad puede alimentar Caja, Cartera, Compras y Gastos.';
  elements.saveThirdPartyButton.textContent =
    party ? 'Guardar cambios' : 'Registrar tercero';
  if (party) {
    setThirdPartyFormValue('partyType', party.party_type);
    setThirdPartyFormValue('name', party.name);
    setThirdPartyFormValue('tradeName', party.trade_name);
    setThirdPartyFormValue('documentType', party.document_type);
    setThirdPartyFormValue('documentNumber', party.document_number);
    setThirdPartyFormValue('verificationDigit', party.verification_digit);
    setThirdPartyFormValue('email', party.email);
    setThirdPartyFormValue('phone', party.phone);
    setThirdPartyFormValue('address', party.address);
    setThirdPartyFormValue('municipalityCode', party.municipality_code);
    setThirdPartyFormValue('paymentTermsDays', party.payment_terms_days || 0);
    setThirdPartyFormValue('notes', party.notes);
    elements.thirdPartyForm.elements.isCustomer.checked = party.is_customer;
    elements.thirdPartyForm.elements.isSupplier.checked = party.is_supplier;
    elements.thirdPartyForm.elements.obligatedToInvoice.checked =
      Boolean(party.obligated_to_invoice);
    elements.thirdPartyForm.elements.electronicInvoicer.checked =
      Boolean(party.electronic_invoicer);
    elements.thirdPartyForm.elements.active.checked = party.active;
  }
  elements.thirdPartyDialog.showModal();
  elements.thirdPartyForm.elements.name.focus();
}

function closeThirdPartyDialog() {
  elements.thirdPartyDialog.close();
  editingThirdParty = null;
}

async function submitThirdParty(event) {
  event.preventDefault();
  const formData = new FormData(elements.thirdPartyForm);
  const payload = {
    partyType: formData.get('partyType'),
    name: formData.get('name'),
    tradeName: formData.get('tradeName'),
    documentType: formData.get('documentType'),
    documentNumber: formData.get('documentNumber'),
    verificationDigit: formData.get('verificationDigit'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    municipalityCode: formData.get('municipalityCode'),
    paymentTermsDays: Number(formData.get('paymentTermsDays') || 0),
    notes: formData.get('notes'),
    reason: formData.get('reason'),
    isCustomer: formData.has('isCustomer'),
    isSupplier: formData.has('isSupplier'),
    obligatedToInvoice: formData.has('obligatedToInvoice'),
    electronicInvoicer: formData.has('electronicInvoicer'),
    active: editingThirdParty ? formData.has('active') : true,
  };
  if (!payload.isCustomer && !payload.isSupplier) {
    elements.thirdPartyFormError.textContent =
      'Selecciona si es cliente, proveedor o ambos.';
    elements.thirdPartyFormError.hidden = false;
    return;
  }
  elements.thirdPartyFormError.hidden = true;
  elements.saveThirdPartyButton.disabled = true;
  elements.saveThirdPartyButton.textContent = 'Guardando…';
  try {
    const endpoint = editingThirdParty
      ? `/api/third-parties/${editingThirdParty.id}`
      : '/api/third-parties';
    const saved = await getJson(endpoint, {
      method: editingThirdParty ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    elements.thirdPartyDialog.close();
    editingThirdParty = null;
    await loadThirdParties();
    await loadThirdPartyDetail(saved.id);
    await Promise.allSettled([
      hasAnyPermission('purchases.manage') ? loadPurchases() : Promise.resolve(),
      hasAnyPermission('receivables.manage') ? loadReceivables() : Promise.resolve(),
      hasAnyPermission('expenses.view', 'expenses.manage')
        ? loadExpenses() : Promise.resolve(),
      hasAnyPermission('sales.operate') ? loadPos() : Promise.resolve(),
    ]);
    showToast('Tercero guardado y conectado con los módulos operativos.');
  } catch (error) {
    elements.thirdPartyFormError.textContent = error.message;
    elements.thirdPartyFormError.hidden = false;
  } finally {
    elements.saveThirdPartyButton.disabled = false;
    elements.saveThirdPartyButton.textContent =
      editingThirdParty ? 'Guardar cambios' : 'Registrar tercero';
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
  elements.purchaseSupportDocumentBlock.hidden = !purchase.support_document_required;
  elements.purchaseDetailEmpty.hidden = true;
  elements.purchaseDetailContent.hidden = false;
  elements.purchaseDetailNumber.textContent = purchase.order_number;
  elements.purchaseDetailSupplier.textContent = purchase.supplier_name;
  elements.purchaseDetailBranch.textContent =
    `${purchase.branch_name} · ${purchase.branch_code}${purchase.support_document_required
      ? ' · Documento soporte requerido' : ''}`;
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

  const electronic = purchase.electronic_reception;
  const hasElectronic = Boolean(electronic);
  elements.purchaseElectronicStatus.textContent = hasElectronic
    ? electronic.status === 'EVENT_SENT' ? 'Evento emitido'
      : electronic.status === 'FAILED' || electronic.status === 'EVENT_REJECTED' ? 'Requiere revisión'
        : 'Cargada en Factus'
    : 'Sin cargar';
  elements.purchaseElectronicStatus.className = hasElectronic
    ? 'purchase-status received' : 'purchase-status ordered';
  elements.purchaseElectronicCopy.textContent = electronic?.last_error
    ? `Último resultado: ${electronic.last_error}`
    : hasElectronic
    ? `CUFE / track ID: ${electronic.track_id}`
    : 'Carga el CUFE de la factura recibida cuando la conexión Factus de esta empresa esté lista.';
  elements.purchaseElectronicMeta.textContent = hasElectronic
    ? `${electronic.provider_code} · ${electronic.provider_bill_id || 'Identificador pendiente de Factus'}`
    : 'No se ha enviado ninguna recepción al proveedor.';
  elements.uploadPurchaseElectronicButton.textContent = hasElectronic
    ? 'Actualizar factura recibida' : 'Cargar factura recibida';
  elements.emitPurchaseRadianEventButton.hidden = !electronic?.provider_bill_id;
  elements.purchaseElectronicEventList.replaceChildren();
  if (!electronic?.events?.length) {
    const empty = document.createElement('p');
    empty.className = 'purchase-receipt-empty';
    empty.textContent = hasElectronic
      ? 'Aún no se han emitido eventos RADIAN.'
      : 'Los eventos aparecerán después de cargar la factura.';
    elements.purchaseElectronicEventList.append(empty);
  } else {
    for (const event of electronic.events) {
      const item = document.createElement('article');
      const symbol = document.createElement('span');
      symbol.textContent = '✓';
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `RADIAN ${event.event_type}`;
      const meta = document.createElement('small');
      meta.textContent = `${event.status} · ${formatShortDate(event.emitted_at)}`;
      copy.append(title, meta);
      item.append(symbol, copy);
      elements.purchaseElectronicEventList.append(item);
    }
  }
  renderPurchaseOrders();
}

function renderPurchaseSupportDocumentReadiness(readiness) {
  const applies = Boolean(readiness?.applicable);
  elements.purchaseSupportDocumentBlock.hidden = !applies;
  if (!applies) return;
  elements.purchaseSupportDocumentStatus.textContent = readiness.ready ? 'Lista para preparar' : 'Configuración pendiente';
  elements.purchaseSupportDocumentStatus.className = readiness.ready
    ? 'purchase-status received' : 'purchase-status ordered';
  elements.purchaseSupportDocumentCopy.textContent = readiness.message;
  elements.purchaseSupportDocumentRequirements.replaceChildren();
  for (const requirement of readiness.requirements || []) {
    const item = document.createElement('article');
    const symbol = document.createElement('span');
    symbol.textContent = requirement.ready ? '✓' : '!';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = requirement.label;
    const detail = document.createElement('small');
    detail.textContent = requirement.detail;
    copy.append(title, detail);
    item.append(symbol, copy);
    elements.purchaseSupportDocumentRequirements.append(item);
  }
}

async function loadPurchaseSupportDocumentReadiness(purchaseId) {
  try {
    const readiness = await getJson(`/api/purchases/${purchaseId}/support-document/readiness`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    if (selectedPurchase?.id === purchaseId) renderPurchaseSupportDocumentReadiness(readiness);
  } catch (error) {
    if (selectedPurchase?.id !== purchaseId) return;
    elements.purchaseSupportDocumentBlock.hidden = !selectedPurchase.support_document_required;
    elements.purchaseSupportDocumentStatus.textContent = 'No se pudo revisar';
    elements.purchaseSupportDocumentStatus.className = 'purchase-status ordered';
    elements.purchaseSupportDocumentCopy.textContent = error.message;
  }
}

async function loadPurchaseDetail(purchaseId) {
  try {
    const detail = await getJson(`/api/purchases/${purchaseId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderPurchaseDetail(detail);
    await loadPurchaseSupportDocumentReadiness(purchaseId);
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

function openPurchaseElectronicDialog() {
  if (!selectedPurchase) return;
  elements.purchaseElectronicForm.reset();
  elements.purchaseElectronicTrackId.value = selectedPurchase.electronic_reception?.track_id || '';
  elements.purchaseElectronicFormError.hidden = true;
  elements.purchaseElectronicDialog.showModal();
  elements.purchaseElectronicTrackId.focus();
}

function closePurchaseElectronicDialog() {
  elements.purchaseElectronicDialog.close();
}

async function submitPurchaseElectronicReception(event) {
  event.preventDefault();
  if (!selectedPurchase) return;
  elements.purchaseElectronicFormError.hidden = true;
  elements.savePurchaseElectronicButton.disabled = true;
  elements.savePurchaseElectronicButton.textContent = 'Cargando…';
  try {
    await getJson(`/api/purchases/${selectedPurchase.id}/electronic-reception`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify({ trackId: elements.purchaseElectronicTrackId.value.trim() }),
    });
    closePurchaseElectronicDialog();
    await loadPurchaseDetail(selectedPurchase.id);
    showToast('Factura del proveedor cargada en Factus.');
  } catch (error) {
    elements.purchaseElectronicFormError.textContent = error.message;
    elements.purchaseElectronicFormError.hidden = false;
  } finally {
    elements.savePurchaseElectronicButton.disabled = false;
    elements.savePurchaseElectronicButton.textContent = 'Cargar en Factus';
  }
}

function openPurchaseRadianDialog() {
  if (!selectedPurchase?.electronic_reception?.provider_bill_id) return;
  elements.purchaseRadianForm.reset();
  elements.purchaseRadianFormError.hidden = true;
  elements.purchaseRadianDialog.showModal();
  elements.purchaseRadianEventType.focus();
}

function closePurchaseRadianDialog() {
  elements.purchaseRadianDialog.close();
}

async function submitPurchaseRadianEvent(event) {
  event.preventDefault();
  const reception = selectedPurchase?.electronic_reception;
  if (!reception) return;
  let eventPayload;
  try {
    eventPayload = JSON.parse(elements.purchaseRadianPayload.value);
  } catch {
    elements.purchaseRadianFormError.textContent = 'Los datos del evento deben ser JSON válido.';
    elements.purchaseRadianFormError.hidden = false;
    return;
  }
  elements.purchaseRadianFormError.hidden = true;
  elements.savePurchaseRadianButton.disabled = true;
  elements.savePurchaseRadianButton.textContent = 'Enviando…';
  try {
    await getJson(`/api/purchases/electronic-receptions/${reception.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify({
        eventType: elements.purchaseRadianEventType.value,
        eventPayload,
      }),
    });
    closePurchaseRadianDialog();
    await loadPurchaseDetail(selectedPurchase.id);
    showToast('Evento RADIAN emitido y auditado.');
  } catch (error) {
    elements.purchaseRadianFormError.textContent = error.message;
    elements.purchaseRadianFormError.hidden = false;
  } finally {
    elements.savePurchaseRadianButton.disabled = false;
    elements.savePurchaseRadianButton.textContent = 'Emitir evento';
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
  elements.dashboardPayableSnapshot.textContent =
    formatCurrency(summary.outstanding || 0);
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
    const paymentMethod = payment.payment_method.replaceAll('_', ' ').toLocaleLowerCase('es');
    const bankAccount = payment.bank_name
      ? ` · ${payment.bank_name}${payment.masked_account ? ` (${payment.masked_account})` : ''}`
      : '';
    reference.textContent = payment.reference || `${paymentMethod}${bankAccount}`;
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
    const [summary, sources, invoices, bankAccounts] = await Promise.all([
      getJson('/api/payables/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/payables/sources', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/payables/invoices', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/payables/bank-accounts', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    payableSources = sources;
    payableInvoices = invoices;
    payableBankAccounts = bankAccounts;
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
  setPaymentBankOptions(elements.payablePaymentBankAccountId, payableBankAccounts);
  syncPayablePaymentBankField();
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

const expenseStatusLabels = {
  DRAFT: { label: 'Borrador', className: 'draft' },
  SUBMITTED: { label: 'Por aprobar', className: 'submitted' },
  APPROVED: { label: 'Aprobado', className: 'approved' },
  PARTIAL: { label: 'Pago parcial', className: 'partial' },
  PAID: { label: 'Pagado', className: 'paid' },
  REJECTED: { label: 'Rechazado', className: 'rejected' },
  VOID: { label: 'Anulado', className: 'void' },
};

function expenseStatusMeta(status) {
  return expenseStatusLabels[status] || expenseStatusLabels.DRAFT;
}

function setExpenseSummary(summary = {}) {
  elements.expenseMonthTotal.textContent = formatCurrency(summary.month_total || 0);
  elements.expensePendingApproval.textContent =
    String(summary.pending_approval || 0);
  elements.expensePendingPayment.textContent =
    formatCurrency(summary.pending_payment || 0);
  elements.expenseRecurringTotal.textContent =
    formatCurrency(summary.recurring_total || 0);
  elements.expenseUnsupportedTotal.textContent =
    formatCurrency(summary.unsupported_total || 0);
}

function renderExpenseCenters() {
  elements.expenseCenterStrip.replaceChildren();
  for (const center of expenseSetup.costCenters) {
    const card = document.createElement('article');
    const copy = document.createElement('div');
    const code = document.createElement('span');
    code.textContent = center.code;
    const name = document.createElement('strong');
    name.textContent = center.name;
    const scope = document.createElement('small');
    scope.textContent = center.branch_name || 'Toda la empresa';
    copy.append(code, name, scope);
    const budget = document.createElement('div');
    budget.append(
      Object.assign(document.createElement('span'), { textContent: 'Presupuesto' }),
      Object.assign(document.createElement('strong'), {
        textContent: center.monthly_budget == null
          ? 'Sin límite'
          : formatCurrency(center.monthly_budget),
      }),
    );
    card.append(copy, budget);
    elements.expenseCenterStrip.append(card);
  }
}

function showExpensesError(message) {
  businessExpenses = [];
  selectedExpense = null;
  setExpenseSummary();
  elements.expenseList.replaceChildren();
  elements.expenseCenterStrip.replaceChildren();
  elements.expenseDataState.hidden = false;
  elements.expenseDataState.classList.add('error');
  elements.expenseDataState.querySelector('strong').textContent =
    'No pudimos consultar los gastos';
  elements.expenseDataState.querySelector('p').textContent = message;
  elements.expenseRecordCount.textContent = '—';
  elements.expenseDetailContent.hidden = true;
  elements.expenseDetailEmpty.hidden = false;
}

function renderExpenseList() {
  const search = normalizeSearch(elements.expenseSearch.value.trim());
  const status = elements.expenseStatusFilter.value;
  const filtered = businessExpenses.filter((expense) => {
    const haystack = normalizeSearch([
      expense.expense_number,
      expense.description,
      expense.beneficiary,
      expense.category_name,
      expense.cost_center_name,
      expense.branch_name,
    ].filter(Boolean).join(' '));
    return (!search || haystack.includes(search)) &&
      (status === 'ALL' || expense.status === status);
  });
  elements.expenseList.replaceChildren();
  elements.expenseRecordCount.textContent = String(filtered.length);
  elements.expenseDataState.hidden = filtered.length > 0;
  elements.expenseDataState.classList.remove('error');
  if (!filtered.length) {
    elements.expenseDataState.querySelector('strong').textContent =
      search || status !== 'ALL' ? 'No hay coincidencias' : 'Sin gastos registrados';
    elements.expenseDataState.querySelector('p').textContent =
      search || status !== 'ALL'
        ? 'Cambia la búsqueda o consulta todos los estados.'
        : 'El primer gasto aparecerá después de enviarlo para aprobación.';
    return;
  }
  for (const expense of filtered) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'expense-list-card';
    if (selectedExpense?.id === expense.id) button.classList.add('selected');
    const top = document.createElement('div');
    const number = document.createElement('strong');
    number.textContent = expense.expense_number;
    const meta = expenseStatusMeta(expense.status);
    const badge = document.createElement('span');
    badge.className = `expense-status ${meta.className}`;
    badge.textContent = meta.label;
    top.append(number, badge);
    const description = document.createElement('span');
    description.className = 'expense-list-description';
    description.textContent = expense.description;
    const beneficiary = document.createElement('small');
    beneficiary.textContent =
      `${expense.beneficiary} · ${expense.category_name} · ${expense.cost_center_name}`;
    const amounts = document.createElement('div');
    const date = document.createElement('span');
    date.textContent = formatShortDate(expense.issue_date);
    const total = document.createElement('strong');
    total.textContent = formatCurrency(expense.total);
    amounts.append(date, total);
    button.append(top, description, beneficiary, amounts);
    button.addEventListener('click', () => loadExpenseDetail(expense.id));
    elements.expenseList.append(button);
  }
}

function renderExpenseDetail(expense) {
  selectedExpense = expense;
  elements.expenseDetailEmpty.hidden = true;
  elements.expenseDetailContent.hidden = false;
  elements.expenseDetailNumber.textContent = expense.expense_number;
  elements.expenseDetailDescription.textContent = expense.description;
  elements.expenseDetailBeneficiary.textContent =
    expense.supplier_name || expense.beneficiary_name;
  const status = expenseStatusMeta(expense.status);
  elements.expenseDetailStatus.textContent = status.label;
  elements.expenseDetailStatus.className = `expense-status ${status.className}`;
  elements.expenseDetailDate.textContent = formatShortDate(expense.issue_date);
  elements.expenseDetailCategory.textContent =
    `${expense.category_name} · ${expense.account_code}`;
  elements.expenseDetailCenter.textContent =
    `${expense.cost_center_name} · ${expense.cost_center_code}`;
  elements.expenseDetailBranch.textContent = expense.branch_name;
  elements.expenseDetailTotal.textContent = formatCurrency(expense.total);
  elements.expenseDetailBalance.textContent = formatCurrency(expense.balance);
  elements.expenseDetailSupport.textContent =
    expense.support_document_name || 'Sin archivo adjunto';
  elements.expenseDetailDocument.textContent = expense.supplier_document_number
    ? `Comprobante ${expense.supplier_document_number}`
    : 'Sin número de comprobante';
  elements.expenseSupportLink.hidden = !expense.support_url;
  if (expense.support_url) elements.expenseSupportLink.href = expense.support_url;
  if (expense.status === 'REJECTED') {
    elements.expenseDecisionOwner.textContent =
      `Rechazado por ${expense.rejected_by_name || 'responsable'}`;
  } else if (['APPROVED', 'PARTIAL', 'PAID'].includes(expense.status)) {
    elements.expenseDecisionOwner.textContent =
      `Aprobado por ${expense.approved_by_name || 'responsable'}`;
  } else {
    elements.expenseDecisionOwner.textContent = 'Esperando aprobación';
  }
  elements.expenseDecisionNotes.textContent =
    expense.decision_notes || 'Todavía no se ha registrado una decisión.';
  elements.approveExpenseButton.hidden =
    expense.status !== 'SUBMITTED' || !hasAnyPermission('expenses.approve');
  elements.rejectExpenseButton.hidden =
    expense.status !== 'SUBMITTED' || !hasAnyPermission('expenses.approve');
  elements.payExpenseButton.hidden =
    !['APPROVED', 'PARTIAL'].includes(expense.status) ||
    !hasAnyPermission('expenses.pay');
  elements.expensePaymentList.replaceChildren();
  elements.expensePaymentCount.textContent =
    `${expense.payments.length} ${expense.payments.length === 1 ? 'pago' : 'pagos'}`;
  if (!expense.payments.length) {
    const empty = document.createElement('p');
    empty.className = 'ar-no-payments';
    empty.textContent = expense.status === 'SUBMITTED'
      ? 'El gasto debe aprobarse antes de pagar.'
      : 'Todavía no se han registrado pagos.';
    elements.expensePaymentList.append(empty);
  }
  for (const payment of expense.payments) {
    const row = document.createElement('div');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = formatShortDate(payment.payment_date);
    const detail = document.createElement('small');
    detail.textContent = [
      payment.payment_method.replaceAll('_', ' ').toLocaleLowerCase('es'),
      payment.bank_name
        ? `${payment.bank_name} ${payment.masked_account}`
        : payment.cash_register_name,
      payment.reference,
    ].filter(Boolean).join(' · ');
    copy.append(title, detail);
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(payment.amount);
    row.append(copy, amount);
    elements.expensePaymentList.append(row);
  }
  renderExpenseList();
}

async function loadExpenseDetail(expenseId) {
  try {
    const expense = await getJson(`/api/expenses/${expenseId}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    renderExpenseDetail(expense);
  } catch (error) {
    showToast(error.message);
  }
}

async function loadExpenses() {
  if (!activeTenantId) {
    showExpensesError('Primero debes registrar o seleccionar una empresa.');
    return [];
  }
  try {
    const [summary, setup, expenses] = await Promise.all([
      getJson('/api/expenses/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/expenses/setup', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/expenses', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
    ]);
    expenseSetup = setup;
    businessExpenses = expenses;
    setExpenseSummary(summary);
    renderExpenseCenters();
    renderExpenseList();
    elements.newExpenseButton.disabled =
      !setup.branches.length || !setup.categories.length || !setup.costCenters.length;
    if (selectedExpense) {
      const exists = expenses.some((expense) => expense.id === selectedExpense.id);
      if (exists) await loadExpenseDetail(selectedExpense.id);
      else {
        selectedExpense = null;
        elements.expenseDetailContent.hidden = true;
        elements.expenseDetailEmpty.hidden = false;
      }
    }
    return expenses;
  } catch (error) {
    showExpensesError(error.message);
    throw error;
  }
}

function syncExpenseCostCenters() {
  const branchId = elements.expenseBranchId.value;
  fillInventorySelect(
    elements.expenseCostCenterId,
    'Selecciona un centro',
    expenseSetup.costCenters.filter(
      (center) => !center.branch_id || center.branch_id === branchId,
    ),
    (center) => `${center.name} · ${center.code}`,
  );
}

function syncExpenseBeneficiary() {
  const hasSupplier = Boolean(elements.expenseSupplierId.value);
  elements.expenseBeneficiaryField.hidden = hasSupplier;
  elements.expenseBeneficiaryName.required = !hasSupplier;
}

function syncExpenseRecurrence() {
  elements.expenseRecurrenceField.hidden = !elements.expenseRecurring.checked;
  elements.expenseRecurrenceRule.required = elements.expenseRecurring.checked;
}

function updateExpenseDraftTotal() {
  const total =
    (Number(elements.expenseSubtotal.value) || 0) +
    (Number(elements.expenseTaxTotal.value) || 0);
  elements.expenseDraftTotal.textContent = formatCurrency(total);
}

function openExpenseDialog() {
  elements.expenseForm.reset();
  elements.expenseFormError.hidden = true;
  fillInventorySelect(
    elements.expenseBranchId,
    'Selecciona una sucursal',
    expenseSetup.branches,
    (branch) => `${branch.name} · ${branch.code}`,
  );
  fillInventorySelect(
    elements.expenseCategoryId,
    'Selecciona una categoría',
    expenseSetup.categories,
    (category) => `${category.name} · ${category.account_code}`,
  );
  fillInventorySelect(
    elements.expenseSupplierId,
    'Otro beneficiario',
    expenseSetup.suppliers,
    (supplier) => `${supplier.name}${supplier.tax_id ? ` · ${supplier.tax_id}` : ''}`,
  );
  fillInventorySelect(
    elements.expenseSupportDocumentId,
    'Sin archivo adjunto',
    expenseSetup.documents,
    (document) => `${document.original_name} · ${document.category}`,
  );
  elements.expenseIssueDate.value = isoDate();
  elements.expenseDueDate.value = isoDate();
  elements.expenseTaxTotal.value = '0';
  syncExpenseCostCenters();
  syncExpenseBeneficiary();
  syncExpenseRecurrence();
  updateExpenseDraftTotal();
  elements.expenseDialog.showModal();
  elements.expenseBranchId.focus();
}

function closeExpenseDialog() {
  elements.expenseDialog.close();
}

async function submitExpense(event) {
  event.preventDefault();
  const formData = new FormData(elements.expenseForm);
  elements.expenseFormError.hidden = true;
  elements.saveExpenseButton.disabled = true;
  elements.saveExpenseButton.textContent = 'Enviando…';
  try {
    const expense = await getJson('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        branchId: formData.get('branchId'),
        costCenterId: formData.get('costCenterId'),
        categoryId: formData.get('categoryId'),
        supplierId: formData.get('supplierId') || null,
        beneficiaryName: formData.get('beneficiaryName') || null,
        supplierDocumentNumber: formData.get('supplierDocumentNumber') || null,
        supportDocumentId: formData.get('supportDocumentId') || null,
        issueDate: formData.get('issueDate'),
        dueDate: formData.get('dueDate') || null,
        subtotal: Number(formData.get('subtotal')),
        taxTotal: Number(formData.get('taxTotal') || 0),
        description: formData.get('description'),
        recurring: elements.expenseRecurring.checked,
        recurrenceRule: elements.expenseRecurring.checked
          ? formData.get('recurrenceRule')
          : null,
      }),
    });
    closeExpenseDialog();
    await loadExpenses();
    await loadExpenseDetail(expense.id);
    showToast(`${expense.expense_number} enviado para aprobación.`);
  } catch (error) {
    elements.expenseFormError.textContent = error.message;
    elements.expenseFormError.hidden = false;
  } finally {
    elements.saveExpenseButton.disabled = false;
    elements.saveExpenseButton.textContent = 'Enviar para aprobación';
  }
}

function openExpenseDecision(action) {
  if (!selectedExpense) return;
  elements.expenseDecisionForm.reset();
  elements.expenseDecisionError.hidden = true;
  elements.expenseDecisionAction.value = action;
  const approve = action === 'approve';
  elements.expenseDecisionKicker.textContent = selectedExpense.expense_number;
  elements.expenseDecisionTitle.textContent =
    approve ? 'Aprobar gasto' : 'Rechazar gasto';
  elements.expenseDecisionCopy.textContent = approve
    ? `Se reconocerá contablemente ${formatCurrency(selectedExpense.total)} y quedará disponible para pago.`
    : 'El gasto quedará cerrado sin generar obligación ni asiento contable.';
  elements.saveExpenseDecision.textContent =
    approve ? 'Aprobar y contabilizar' : 'Confirmar rechazo';
  elements.expenseDecisionDialog.showModal();
  elements.expenseDecisionInput.focus();
}

function closeExpenseDecisionDialog() {
  elements.expenseDecisionDialog.close();
}

async function submitExpenseDecision(event) {
  event.preventDefault();
  if (!selectedExpense) return;
  const action = elements.expenseDecisionAction.value;
  elements.expenseDecisionError.hidden = true;
  elements.saveExpenseDecision.disabled = true;
  try {
    const expenseId = selectedExpense.id;
    await getJson(`/api/expenses/${expenseId}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ notes: elements.expenseDecisionInput.value }),
    });
    closeExpenseDecisionDialog();
    await loadExpenses();
    await loadExpenseDetail(expenseId);
    showToast(action === 'approve'
      ? 'Gasto aprobado y contabilizado.'
      : 'Gasto rechazado con trazabilidad.');
  } catch (error) {
    elements.expenseDecisionError.textContent = error.message;
    elements.expenseDecisionError.hidden = false;
  } finally {
    elements.saveExpenseDecision.disabled = false;
  }
}

function syncExpensePaymentSource() {
  const method = elements.expensePaymentMethod.value;
  const cash = method === 'CASH';
  const bank = ['BANK_TRANSFER', 'CARD', 'CHECK'].includes(method);
  elements.expenseBankAccountField.hidden = !bank;
  elements.expenseCashSessionField.hidden = !cash;
  elements.expenseBankAccountId.required = bank;
  elements.expenseCashSessionId.required = cash;
}

function openExpensePaymentDialog() {
  if (!selectedExpense || !['APPROVED', 'PARTIAL'].includes(selectedExpense.status)) {
    return;
  }
  elements.expensePaymentForm.reset();
  elements.expensePaymentError.hidden = true;
  elements.expensePaymentNumber.textContent = selectedExpense.expense_number;
  elements.expensePaymentBalance.textContent =
    `${formatCurrency(selectedExpense.balance)} pendientes`;
  elements.expensePaymentAmount.value = String(selectedExpense.balance);
  elements.expensePaymentAmount.max = String(selectedExpense.balance);
  elements.expensePaymentDate.value = isoDate();
  fillInventorySelect(
    elements.expenseBankAccountId,
    expenseSetup.bankAccounts.length ? 'Selecciona una cuenta' : 'Sin cuentas bancarias',
    expenseSetup.bankAccounts,
    (account) => `${account.bank_name} · ${account.masked_account}`,
  );
  fillInventorySelect(
    elements.expenseCashSessionId,
    expenseSetup.cashSessions.length ? 'Selecciona un turno' : 'Sin turnos abiertos',
    expenseSetup.cashSessions,
    (session) => `${session.register_name} · ${session.branch_name}`,
  );
  elements.expensePaymentMethod.value = expenseSetup.bankAccounts.length
    ? 'BANK_TRANSFER'
    : expenseSetup.cashSessions.length ? 'CASH' : 'OTHER';
  syncExpensePaymentSource();
  elements.expensePaymentDialog.showModal();
  elements.expensePaymentAmount.focus();
  elements.expensePaymentAmount.select();
}

function closeExpensePaymentDialog() {
  elements.expensePaymentDialog.close();
}

async function submitExpensePayment(event) {
  event.preventDefault();
  if (!selectedExpense) return;
  const formData = new FormData(elements.expensePaymentForm);
  const method = formData.get('paymentMethod');
  elements.expensePaymentError.hidden = true;
  elements.saveExpensePayment.disabled = true;
  elements.saveExpensePayment.textContent = 'Aplicando pago…';
  try {
    const expenseId = selectedExpense.id;
    await getJson(`/api/expenses/${expenseId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        amount: Number(formData.get('amount')),
        paymentDate: formData.get('paymentDate'),
        paymentMethod: method,
        bankAccountId: ['BANK_TRANSFER', 'CARD', 'CHECK'].includes(method)
          ? formData.get('bankAccountId')
          : null,
        cashSessionId: method === 'CASH' ? formData.get('cashSessionId') : null,
        reference: formData.get('reference') || null,
        notes: formData.get('notes') || null,
      }),
    });
    closeExpensePaymentDialog();
    await loadExpenses();
    await loadExpenseDetail(expenseId);
    if (hasAnyPermission('sales.operate')) await loadPos();
    showToast('Pago aplicado, contabilizado y auditado.');
  } catch (error) {
    elements.expensePaymentError.textContent = error.message;
    elements.expensePaymentError.hidden = false;
  } finally {
    elements.saveExpensePayment.disabled = false;
    elements.saveExpensePayment.textContent = 'Aplicar pago';
  }
}

function openCostCenterDialog() {
  elements.costCenterForm.reset();
  elements.costCenterFormError.hidden = true;
  fillInventorySelect(
    elements.costCenterBranchId,
    'Toda la empresa',
    expenseSetup.branches,
    (branch) => `${branch.name} · ${branch.code}`,
  );
  elements.costCenterDialog.showModal();
  elements.costCenterForm.elements.code.focus();
}

function closeCostCenterDialog() {
  elements.costCenterDialog.close();
}

async function submitCostCenter(event) {
  event.preventDefault();
  const formData = new FormData(elements.costCenterForm);
  elements.costCenterFormError.hidden = true;
  elements.saveCostCenter.disabled = true;
  try {
    await getJson('/api/expenses/cost-centers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    closeCostCenterDialog();
    await loadExpenses();
    showToast('Centro de costos creado.');
  } catch (error) {
    elements.costCenterFormError.textContent = error.message;
    elements.costCenterFormError.hidden = false;
  } finally {
    elements.saveCostCenter.disabled = false;
  }
}

function openExpenseCategoryDialog() {
  elements.expenseCategoryForm.reset();
  elements.expenseCategoryFormError.hidden = true;
  fillInventorySelect(
    elements.expenseAccountingAccountId,
    'Selecciona una cuenta',
    expenseSetup.expenseAccounts,
    (account) => `${account.code} · ${account.name}`,
  );
  elements.expenseCategoryDialog.showModal();
  elements.expenseCategoryForm.elements.code.focus();
}

function closeExpenseCategoryDialog() {
  elements.expenseCategoryDialog.close();
}

async function submitExpenseCategory(event) {
  event.preventDefault();
  const formData = new FormData(elements.expenseCategoryForm);
  elements.expenseCategoryFormError.hidden = true;
  elements.saveExpenseCategory.disabled = true;
  try {
    await getJson('/api/expenses/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        code: formData.get('code'),
        name: formData.get('name'),
        accountingAccountId: formData.get('accountingAccountId'),
        approvalThreshold: Number(formData.get('approvalThreshold') || 0),
        requiresSupport: formData.get('requiresSupport') === 'on',
      }),
    });
    closeExpenseCategoryDialog();
    await loadExpenses();
    showToast('Categoría de gasto creada.');
  } catch (error) {
    elements.expenseCategoryFormError.textContent = error.message;
    elements.expenseCategoryFormError.hidden = false;
  } finally {
    elements.saveExpenseCategory.disabled = false;
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
  elements.revokeUserSessionsButton.hidden = user.status !== 'ACTIVE';
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

async function revokeUserSessions() {
  if (!selectedTeamUser) return;
  const approved = window.confirm(
    `Se cerrarán todas las sesiones de ${selectedTeamUser.full_name}. Tendrá que volver a iniciar sesión en sus equipos. ¿Continuar?`,
  );
  if (!approved) return;
  elements.revokeUserSessionsButton.disabled = true;
  try {
    const result = await getJson(`/api/users/${selectedTeamUser.id}/revoke-sessions`, {
      method: 'POST',
      headers: {
        ...accessRequestHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Cierre preventivo desde Equipo y accesos' }),
    });
    showToast(`${result.revokedSessions} ${result.revokedSessions === 1 ? 'sesión cerrada' : 'sesiones cerradas'}.`);
    await loadUsers();
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.revokeUserSessionsButton.disabled = false;
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
  CUSTOMER_RETURN: 'Devolución de cliente',
  SUPPLIER_RETURN: 'Devolución a proveedor',
  DAMAGE_OUT: 'Salida hacia averías',
  DAMAGE_IN: 'Ingreso a averías',
  LOSS: 'Pérdida confirmada',
  QUARANTINE_OUT: 'Salida hacia cuarentena',
  QUARANTINE_IN: 'Ingreso a cuarentena',
  QUARANTINE_RELEASE_OUT: 'Salida de cuarentena',
  QUARANTINE_RELEASE_IN: 'Liberación de cuarentena',
  TRANSFER_DISPATCH: 'Despacho de transferencia',
  TRANSFER_TRANSIT: 'Ingreso a tránsito',
  TRANSFER_TRANSIT_OUT: 'Salida de tránsito',
  TRANSFER_RECEIVED: 'Transferencia recibida',
};

const inventoryIncidentLabels = {
  CUSTOMER_RETURN: 'Devolución de cliente',
  SUPPLIER_RETURN: 'Devolución a proveedor',
  DAMAGE: 'Avería',
  LOSS: 'Pérdida',
  QUARANTINE: 'Cuarentena',
  QUARANTINE_RELEASE: 'Liberación',
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
  elements.inventoryStorageUnits.textContent =
    formatQuantity(summary.storage_units || 0);
  elements.inventoryDisplayUnits.textContent =
    formatQuantity(summary.display_units || 0);
  elements.inventoryReservedUnits.textContent =
    `${formatQuantity(summary.reserved_units || 0)} reservadas`;
  elements.inventoryLowStock.textContent = String(summary.low_stock_balances || 0);
  elements.inventoryMovementsMonth.textContent = String(summary.movements_month || 0);
}

function renderReplenishments() {
  const canAdjustInventory = hasAnyPermission('inventory.adjust');
  const alerts = inventoryReplenishments.filter((item) => item.status !== 'OK');
  const ready = inventoryReplenishments.filter((item) => item.status === 'OK');
  elements.replenishmentAlertCount.textContent = String(alerts.length);
  elements.replenishmentReadyCount.textContent = String(ready.length);
  elements.replenishmentList.replaceChildren();
  elements.replenishmentState.hidden = inventoryReplenishments.length > 0;
  elements.replenishmentState.classList.remove('error');
  if (!inventoryReplenishments.length) {
    elements.replenishmentState.querySelector('strong').textContent =
      'Aún no hay ubicaciones de exhibición';
    elements.replenishmentState.querySelector('p').textContent =
      'Crea una ubicación de tipo Exhibición para activar las recomendaciones.';
    return;
  }

  const statusLabels = {
    OUT: 'Agotado en exhibición',
    LOW: 'Reposición necesaria',
    OK: 'Nivel correcto',
  };
  for (const item of inventoryReplenishments) {
    const card = document.createElement('article');
    card.className = `replenishment-card status-${item.status.toLowerCase()}`;

    const heading = document.createElement('div');
    heading.className = 'replenishment-card-heading';
    const identity = document.createElement('div');
    const product = document.createElement('strong');
    product.textContent = item.product_name;
    const sku = document.createElement('small');
    sku.textContent = `${item.sku} · ${item.display_warehouse_name}`;
    identity.append(product, sku);
    const status = document.createElement('span');
    status.className = 'replenishment-status';
    status.textContent = statusLabels[item.status] || item.status;
    heading.append(identity, status);

    const levels = document.createElement('div');
    levels.className = 'replenishment-levels';
    const displayLevel = document.createElement('div');
    displayLevel.append(
      Object.assign(document.createElement('span'), { textContent: 'Exhibición' }),
      Object.assign(document.createElement('strong'), {
        textContent: formatQuantity(item.display_available),
      }),
    );
    const policy = document.createElement('div');
    policy.append(
      Object.assign(document.createElement('span'), { textContent: 'Mín. / Máx.' }),
      Object.assign(document.createElement('strong'), {
        textContent: `${formatQuantity(item.minimum_quantity)} / ` +
          `${formatQuantity(item.maximum_quantity)}`,
      }),
    );
    const sourceLevel = document.createElement('div');
    sourceLevel.append(
      Object.assign(document.createElement('span'), { textContent: 'En bodega' }),
      Object.assign(document.createElement('strong'), {
        textContent: formatQuantity(item.source_available),
      }),
    );
    levels.append(displayLevel, policy, sourceLevel);

    const footer = document.createElement('div');
    footer.className = 'replenishment-card-actions';
    const route = document.createElement('small');
    route.textContent = item.source_warehouse_name
      ? `Desde ${item.source_warehouse_name}`
      : 'Sin bodega de abastecimiento';
    const configure = document.createElement('button');
    configure.type = 'button';
    configure.className = 'replenishment-configure';
    configure.textContent = 'Configurar';
    configure.hidden = !canAdjustInventory;
    configure.addEventListener('click', () => openReplenishmentDialog(item));
    const replenish = document.createElement('button');
    replenish.type = 'button';
    replenish.className = 'replenishment-action';
    const suggested = Number(item.suggested_quantity || 0);
    replenish.disabled = item.status === 'OK' || suggested <= 0 || !item.source_warehouse_id;
    replenish.hidden = !canAdjustInventory;
    replenish.textContent = item.status === 'OK'
      ? 'Nivel completo'
      : suggested > 0
        ? `Reponer ${formatQuantity(suggested)}`
        : 'Sin saldo para reponer';
    replenish.addEventListener('click', () => openTransferDialog({
      productId: item.product_id,
      sourceWarehouseId: item.source_warehouse_id,
      destinationWarehouseId: item.display_warehouse_id,
      quantity: suggested,
      reason: `Reposición de exhibición · mínimo ${formatQuantity(item.minimum_quantity)} ` +
        `· máximo ${formatQuantity(item.maximum_quantity)}`,
    }));
    footer.append(route, configure, replenish);
    card.append(heading, levels, footer);
    elements.replenishmentList.append(card);
  }
}

function showInventoryError(message) {
  inventoryBalances = [];
  inventoryMovements = [];
  inventoryReplenishments = [];
  inventoryIncidents = [];
  inventoryTransferOrders = [];
  setInventorySummary();
  renderReplenishments();
  renderInventoryIncidents();
  renderInventoryTransferOrders();
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
    meta.textContent = `${balance.sku} · ${balance.warehouse_name} · ` +
      `${warehouseTypeLabels[balance.warehouse_type] || balance.warehouse_type}`;
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
    adjust.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Ajustar`;
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

function renderInventoryIncidents() {
  elements.inventoryIncidentList.replaceChildren();
  elements.inventoryIncidentCount.textContent =
    `${inventoryIncidents.length} ` +
    `${inventoryIncidents.length === 1 ? 'novedad' : 'novedades'}`;
  elements.inventoryIncidentState.hidden = inventoryIncidents.length > 0;
  for (const incident of inventoryIncidents) {
    const item = document.createElement('article');
    item.className =
      `inventory-incident-card type-${incident.incident_type.toLowerCase()}`;
    const marker = document.createElement('span');
    marker.className = 'inventory-incident-marker';
    marker.textContent = incident.incident_type === 'CUSTOMER_RETURN' ? '↩'
      : incident.incident_type === 'QUARANTINE_RELEASE' ? '✓'
        : incident.incident_type === 'QUARANTINE' ? 'Q' : '!';
    const copy = document.createElement('div');
    const heading = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent =
      inventoryIncidentLabels[incident.incident_type] || incident.incident_type;
    const status = document.createElement('span');
    status.className = 'inventory-incident-status';
    status.textContent = incident.status === 'RESOLVED'
      ? 'APLICADA'
      : incident.status;
    heading.append(title, status);
    const product = document.createElement('p');
    product.textContent =
      `${incident.product_name} · ${formatQuantity(incident.quantity)} unidades`;
    const route = document.createElement('small');
    route.textContent = [
      incident.source_warehouse_name,
      incident.destination_warehouse_name
        ? `→ ${incident.destination_warehouse_name}`
        : null,
      formatShortDate(incident.created_at),
    ].filter(Boolean).join(' ');
    const reason = document.createElement('span');
    reason.textContent = incident.reason;
    copy.append(heading, product, route, reason);
    item.append(marker, copy);
    elements.inventoryIncidentList.append(item);
  }
}

function renderInventoryTransferOrders() {
  elements.inventoryTransferOrderList.replaceChildren();
  const pending = inventoryTransferOrders.filter((transfer) =>
    transfer.status === 'DISPATCHED');
  elements.inventoryTransferOrderCount.textContent =
    `${pending.length} ${pending.length === 1 ? 'pendiente' : 'pendientes'}`;
  elements.inventoryTransferOrderState.hidden =
    inventoryTransferOrders.length > 0;
  for (const transfer of inventoryTransferOrders) {
    const item = document.createElement('article');
    item.className = `inventory-transfer-order ${transfer.status.toLowerCase()}`;
    const route = document.createElement('div');
    const status = document.createElement('span');
    status.textContent = transfer.status === 'DISPATCHED'
      ? 'EN TRÁNSITO'
      : transfer.status === 'RECEIVED' ? 'RECIBIDA' : transfer.status;
    const title = document.createElement('strong');
    title.textContent =
      `${transfer.source_branch_name} → ${transfer.destination_branch_name}`;
    const product = document.createElement('p');
    product.textContent =
      `${transfer.product_name} · ${formatQuantity(transfer.quantity)} unidades`;
    const meta = document.createElement('small');
    meta.textContent =
      `${transfer.source_warehouse_name} → ` +
      `${transfer.destination_warehouse_name} · ` +
      `${formatShortDate(transfer.dispatched_at)}`;
    route.append(status, title, product, meta);
    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = transfer.status === 'DISPATCHED'
      ? 'Confirmar recepción'
      : 'Recepción confirmada';
    action.disabled = transfer.status !== 'DISPATCHED';
    action.addEventListener('click', () =>
      receiveTransferOrder(transfer.id, action));
    item.append(route, action);
    elements.inventoryTransferOrderList.append(item);
  }
}

function syncInventoryOperationBadge() {
  const replenishmentAlerts = inventoryReplenishments
    .filter((item) => item.status !== 'OK').length;
  const pendingTransfers = inventoryTransferOrders
    .filter((item) => item.status === 'DISPATCHED').length;
  const openIncidents = inventoryIncidents
    .filter((item) => item.status !== 'RESOLVED').length;
  elements.inventoryOperationAlertBadge.textContent =
    String(replenishmentAlerts + pendingTransfers + openIncidents);
}

function syncInventoryWarehouseFilter() {
  const selected = elements.inventoryWarehouseFilter.value;
  elements.inventoryWarehouseFilter.replaceChildren(new Option('Todas las bodegas', ''));
  for (const warehouse of warehouses.filter((item) => item.active)) {
    elements.inventoryWarehouseFilter.append(
      new Option(
        `${warehouse.name} · ${warehouseTypeLabels[warehouse.warehouse_type] || warehouse.code}`,
        warehouse.id,
      ),
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
    const logisticsEnabled = isTenantModuleEnabled('LOGISTICS');
    const [
      summary,
      balances,
      movements,
      replenishments,
      incidents,
      transferOrders,
    ] =
      await Promise.all([
      getJson('/api/inventory/summary', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/inventory/balances', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      getJson('/api/inventory/movements?limit=40', {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      logisticsEnabled ? getJson('/api/inventory/replenishments', {
        headers: { 'x-tenant-id': activeTenantId },
      }) : Promise.resolve([]),
      logisticsEnabled ? getJson('/api/inventory/incidents?limit=30', {
        headers: { 'x-tenant-id': activeTenantId },
      }) : Promise.resolve([]),
      logisticsEnabled ? getJson('/api/inventory/transfer-orders', {
        headers: { 'x-tenant-id': activeTenantId },
      }) : Promise.resolve([]),
      ]);
    inventoryBalances = balances;
    inventoryMovements = movements;
    inventoryReplenishments = replenishments;
    inventoryIncidents = incidents;
    inventoryTransferOrders = transferOrders;
    setInventorySummary(summary);
    syncInventoryWarehouseFilter();
    renderReplenishments();
    renderInventoryBalances();
    renderInventoryMovements();
    renderInventoryIncidents();
    renderInventoryTransferOrders();
    syncInventoryOperationBadge();
    return balances;
  } catch (error) {
    showInventoryError(error.message);
    throw error;
  }
}

function openKardexDialog() {
  const selectedProduct = elements.kardexProduct.value;
  const selectedWarehouse = elements.kardexWarehouse.value;
  const uniqueProducts = new Map();
  inventoryBalances.forEach((balance) => {
    uniqueProducts.set(balance.product_id, {
      id: balance.product_id,
      label: `${balance.sku} · ${balance.name}`,
    });
  });
  elements.kardexProduct.replaceChildren(new Option('Todos los productos', ''));
  [...uniqueProducts.values()].sort((a, b) => a.label.localeCompare(b.label))
    .forEach((product) => elements.kardexProduct.append(
      new Option(product.label, product.id),
    ));
  elements.kardexWarehouse.replaceChildren(new Option('Todas las bodegas', ''));
  warehouses.filter((warehouse) => warehouse.active).forEach((warehouse) => {
    elements.kardexWarehouse.append(
      new Option(`${warehouse.code} · ${warehouse.name}`, warehouse.id),
    );
  });
  if (uniqueProducts.has(selectedProduct)) elements.kardexProduct.value = selectedProduct;
  if (warehouses.some((warehouse) => warehouse.id === selectedWarehouse)) {
    elements.kardexWarehouse.value = selectedWarehouse;
  }
  const today = new Date().toISOString().slice(0, 10);
  elements.kardexDateTo.value ||= today;
  elements.kardexDateFrom.value ||= `${today.slice(0, 8)}01`;
  elements.kardexTableBody.replaceChildren();
  elements.kardexState.hidden = false;
  elements.kardexDialog.showModal();
}

function closeKardexDialog() {
  elements.kardexDialog.close();
}

async function loadKardex(event) {
  event.preventDefault();
  elements.loadKardexButton.disabled = true;
  elements.kardexState.hidden = false;
  elements.kardexState.querySelector('strong').textContent = 'Consultando kardex';
  elements.kardexState.querySelector('p').textContent =
    'Calculando saldos acumulados y valoración.';
  try {
    const params = new URLSearchParams();
    if (elements.kardexProduct.value) {
      params.set('productId', elements.kardexProduct.value);
    }
    if (elements.kardexWarehouse.value) {
      params.set('warehouseId', elements.kardexWarehouse.value);
    }
    if (elements.kardexDateFrom.value) {
      params.set('dateFrom', elements.kardexDateFrom.value);
    }
    if (elements.kardexDateTo.value) {
      params.set('dateTo', elements.kardexDateTo.value);
    }
    const records = await getJson(`/api/inventory/kardex?${params}`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    elements.kardexTableBody.replaceChildren();
    records.forEach((record) => {
      const row = document.createElement('tr');
      row.append(
        createCell('Fecha', formatShortDate(record.created_at)),
        createCell('Producto', `${record.sku} · ${record.product_name}`),
        createCell('Ubicación', record.warehouse_name),
        createCell(
          'Movimiento',
          inventoryMovementLabels[record.movement_type] || record.movement_type,
        ),
        createCell('Cantidad', formatQuantity(record.quantity, { sign: true })),
        createCell('Costo', formatCurrency(record.unit_cost)),
        createCell('Saldo', formatQuantity(record.running_quantity)),
        createCell('Valor acumulado', formatCurrency(record.running_value)),
      );
      elements.kardexTableBody.append(row);
    });
    elements.kardexState.hidden = records.length > 0;
    if (!records.length) {
      elements.kardexState.querySelector('strong').textContent = 'Sin movimientos';
      elements.kardexState.querySelector('p').textContent =
        'No hay registros para los filtros seleccionados.';
    }
  } catch (error) {
    elements.kardexTableBody.replaceChildren();
    elements.kardexState.querySelector('strong').textContent =
      'No fue posible consultar el kardex';
    elements.kardexState.querySelector('p').textContent = error.message;
  } finally {
    elements.loadKardexButton.disabled = false;
  }
}

function fillInventorySelect(select, placeholder, records, label, value = '') {
  select.replaceChildren(new Option(placeholder, ''));
  for (const record of records) {
    select.append(new Option(label(record), record.id));
  }
  if (records.some((record) => record.id === value)) select.value = value;
}

function syncInventoryIncidentForm() {
  const type = elements.inventoryIncidentType.value;
  const productId = elements.inventoryIncidentProductId.value;
  const currentWarehouse = elements.inventoryIncidentWarehouseId.value;
  const release = type === 'QUARANTINE_RELEASE';
  const customerReturn = type === 'CUSTOMER_RETURN';
  elements.inventoryIncidentDestinationField.hidden = !release;
  elements.inventoryIncidentDestinationId.required = release;
  elements.inventoryIncidentWarehouseLabel.innerHTML = customerReturn
    ? 'Ubicación que recibe <b>*</b>'
    : release
      ? 'Ubicación de cuarentena <b>*</b>'
      : 'Ubicación de origen <b>*</b>';

  let locations;
  if (customerReturn) {
    locations = warehouses.filter((warehouse) =>
      warehouse.active &&
      ['AVAILABLE', 'DISPLAY'].includes(warehouse.warehouse_type));
  } else {
    const allowedType = release ? 'QUARANTINE' : null;
    const unique = new Map();
    inventoryBalances
      .filter((balance) =>
        balance.product_id === productId &&
        Number(balance.available) > 0 &&
        (!allowedType || balance.warehouse_type === allowedType))
      .forEach((balance) => unique.set(balance.warehouse_id, {
        id: balance.warehouse_id,
        name: balance.warehouse_name,
        code: balance.warehouse_code,
        warehouse_type: balance.warehouse_type,
        branch_id: warehouses.find((warehouse) =>
          warehouse.id === balance.warehouse_id)?.branch_id,
      }));
    locations = [...unique.values()];
  }
  fillInventorySelect(
    elements.inventoryIncidentWarehouseId,
    customerReturn ? 'Selecciona dónde ingresa' : 'Selecciona la ubicación',
    locations,
    (warehouse) => `${warehouse.name} · ` +
      `${warehouseTypeLabels[warehouse.warehouse_type] || warehouse.code}`,
    currentWarehouse,
  );
  const source = warehouses.find((warehouse) =>
    warehouse.id === elements.inventoryIncidentWarehouseId.value);
  fillInventorySelect(
    elements.inventoryIncidentDestinationId,
    'Selecciona ubicación disponible',
    warehouses.filter((warehouse) =>
      warehouse.active &&
      warehouse.branch_id === source?.branch_id &&
      ['AVAILABLE', 'DISPLAY'].includes(warehouse.warehouse_type)),
    (warehouse) => `${warehouse.name} · ` +
      `${warehouseTypeLabels[warehouse.warehouse_type] || warehouse.code}`,
  );
  const descriptions = {
    CUSTOMER_RETURN:
      'Las unidades vuelven al saldo disponible. Conserva la referencia de la venta.',
    SUPPLIER_RETURN:
      'Las unidades salen del inventario y quedan vinculadas a la devolución al proveedor.',
    DAMAGE:
      'Las unidades salen de la ubicación operativa e ingresan a una zona de averías separada.',
    LOSS:
      'Las unidades salen definitivamente. Usa este tipo solo con una pérdida confirmada.',
    QUARANTINE:
      'Las unidades se aíslan y dejan de estar disponibles para venta.',
    QUARANTINE_RELEASE:
      'Las unidades salen de cuarentena y vuelven a una ubicación operativa.',
  };
  elements.inventoryIncidentImpact.textContent = descriptions[type] || '';
}

function openInventoryIncidentDialog() {
  if (!products.length || !warehouses.length) {
    showToast('Necesitas productos y ubicaciones activas.');
    return;
  }
  elements.inventoryIncidentForm.reset();
  elements.inventoryIncidentFormError.hidden = true;
  fillInventorySelect(
    elements.inventoryIncidentProductId,
    'Selecciona un producto',
    products,
    (product) => `${product.name} · ${product.sku}`,
  );
  syncInventoryIncidentForm();
  elements.inventoryIncidentDialog.showModal();
  elements.inventoryIncidentType.focus();
}

function closeInventoryIncidentDialog() {
  elements.inventoryIncidentDialog.close();
}

async function submitInventoryIncident(event) {
  event.preventDefault();
  const formData = new FormData(elements.inventoryIncidentForm);
  const payload = Object.fromEntries(formData);
  if (elements.inventoryIncidentDestinationField.hidden) {
    delete payload.destinationWarehouseId;
  }
  elements.inventoryIncidentFormError.hidden = true;
  elements.saveInventoryIncidentButton.disabled = true;
  elements.saveInventoryIncidentButton.textContent = 'Aplicando movimiento…';
  try {
    await getJson('/api/inventory/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    closeInventoryIncidentDialog();
    await loadWarehouses();
    await Promise.all([
      loadInventory(),
      loadPosCatalog().catch(() => []),
      loadCommercialCatalog().catch(() => {}),
    ]);
    showToast('Novedad aplicada al kardex y registrada en auditoría.');
  } catch (error) {
    elements.inventoryIncidentFormError.textContent = error.message;
    elements.inventoryIncidentFormError.hidden = false;
  } finally {
    elements.saveInventoryIncidentButton.disabled = false;
    elements.saveInventoryIncidentButton.textContent = 'Registrar y mover saldo';
  }
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
  const reason = formData.get('reason');
  const evidenceFile = elements.adjustmentEvidenceFile?.files?.[0] || null;
  elements.adjustmentFormError.hidden = true;
  elements.saveAdjustmentButton.disabled = true;
  elements.saveAdjustmentButton.textContent = 'Registrando…';
  try {
    const created = await getJson('/api/inventory/adjustments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        productId: formData.get('productId'),
        warehouseId: formData.get('warehouseId'),
        quantity: signedQuantity,
        reason,
      }),
    });
    // El ajuste ya quedó asentado: si la evidencia falla no se puede revertir
    // ni callar, así que se avisa en lugar de reportar un éxito completo.
    let evidenceWarning = '';
    if (evidenceFile) {
      try {
        await uploadOperationalEvidence({
          file: evidenceFile,
          entityType: 'INVENTORY_ADJUSTMENT',
          entityId: created.movement.id,
          purpose: 'DAMAGE_EVIDENCE',
          note: reason,
        });
      } catch (error) {
        evidenceWarning = ` La foto no se pudo adjuntar: ${error.message}`;
      }
    }
    closeAdjustmentDialog();
    await Promise.all([loadInventory(), loadPosCatalog().catch(() => [])]);
    showToast(`Ajuste registrado con trazabilidad.${evidenceWarning}`);
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
      type: balance.warehouse_type,
    }));
  fillInventorySelect(
    elements.transferSourceWarehouseId,
    'Selecciona origen',
    sources,
    (warehouse) => `${warehouse.name} · ` +
      `${warehouseTypeLabels[warehouse.type] || warehouse.code}`,
  );
  fillInventorySelect(
    elements.transferDestinationWarehouseId,
    'Selecciona destino',
    warehouses.filter((warehouse) => warehouse.active),
    (warehouse) => `${warehouse.name} · ` +
      `${warehouseTypeLabels[warehouse.warehouse_type] || warehouse.code}`,
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

function openTransferDialog(preset = null) {
  const prepared = preset && typeof preset.productId === 'string' ? preset : null;
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
    prepared?.productId,
  );
  syncTransferWarehouses();
  if (prepared) {
    elements.transferSourceWarehouseId.value = prepared.sourceWarehouseId;
    updateTransferAvailability();
    elements.transferDestinationWarehouseId.value = prepared.destinationWarehouseId;
    elements.transferForm.elements.quantity.value = prepared.quantity;
    elements.transferForm.elements.reason.value = prepared.reason;
  }
  elements.transferDialog.showModal();
  (prepared
    ? elements.transferForm.elements.quantity
    : elements.transferProductId).focus();
}

function closeTransferDialog() {
  elements.transferDialog.close();
}

async function submitTransfer(event) {
  event.preventDefault();
  const formData = new FormData(elements.transferForm);
  const requiresReception = formData.has('requiresReception');
  const payload = Object.fromEntries(formData);
  delete payload.requiresReception;
  elements.transferFormError.hidden = true;
  elements.saveTransferButton.disabled = true;
  elements.saveTransferButton.textContent = requiresReception
    ? 'Despachando…'
    : 'Trasladando…';
  try {
    await getJson(
      requiresReception
        ? '/api/inventory/transfer-orders'
        : '/api/inventory/transfers',
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
      },
    );
    closeTransferDialog();
    await loadWarehouses();
    await Promise.all([loadInventory(), loadPosCatalog().catch(() => [])]);
    showToast(requiresReception
      ? 'Despacho registrado. Las unidades quedaron en tránsito.'
      : 'Transferencia completada en ambas bodegas.');
  } catch (error) {
    elements.transferFormError.textContent = error.message;
    elements.transferFormError.hidden = false;
  } finally {
    elements.saveTransferButton.disabled = false;
    elements.saveTransferButton.textContent = 'Confirmar traslado';
  }
}

async function receiveTransferOrder(transferId, button) {
  const receptionNotes = window.prompt(
    'Describe el estado recibido, la persona responsable o cualquier diferencia.',
  )?.trim();
  if (!receptionNotes) return;
  button.disabled = true;
  button.textContent = 'Recibiendo…';
  try {
    await getJson(`/api/inventory/transfer-orders/${transferId}/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ receptionNotes }),
    });
    await Promise.all([loadInventory(), loadPosCatalog().catch(() => [])]);
    showToast('Recepción confirmada y saldo habilitado en el destino.');
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Confirmar recepción';
    showToast(error.message);
  }
}

function openReplenishmentDialog(item) {
  elements.replenishmentForm.reset();
  elements.replenishmentFormError.hidden = true;
  elements.replenishmentProductId.value = item.product_id;
  elements.replenishmentProductName.textContent = item.product_name;
  elements.replenishmentProductSku.textContent = item.sku;
  const branchWarehouses = warehouses.filter((warehouse) =>
    warehouse.active && warehouse.branch_id === item.branch_id);
  fillInventorySelect(
    elements.replenishmentSourceWarehouseId,
    'Selecciona la bodega',
    branchWarehouses.filter((warehouse) => warehouse.warehouse_type === 'AVAILABLE'),
    (warehouse) => `${warehouse.name} · ${warehouse.code}`,
    item.source_warehouse_id,
  );
  fillInventorySelect(
    elements.replenishmentDisplayWarehouseId,
    'Selecciona la exhibición',
    branchWarehouses.filter((warehouse) => warehouse.warehouse_type === 'DISPLAY'),
    (warehouse) => `${warehouse.name} · ${warehouse.code}`,
    item.display_warehouse_id,
  );
  elements.replenishmentMinimumQuantity.value = Number(item.minimum_quantity);
  elements.replenishmentMaximumQuantity.value = Number(item.maximum_quantity);
  elements.replenishmentDialog.showModal();
  elements.replenishmentMinimumQuantity.focus();
}

function closeReplenishmentDialog() {
  elements.replenishmentDialog.close();
}

async function submitReplenishmentRule(event) {
  event.preventDefault();
  const formData = new FormData(elements.replenishmentForm);
  const productId = formData.get('productId');
  elements.replenishmentFormError.hidden = true;
  elements.saveReplenishmentButton.disabled = true;
  elements.saveReplenishmentButton.textContent = 'Guardando…';
  try {
    await getJson(`/api/inventory/replenishments/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        sourceWarehouseId: formData.get('sourceWarehouseId'),
        displayWarehouseId: formData.get('displayWarehouseId'),
        minimumQuantity: Number(formData.get('minimumQuantity')),
        maximumQuantity: Number(formData.get('maximumQuantity')),
      }),
    });
    closeReplenishmentDialog();
    await loadInventory();
    showToast('Niveles de exhibición actualizados.');
  } catch (error) {
    elements.replenishmentFormError.textContent = error.message;
    elements.replenishmentFormError.hidden = false;
  } finally {
    elements.saveReplenishmentButton.disabled = false;
    elements.saveReplenishmentButton.textContent = 'Guardar niveles';
  }
}

function advancedEmptyList(container, message) {
  const empty = document.createElement('p');
  empty.className = 'advanced-record-empty';
  empty.textContent = message;
  container.append(empty);
}

function appendAdvancedRecord(container, { symbol, title, meta, value, action }) {
  const row = document.createElement('article');
  const icon = document.createElement('span');
  icon.textContent = symbol;
  const identity = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = title;
  const detail = document.createElement('small');
  detail.textContent = meta;
  identity.append(name, detail);
  const end = document.createElement('div');
  const amount = document.createElement('strong');
  amount.textContent = value;
  end.append(amount);
  if (action) end.append(action);
  row.append(icon, identity, end);
  container.append(row);
}

function renderAdvancedInventory() {
  const summary = advancedInventory.summary || {};
  elements.advancedLocationCount.textContent = String(summary.locations || 0);
  elements.advancedUnitCount.textContent = String(summary.units || 0);
  elements.advancedLotCount.textContent = String(summary.lots || 0);
  elements.advancedExpiringCount.textContent = String(summary.expiring_lots || 0);
  elements.advancedSerialCount.textContent = String(summary.serials || 0);
  elements.advancedReservedCount.textContent = formatQuantity(summary.reserved_units || 0);
  elements.advancedInventoryAlertBadge.textContent = String(summary.expiring_lots || 0);

  elements.advancedLocationList.replaceChildren();
  elements.advancedLocationRecordCount.textContent =
    String(advancedInventory.locations.length);
  if (!advancedInventory.locations.length) {
    advancedEmptyList(elements.advancedLocationList, 'Aún no hay ubicaciones internas.');
  }
  advancedInventory.locations.slice(0, 12).forEach((location) => {
    appendAdvancedRecord(elements.advancedLocationList, {
      symbol: '⌖',
      title: `${location.warehouse_name} · ${location.code}`,
      meta: [location.zone_type, location.aisle, location.rack, location.level]
        .filter(Boolean).join(' · '),
      value: location.sellable ? 'Vendible' : 'Control',
    });
  });

  const lotAndSerials = [
    ...advancedInventory.lots.map((item) => ({ ...item, recordType: 'LOT' })),
    ...advancedInventory.serials.map((item) => ({ ...item, recordType: 'SERIAL' })),
  ];
  elements.advancedLotList.replaceChildren();
  elements.advancedLotRecordCount.textContent = String(lotAndSerials.length);
  if (!lotAndSerials.length) {
    advancedEmptyList(elements.advancedLotList, 'Sin lotes ni series registrados.');
  }
  lotAndSerials.slice(0, 16).forEach((item) => {
    const isLot = item.recordType === 'LOT';
    appendAdvancedRecord(elements.advancedLotList, {
      symbol: isLot ? 'L' : '#',
      title: `${item.product_name} · ${isLot ? item.lot_number : item.serial_number}`,
      meta: `${item.warehouse_name}${isLot && item.expiration_date
        ? ` · vence ${formatShortDate(item.expiration_date)}` : ''}`,
      value: isLot ? `${formatQuantity(item.on_hand)} und.` : item.status,
    });
  });

  elements.advancedReservationList.replaceChildren();
  const activeReservations = advancedInventory.reservations
    .filter((reservation) => reservation.status === 'ACTIVE');
  elements.advancedReservationRecordCount.textContent = String(activeReservations.length);
  if (!activeReservations.length) {
    advancedEmptyList(elements.advancedReservationList, 'No hay existencias reservadas.');
  }
  activeReservations.forEach((reservation) => {
    const release = document.createElement('button');
    release.type = 'button';
    release.className = 'sync-link';
    release.textContent = 'Liberar';
    release.addEventListener('click', () => releaseInventoryReservation(
      reservation.id,
      release,
    ));
    appendAdvancedRecord(elements.advancedReservationList, {
      symbol: 'R',
      title: reservation.product_name,
      meta: `${reservation.warehouse_name} · ${reservation.reference_type} ${reservation.reference_id}`,
      value: formatQuantity(reservation.quantity),
      action: release,
    });
  });

  elements.advancedClosureList.replaceChildren();
  elements.advancedClosureRecordCount.textContent =
    String(advancedInventory.closures.length);
  if (!advancedInventory.closures.length) {
    advancedEmptyList(elements.advancedClosureList, 'Todavía no hay cierres valorizados.');
  }
  advancedInventory.closures.forEach((closure) => {
    appendAdvancedRecord(elements.advancedClosureList, {
      symbol: '✓',
      title: `Cierre ${formatShortDate(closure.closure_date)}`,
      meta: `${formatQuantity(closure.total_units)} unidades · ${closure.valuation_method}`,
      value: formatCurrency(closure.total_value),
    });
  });

  elements.advancedLabelList.replaceChildren();
  elements.advancedLabelRecordCount.textContent = String(advancedInventory.labels.length);
  if (!advancedInventory.labels.length) {
    advancedEmptyList(elements.advancedLabelList, 'No hay etiquetas preparadas.');
  }
  advancedInventory.labels.slice(0, 12).forEach((label) => {
    appendAdvancedRecord(elements.advancedLabelList, {
      symbol: '▥',
      title: `${label.product_name} · ${label.label_type}`,
      meta: `${label.quantity} etiqueta${Number(label.quantity) === 1 ? '' : 's'} · ${
        formatShortDate(label.requested_at)
      }`,
      value: label.status,
    });
  });

  elements.advancedPermissionList.replaceChildren();
  elements.advancedPermissionRecordCount.textContent =
    String(advancedInventory.permissions.length);
  if (!advancedInventory.permissions.length) {
    advancedEmptyList(
      elements.advancedPermissionList,
      'Sin restricciones particulares; aplican los permisos del rol.',
    );
  }
  advancedInventory.permissions.slice(0, 16).forEach((permission) => {
    const capabilities = [
      permission.can_view && 'Ver',
      permission.can_adjust && 'Ajustar',
      permission.can_dispatch && 'Despachar',
      permission.can_receive && 'Recibir',
      permission.can_sell && 'Vender',
    ].filter(Boolean);
    appendAdvancedRecord(elements.advancedPermissionList, {
      symbol: 'U',
      title: `${permission.user_name} · ${permission.warehouse_name}`,
      meta: capabilities.join(' · ') || 'Sin acciones habilitadas',
      value: 'Activo',
    });
  });
}

async function loadAdvancedInventory() {
  if (
    !activeTenantId ||
    !isTenantModuleEnabled('LOGISTICS') ||
    !hasAnyPermission('inventory.view', 'inventory.adjust')
  ) return null;
  advancedInventory = await getJson('/api/inventory-advanced/overview', {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderAdvancedInventory();
  return advancedInventory;
}

function advancedSelectOptions(items, label) {
  return [
    { value: '', label },
    ...items.map((item) => ({ value: item.id, label: item.label || item.name })),
  ];
}

function createAdvancedField(field) {
  const label = document.createElement('label');
  if (field.wide) label.classList.add('form-span-2');
  const title = document.createElement('span');
  title.textContent = field.label;
  let input;
  if (field.type === 'select') {
    input = document.createElement('select');
    (field.options || []).forEach((option) =>
      input.append(new Option(option.label, option.value)));
  } else if (field.type === 'checkbox') {
    label.className = 'advanced-checkbox';
    input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(field.checked);
  } else {
    input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
    if (field.type !== 'textarea') input.type = field.type || 'text';
    if (field.min != null) input.min = String(field.min);
    if (field.max != null) input.max = String(field.max);
    if (field.step != null) input.step = String(field.step);
    if (field.value != null) input.value = String(field.value);
    if (field.placeholder) input.placeholder = field.placeholder;
  }
  input.name = field.name;
  input.required = Boolean(field.required);
  if (field.type === 'checkbox') {
    const copy = document.createElement('span');
    copy.textContent = field.label;
    label.append(input, copy);
  } else {
    label.append(title, input);
  }
  return label;
}

function advancedInventoryActionConfig(action) {
  const productOptions = advancedSelectOptions(
    products.map((product) => ({
      id: product.id,
      name: `${product.name} · ${product.sku}`,
    })),
    'Selecciona un producto',
  );
  const warehouseOptions = advancedSelectOptions(
    warehouses.filter((warehouse) => warehouse.active).map((warehouse) => ({
      id: warehouse.id,
      name: `${warehouse.name} · ${warehouse.code}`,
    })),
    'Selecciona una bodega',
  );
  const unitOptions = advancedSelectOptions(
    advancedInventory.units.filter((unit) => unit.active).map((unit) => ({
      id: unit.id,
      name: `${unit.name} · ${unit.symbol}`,
    })),
    'Selecciona una unidad',
  );
  const locationOptions = advancedSelectOptions(
    advancedInventory.locations.filter((location) => location.active).map((location) => ({
      id: location.id,
      name: `${location.warehouse_name} · ${location.code}`,
    })),
    'Ubicación general / sin asignar',
  );
  const configs = {
    tracking: {
      title: 'Política del producto',
      copy: 'Define cómo se mide, repone y rastrea esta referencia.',
      fields: [
        { name: 'productId', label: 'Producto', type: 'select', options: productOptions, required: true, wide: true },
        { name: 'baseUomId', label: 'Unidad base', type: 'select', options: unitOptions, required: true },
        { name: 'minimumStock', label: 'Stock mínimo', type: 'number', min: 0, step: .0001, value: 0 },
        { name: 'maximumStock', label: 'Stock máximo', type: 'number', min: 0, step: .0001 },
        { name: 'warrantyDays', label: 'Garantía en días', type: 'number', min: 0, value: 0 },
        { name: 'trackLots', label: 'Controlar por lotes', type: 'checkbox' },
        { name: 'trackExpiration', label: 'Controlar vencimientos', type: 'checkbox' },
        { name: 'trackSerials', label: 'Controlar números de serie', type: 'checkbox' },
      ],
    },
    location: {
      title: 'Nueva ubicación interna',
      copy: 'Construye el mapa físico dentro de una bodega.',
      fields: [
        { name: 'warehouseId', label: 'Bodega', type: 'select', options: warehouseOptions, required: true, wide: true },
        { name: 'code', label: 'Código', required: true, placeholder: 'A-01-02' },
        { name: 'name', label: 'Nombre', required: true, placeholder: 'Pasillo A · Estante 01' },
        { name: 'zoneType', label: 'Tipo de zona', type: 'select', options: [
          { value: 'STORAGE', label: 'Almacenamiento' }, { value: 'PICKING', label: 'Alistamiento' },
          { value: 'RECEIVING', label: 'Recepción' }, { value: 'DISPLAY', label: 'Exhibición' },
          { value: 'QUARANTINE', label: 'Cuarentena' }, { value: 'DAMAGED', label: 'Averías' },
          { value: 'DISPATCH', label: 'Despacho' }, { value: 'RETURNS', label: 'Devoluciones' },
        ] },
        { name: 'aisle', label: 'Pasillo' }, { name: 'rack', label: 'Estante' },
        { name: 'level', label: 'Nivel' }, { name: 'position', label: 'Posición' },
        { name: 'sellable', label: 'Permitir venta desde esta zona', type: 'checkbox' },
      ],
    },
    unit: {
      title: 'Unidad de medida',
      copy: 'Crea una unidad propia y conserva su equivalencia DIAN.',
      fields: [
        { name: 'code', label: 'Código', required: true }, { name: 'name', label: 'Nombre', required: true },
        { name: 'symbol', label: 'Símbolo', required: true },
        { name: 'category', label: 'Categoría', type: 'select', options: [
          { value: 'UNIT', label: 'Unidad' }, { value: 'WEIGHT', label: 'Peso' },
          { value: 'LENGTH', label: 'Longitud' }, { value: 'VOLUME', label: 'Volumen' },
          { value: 'AREA', label: 'Área' }, { value: 'OTHER', label: 'Otra' },
        ] },
        { name: 'dianCode', label: 'Código DIAN' },
        { name: 'allowsDecimals', label: 'Permitir decimales', type: 'checkbox' },
      ],
    },
    conversion: {
      title: 'Conversión comercial',
      copy: 'Relaciona una presentación con la unidad base del producto.',
      fields: [
        { name: 'productId', label: 'Producto', type: 'select', options: productOptions, required: true, wide: true },
        { name: 'uomId', label: 'Presentación', type: 'select', options: unitOptions, required: true },
        { name: 'conversionFactor', label: 'Equivale a unidades base', type: 'number', min: .000001, step: .000001, required: true },
        { name: 'barcode', label: 'Código de barras' }, { name: 'price', label: 'Precio de venta', type: 'number', min: 0 },
        { name: 'purchaseEnabled', label: 'Disponible en compras', type: 'checkbox', checked: true },
        { name: 'saleEnabled', label: 'Disponible en ventas', type: 'checkbox', checked: true },
      ],
    },
    variant: {
      title: 'Nueva variante',
      copy: 'Crea una presentación con identidad y precio propios.',
      fields: [
        { name: 'productId', label: 'Producto padre', type: 'select', options: productOptions, required: true, wide: true },
        { name: 'sku', label: 'SKU de variante', required: true }, { name: 'name', label: 'Nombre', required: true },
        { name: 'barcode', label: 'Código de barras' }, { name: 'attributesText', label: 'Atributos', placeholder: 'Color: azul, Talla: M' },
        { name: 'cost', label: 'Costo', type: 'number', min: 0 }, { name: 'salePrice', label: 'Precio', type: 'number', min: 0 },
      ],
    },
    lot: {
      title: 'Asignar lote',
      copy: 'La cantidad debe existir previamente en la bodega y no estar asignada a otro lote.',
      fields: [
        { name: 'productId', label: 'Producto', type: 'select', options: productOptions, required: true },
        { name: 'warehouseId', label: 'Bodega', type: 'select', options: warehouseOptions, required: true },
        { name: 'locationId', label: 'Ubicación interna', type: 'select', options: locationOptions },
        { name: 'lotNumber', label: 'Número de lote', required: true },
        { name: 'quantity', label: 'Unidades existentes a asignar', type: 'number', min: 0, step: .0001, required: true },
        { name: 'unitCost', label: 'Costo unitario', type: 'number', min: 0, value: 0 },
        { name: 'manufacturingDate', label: 'Fabricación', type: 'date' },
        { name: 'expirationDate', label: 'Vencimiento', type: 'date' },
        { name: 'reason', label: 'Evidencia', wide: true, required: true },
      ],
    },
    serial: {
      title: 'Registrar número de serie',
      copy: 'Identifica una unidad existente para garantía y trazabilidad individual.',
      fields: [
        { name: 'productId', label: 'Producto', type: 'select', options: productOptions, required: true },
        { name: 'warehouseId', label: 'Bodega', type: 'select', options: warehouseOptions, required: true },
        { name: 'locationId', label: 'Ubicación', type: 'select', options: locationOptions },
        { name: 'serialNumber', label: 'Número de serie', required: true },
        { name: 'warrantyUntil', label: 'Garantía hasta', type: 'date' },
        { name: 'notes', label: 'Notas', type: 'textarea', wide: true },
      ],
    },
    reservation: {
      title: 'Reservar existencias',
      copy: 'Las unidades dejan de estar disponibles hasta liberar o cumplir la reserva.',
      fields: [
        { name: 'productId', label: 'Producto', type: 'select', options: productOptions, required: true },
        { name: 'warehouseId', label: 'Bodega', type: 'select', options: warehouseOptions, required: true },
        { name: 'quantity', label: 'Cantidad', type: 'number', min: .0001, step: .0001, required: true },
        { name: 'referenceType', label: 'Origen', type: 'select', options: [
          { value: 'ORDER', label: 'Pedido' }, { value: 'QUOTE', label: 'Cotización' },
          { value: 'TRANSFER', label: 'Transferencia' }, { value: 'MANUAL', label: 'Reserva manual' },
        ] },
        { name: 'referenceId', label: 'Número o referencia', required: true },
        { name: 'expiresAt', label: 'Vence', type: 'datetime-local' },
        { name: 'notes', label: 'Notas', type: 'textarea', wide: true },
      ],
    },
    label: {
      title: 'Preparar etiquetas',
      copy: 'Genera una solicitud imprimible para identificar el inventario.',
      fields: [
        { name: 'productId', label: 'Producto', type: 'select', options: productOptions, required: true, wide: true },
        { name: 'labelType', label: 'Tipo', type: 'select', options: [
          { value: 'PRODUCT', label: 'Producto' }, { value: 'PRICE', label: 'Precio' },
          { value: 'LOT', label: 'Lote' }, { value: 'SERIAL', label: 'Serie' },
        ] },
        { name: 'quantity', label: 'Cantidad de etiquetas', type: 'number', min: 1, max: 1000, value: 1 },
        { name: 'barcodeValue', label: 'Código personalizado', wide: true },
      ],
    },
    permission: {
      title: 'Permiso por bodega',
      copy: 'Asigna capacidades específicas sin ampliar el rol general.',
      fields: [
        { name: 'warehouseId', label: 'Bodega', type: 'select', options: warehouseOptions, required: true },
        { name: 'userId', label: 'Usuario', type: 'select', options: advancedSelectOptions(
          advancedInventory.users.map((user) => ({ id: user.id, name: `${user.full_name} · ${user.role_name}` })),
          'Selecciona un usuario',
        ), required: true },
        { name: 'canView', label: 'Puede consultar', type: 'checkbox', checked: true },
        { name: 'canAdjust', label: 'Puede ajustar', type: 'checkbox' },
        { name: 'canDispatch', label: 'Puede despachar', type: 'checkbox' },
        { name: 'canReceive', label: 'Puede recibir', type: 'checkbox' },
        { name: 'canSell', label: 'Puede vender', type: 'checkbox' },
      ],
    },
    closure: {
      title: 'Cerrar valoración',
      copy: 'Conserva una fotografía de unidades y costo promedio para auditoría.',
      fields: [
        { name: 'closureDate', label: 'Fecha de cierre', type: 'date', value: isoDate(new Date()), required: true },
        { name: 'notes', label: 'Motivo y observaciones', type: 'textarea', required: true, wide: true },
      ],
    },
  };
  return configs[action];
}

function openAdvancedInventoryDialog(action) {
  const config = advancedInventoryActionConfig(action);
  if (!config) return;
  advancedInventoryAction = action;
  elements.advancedInventoryForm.reset();
  elements.advancedInventoryFormError.hidden = true;
  elements.advancedInventoryDialogTitle.textContent = config.title;
  elements.advancedInventoryDialogCopy.textContent = config.copy;
  elements.advancedInventoryFields.replaceChildren(
    ...config.fields.map(createAdvancedField),
  );
  elements.advancedInventoryDialog.showModal();
  elements.advancedInventoryFields.querySelector('input,select,textarea')?.focus();
}

function closeAdvancedInventoryDialog() {
  elements.advancedInventoryDialog.close();
  advancedInventoryAction = null;
}

async function submitAdvancedInventory(event) {
  event.preventDefault();
  const formData = new FormData(elements.advancedInventoryForm);
  const payload = Object.fromEntries(formData);
  elements.advancedInventoryForm.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    payload[input.name] = formData.has(input.name);
  });
  if (advancedInventoryAction === 'variant') {
    payload.attributes = payload.attributesText
      ? { description: payload.attributesText } : {};
    delete payload.attributesText;
  }
  const action = advancedInventoryAction;
  const routes = {
    tracking: { method: 'PATCH', url: `/api/inventory-advanced/products/${payload.productId}/tracking` },
    location: { method: 'POST', url: '/api/inventory-advanced/locations' },
    unit: { method: 'POST', url: '/api/inventory-advanced/units' },
    conversion: { method: 'POST', url: '/api/inventory-advanced/conversions' },
    variant: { method: 'POST', url: '/api/inventory-advanced/variants' },
    lot: { method: 'POST', url: '/api/inventory-advanced/lots' },
    serial: { method: 'POST', url: '/api/inventory-advanced/serials' },
    reservation: { method: 'POST', url: '/api/inventory-advanced/reservations' },
    label: { method: 'POST', url: '/api/inventory-advanced/labels' },
    permission: { method: 'PUT', url: '/api/inventory-advanced/warehouse-permissions' },
    closure: { method: 'POST', url: '/api/inventory-advanced/valuation-closures' },
  };
  if (!routes[action]) return;
  if (action === 'tracking') delete payload.productId;
  elements.advancedInventoryFormError.hidden = true;
  elements.saveAdvancedInventoryButton.disabled = true;
  try {
    await getJson(routes[action].url, {
      method: routes[action].method,
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify(payload),
    });
    closeAdvancedInventoryDialog();
    await Promise.all([loadAdvancedInventory(), loadInventory()]);
    showToast('Control avanzado guardado correctamente.');
  } catch (error) {
    elements.advancedInventoryFormError.textContent = error.message;
    elements.advancedInventoryFormError.hidden = false;
  } finally {
    elements.saveAdvancedInventoryButton.disabled = false;
  }
}

async function releaseInventoryReservation(reservationId, button) {
  button.disabled = true;
  try {
    await getJson(`/api/inventory-advanced/reservations/${reservationId}/release`, {
      method: 'POST',
      headers: { 'x-tenant-id': activeTenantId },
    });
    await Promise.all([loadAdvancedInventory(), loadInventory()]);
    showToast('Reserva liberada y disponibilidad actualizada.');
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

function selectInventoryPanel(panelName) {
  const logisticsPanels = new Set([
    'flow',
    'labels',
    'operations',
    'advanced',
    'configuration',
  ]);
  const section = document.querySelector(
    logisticsPanels.has(panelName) ? '#logistica' : '#inventario',
  );
  if (!section) return;
  section.querySelectorAll('[data-inventory-tab]').forEach((button) => {
    const selected = button.dataset.inventoryTab === panelName;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  section.querySelectorAll('[data-inventory-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.inventoryPanel !== panelName;
  });
  if (panelName === 'advanced' || panelName === 'configuration') {
    loadAdvancedInventory().catch(() => {});
  }
  if (panelName === 'labels') {
    const firstCompleted = logisticsOverview.batches.find((batch) =>
      batch.status === 'COMPLETED');
    if (!logisticsLabelBatchId && firstCompleted) {
      selectLogisticsLabelBatch(firstCompleted.id).catch(() => {});
    } else {
      renderLogisticsLabelCenter();
    }
  }
}

function organizeInventoryModules() {
  const operationsWorkspace = document.querySelector('#inventoryOperationsWorkspace');
  [
    '#inventoryReplenishmentPanel',
    '#inventoryCommandBar',
    '#inventoryIncidentsPanel',
    '#inventoryTransferOrdersPanel',
  ].forEach((selector) => {
    const section = document.querySelector(selector);
    if (section && operationsWorkspace) operationsWorkspace.append(section);
  });

  const configurationActions = document.querySelector('#advancedConfigurationActions');
  const configurationActionNames = new Set([
    'tracking', 'location', 'unit', 'conversion', 'variant',
    'label', 'permission', 'closure',
  ]);
  document.querySelectorAll('[data-advanced-inventory-action]').forEach((button) => {
    if (configurationActionNames.has(button.dataset.advancedInventoryAction)) {
      configurationActions?.append(button);
    }
  });

  const configurationBoard = document.querySelector('#advancedConfigurationBoard');
  ['#advancedLocationsBoard', '#advancedClosuresBoard'].forEach((selector) => {
    const section = document.querySelector(selector);
    if (section && configurationBoard) configurationBoard.append(section);
  });

  const logisticsWorkspace = document.querySelector('#logisticsWorkspace');
  ['labels', 'operations', 'advanced', 'configuration'].forEach((panelName) => {
    const panel = document.querySelector(`[data-inventory-panel="${panelName}"]`);
    if (panel && logisticsWorkspace) logisticsWorkspace.append(panel);
  });
}

organizeInventoryModules();

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

function normalizeCountScanValue(value) {
  return normalizeSearch(value || '').replace(/[^a-z0-9]/g, '');
}

function focusPhysicalCountItem(productId) {
  const card = document.querySelector(`[data-count-product-id="${productId}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => {
    const quantity = card.querySelector('input[type="number"]');
    quantity?.focus();
    quantity?.select();
  }, 220);
}

function revealPhysicalCountScannedItem(value) {
  const scanned = normalizeCountScanValue(value);
  if (!scanned || !selectedPhysicalCount) return;

  const item = selectedPhysicalCount.items.find((candidate) =>
    normalizeCountScanValue(candidate.sku_snapshot) === scanned
    || normalizeCountScanValue(candidate.barcode_snapshot) === scanned,
  );

  if (!item) {
    elements.countProductSearch.value = value.trim();
    renderCountItems();
    showToast('No encontramos una referencia exacta en esta jornada. Revisa el código o usa el buscador.');
    return;
  }

  elements.countProductSearch.value = item.sku_snapshot;
  elements.countItemFilter.value = 'ALL';
  renderCountItems();
  focusPhysicalCountItem(item.product_id);
  showToast(`${item.name_snapshot} listo para registrar.`);
}

function ensurePhysicalCountScanner() {
  let scanner = document.querySelector('#physicalCountScanner');
  if (!scanner) {
    scanner = document.createElement('form');
    scanner.id = 'physicalCountScanner';
    scanner.className = 'count-item-editor count-scan-panel';
    scanner.innerHTML = `
      <label class="form-field">
        <span>Escanear código o SKU</span>
        <input id="physicalCountScanInput" type="search" inputmode="search"
          autocomplete="off" placeholder="Escanea con lector o escribe el código">
      </label>
      <button class="primary-button count-save-item" type="submit">Buscar y registrar</button>
    `;
    scanner.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = scanner.querySelector('#physicalCountScanInput');
      revealPhysicalCountScannedItem(input.value);
      input.value = '';
      input.focus();
    });
    elements.countItemList.before(scanner);
  }

  const isActive = selectedPhysicalCount?.status === 'IN_PROGRESS';
  scanner.hidden = !isActive;
  scanner.querySelector('input').disabled = !isActive;
  scanner.querySelector('button').disabled = !isActive;
}

async function capturePhysicalCountProductImage(item, button) {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/*';
  picker.setAttribute('capture', 'environment');

  picker.addEventListener('change', async () => {
    const file = picker.files?.[0];
    if (!file) return;

    button.disabled = true;
    button.textContent = 'Subiendo foto…';
    try {
      await uploadProductImage(
        item.product_id,
        file,
        item.name_snapshot,
        { makePrimary: true },
      );
      await Promise.all([
        loadPhysicalCountDetail(selectedPhysicalCount.id),
        loadCatalog().catch(() => []),
      ]);
      showToast('Fotografía principal guardada para este producto.');
    } catch (error) {
      showToast(`No fue posible guardar la fotografía: ${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = 'Tomar foto';
    }
  }, { once: true });

  picker.click();
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
    card.dataset.countProductId = item.product_id;
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

      if (!item.image_url) {
        const capture = document.createElement('button');
        capture.type = 'button';
        capture.className = 'secondary-button count-save-item';
        capture.textContent = 'Tomar foto';
        capture.title = 'Tomar una foto o seleccionar una imagen para esta referencia';
        capture.addEventListener('click', () =>
          capturePhysicalCountProductImage(item, capture));
        editor.append(quantityLabel, notesLabel, capture, save);
      } else {
        editor.append(quantityLabel, notesLabel, save);
      }
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
  const evidenceFile = elements.countEvidenceFile?.files?.[0] || null;
  // El archivo viaja aparte por /api/media: dejarlo en el objeto lo
  // serializaría como {} dentro del JSON del conteo.
  const payload = Object.fromEntries(formData);
  delete payload.evidenceFile;
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
      body: JSON.stringify(payload),
    });
    let evidenceWarning = '';
    if (evidenceFile) {
      try {
        await uploadOperationalEvidence({
          file: evidenceFile,
          entityType: 'INVENTORY_COUNT',
          entityId: count.id,
          purpose: 'COUNT_EVIDENCE',
          note: payload.notes || null,
        });
      } catch (error) {
        evidenceWarning = ` La foto no se pudo adjuntar: ${error.message}`;
      }
    }
    closeCountDialog();
    await loadPhysicalCounts();
    await loadPhysicalCountDetail(count.id);
    showToast(`${count.count_number} creado con el saldo esperado.${evidenceWarning}`);
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

function renderElectronicBilling(overview = {}) {
  electronicBillingOverview = overview;
  if (elements.payrollFactusStatus) renderPayrollFactusStatus();
  const account = overview.account;
  const readiness = overview.readiness || {};
  const resolution = (overview.resolutions || []).find((item) =>
    item.active && Number(item.remaining_numbers) > 0) || null;
  elements.billingEnvironmentBadge.textContent = account
    ? `${account.environment} · ${account.provider_code}`
    : 'Sin conexión';
  elements.billingProviderName.textContent =
    account?.display_name || 'Pendiente de seleccionar';
  elements.billingConnectionStatus.textContent =
    account?.connection_status || 'BORRADOR';
  elements.billingProviderEnvironment.textContent = account?.environment || '—';
  elements.billingCredentialsStatus.textContent = account?.credentials_configured ||
    account?.provider_code === 'SANDBOX'
    ? 'Protegidas'
    : 'No configuradas';
  elements.billingLastTest.textContent = account?.last_tested_at
    ? formatShortDate(account.last_tested_at)
    : '—';
  elements.billingConnectionMessage.textContent = account?.last_error ||
    (account?.connection_status === 'READY'
      ? 'La conexión está preparada para recibir un adaptador de transmisión.'
      : 'Puedes usar SANDBOX para verificar el flujo antes de contratar al proveedor.');
  elements.testBillingConnectionButton.disabled = !account;
  Object.entries(readiness).forEach(([key, ready]) => {
    elements.billingReadiness.querySelector(`[data-billing-check="${key}"]`)
      ?.classList.toggle('ready', Boolean(ready));
  });

  elements.billingResolutionName.textContent = resolution
    ? `${resolution.prefix} · ${resolution.number_from}–${resolution.number_to}`
    : 'Sin resolución vigente';
  elements.billingResolutionStatus.textContent = resolution ? 'VIGENTE' : 'PENDIENTE';
  elements.billingResolutionValidity.textContent = resolution
    ? `${formatShortDate(resolution.valid_from)} – ${formatShortDate(resolution.valid_until)}`
    : '—';
  elements.billingResolutionNext.textContent = resolution
    ? `${resolution.prefix}${resolution.current_number}`
    : '—';
  elements.billingResolutionRemaining.textContent =
    String(resolution?.remaining_numbers || 0);

  const diagnostics = overview.diagnostics;
  elements.billingDiagnosticsStrip.hidden = !diagnostics;
  if (diagnostics) {
    elements.billingDiagnosticsLabel.textContent = diagnostics.label || 'DIAGNÓSTICO OPERATIVO';
    elements.billingDiagnosticsSummary.textContent = diagnostics.summary || 'Sin novedades operativas.';
    elements.billingDiagnosticsDetail.textContent = diagnostics.detail || 'La información se actualiza con este tablero.';
  }

  const counts = overview.counts || {};
  elements.billingPendingCount.textContent = String(counts.pending || 0);
  elements.billingAcceptedCount.textContent = String(counts.accepted || 0);
  elements.billingRejectedCount.textContent = String(counts.rejected || 0);
  const contingency = overview.contingency;
  const contingencyOpen = contingency?.status === 'OPEN';
  elements.billingContingencyStrip.hidden = !contingencyOpen;
  elements.billingContingencyButton.hidden = contingencyOpen;
  if (contingencyOpen) {
    elements.billingContingencyReason.textContent = contingency.reason;
    elements.billingContingencyStarted.textContent =
      `Desde ${formatShortDate(contingency.started_at)} · los documentos siguen visibles y pendientes`;
  }
  elements.billingDocumentList.replaceChildren();
  elements.billingDocumentState.hidden = (overview.documents || []).length > 0;
  for (const document of overview.documents || []) {
    const row = window.document.createElement('article');
    row.className = 'billing-document-row';
    const identity = window.document.createElement('div');
    const number = window.document.createElement('strong');
    number.textContent = document.provider_reference
      ? document.provider_reference
      : document.document_number
      ? `${document.prefix || ''}${document.document_number}`
      : `Venta #${document.sequence_number}`;
    const type = window.document.createElement('small');
    type.textContent = document.document_type;
    identity.append(number, type);
    const status = window.document.createElement('div');
    status.append(
      Object.assign(window.document.createElement('span'), { textContent: 'Estado' }),
      Object.assign(window.document.createElement('strong'), {
        textContent: document.transmission_status || document.status,
      }),
    );
    const amount = window.document.createElement('div');
    amount.append(
      Object.assign(window.document.createElement('span'), { textContent: 'Total' }),
      Object.assign(window.document.createElement('strong'), {
        textContent: formatCurrency(document.total),
      }),
    );
    const date = window.document.createElement('div');
    date.append(
      Object.assign(window.document.createElement('span'), { textContent: 'Creado' }),
      Object.assign(window.document.createElement('strong'), {
        textContent: formatShortDate(document.created_at),
      }),
    );
    const queue = window.document.createElement('button');
    queue.type = 'button';
    queue.textContent = 'Preparar envío';
    queue.disabled = !readiness.connectionReady || !readiness.resolutionReady ||
      !['PENDING', 'REJECTED'].includes(document.status);
    queue.addEventListener('click', () => queueElectronicDocument(document.id, queue));
    const actions = window.document.createElement('div');
    actions.className = 'billing-document-actions';
    actions.append(queue);
    if (document.pdf_document_id) {
      const pdf = window.document.createElement('a');
      pdf.className = 'billing-artifact-link';
      pdf.href = `/api/assets/documents/${document.pdf_document_id}`;
      pdf.target = '_blank';
      pdf.rel = 'noopener';
      pdf.textContent = 'Ver PDF';
      actions.append(pdf);
    }
    if (document.xml_document_id) {
      const xml = window.document.createElement('a');
      xml.className = 'billing-artifact-link';
      xml.href = `/api/assets/documents/${document.xml_document_id}`;
      xml.target = '_blank';
      xml.rel = 'noopener';
      xml.textContent = 'Ver XML';
      actions.append(xml);
    }
    if (
      document.status === 'ACCEPTED' &&
      (!document.pdf_document_id || !document.xml_document_id)
    ) {
      const recover = window.document.createElement('button');
      recover.type = 'button';
      recover.className = 'sandbox-process-button';
      recover.textContent = 'Recuperar PDF/XML';
      recover.addEventListener('click', async () => {
        recover.disabled = true;
        recover.textContent = 'Recuperando…';
        try {
          await getJson(
            `/api/electronic-billing/documents/${document.id}/sync-artifacts`,
            {
              method: 'POST',
              headers: { 'x-tenant-id': activeTenantId },
            },
          );
          await loadElectronicBilling();
          showToast('PDF y XML fiscales archivados.');
        } catch (error) {
          recover.disabled = false;
          recover.textContent = 'Reintentar archivos';
          showToast(error.message);
        }
      });
      actions.append(recover);
    }
    const sandboxReady = overview.account?.provider_code === 'SANDBOX' &&
      overview.account?.environment === 'TEST' &&
      ['QUEUED', 'RETRYABLE'].includes(document.transmission_status);
    if (sandboxReady) {
      const process = window.document.createElement('button');
      process.type = 'button';
      process.className = 'sandbox-process-button';
      process.textContent = 'Probar respuesta';
      process.addEventListener('click', () =>
        processSandboxDocument(document.id, process));
      actions.append(process);
    }
    const providerReady = overview.account?.provider_code !== 'SANDBOX' &&
      ['QUEUED', 'RETRYABLE'].includes(document.transmission_status);
    if (providerReady) {
      const process = window.document.createElement('button');
      process.type = 'button';
      process.className = 'sandbox-process-button';
      process.textContent = document.transmission_status === 'RETRYABLE'
        ? 'Reintentar envío'
        : 'Enviar a Factus';
      process.addEventListener('click', () =>
        processElectronicDocument(document.id, process));
      actions.append(process);
    }
    if (document.failure_reason) {
      status.title = document.failure_reason;
    }
    row.append(identity, status, amount, date, actions);
    elements.billingDocumentList.append(row);
  }
}

async function loadElectronicBilling() {
  if (!activeTenantId || !hasAnyPermission('billing.manage')) return null;
  const overview = await getJson('/api/electronic-billing/overview', {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderElectronicBilling(overview);
  return overview;
}

const billingStatusLabels = {
  DRAFT: 'Borrador',
  SENT: 'Enviada al cliente',
  ACCEPTED: 'Aceptado',
  CONFIRMED: 'Confirmado',
  READY_TO_INVOICE: 'Listo para facturar',
  CONVERTED: 'Convertida',
  INVOICED: 'Facturado',
  EXPIRED: 'Vencido',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendiente',
  QUEUED: 'En cola',
  SUBMITTED: 'Enviado',
  REJECTED: 'Rechazado',
};

function billingStatusLabel(status) {
  return billingStatusLabels[status] || status || 'Pendiente';
}

function appendBillingFact(container, label, value) {
  const fact = window.document.createElement('div');
  fact.append(
    Object.assign(window.document.createElement('span'), { textContent: label }),
    Object.assign(window.document.createElement('strong'), { textContent: value }),
  );
  container.append(fact);
}

function renderBillingCommercialDocuments(documents = []) {
  elements.billingCommercialList.replaceChildren();
  elements.billingCommercialState.hidden = documents.length > 0;
  documents.forEach((document) => {
    const row = window.document.createElement('article');
    row.className = 'billing-flow-row';
    const badge = window.document.createElement('span');
    badge.className = `billing-kind ${document.document_type.toLowerCase()}`;
    badge.textContent = document.document_type === 'QUOTE' ? 'COT' : 'PED';
    const identity = window.document.createElement('div');
    identity.className = 'billing-flow-identity';
    identity.append(
      Object.assign(window.document.createElement('strong'), {
        textContent: document.document_number,
      }),
      Object.assign(window.document.createElement('small'), {
        textContent: `${document.customer_name || 'Cliente por definir'} · ${document.branch_name}`,
      }),
    );
    const facts = window.document.createElement('div');
    facts.className = 'billing-flow-facts';
    appendBillingFact(facts, 'Total', formatCurrency(document.total));
    appendBillingFact(facts, 'Estado', billingStatusLabel(document.status));
    appendBillingFact(
      facts,
      document.document_type === 'QUOTE' ? 'Vigencia' : 'Entrega',
      formatShortDate(document.valid_until || document.expected_date),
    );
    const actions = window.document.createElement('div');
    actions.className = 'billing-flow-actions';
    if (
      document.document_type === 'QUOTE' &&
      !['CONVERTED', 'CANCELLED', 'EXPIRED'].includes(document.status)
    ) {
      const convert = window.document.createElement('button');
      convert.type = 'button';
      convert.className = 'billing-action-button';
      convert.textContent = 'Convertir en pedido →';
      convert.addEventListener('click', () => convertQuoteToOrder(document, convert));
      actions.append(convert);
    } else if (document.document_type === 'ORDER' && document.status === 'CONFIRMED') {
      const ready = window.document.createElement('button');
      ready.type = 'button';
      ready.className = 'billing-action-button';
      ready.textContent = 'Aprobar para facturar →';
      ready.addEventListener('click', () => markOrderReady(document, ready));
      actions.append(ready);
    } else if (
      document.document_type === 'ORDER' &&
      document.status === 'READY_TO_INVOICE'
    ) {
      const pos = window.document.createElement('a');
      pos.href = '#caja';
      pos.textContent = 'Ir a Caja & POS →';
      actions.append(pos);
    } else {
      const trace = window.document.createElement('small');
      trace.textContent = document.source_document_number
        ? `Origen: ${document.source_document_number}`
        : `${document.item_count} productos`;
      actions.append(trace);
    }
    row.append(badge, identity, facts, actions);
    elements.billingCommercialList.append(row);
  });
}

function addFiscalLinks(actions, document) {
  [
    ['PDF', document.pdf_url],
    ['XML', document.xml_url],
  ].forEach(([label, url]) => {
    if (!url) return;
    const link = window.document.createElement('a');
    link.href = resolvePublicAsset(url);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    actions.append(link);
  });
}

function renderBillingFiscalDocuments(invoices = [], notes = []) {
  elements.billingFiscalList.replaceChildren();
  const records = [
    ...invoices.map((item) => ({ ...item, fiscalKind: 'INVOICE' })),
    ...notes.map((item) => ({ ...item, fiscalKind: item.note_type })),
  ].sort((left, right) =>
    new Date(right.created_at || right.updated_at) -
    new Date(left.created_at || left.updated_at));
  elements.billingFiscalState.hidden = records.length > 0;
  records.forEach((document) => {
    const row = window.document.createElement('article');
    row.className = 'billing-flow-row fiscal';
    const badge = window.document.createElement('span');
    badge.className = 'billing-kind fiscal';
    badge.textContent = document.fiscalKind === 'INVOICE'
      ? 'FE'
      : document.fiscalKind === 'CREDIT_NOTE' ? 'NC' : 'ND';
    const identity = window.document.createElement('div');
    identity.className = 'billing-flow-identity';
    const documentNumber = document.fiscalKind === 'INVOICE'
      ? (document.document_number
        ? `${document.prefix || ''}${document.document_number}`
        : `Venta #${document.sequence_number}`)
      : `${document.fiscalKind === 'CREDIT_NOTE' ? 'Nota crédito' : 'Nota débito'} · ${document.prefix || ''}${document.document_number || ''}`;
    identity.append(
      Object.assign(window.document.createElement('strong'), {
        textContent: documentNumber,
      }),
      Object.assign(window.document.createElement('small'), {
        textContent: document.customer_name || document.reason || 'Documento electrónico',
      }),
    );
    const facts = window.document.createElement('div');
    facts.className = 'billing-flow-facts';
    appendBillingFact(facts, 'Total', formatCurrency(document.total));
    appendBillingFact(facts, 'Estado', billingStatusLabel(document.status));
    const fiscalCode = document.cufe || document.cude;
    appendBillingFact(
      facts,
      document.fiscalKind === 'INVOICE' ? 'CUFE' : 'CUDE',
      fiscalCode ? `${fiscalCode.slice(0, 12)}…` : 'Aún no emitido',
    );
    const actions = window.document.createElement('div');
    actions.className = 'billing-flow-actions';
    if (fiscalCode) {
      const code = window.document.createElement('button');
      code.type = 'button';
      code.addEventListener('click', () => {
        const fullCode = fiscalCode;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(fullCode)
            .then(() => showToast(`${document.fiscalKind === 'INVOICE' ? 'CUFE' : 'CUDE'} copiado al portapapeles.`))
            .catch(() => showToast(`Código: ${fullCode}`));
        } else {
          showToast(`Código: ${fullCode}`);
        }
      });
      actions.append(code);
    }
    if (document.qr_url) {
      const qr = window.document.createElement('a');
      qr.href = resolvePublicAsset(document.qr_url);
      qr.target = '_blank';
      qr.rel = 'noopener noreferrer';
      qr.textContent = 'Ver QR';
      actions.append(qr);
    }
    addFiscalLinks(actions, document);
    if (
      document.fiscalKind === 'INVOICE' &&
      ['PENDING', 'REJECTED'].includes(document.status)
    ) {
      const queue = window.document.createElement('button');
      queue.type = 'button';
      queue.className = 'billing-action-button';
      queue.textContent = document.status === 'REJECTED' ? 'Reintentar' : 'Preparar envío';
      const readiness = (typeof electronicBillingOverview !== 'undefined' && electronicBillingOverview?.readiness) || { connectionReady: true, resolutionReady: true };
      queue.disabled = !readiness.connectionReady || !readiness.resolutionReady;
      queue.addEventListener('click', () => queueElectronicDocument(document.id, queue));
      actions.append(queue);
    }
    const isQueued = ['QUEUED', 'RETRYABLE'].includes(document.transmission_status || document.status);
    if (document.fiscalKind === 'INVOICE' && isQueued) {
      const account = (typeof electronicBillingOverview !== 'undefined' && electronicBillingOverview?.account) || null;
      if (account?.provider_code === 'SANDBOX') {
        const process = window.document.createElement('button');
        process.type = 'button';
        process.className = 'sandbox-process-button';
        process.textContent = 'Probar respuesta';
        process.addEventListener('click', () => processSandboxDocument(document.id, process));
        actions.append(process);
      } else {
        const process = window.document.createElement('button');
        process.type = 'button';
        process.className = 'sandbox-process-button';
        process.textContent = (document.transmission_status || document.status) === 'RETRYABLE'
          ? 'Reintentar envío'
          : 'Enviar a Factus';
        process.addEventListener('click', () => processElectronicDocument(document.id, process));
        actions.append(process);
      }
    }
    if (
      document.fiscalKind !== 'INVOICE' &&
      ['PENDING', 'REJECTED'].includes(document.status)
    ) {
      const queue = window.document.createElement('button');
      queue.type = 'button';
      queue.className = 'billing-action-button';
      queue.textContent = document.status === 'REJECTED' ? 'Reintentar' : 'Preparar envío';
      queue.addEventListener('click', () => queueBillingNote(document.id, queue));
      actions.append(queue);
    }
    if (!actions.children.length) {
      actions.append(Object.assign(window.document.createElement('small'), {
        textContent: document.status === 'ACCEPTED'
          ? 'Esperando archivos del proveedor'
          : 'Sin representación fiscal todavía',
      }));
    }
    row.append(badge, identity, facts, actions);
    elements.billingFiscalList.append(row);
  });
}

function renderBillingWorkflow(overview = {}) {
  billingWorkflowOverview = overview;
  const counts = overview.counts || {};
  elements.billingFlowQuoteCount.textContent = String(counts.open_quotes || 0);
  elements.billingFlowOrderCount.textContent = String(counts.open_orders || 0);
  elements.billingFlowNoteCount.textContent = String(counts.pending_notes || 0);
  elements.billingFlowAcceptedCount.textContent = String(
    (overview.invoices || []).filter((invoice) => invoice.status === 'ACCEPTED').length,
  );
  renderBillingCommercialDocuments(overview.documents || []);
  renderBillingFiscalDocuments(overview.invoices || [], overview.notes || []);
  elements.newBillingNoteButton.disabled =
    !(overview.invoices || []).some((invoice) => invoice.status === 'ACCEPTED');
}

async function loadBillingWorkflow() {
  if (!activeTenantId || !hasAnyPermission('billing.manage')) return null;
  const overview = await getJson('/api/billing-workflow/overview', {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderBillingWorkflow(overview);
  return overview;
}

function quoteProductOptions(selected = '') {
  const fragment = window.document.createDocumentFragment();
  const placeholder = window.document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona un producto';
  fragment.append(placeholder);
  products.filter((product) => product.active !== false).forEach((product) => {
    const option = window.document.createElement('option');
    option.value = product.id;
    option.textContent = `${product.name} · ${product.sku} · ${formatCurrency(product.sale_price)}`;
    option.selected = product.id === selected;
    fragment.append(option);
  });
  return fragment;
}

function addQuoteItemRow(selectedProductId = '') {
  const row = window.document.createElement('div');
  row.className = 'quote-item-row';
  const product = window.document.createElement('select');
  product.required = true;
  product.className = 'quote-product';
  product.append(quoteProductOptions(selectedProductId));
  const quantity = window.document.createElement('input');
  quantity.type = 'number';
  quantity.className = 'quote-quantity';
  quantity.min = '0.0001';
  quantity.step = '0.0001';
  quantity.value = '1';
  quantity.required = true;
  const remove = window.document.createElement('button');
  remove.type = 'button';
  remove.className = 'icon-button';
  remove.setAttribute('aria-label', 'Quitar línea');
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    if (elements.quoteItems.children.length > 1) row.remove();
  });
  row.append(product, quantity, remove);
  elements.quoteItems.append(row);
}

function fillQuoteSources() {
  elements.quoteBranchId.replaceChildren();
  branches.filter((branch) => branch.active !== false).forEach((branch) => {
    const option = window.document.createElement('option');
    option.value = branch.id;
    option.textContent = `${branch.name} · ${branch.code}`;
    elements.quoteBranchId.append(option);
  });
  elements.quoteCustomerId.replaceChildren(
    Object.assign(window.document.createElement('option'), {
      value: '',
      textContent: 'Consumidor final / por definir',
    }),
  );
  const customerMap = new Map(
    [...receivableCustomers, ...posCustomers].map((customer) => [customer.id, customer]),
  );
  customerMap.forEach((customer) => {
    const option = window.document.createElement('option');
    option.value = customer.id;
    option.textContent = customer.name;
    elements.quoteCustomerId.append(option);
  });
}

function openQuoteDialog() {
  if (!branches.length || !products.length) {
    showToast('Necesitas al menos una sucursal y un producto configurado.');
    return;
  }
  elements.quoteForm.reset();
  elements.quoteFormError.hidden = true;
  elements.quoteItems.replaceChildren();
  fillQuoteSources();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 15);
  elements.quoteValidUntil.value = isoDate(validUntil);
  addQuoteItemRow();
  elements.quoteDialog.showModal();
}

function closeQuoteDialog() {
  elements.quoteDialog.close();
}

async function submitQuote(event) {
  event.preventDefault();
  const formData = new FormData(elements.quoteForm);
  const items = [...elements.quoteItems.querySelectorAll('.quote-item-row')]
    .map((row) => ({
      productId: row.querySelector('.quote-product').value,
      quantity: Number(row.querySelector('.quote-quantity').value),
    }));
  elements.saveQuoteButton.disabled = true;
  elements.quoteFormError.hidden = true;
  try {
    await getJson('/api/billing-workflow/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        branchId: formData.get('branchId'),
        customerId: formData.get('customerId') || null,
        validUntil: formData.get('validUntil'),
        notes: formData.get('notes'),
        items,
      }),
    });
    closeQuoteDialog();
    await loadBillingWorkflow();
    showToast('Cotización creada sin consumir numeración fiscal.');
  } catch (error) {
    elements.quoteFormError.textContent = error.message;
    elements.quoteFormError.hidden = false;
  } finally {
    elements.saveQuoteButton.disabled = false;
  }
}

async function convertQuoteToOrder(document, button) {
  button.disabled = true;
  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 7);
  try {
    await getJson(`/api/billing-workflow/quotes/${document.id}/convert-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ expectedDate: isoDate(expectedDate) }),
    });
    await loadBillingWorkflow();
    showToast(`${document.document_number} convertida en pedido.`);
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
  }
}

async function markOrderReady(document, button) {
  button.disabled = true;
  try {
    await getJson(`/api/billing-workflow/orders/${document.id}/ready-to-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ reason: 'Pedido comercial revisado antes de facturar' }),
    });
    await loadBillingWorkflow();
    showToast(`${document.document_number} quedó listo para facturar.`);
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
  }
}

function openBillingNoteDialog() {
  const accepted = (billingWorkflowOverview.invoices || [])
    .filter((invoice) => invoice.status === 'ACCEPTED');
  if (!accepted.length) {
    showToast('No hay facturas electrónicas aceptadas para ajustar.');
    return;
  }
  elements.billingNoteForm.reset();
  elements.billingNoteFormError.hidden = true;
  elements.billingNoteDocumentId.replaceChildren();
  accepted.forEach((invoice) => {
    const option = window.document.createElement('option');
    option.value = invoice.id;
    option.textContent = `${invoice.prefix || ''}${invoice.document_number || invoice.sequence_number} · ${formatCurrency(invoice.total)}`;
    elements.billingNoteDocumentId.append(option);
  });
  loadBillingNoteItems(elements.billingNoteDocumentId.value);
  elements.billingNoteDialog.showModal();
}

function refreshBillingNoteTotal() {
  const lines = [...elements.billingNoteItems.querySelectorAll('[data-note-sale-item]')];
  const total = lines.reduce((sum, line) => {
    const checked = line.querySelector('input[type="checkbox"]')?.checked;
    const quantity = Number(line.querySelector('input[type="number"]')?.value || 0);
    const unitTotal = Number(line.dataset.unitTotal || 0);
    return checked ? sum + (quantity * unitTotal) : sum;
  }, 0);
  elements.billingNoteForm.elements.total.value = total ? String(Math.round(total * 100) / 100) : '';
}

async function loadBillingNoteItems(documentId) {
  elements.billingNoteItems.textContent = 'Cargando productos facturados…';
  try {
    const items = await getJson(`/api/billing-workflow/documents/${documentId}/adjustment-items`, {
      headers: { 'x-tenant-id': activeTenantId },
    });
    elements.billingNoteItems.replaceChildren();
    const title = window.document.createElement('span');
    title.textContent = 'Productos y cantidades a ajustar *';
    elements.billingNoteItems.append(title);
    items.forEach((item) => {
      const row = window.document.createElement('label');
      row.dataset.noteSaleItem = item.sale_item_id;
      row.dataset.unitTotal = String(Number(item.line_total) / Number(item.quantity));
      row.innerHTML = `<input type="checkbox" checked> <b>${escapeHtml(item.name_snapshot)}</b> · ${escapeHtml(item.sku_snapshot)} <input type="number" min="0.0001" max="${item.quantity}" step="0.0001" value="${item.quantity}">`;
      row.querySelectorAll('input').forEach((input) => input.addEventListener('input', refreshBillingNoteTotal));
      elements.billingNoteItems.append(row);
    });
    refreshBillingNoteTotal();
  } catch (error) {
    elements.billingNoteItems.textContent = error.message;
  }
}

function closeBillingNoteDialog() {
  elements.billingNoteDialog.close();
}

async function submitBillingNote(event) {
  event.preventDefault();
  const formData = new FormData(elements.billingNoteForm);
  elements.saveBillingNoteButton.disabled = true;
  elements.billingNoteFormError.hidden = true;
  try {
    await getJson('/api/billing-workflow/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        originalDocumentId: formData.get('originalDocumentId'),
        noteType: formData.get('noteType'),
        reasonCode: formData.get('reasonCode'),
        reason: formData.get('reason'),
        items: [...elements.billingNoteItems.querySelectorAll('[data-note-sale-item]')]
          .filter((line) => line.querySelector('input[type="checkbox"]')?.checked)
          .map((line) => ({
            saleItemId: line.dataset.noteSaleItem,
            quantity: Number(line.querySelector('input[type="number"]')?.value),
          })),
      }),
    });
    closeBillingNoteDialog();
    await loadBillingWorkflow();
    showToast('Nota creada y vinculada a la factura original.');
  } catch (error) {
    elements.billingNoteFormError.textContent = error.message;
    elements.billingNoteFormError.hidden = false;
  } finally {
    elements.saveBillingNoteButton.disabled = false;
  }
}

async function queueBillingNote(noteId, button) {
  button.disabled = true;
  try {
    await getJson(`/api/billing-workflow/notes/${noteId}/queue`, {
      method: 'POST',
      headers: { 'x-tenant-id': activeTenantId },
    });
    await loadBillingWorkflow();
    showToast('Nota preparada para transmisión.');
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
  }
}

function openBillingConnectionDialog() {
  const account = electronicBillingOverview?.account;
  elements.billingConnectionForm.reset();
  elements.billingConnectionFormError.hidden = true;
  elements.billingProviderCode.value = account?.provider_code || 'FACTUS';
  elements.billingProviderDisplayName.value =
    account?.display_name || 'Factus API V2';
  elements.billingProviderEnvironmentInput.value = account?.environment || 'TEST';
  elements.billingProviderBaseUrl.value = account?.base_url || '';
  syncBillingProviderFields();
  elements.billingConnectionDialog.showModal();
  elements.billingProviderCode.focus();
}

function syncBillingProviderFields() {
  const isFactus = elements.billingProviderCode.value === 'FACTUS';
  const environment = elements.billingProviderEnvironmentInput.value || 'TEST';
  elements.factusCredentialFields.hidden = !isFactus;
  if (isFactus) {
    elements.billingProviderDisplayName.value =
      elements.billingProviderDisplayName.value === 'Simulador Nubixor'
        ? 'Factus API V2'
        : elements.billingProviderDisplayName.value;
    elements.billingProviderBaseUrl.value = environment === 'PRODUCTION'
      ? 'https://api.factus.com.co'
      : 'https://api-sandbox.factus.com.co';
    elements.billingProviderBaseUrl.readOnly = true;
  } else {
    elements.billingProviderDisplayName.value =
      elements.billingProviderDisplayName.value === 'Factus API V2'
        ? 'Simulador Nubixor'
        : elements.billingProviderDisplayName.value;
    elements.billingProviderBaseUrl.value = '';
    elements.billingProviderBaseUrl.readOnly = false;
  }
}

function closeBillingConnectionDialog() {
  elements.billingConnectionDialog.close();
}

async function saveBillingConnection(event) {
  event.preventDefault();
  const formData = new FormData(elements.billingConnectionForm);
  let credentials;
  if (formData.get('providerCode') === 'FACTUS') {
    const credentialValues = {
      username: formData.get('factusUsername').trim(),
      password: formData.get('factusPassword').trim(),
      client_id: formData.get('factusClientId').trim(),
      client_secret: formData.get('factusClientSecret').trim(),
    };
    const providedCount = Object.values(credentialValues).filter(Boolean).length;
    if (providedCount > 0 && providedCount < 4) {
      elements.billingConnectionFormError.textContent =
        'Para cambiar las credenciales pega los cuatro datos de Factus.';
      elements.billingConnectionFormError.hidden = false;
      return;
    }
    credentials = providedCount === 4 ? credentialValues : undefined;
  }
  elements.saveBillingConnectionButton.disabled = true;
  elements.billingConnectionFormError.hidden = true;
  try {
    await getJson('/api/electronic-billing/connection', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        providerCode: formData.get('providerCode'),
        displayName: formData.get('displayName'),
        environment: formData.get('environment'),
        baseUrl: formData.get('baseUrl'),
        ...(credentials ? { credentials } : {}),
      }),
    });
    closeBillingConnectionDialog();
    await loadElectronicBilling();
    showToast('Conexión guardada sin exponer credenciales.');
  } catch (error) {
    elements.billingConnectionFormError.textContent = error.message;
    elements.billingConnectionFormError.hidden = false;
  } finally {
    elements.saveBillingConnectionButton.disabled = false;
  }
}

async function testBillingConnection() {
  elements.testBillingConnectionButton.disabled = true;
  elements.testBillingConnectionButton.textContent = 'Probando…';
  try {
    await getJson('/api/electronic-billing/connection/test', {
      method: 'POST',
      headers: { 'x-tenant-id': activeTenantId },
    });
    await loadElectronicBilling();
    showToast('Conexión de prueba verificada.');
  } catch (error) {
    showToast(error.message);
    await loadElectronicBilling().catch(() => {});
  } finally {
    elements.testBillingConnectionButton.disabled = false;
    elements.testBillingConnectionButton.textContent = 'Probar conexión';
  }
}

function factusRangeRows(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function factusDate(value) {
  if (!value) return '';
  const normalized = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

async function loadFactusRangesIntoDialog() {
  elements.factusNumberingRangeSelect.replaceChildren(
    new Option('Selecciona un rango real…', ''),
  );
  try {
    const payload = await getJson('/api/electronic-billing/factus/numbering-ranges', {
      headers: { 'x-tenant-id': activeTenantId },
    });
    const ranges = factusRangeRows(payload);
    for (const range of ranges) {
      const documentCode = range.document?.code || range.document_code || range.document;
      const option = new Option(
        `${range.prefix || 'Sin prefijo'} · ${range.from || range.number_from}–${range.to || range.number_to} · ${documentCode || 'documento'}`,
        String(range.id),
      );
      option._factusRange = range;
      elements.factusNumberingRangeSelect.add(option);
    }
    if (!ranges.length) {
      elements.factusNumberingRangeSelect.add(
        new Option('La cuenta no devolvió rangos activos', ''),
      );
    }
  } catch (error) {
    elements.factusNumberingRangeSelect.add(
      new Option(`No fue posible consultar: ${error.message}`, ''),
    );
  }
}

function applySelectedFactusRange() {
  const option = elements.factusNumberingRangeSelect.selectedOptions[0];
  const range = option?._factusRange;
  if (!range) return;
  const form = elements.billingResolutionForm.elements;
  form.providerNumberingRangeId.value = range.id || '';
  form.providerDocumentCode.value =
    range.document?.code || range.document_code || range.document || '';
  form.prefix.value = range.prefix || '';
  form.numberFrom.value = range.from || range.number_from || '';
  form.numberTo.value = range.to || range.number_to || '';
  form.validFrom.value = factusDate(range.start_date || range.valid_from);
  form.validUntil.value = factusDate(range.end_date || range.valid_until);
}

function openBillingResolutionDialog() {
  elements.billingResolutionForm.reset();
  elements.billingResolutionFormError.hidden = true;
  fillInventorySelect(
    elements.billingResolutionBranchId,
    'Selecciona una sucursal',
    branches.filter((branch) => branch.active),
    (branch) => `${branch.name} · ${branch.code}`,
  );
  const usesFactus = electronicBillingOverview?.account?.provider_code === 'FACTUS';
  elements.factusRangeField.hidden = !usesFactus;
  if (usesFactus) loadFactusRangesIntoDialog();
  elements.billingResolutionDialog.showModal();
  elements.billingResolutionBranchId.focus();
}

function closeBillingResolutionDialog() {
  elements.billingResolutionDialog.close();
}

async function saveBillingResolution(event) {
  event.preventDefault();
  const formData = new FormData(elements.billingResolutionForm);
  elements.saveBillingResolutionButton.disabled = true;
  elements.billingResolutionFormError.hidden = true;
  try {
    const payload = Object.fromEntries(formData);
    const selectedRange =
      elements.factusNumberingRangeSelect.selectedOptions[0]?._factusRange;
    if (selectedRange) payload.providerSnapshot = selectedRange;
    await getJson('/api/electronic-billing/resolutions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify(payload),
    });
    closeBillingResolutionDialog();
    await Promise.all([loadElectronicBilling(), loadPos()]);
    showToast('Resolución registrada para la empresa activa.');
  } catch (error) {
    elements.billingResolutionFormError.textContent = error.message;
    elements.billingResolutionFormError.hidden = false;
  } finally {
    elements.saveBillingResolutionButton.disabled = false;
  }
}

async function queueElectronicDocument(documentId, button) {
  button.disabled = true;
  button.textContent = 'Procesando…';
  try {
    await getJson(`/api/electronic-billing/documents/${documentId}/queue`, {
      method: 'POST',
      headers: { 'x-tenant-id': activeTenantId },
    });
    
    button.textContent = 'Emitiendo DIAN…';
    const account = (typeof electronicBillingOverview !== 'undefined' && electronicBillingOverview?.account) || null;
    const isSandbox = account?.provider_code === 'SANDBOX';
    
    if (isSandbox) {
      await getJson(`/api/electronic-billing/documents/${documentId}/process-sandbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ outcome: 'ACCEPTED' }),
      });
    } else {
      await getJson(`/api/electronic-billing/documents/${documentId}/process`, {
        method: 'POST',
        headers: { 'x-tenant-id': activeTenantId },
      });
    }
    
    await Promise.all([
      loadElectronicBilling().catch(() => {}),
      loadBillingWorkflow().catch(() => {})
    ]);
    showToast('Factura emitida y aceptada con éxito.');
  } catch (error) {
    showToast(error.message);
    await Promise.all([
      loadElectronicBilling().catch(() => {}),
      loadBillingWorkflow().catch(() => {})
    ]);
  }
}

async function processSandboxDocument(documentId, button) {
  button.disabled = true;
  button.textContent = 'Procesando…';
  try {
    await getJson(
      `/api/electronic-billing/documents/${documentId}/process-sandbox`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ outcome: 'ACCEPTED' }),
      },
    );
    await Promise.all([
      loadElectronicBilling().catch(() => {}),
      loadBillingWorkflow().catch(() => {})
    ]);
    showToast('Respuesta SANDBOX registrada. No representa aceptación DIAN.');
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
    button.textContent = 'Probar respuesta';
  }
}

async function processElectronicDocument(documentId, button) {
  button.disabled = true;
  button.textContent = 'Transmitiendo…';
  try {
    await getJson(
      `/api/electronic-billing/documents/${documentId}/process`,
      {
        method: 'POST',
        headers: { 'x-tenant-id': activeTenantId },
      },
    );
    await Promise.all([
      loadElectronicBilling().catch(() => {}),
      loadBillingWorkflow().catch(() => {})
    ]);
    showToast('La respuesta de Factus quedó registrada y auditada.');
  } catch (error) {
    showToast(error.message);
    await Promise.all([
      loadElectronicBilling().catch(() => {}),
      loadBillingWorkflow().catch(() => {})
    ]);
  }
}

async function startBillingContingency() {
  const reason = window.prompt(
    'Describe la causa verificable: caída del proveedor, conectividad o indisponibilidad técnica.',
  )?.trim();
  if (!reason) return;
  try {
    await getJson('/api/electronic-billing/contingencies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ reason }),
    });
    await loadElectronicBilling();
    showToast('Contingencia abierta y registrada en auditoría.');
  } catch (error) {
    showToast(error.message);
  }
}

async function closeBillingContingency() {
  const contingency = electronicBillingOverview?.contingency;
  if (!contingency || contingency.status !== 'OPEN') return;
  const resolutionNotes = window.prompt(
    'Indica cómo se restableció el servicio y qué documentos quedan por transmitir.',
  )?.trim();
  if (!resolutionNotes) return;
  try {
    await getJson(
      `/api/electronic-billing/contingencies/${contingency.id}/close`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({ resolutionNotes }),
      },
    );
    await loadElectronicBilling();
    showToast('Contingencia cerrada con evidencia de resolución.');
  } catch (error) {
    showToast(error.message);
  }
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
    showThirdPartiesError('Primero debes registrar o seleccionar una empresa.');
    showPurchasesError('Primero debes registrar o seleccionar una empresa.');
    showPayablesError('Primero debes registrar o seleccionar una empresa.');
    showExpensesError('Primero debes registrar o seleccionar una empresa.');
    showUsersError('Primero debes registrar o seleccionar una empresa.');
    showPosError('Primero debes registrar o seleccionar una empresa.');
    showReceivableError('Primero debes registrar o seleccionar una empresa.');
    showAuditError('Primero debes registrar o seleccionar una empresa.');
    showReportsError('Primero debes registrar o seleccionar una empresa.');
    showCommercialPlanningError('Primero debes registrar o seleccionar una empresa.');
    setExecutiveSummary();
    setMetric(elements.branchCount, elements.branchDetail, { status: 'rejected' }, ['sucursal', 'sucursales']);
    setMetric(elements.warehouseCount, elements.warehouseDetail, { status: 'rejected' }, ['bodega registrada', 'bodegas registradas']);
    setMetric(elements.productCount, elements.productDetail, { status: 'rejected' }, ['producto registrado', 'productos registrados']);
    return;
  }

  if (hasAnyPermission(
    'inventory.view',
    'inventory.adjust',
    'logistics.view',
    'users.manage',
  )) {
    try {
      await loadTenantModules();
    } catch (error) {
      elements.moduleSettingMessage.textContent =
        `No fue posible consultar los módulos: ${error.message}`;
      elements.moduleSettingMessage.hidden = false;
    }
  }

  const results = await Promise.allSettled([
    hasAnyPermission(
      'dashboard.view',
      'branches.manage',
      'inventory.view',
      'sales.operate',
      'billing.manage',
    )
      ? loadBranches() : Promise.resolve([]),
    hasAnyPermission('inventory.view', 'warehouse.view', 'warehouses.manage', 'purchase.view', 'purchases.manage', 'pos.use', 'sales.operate')
      ? loadWarehouses() : Promise.resolve([]),
    hasAnyPermission('inventory.view', 'inventory.count.view', 'inventory.adjust')
      ? loadInventory() : Promise.resolve([]),
    hasAnyPermission('inventory.view', 'inventory.count.view', 'inventory.adjust')
      ? loadPhysicalCounts() : Promise.resolve([]),
    hasAnyPermission(
      'inventory.view',
      'product.view',
      'catalog.manage',
      'purchases.manage',
      'sales.operate',
      'billing.manage',
    )
      ? loadCatalog() : Promise.resolve([]),
    hasAnyPermission('purchase.view', 'purchases.manage') ? loadPurchases() : Promise.resolve([]),
    hasAnyPermission('payable.view', 'payables.manage') ? loadPayables() : Promise.resolve([]),
    hasAnyPermission('expenses.view', 'expenses.manage', 'expenses.approve', 'expenses.pay')
      ? loadExpenses() : Promise.resolve([]),
    hasAnyPermission('pos.use', 'sales.operate') ? loadPos() : Promise.resolve([]),
    hasAnyPermission('receivable.view', 'receivables.manage') ? loadReceivables() : Promise.resolve([]),
    hasAnyPermission('user.view', 'users.manage') ? loadUsers() : Promise.resolve([]),
    hasAnyPermission('dashboard.view') ? loadExecutiveSummary() : Promise.resolve({}),
    hasAnyPermission('audit.view') && !activeMembership()?.branchId
      ? loadAudit() : Promise.resolve({}),
    hasAnyPermission('reports.view') ? loadReports() : Promise.resolve({}),
    hasAnyPermission('billing.view', 'billing.manage') ? loadElectronicBilling() : Promise.resolve({}),
    hasAnyPermission('billing.view', 'billing.manage') ? loadBillingWorkflow() : Promise.resolve({}),
    hasAnyPermission(
      'commercial.view',
      'marketing.budget.view',
      'marketing.campaign.view',
      'commercial_planning.view',
      'commercial_planning.manage',
      'commercial_planning.marketing',
      'commercial_planning.supervise',
      'reports.view',
      'sales.operate',
    )
      ? loadCommercialPlanning() : Promise.resolve({}),
    hasAnyPermission('parties.view', 'parties.manage')
      ? loadThirdParties() : Promise.resolve([]),
    isTenantModuleEnabled('LOGISTICS') &&
      hasAnyPermission('inventory.view', 'inventory.adjust')
      ? loadAdvancedInventory() : Promise.resolve({}),
    isTenantModuleEnabled('LOGISTICS') && hasAnyPermission('logistics.view')
      ? loadLogisticsOverview() : Promise.resolve({}),
    isTenantModuleEnabled('PAYROLL') && hasAnyPermission('payroll.view', 'payroll.manage', 'payroll.approve')
      ? loadPayroll() : Promise.resolve([]),
    hasAnyPermission('dashboard.view') ? loadOnboardingStatus() : Promise.resolve(null),
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
      `nubixor-${activeReportType}.csv`;
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

const auditLabelOverrides = {
  // Acciones: conservamos los códigos en la API, pero mostramos una descripción
  // clara para el equipo que revisa la bitácora.
  'accounting.entry_posted': 'Comprobante contable registrado',
  'accounting.entry_reversed': 'Comprobante contable reversado',
  'accounting.period_permanently_locked': 'Período bloqueado definitivamente',
  'audit_control_run.sealed': 'Control de auditoría sellado',
  'billing.adjustment_note_queued': 'Nota de ajuste puesta en cola',
  'billing.order_ready_to_invoice': 'Pedido listo para facturar',
  'billing.quote_converted_to_order': 'Cotización convertida en pedido',
  'catalog.bulk_imported': 'Carga masiva de catálogo',
  'electronic_billing.document_queued': 'Documento electrónico puesto en cola',
  'electronic_billing.connection_tested': 'Conexión de facturación probada',
  'electronic_billing.resolutions_auto_synced': 'Resoluciones sincronizadas automáticamente',
  'expense.payment_created': 'Pago de gasto registrado',
  'inventory.adjustment_created': 'Ajuste de inventario registrado',
  'inventory.transfer_dispatched': 'Transferencia de inventario despachada',
  'inventory.transfer_received': 'Transferencia de inventario recibida',
  'inventory_count.completed': 'Conteo físico completado',
  'inventory_count.created': 'Conteo físico creado',
  'payable.invoice_created': 'Cuenta por pagar creada',
  'payroll.employee_created': 'Colaborador creado',
  'payroll.period_approved': 'Período de nómina aprobado',
  'product.combo.assembled': 'Combo armado',
  'product.combo.configured': 'Combo configurado',
  'product.variant.created': 'Variante de producto creada',
  'receivable.invoice_created': 'Cuenta por cobrar creada',
  'receivable.payment_recorded': 'Abono registrado',
  'sale.completed': 'Venta completada',
  'cash.session_opened': 'Turno de caja abierto',
  'cash.session_closed': 'Turno de caja cerrado',
  'user.sessions_revoked': 'Sesiones de usuario revocadas',
};

const auditWordMap = {
  account: 'cuenta', accounts: 'cuentas', action: 'acción', actions: 'acciones',
  active: 'activo', approved: 'aprobado', archived: 'archivado', assigned: 'asignado',
  before: 'antes', branch: 'sucursal', company: 'empresa', completed: 'completado',
  closed: 'cerrado', fail: 'fallido', failed: 'fallido', hash: 'huella',
  configuration: 'configuración', created: 'creado', date: 'fecha', deleted: 'eliminado',
  description: 'descripción', document: 'documento', email: 'correo', entity: 'módulo',
  event: 'evento', eventHash: 'huella del evento', failed: 'fallido', id: 'identificador',
  invoice: 'factura', inventory: 'inventario', item: 'ítem', last: 'último', metadata: 'metadatos', movement: 'movimiento',
  name: 'nombre', note: 'nota', number: 'número', old: 'anterior', order: 'pedido',
  payment: 'pago', pending: 'pendiente', period: 'período', product: 'producto',
  pass: 'correcto', reason: 'motivo', received: 'recibido', reference: 'referencia', resolution: 'resolución',
  role: 'rol', sale: 'venta', session: 'turno', status: 'estado', stock: 'existencias',
  tax: 'impuesto', tenant: 'empresa', time: 'hora', total: 'total', transfer: 'transferencia',
  updated: 'actualizado', user: 'usuario', valuation: 'valoración', value: 'valor', warning: 'advertencia', warehouse: 'bodega',
};

function auditHumanLabel(value) {
  if (!value) return 'Sin identificar';
  const raw = String(value);
  if (auditLabelOverrides[raw]) return auditLabelOverrides[raw];
  const words = raw
    .replaceAll('.', ' ')
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => auditWordMap[word] || auditWordMap[word.toLowerCase()] || word)
    .join(' ')
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

function ensureAuditPeriod() {
  if (elements.auditPeriodFrom.value && elements.auditPeriodTo.value) return;
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  elements.auditPeriodFrom.value = `${end.slice(0, 8)}01`;
  elements.auditPeriodTo.value = end;
}

function auditPeriodQuery() {
  ensureAuditPeriod();
  const params = new URLSearchParams({
    dateFrom: elements.auditPeriodFrom.value,
    dateTo: elements.auditPeriodTo.value,
  });
  return params.toString();
}

function renderAuditReadiness(readiness) {
  auditReadiness = readiness;
  elements.auditReadinessScore.dataset.status = readiness.status;
  elements.auditReadinessScore.replaceChildren();
  const score = document.createElement('strong');
  score.textContent = `${readiness.score}%`;
  const status = document.createElement('span');
  status.textContent = readiness.status === 'PASS'
    ? 'Listo'
    : readiness.status === 'WARNING' ? 'Con alertas' : 'No listo';
  elements.auditReadinessScore.append(score, status);
  elements.auditControlGrid.replaceChildren();
  readiness.controls.forEach((control) => {
    const card = document.createElement('article');
    card.className = 'audit-control-card';
    card.dataset.status = control.status;
    const state = document.createElement('span');
    state.className = 'audit-control-state';
    state.textContent = control.status === 'PASS' ? '✓' : '!';
    const copy = document.createElement('div');
    copy.className = 'audit-control-copy';
    const area = document.createElement('span');
    area.textContent = control.area;
    const title = document.createElement('strong');
    title.textContent = control.title;
    const detail = document.createElement('small');
    detail.textContent = control.detail;
    copy.append(area, title, detail);
    card.append(state, copy);
    elements.auditControlGrid.append(card);
  });
}

function renderAuditReadinessError(message) {
  elements.auditReadinessScore.dataset.status = 'FAIL';
  elements.auditReadinessScore.innerHTML = '<strong>—</strong><span>No disponible</span>';
  elements.auditControlGrid.replaceChildren();
  const state = document.createElement('div');
  state.className = 'data-state compact';
  const copy = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = 'No fue posible ejecutar los controles';
  const detail = document.createElement('p');
  detail.textContent = message;
  copy.append(title, detail);
  state.append(copy);
  elements.auditControlGrid.append(state);
}

async function loadAuditReadiness() {
  if (!activeTenantId) return null;
  const readiness = await getJson(`/api/audit/readiness?${auditPeriodQuery()}`, {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderAuditReadiness(readiness);
  return readiness;
}

function accountingSourceLabel(sourceType) {
  return {
    SALE: 'Venta',
    CASH_OPEN: 'Apertura de caja',
    CASH_MOVEMENT: 'Movimiento de caja',
    CASH_CLOSE: 'Cierre de caja',
    AR_INVOICE: 'Cuenta por cobrar',
    AR_PAYMENT: 'Recaudo de cartera',
    PURCHASE_RECEIPT: 'Recepción de compra',
    AP_INVOICE: 'Cuenta por pagar',
    AP_PAYMENT: 'Pago a proveedor',
    REVERSAL: 'Contraasiento',
  }[sourceType] || sourceType;
}

function renderAccountingLedger(ledger = {}) {
  const summary = ledger.summary || {};
  elements.accountingPostedCount.textContent = String(summary.posted_count || 0);
  elements.accountingDebitTotal.textContent = formatCurrency(summary.debit_total || 0);
  elements.accountingCreditTotal.textContent = formatCurrency(summary.credit_total || 0);
  elements.accountingPendingAccounts.textContent =
    String(summary.accounts_pending_review || 0);
  elements.accountingBalanceBadge.dataset.status =
    summary.balanced && Number(summary.draft_count || 0) === 0 ? 'PASS' : 'FAIL';
  elements.accountingBalanceBadge.textContent =
    summary.balanced && Number(summary.draft_count || 0) === 0
      ? 'Débitos = créditos'
      : 'Requiere revisión';
  elements.accountingEntryList.replaceChildren();
  if (!ledger.entries?.length) {
    const empty = document.createElement('div');
    empty.className = 'data-state compact';
    empty.innerHTML =
      '<div><strong>Sin operaciones en el período</strong>' +
      '<p>Los asientos aparecerán al registrar movimientos operativos.</p></div>';
    elements.accountingEntryList.append(empty);
    return;
  }
  ledger.entries.forEach((entry) => {
    const row = document.createElement('article');
    row.className = 'accounting-entry-row';
    const number = document.createElement('span');
    number.className = 'accounting-entry-number';
    number.textContent = `#${entry.entry_number}`;
    const copy = document.createElement('div');
    copy.className = 'accounting-entry-copy';
    const title = document.createElement('strong');
    title.textContent = entry.description;
    const detail = document.createElement('small');
    detail.textContent =
      `${accountingSourceLabel(entry.source_type)} · ${entry.entry_date} · ` +
      `${entry.line_count} líneas · ${entry.actor_name}`;
    copy.append(title, detail);
    const amount = document.createElement('div');
    amount.className = 'accounting-entry-amount';
    const value = document.createElement('strong');
    value.textContent = formatCurrency(entry.total_debit);
    const seal = document.createElement('small');
    seal.textContent = entry.entry_hash
      ? `Sellado ${entry.entry_hash.slice(0, 10)}…`
      : entry.status;
    amount.append(value, seal);
    const voucher = document.createElement('button');
    voucher.className = 'accounting-row-action';
    voucher.type = 'button';
    voucher.textContent = 'Imprimir comprobante';
    voucher.addEventListener('click', () => printAccountingVoucher(entry));
    amount.append(voucher);
    if (hasAnyPermission('accounting.manage') &&
        entry.source_type !== 'REVERSAL' && !entry.has_reversal) {
      const reverse = document.createElement('button');
      reverse.className = 'accounting-row-action';
      reverse.type = 'button';
      reverse.textContent = 'Crear contraasiento';
      reverse.addEventListener('click', () => openAccountingAction({
        type: 'REVERSE',
        id: entry.id,
        kicker: `Asiento #${entry.entry_number}`,
        title: 'Crear contraasiento',
        description: 'Se registrará un asiento nuevo con débitos y créditos invertidos.',
        requiresDate: true,
      }));
      amount.append(reverse);
    }
    row.append(number, copy, amount);
    elements.accountingEntryList.append(row);
  });
}

async function loadAccountingLedger() {
  const ledger = await getJson(`/api/audit/accounting-ledger?${auditPeriodQuery()}`, {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderAccountingLedger(ledger);
  return ledger;
}

async function printAccountingVoucher(entry) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/audit/accounting/entries/${entry.id}/voucher.html`,
      {
        credentials: 'include',
        headers: { 'x-tenant-id': activeTenantId },
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'No fue posible generar el comprobante.');
    }
    const url = URL.createObjectURL(await response.blob());
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      URL.revokeObjectURL(url);
      throw new Error('Permite ventanas emergentes para imprimir el comprobante.');
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    showToast(error.message);
  }
}

function fillBankAccountSelect(select) {
  select.replaceChildren();
  bankReconciliationData.accounts.forEach((account) => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${account.bank_name} · ${account.masked_account}`;
    select.append(option);
  });
}

function renderBankReconciliation(data = {}) {
  bankReconciliationData = data;
  const canManageAccounting = hasAnyPermission('accounting.manage');
  elements.newBankAccountButton.hidden = !canManageAccounting;
  elements.newBankTransactionButton.hidden = !canManageAccounting;
  elements.completeBankReconciliationButton.hidden = !canManageAccounting;
  const summary = data.summary || {};
  elements.bankTransactionCount.textContent = String(summary.total || 0);
  elements.bankMatchedCount.textContent = String(summary.matched || 0);
  elements.bankUnmatchedCount.textContent = String(summary.unmatched || 0);
  elements.newBankTransactionButton.disabled = !(data.accounts || []).length;
  elements.completeBankReconciliationButton.disabled = !(data.accounts || []).length;
  elements.bankTransactionList.replaceChildren();
  if (!data.transactions?.length) {
    const empty = document.createElement('div');
    empty.className = 'data-state compact';
    empty.innerHTML = '<div><strong>Sin movimientos del extracto</strong>' +
      '<p>Registra la cuenta bancaria y sus movimientos para iniciar la conciliación.</p></div>';
    elements.bankTransactionList.append(empty);
    return;
  }
  data.transactions.forEach((transaction) => {
    const row = document.createElement('article');
    row.className = 'bank-transaction-row';
    const status = document.createElement('span');
    status.className = 'bank-match-state';
    status.dataset.status = transaction.status;
    status.textContent = transaction.status === 'MATCHED' ? '✓' : '!';
    const copy = document.createElement('div');
    copy.append(
      Object.assign(document.createElement('strong'), {
        textContent: transaction.description,
      }),
      Object.assign(document.createElement('small'), {
        textContent: `${transaction.transaction_date} · ${transaction.bank_name} ${transaction.masked_account} · ${transaction.reference}`,
      }),
    );
    const amount = document.createElement('div');
    amount.className = 'bank-transaction-amount';
    amount.append(
      Object.assign(document.createElement('strong'), {
        textContent: formatCurrency(transaction.amount),
      }),
      Object.assign(document.createElement('small'), {
        textContent: transaction.status === 'MATCHED'
          ? `Comprobante #${transaction.entry_number}`
          : 'Pendiente de conciliar',
      }),
    );
    if (transaction.status === 'UNMATCHED' &&
        hasAnyPermission('accounting.manage')) {
      const match = document.createElement('button');
      match.className = 'accounting-row-action';
      match.type = 'button';
      match.textContent = 'Conciliar';
      match.addEventListener('click', () => matchBankTransaction(transaction));
      amount.append(match);
    }
    row.append(status, copy, amount);
    elements.bankTransactionList.append(row);
  });
}

function renderTrialBalance(data = {}) {
  trialBalanceData = data;
  elements.trialBalanceState.textContent = data.balanced ? 'Cuadrado' : 'Revisar';
  elements.trialBalanceState.dataset.status = data.balanced ? 'PASS' : 'FAIL';
  elements.trialBalanceList.replaceChildren();
  const activeAccounts = (data.accounts || []).filter((account) =>
    Number(account.ending_debit) !== 0 || Number(account.ending_credit) !== 0 ||
    Number(account.movement_debit) !== 0 || Number(account.movement_credit) !== 0);
  if (!activeAccounts.length) {
    const empty = document.createElement('div');
    empty.className = 'data-state compact';
    empty.innerHTML = '<div><strong>Sin saldos en el período</strong>' +
      '<p>El balance aparecerá cuando existan asientos contabilizados.</p></div>';
    elements.trialBalanceList.append(empty);
    return;
  }
  activeAccounts.forEach((account) => {
    const row = document.createElement('button');
    row.className = 'trial-balance-row';
    row.type = 'button';
    const net = Number(account.ending_debit) - Number(account.ending_credit);
    const code = document.createElement('span');
    code.textContent = account.code;
    const name = document.createElement('strong');
    name.textContent = account.name;
    const balance = document.createElement('small');
    balance.textContent = `${formatCurrency(net)} saldo neto`;
    row.append(code, name, balance);
    row.addEventListener('click', () => openAccountingAuxiliary(account));
    elements.trialBalanceList.append(row);
  });
}

async function loadAccountingControls() {
  const periodQuery = auditPeriodQuery();
  const [bank, trial] = await Promise.all([
    getJson(`/api/audit/accounting/bank-reconciliation?${periodQuery}`, {
      headers: { 'x-tenant-id': activeTenantId },
    }),
    getJson(`/api/audit/accounting/trial-balance?${periodQuery}`, {
      headers: { 'x-tenant-id': activeTenantId },
    }),
  ]);
  renderBankReconciliation(bank);
  renderTrialBalance(trial);
  return { bank, trial };
}

async function openAccountingAuxiliary(account) {
  try {
    const auxiliary = await getJson(
      `/api/audit/accounting/auxiliary/${account.id}?${auditPeriodQuery()}`,
      { headers: { 'x-tenant-id': activeTenantId } },
    );

    const dialog = document.getElementById('accountingAuxiliaryDialog');
    const titleEl = document.getElementById('accountingAuxiliaryTitle');
    const balancesEl = document.getElementById('accountingAuxiliaryBalances');
    const rowsEl = document.getElementById('accountingAuxiliaryRows');

    titleEl.textContent = `${account.code} · ${account.name}`;
    balancesEl.textContent = `Saldo inicial: ${formatCurrency(auxiliary.openingBalance)} | Saldo final: ${formatCurrency(auxiliary.endingBalance)}`;

    rowsEl.innerHTML = '';
    if (!auxiliary.items || auxiliary.items.length === 0) {
      rowsEl.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 24px; text-align: center; color: var(--color-muted); font-size: 13px;">Sin movimientos en este período</td>
        </tr>
      `;
    } else {
      auxiliary.items.forEach((item) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f1f5f9';
        
        let dateStr = item.entry_date;
        try {
          dateStr = new Date(item.entry_date).toISOString().split('T')[0];
        } catch (_) {}

        tr.innerHTML = `
          <td style="padding: 10px 12px; color: #64748b; font-weight: 500;">${dateStr}</td>
          <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">#${item.entry_number}</td>
          <td style="padding: 10px 12px; text-align: right; color: #059669; font-weight: 500;">${item.debit > 0 ? formatCurrency(item.debit) : '—'}</td>
          <td style="padding: 10px 12px; text-align: right; color: #dc2626; font-weight: 500;">${item.credit > 0 ? formatCurrency(item.credit) : '—'}</td>
          <td style="padding: 10px 12px; text-align: right; color: #0f172a; font-weight: 700;">${formatCurrency(item.running_balance)}</td>
        `;
        rowsEl.appendChild(tr);
      });
    }

    const closeBtn = document.getElementById('closeAccountingAuxiliary');
    const closeBtn2 = document.getElementById('closeAccountingAuxiliaryButton');
    const onClose = () => dialog.close();
    closeBtn.onclick = onClose;
    closeBtn2.onclick = onClose;

    dialog.showModal();
  } catch (error) {
    showToast(error.message);
  }
}

function openBankAccountDialog() {
  elements.bankAccountForm.reset();
  elements.bankAccountError.hidden = true;
  elements.bankAccountingAccountId.replaceChildren();
  accountingGovernanceData.accounts
    .filter((account) => account.active && account.account_type === 'ASSET')
    .forEach((account) => {
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = `${account.code} · ${account.name}`;
      elements.bankAccountingAccountId.append(option);
    });
  elements.bankAccountDialog.showModal();
}

function closeBankAccountDialog() {
  elements.bankAccountDialog.close();
}

async function submitBankAccount(event) {
  event.preventDefault();
  elements.saveBankAccount.disabled = true;
  elements.bankAccountError.hidden = true;
  try {
    await getJson('/api/audit/accounting/bank-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        accountingAccountId: elements.bankAccountingAccountId.value,
        bankName: elements.bankName.value,
        accountName: elements.bankAccountName.value,
        maskedAccount: elements.bankMaskedAccount.value,
        openingBalance: Number(elements.bankOpeningBalance.value),
      }),
    });
    closeBankAccountDialog();
    await loadAccountingControls();
    showToast('Cuenta bancaria creada para conciliación.');
  } catch (error) {
    elements.bankAccountError.textContent = error.message;
    elements.bankAccountError.hidden = false;
  } finally {
    elements.saveBankAccount.disabled = false;
  }
}

function openBankTransactionDialog() {
  if (!bankReconciliationData.accounts.length) return;
  elements.bankTransactionForm.reset();
  elements.bankTransactionError.hidden = true;
  fillBankAccountSelect(elements.bankTransactionAccountId);
  elements.bankTransactionDate.value = new Date().toISOString().slice(0, 10);
  elements.bankTransactionDialog.showModal();
}

function closeBankTransactionDialog() {
  elements.bankTransactionDialog.close();
}

async function submitBankTransaction(event) {
  event.preventDefault();
  elements.saveBankTransaction.disabled = true;
  elements.bankTransactionError.hidden = true;
  try {
    const transaction = await getJson('/api/audit/accounting/bank-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        bankAccountId: elements.bankTransactionAccountId.value,
        transactionDate: elements.bankTransactionDate.value,
        reference: elements.bankTransactionReference.value,
        description: elements.bankTransactionDescription.value,
        amount: Number(elements.bankTransactionAmount.value),
        statementBalance: elements.bankStatementBalance.value,
      }),
    });
    closeBankTransactionDialog();
    await loadAccountingControls();
    showToast(transaction.matched_sale_tender_id
      ? 'Movimiento registrado y transferencia de caja conciliada automáticamente.'
      : 'Movimiento bancario registrado.');
  } catch (error) {
    elements.bankTransactionError.textContent = error.message;
    elements.bankTransactionError.hidden = false;
  } finally {
    elements.saveBankTransaction.disabled = false;
  }
}

async function matchBankTransaction(transaction) {
  const reference = window.prompt(
    'Escribe el número del comprobante contable contabilizado que contiene la cuenta bancaria.',
  );
  if (!reference) return;
  try {
    await getJson(
      `/api/audit/accounting/bank-transactions/${transaction.id}/match`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({
          entryNumber: Number(reference),
          notes: `Conciliación de ${transaction.reference}`,
        }),
      },
    );
    await loadAccountingControls();
    showToast('Movimiento conciliado con el comprobante.');
  } catch (error) {
    showToast(error.message);
  }
}

function openBankReconciliationDialog() {
  if (!bankReconciliationData.accounts.length) return;
  elements.bankReconciliationForm.reset();
  elements.bankReconciliationError.hidden = true;
  fillBankAccountSelect(elements.bankReconciliationAccountId);
  elements.bankReconciliationDialog.showModal();
}

function closeBankReconciliationDialog() {
  elements.bankReconciliationDialog.close();
}

async function submitBankReconciliation(event) {
  event.preventDefault();
  elements.saveBankReconciliation.disabled = true;
  elements.bankReconciliationError.hidden = true;
  ensureAuditPeriod();
  try {
    await getJson('/api/audit/accounting/bank-reconciliations/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        bankAccountId: elements.bankReconciliationAccountId.value,
        periodStart: elements.auditPeriodFrom.value,
        periodEnd: elements.auditPeriodTo.value,
        statementEndingBalance: Number(elements.bankReconciliationBalance.value),
        notes: elements.bankReconciliationNotes.value,
      }),
    });
    closeBankReconciliationDialog();
    await loadAccountingControls();
    showToast('Conciliación calculada, sellada y auditada.');
  } catch (error) {
    elements.bankReconciliationError.textContent = error.message;
    elements.bankReconciliationError.hidden = false;
  } finally {
    elements.saveBankReconciliation.disabled = false;
  }
}

async function downloadMonthlyPackage() {
  ensureAuditPeriod();
  const month = elements.auditPeriodFrom.value.slice(0, 7);
  const response = await fetch(
    `${API_BASE_URL}/api/audit/accounting/monthly-package.json?month=${month}`,
    {
      credentials: 'include',
      headers: { 'x-tenant-id': activeTenantId },
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    showToast(body.error || 'No fue posible generar el expediente mensual.');
    return;
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `nubixor-expediente-contable-${month}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Expediente mensual generado con sello SHA-256.');
}

const accountingPurposeLabels = {
  CASH_MAIN: 'Caja principal',
  CASH_REGISTER: 'Caja registradora',
  BANK: 'Bancos y transferencias',
  RECEIVABLES: 'Clientes por cobrar',
  INPUT_TAX: 'Impuesto descontable',
  INVENTORY: 'Inventario',
  PAYABLES: 'Proveedores por pagar',
  RECEIVED_NOT_INVOICED: 'Mercancía recibida sin factura',
  OUTPUT_TAX: 'Impuesto generado',
  EQUITY: 'Patrimonio',
  SALES_REVENUE: 'Ingreso por ventas',
  OTHER_INCOME: 'Otros ingresos',
  GENERAL_EXPENSE: 'Gastos generales',
  CASH_OVER_SHORT: 'Diferencias de caja',
  COST_OF_SALES: 'Costo de ventas',
};

function accountingPeriodLabel(period) {
  return `${String(period.period_start).slice(0, 10)} — ` +
    `${String(period.period_end).slice(0, 10)}`;
}

function renderAccountingGovernance(data = {}) {
  accountingGovernanceData = data;
  const canManage = hasAnyPermission('accounting.manage');
  elements.newAccountingAccount.hidden = !canManage;
  elements.accountingPeriodList.replaceChildren();
  if (!data.periods?.length) {
    const empty = document.createElement('p');
    empty.className = 'accounting-governance-empty';
    empty.textContent = 'Los períodos aparecerán al contabilizar la primera operación.';
    elements.accountingPeriodList.append(empty);
  }
  data.periods?.forEach((period) => {
    const row = document.createElement('article');
    row.className = 'accounting-governance-row';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = accountingPeriodLabel(period);
    const detail = document.createElement('small');
    detail.textContent = `${period.entry_count} asientos · ` +
      `${formatCurrency(period.debit_total)} débito · ${period.status}`;
    copy.append(title, detail);
    const badge = document.createElement('span');
    badge.className = 'accounting-period-state';
    badge.dataset.status = period.permanently_locked ? 'LOCKED' : period.status;
    badge.textContent = period.permanently_locked
      ? 'Bloqueado'
      : period.status === 'CLOSED' ? 'Cerrado' : 'Abierto';
    row.append(copy, badge);
    if (canManage && !period.permanently_locked) {
      const action = document.createElement('button');
      action.className = 'accounting-row-action';
      action.type = 'button';
      action.textContent = period.status === 'CLOSED' ? 'Reabrir' : 'Cerrar período';
      action.addEventListener('click', () => openAccountingAction({
        type: period.status === 'CLOSED' ? 'REOPEN_PERIOD' : 'CLOSE_PERIOD',
        id: period.id,
        kicker: accountingPeriodLabel(period),
        title: period.status === 'CLOSED' ? 'Reabrir período' : 'Cerrar período',
        description: period.status === 'CLOSED'
          ? 'La reapertura quedará registrada en la bitácora inalterable.'
          : 'Después del cierre no se admitirán operaciones con fecha en este período.',
      }));
      row.append(action);
      if (period.status === 'CLOSED') {
        const finalLock = document.createElement('button');
        finalLock.className = 'accounting-row-action danger';
        finalLock.type = 'button';
        finalLock.textContent = 'Bloqueo definitivo';
        finalLock.addEventListener('click', () => openAccountingAction({
          type: 'FINAL_LOCK',
          id: period.id,
          kicker: accountingPeriodLabel(period),
          title: 'Bloquear período definitivamente',
          description: 'Esta acción es irreversible. Exige conciliaciones bancarias sin diferencias y sellará el período.',
        }));
        row.append(finalLock);
      }
    }
    elements.accountingPeriodList.append(row);
  });

  elements.accountingMappingList.replaceChildren();
  data.mappings?.forEach((mapping) => {
    const row = document.createElement('article');
    row.className = 'accounting-mapping-row';
    const label = document.createElement('label');
    const title = document.createElement('span');
    title.textContent = accountingPurposeLabels[mapping.purpose] || mapping.purpose;
    const select = document.createElement('select');
    select.disabled = !canManage;
    data.accounts.filter((account) => account.active && account.allows_posting)
      .forEach((account) => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.code} · ${account.name}`;
        option.selected = account.id === mapping.account_id;
        select.append(option);
      });
    label.append(title, select);
    row.append(label);
    if (canManage) {
      const save = document.createElement('button');
      save.className = 'accounting-row-action';
      save.type = 'button';
      save.textContent = 'Aplicar';
      save.addEventListener('click', () => openAccountingAction({
        type: 'MAPPING',
        id: mapping.purpose,
        accountId: select.value,
        kicker: accountingPurposeLabels[mapping.purpose] || mapping.purpose,
        title: 'Cambiar asignación contable',
        description: `Las próximas operaciones usarán ${select.selectedOptions[0]?.textContent}.`,
      }));
      row.append(save);
    }
    elements.accountingMappingList.append(row);
  });

  elements.accountingAccountList.replaceChildren();
  data.accounts?.forEach((account) => {
    const row = document.createElement('article');
    row.className = 'accounting-account-row';
    const code = document.createElement('span');
    code.className = 'accounting-account-code';
    code.textContent = account.code;
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = account.name;
    const detail = document.createElement('small');
    detail.textContent = `${account.account_type} · ${account.normal_balance} · ` +
      `${account.usage_count} movimientos`;
    copy.append(title, detail);
    const state = document.createElement('span');
    state.className = 'accounting-review-state';
    state.dataset.status = account.accountant_review_required ? 'PENDING' : 'REVIEWED';
    state.textContent = account.accountant_review_required ? 'Por validar' : 'Validada';
    row.append(code, copy, state);
    if (canManage && account.accountant_review_required) {
      const review = document.createElement('button');
      review.className = 'accounting-row-action';
      review.type = 'button';
      review.textContent = 'Registrar revisión';
      review.addEventListener('click', () => openAccountingAction({
        type: 'REVIEW_ACCOUNT',
        id: account.id,
        kicker: `${account.code} · ${account.name}`,
        title: 'Validar cuenta contable',
        description: 'Registra la conclusión del contador o responsable financiero.',
      }));
      row.append(review);
    }
    elements.accountingAccountList.append(row);
  });
}

async function loadAccountingGovernance() {
  const data = await getJson('/api/audit/accounting-governance', {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderAccountingGovernance(data);
  return data;
}

function openAccountingAction(options) {
  pendingAccountingAction = options;
  elements.accountingActionForm.reset();
  elements.accountingActionType.value = options.type;
  elements.accountingActionId.value = options.id;
  elements.accountingActionKicker.textContent = options.kicker || 'Gobierno contable';
  elements.accountingActionTitle.textContent = options.title;
  elements.accountingActionDescription.textContent = options.description;
  elements.accountingActionDateField.hidden = !options.requiresDate;
  elements.accountingActionDate.required = Boolean(options.requiresDate);
  if (options.requiresDate) {
    elements.accountingActionDate.value = new Date().toISOString().slice(0, 10);
  }
  elements.accountingActionError.hidden = true;
  elements.accountingActionDialog.showModal();
}

function closeAccountingAction() {
  pendingAccountingAction = null;
  elements.accountingActionDialog.close();
}

async function saveAccountingAction(event) {
  event.preventDefault();
  if (!pendingAccountingAction) return;
  elements.saveAccountingAction.disabled = true;
  elements.accountingActionError.hidden = true;
  try {
    const action = pendingAccountingAction;
    let path;
    let method = 'POST';
    let body;
    if (action.type === 'CLOSE_PERIOD') {
      path = `/api/audit/accounting/periods/${action.id}/close`;
      body = { notes: elements.accountingActionNotes.value };
    } else if (action.type === 'REOPEN_PERIOD') {
      path = `/api/audit/accounting/periods/${action.id}/reopen`;
      body = { reason: elements.accountingActionNotes.value };
    } else if (action.type === 'FINAL_LOCK') {
      path = `/api/audit/accounting/periods/${action.id}/final-lock`;
      body = {
        confirmation: 'BLOQUEAR DEFINITIVAMENTE',
        notes: elements.accountingActionNotes.value,
      };
    } else if (action.type === 'REVIEW_ACCOUNT') {
      path = `/api/audit/accounting/accounts/${action.id}/review`;
      body = { notes: elements.accountingActionNotes.value };
    } else if (action.type === 'REVERSE') {
      path = `/api/audit/accounting/entries/${action.id}/reverse`;
      body = {
        entryDate: elements.accountingActionDate.value,
        reason: elements.accountingActionNotes.value,
      };
    } else {
      path = `/api/audit/accounting/mappings/${action.id}`;
      method = 'PUT';
      body = {
        accountId: action.accountId,
        reason: elements.accountingActionNotes.value,
      };
    }
    await getJson(path, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify(body),
    });
    closeAccountingAction();
    await Promise.all([
      loadAccountingGovernance(),
      loadAccountingLedger(),
      loadAccountingControls(),
      loadAuditReadiness(),
    ]);
    showToast('Control contable actualizado y registrado en auditoría.');
  } catch (error) {
    elements.accountingActionError.textContent = error.message;
    elements.accountingActionError.hidden = false;
  } finally {
    elements.saveAccountingAction.disabled = false;
  }
}

function openAccountingAccountDialog() {
  elements.accountingAccountForm.reset();
  elements.accountingAccountError.hidden = true;
  elements.accountingAccountDialog.showModal();
}

function closeAccountingAccountDialog() {
  elements.accountingAccountDialog.close();
}

async function saveAccountingAccount(event) {
  event.preventDefault();
  elements.saveAccountingAccount.disabled = true;
  elements.accountingAccountError.hidden = true;
  try {
    await getJson('/api/audit/accounting/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify({
        code: elements.accountingAccountCode.value,
        name: elements.accountingAccountName.value,
        accountType: elements.accountingAccountType.value,
        normalBalance: elements.accountingNormalBalance.value,
        reason: elements.accountingAccountReason.value,
      }),
    });
    closeAccountingAccountDialog();
    await loadAccountingGovernance();
    showToast('Cuenta creada y pendiente de revisión profesional.');
  } catch (error) {
    elements.accountingAccountError.textContent = error.message;
    elements.accountingAccountError.hidden = false;
  } finally {
    elements.saveAccountingAccount.disabled = false;
  }
}

async function runAndSealAuditControls() {
  elements.runAuditControls.disabled = true;
  elements.runAuditControls.textContent = 'Sellando evidencia…';
  try {
    const result = await getJson('/api/audit/control-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify({
        dateFrom: elements.auditPeriodFrom.value,
        dateTo: elements.auditPeriodTo.value,
      }),
    });
    renderAuditReadiness(result.readiness);
    await loadAudit();
    showToast(`Control sellado con resultado ${result.readiness.status}.`);
  } catch (error) {
    renderAuditReadinessError(error.message);
    showToast(error.message);
  } finally {
    elements.runAuditControls.disabled = false;
    elements.runAuditControls.textContent = 'Ejecutar controles';
  }
}

function openAccountantReviewDialog() {
  ensureAuditPeriod();
  elements.accountantReviewError.hidden = true;
  elements.accountantReviewError.textContent = '';
  elements.accountantReviewForm.reset();
  const existing = auditReadiness?.accountantReviews?.[0];
  if (existing) {
    elements.accountantReviewerName.value = existing.reviewer_name || '';
    elements.accountantReviewerDocument.value = existing.reviewer_document || '';
    elements.accountantProfessionalCard.value = existing.professional_card || '';
  }
  elements.accountantReviewDialog.showModal();
}

function closeAccountantReviewDialog() {
  elements.accountantReviewDialog.close();
}

async function saveAccountantReview(event) {
  event.preventDefault();
  elements.accountantReviewError.hidden = true;
  elements.saveAccountantReview.disabled = true;
  elements.saveAccountantReview.textContent = 'Guardando…';
  try {
    await getJson('/api/audit/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
      body: JSON.stringify({
        periodStart: elements.auditPeriodFrom.value,
        periodEnd: elements.auditPeriodTo.value,
        reviewType: elements.accountantReviewType.value,
        status: elements.accountantReviewStatus.value,
        reviewerName: elements.accountantReviewerName.value,
        reviewerDocument: elements.accountantReviewerDocument.value,
        professionalCard: elements.accountantProfessionalCard.value,
        evidenceReference: elements.accountantEvidenceReference.value,
        notes: elements.accountantReviewNotes.value,
      }),
    });
    closeAccountantReviewDialog();
    await loadAudit();
    showToast('Validación del contador registrada y auditada.');
  } catch (error) {
    elements.accountantReviewError.textContent = error.message;
    elements.accountantReviewError.hidden = false;
  } finally {
    elements.saveAccountantReview.disabled = false;
    elements.saveAccountantReview.textContent = 'Guardar validación';
  }
}

async function exportAuditEvidence() {
  elements.exportAuditEvidence.disabled = true;
  elements.exportAuditEvidence.textContent = 'Preparando expediente…';
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/audit/evidence.json?${auditPeriodQuery()}`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'x-tenant-id': activeTenantId,
        },
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'No fue posible preparar el expediente.');
    }
    const url = URL.createObjectURL(await response.blob());
    const download = document.createElement('a');
    download.href = url;
    download.download = `nubixor-expediente-${elements.auditPeriodFrom.value}-${elements.auditPeriodTo.value}.json`;
    document.body.append(download);
    download.click();
    download.remove();
    URL.revokeObjectURL(url);
    showToast('Expediente de auditoría descargado.');
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.exportAuditEvidence.disabled = false;
    elements.exportAuditEvidence.replaceChildren();
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '↓';
    elements.exportAuditEvidence.append(icon, ' Descargar expediente');
  }
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
    renderAuditObject(elements.auditMetadata, {
      ...(detail.metadata || {}),
      integrityVersion: detail.integrity_version,
      previousHash: detail.previous_hash,
      eventHash: detail.event_hash,
    });
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
    ensureAuditPeriod();
    const [summary, facets, page, readiness] = await Promise.all([
      getJson('/api/audit/summary', { headers: { 'x-tenant-id': activeTenantId } }),
      needsFacets
        ? getJson('/api/audit/facets', { headers: { 'x-tenant-id': activeTenantId } })
        : Promise.resolve(null),
      getJson(`/api/audit/events?${auditFiltersQuery()}`, {
        headers: { 'x-tenant-id': activeTenantId },
      }),
      append
        ? Promise.resolve(null)
        : Promise.all([
            loadAuditReadiness(),
            loadAccountingLedger(),
            loadAccountingGovernance(),
            loadAccountingControls(),
          ])
          .then(([result]) => result),
    ]);
    setAuditSummary(summary);
    if (readiness) renderAuditReadiness(readiness);
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
      `nubixor-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
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
  document.body.classList.toggle('sidebar-open', open);
  elements.menuButton.setAttribute('aria-expanded', String(open));
}

function setSidebarGroup(group, open) {
  if (!group) return;
  group.classList.toggle('open', open);
  group.querySelector('.nav-group-toggle')
    ?.setAttribute('aria-expanded', String(open));
}

function toggleSidebarGroup(selectedGroup) {
  const shouldOpen = !selectedGroup.classList.contains('open');
  document.querySelectorAll('.nav-group').forEach((group) => {
    setSidebarGroup(group, group === selectedGroup && shouldOpen);
  });
}

function syncSidebarGroup(view) {
  const activeLink = elements.sidebar
    .querySelector(`[data-view-link="${view}"]:not([hidden])`);
  const activeGroup = activeLink?.closest('.nav-group') || null;
  document.querySelectorAll('.nav-group').forEach((group) => {
    group.classList.toggle('contains-active', group === activeGroup);
    setSidebarGroup(group, group === activeGroup);
  });
}

function updateSidebarGroupVisibility() {
  document.querySelectorAll('.nav-group').forEach((group) => {
    const hasVisibleLink = [...group.querySelectorAll('[data-view-link]')]
      .some((link) => !link.hidden);
    group.hidden = !hasVisibleLink;
    if (!hasVisibleLink) setSidebarGroup(group, false);
  });
}

function payrollEmployeeName(employee) {
  return [employee.first_name, employee.middle_name, employee.last_name, employee.second_last_name]
    .filter(Boolean).join(' ');
}

function payrollStatusLabel(status) {
  return ({ DRAFT: 'Borrador', REVIEW: 'En revisión', APPROVED: 'Aprobado', VOID: 'Anulado' })[status] || status || '—';
}

function setPayrollSummary(summary = {}) {
  elements.payrollActiveEmployees.textContent = String(summary.active_employees || 0);
  elements.payrollActiveContracts.textContent = String(summary.active_contracts || 0);
  elements.payrollOpenPeriods.textContent = String(summary.open_periods || 0);
  elements.payrollPendingNovelties.textContent = String(summary.pending_novelties || 0);
}

function renderPayrollFactusStatus() {
  const account = electronicBillingOverview?.account;
  const isFactus = account?.provider_code === 'FACTUS';
  const status = account?.connection_status || 'DRAFT';
  elements.payrollFactusStatus.textContent = isFactus ? status : 'SIN CONFIGURAR';
  elements.payrollFactusTitle.textContent = isFactus
    ? `Factus Nómina · ${account.environment === 'PRODUCTION' ? 'Producción' : 'Sandbox'}`
    : 'Factus para nómina';
  elements.payrollFactusMessage.textContent = isFactus
    ? (account.last_error || 'La nómina utilizará las credenciales Factus de esta empresa.')
    : 'Configura Factus desde aquí; las credenciales quedan separadas por empresa y se comparten con facturación.';
  elements.testPayrollFactusButton.disabled = !isFactus;
}

function renderPayrollEmployees() {
  elements.payrollEmployeeList.replaceChildren();
  elements.payrollEmployeeState.hidden = payrollEmployees.length > 0;
  if (!payrollEmployees.length) return;
  for (const employee of payrollEmployees) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'purchase-order-row';
    row.classList.toggle('active', selectedPayrollEmployee?.id === employee.id);
    row.innerHTML = `<div><strong>${escapeHtml(payrollEmployeeName(employee))}</strong><small>${escapeHtml(employee.document_type)} · ${escapeHtml(employee.document_number)}${employee.branch_name ? ` · ${escapeHtml(employee.branch_name)}` : ''}</small></div><span>${employee.active_contract_id ? 'Contrato activo' : 'Sin contrato'}</span>`;
    row.addEventListener('click', () => {
      selectedPayrollEmployee = employee;
      renderPayrollEmployees();
      if (!employee.active_contract_id && hasAnyPermission('payroll.manage')) openPayrollContractDialog();
    });
    elements.payrollEmployeeList.append(row);
  }
}

function renderPayrollNovelties() {
  elements.payrollNoveltyList.replaceChildren();
  elements.payrollNoveltyCount.textContent = `${payrollNovelties.length} ${payrollNovelties.length === 1 ? 'novedad' : 'novedades'}`;
  if (!payrollNovelties.length) {
    const empty = document.createElement('p');
    empty.className = 'ar-no-payments';
    empty.textContent = 'Todavía no hay novedades en este período.';
    elements.payrollNoveltyList.append(empty);
    return;
  }
  for (const novelty of payrollNovelties) {
    const row = document.createElement('div');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${novelty.concept_code} · ${payrollEmployeeName(novelty)}`;
    const detail = document.createElement('small');
    detail.textContent = `${novelty.novelty_type.replace('_', ' ').toLocaleLowerCase('es')} · ${novelty.description}`;
    copy.append(title, detail);
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(novelty.amount || 0);
    row.append(copy, amount);
    elements.payrollNoveltyList.append(row);
  }
}

async function selectPayrollPeriod(period) {
  selectedPayrollPeriod = period;
  elements.payrollPeriodEmpty.hidden = true;
  elements.payrollPeriodContent.hidden = false;
  elements.payrollPeriodNumber.textContent = `Período ${period.period_number || ''}`.trim();
  elements.payrollPeriodDates.textContent = `${formatShortDate(period.start_date)} — ${formatShortDate(period.end_date)}`;
  elements.payrollPeriodMeta.textContent = `${period.frequency === 'BIWEEKLY' ? 'Quincenal' : 'Mensual'} · Pago ${formatShortDate(period.payment_date)}`;
  elements.payrollPeriodStatus.textContent = payrollStatusLabel(period.status);
  elements.payrollPeriodEarnings.textContent = formatCurrency(period.earnings || 0);
  elements.payrollPeriodDeductions.textContent = formatCurrency(period.deductions || 0);
  elements.payrollPeriodPaymentDate.textContent = formatShortDate(period.payment_date);
  elements.payrollPeriodNoveltyCount.textContent = String(period.novelty_count || 0);
  const editable = ['DRAFT', 'REVIEW'].includes(period.status);
  elements.newPayrollNoveltyButton.hidden = !editable || !hasAnyPermission('payroll.manage');
  elements.approvePayrollPeriodButton.hidden = !editable || !hasAnyPermission('payroll.approve');
  try {
    payrollNovelties = await getJson(`/api/payroll/periods/${period.id}/novelties`, { headers: { 'x-tenant-id': activeTenantId } });
    renderPayrollNovelties();
  } catch (error) {
    showToast(error.message);
  }
}

function renderPayrollPeriods() {
  if (!payrollPeriods.length) {
    selectedPayrollPeriod = null;
    elements.payrollPeriodContent.hidden = true;
    elements.payrollPeriodEmpty.hidden = false;
    return;
  }
  const current = payrollPeriods.find((period) => period.id === selectedPayrollPeriod?.id) || payrollPeriods[0];
  selectPayrollPeriod(current);
}

async function loadPayroll() {
  if (!activeTenantId || !isTenantModuleEnabled('PAYROLL')) return [];
  try {
    renderPayrollFactusStatus();
    const [summary, employees, periods] = await Promise.all([
      getJson('/api/payroll/summary', { headers: { 'x-tenant-id': activeTenantId } }),
      getJson('/api/payroll/employees', { headers: { 'x-tenant-id': activeTenantId } }),
      getJson('/api/payroll/periods', { headers: { 'x-tenant-id': activeTenantId } }),
    ]);
    payrollEmployees = employees;
    payrollPeriods = periods;
    setPayrollSummary(summary);
    renderPayrollEmployees();
    renderPayrollPeriods();
    return periods;
  } catch (error) {
    elements.payrollEmployeeState.querySelector('strong').textContent = 'No pudimos cargar Nómina';
    elements.payrollEmployeeState.querySelector('p').textContent = error.message;
    elements.payrollEmployeeState.hidden = false;
    throw error;
  }
}

function closePayrollDialog(dialog) { dialog.close(); }

function openPayrollEmployeeDialog() {
  elements.payrollEmployeeForm.reset();
  elements.payrollEmployeeFormError.hidden = true;
  fillInventorySelect(elements.payrollEmployeeBranchId, 'Sin asignar todavía', branches.filter((branch) => branch.active), (branch) => branch.name);
  elements.payrollEmployeeDialog.showModal();
}

function openPayrollContractDialog() {
  if (!selectedPayrollEmployee) { showToast('Selecciona primero un colaborador.'); return; }
  elements.payrollContractForm.reset();
  elements.payrollContractFormError.hidden = true;
  elements.payrollContractEmployeeName.textContent = `Contrato para ${payrollEmployeeName(selectedPayrollEmployee)}.`;
  elements.payrollContractDialog.showModal();
}

function openPayrollPeriodDialog() {
  elements.payrollPeriodForm.reset();
  elements.payrollPeriodFormError.hidden = true;
  elements.payrollPeriodDialog.showModal();
}

function openPayrollNoveltyDialog() {
  if (!selectedPayrollPeriod) { showToast('Crea o selecciona un período primero.'); return; }
  elements.payrollNoveltyForm.reset();
  elements.payrollNoveltyFormError.hidden = true;
  const eligible = payrollEmployees.filter((employee) => employee.active && employee.active_contract_id);
  fillInventorySelect(elements.payrollNoveltyEmployeeId, 'Selecciona un colaborador', eligible, (employee) => `${payrollEmployeeName(employee)} · ${employee.document_number}`);
  elements.payrollNoveltyEffectiveDate.min = String(selectedPayrollPeriod.start_date).slice(0, 10);
  elements.payrollNoveltyEffectiveDate.max = String(selectedPayrollPeriod.end_date).slice(0, 10);
  elements.payrollNoveltyPeriodName.textContent = `Período: ${formatShortDate(selectedPayrollPeriod.start_date)} — ${formatShortDate(selectedPayrollPeriod.end_date)}.`;
  elements.payrollNoveltyDialog.showModal();
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function submitPayrollEmployee(event) {
  event.preventDefault();
  elements.savePayrollEmployeeButton.disabled = true;
  try {
    const employee = await getJson('/api/payroll/employees', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId }, body: JSON.stringify(formPayload(elements.payrollEmployeeForm)) });
    elements.payrollEmployeeDialog.close();
    await loadPayroll();
    selectedPayrollEmployee = payrollEmployees.find((item) => item.id === employee.id) || employee;
    renderPayrollEmployees();
    showToast('Colaborador registrado. Ahora puedes crear su contrato.');
    openPayrollContractDialog();
  } catch (error) { elements.payrollEmployeeFormError.textContent = error.message; elements.payrollEmployeeFormError.hidden = false; }
  finally { elements.savePayrollEmployeeButton.disabled = false; }
}

async function submitPayrollContract(event) {
  event.preventDefault();
  elements.savePayrollContractButton.disabled = true;
  try {
    await getJson(`/api/payroll/employees/${selectedPayrollEmployee.id}/contracts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId }, body: JSON.stringify(formPayload(elements.payrollContractForm)) });
    elements.payrollContractDialog.close(); await loadPayroll(); showToast('Contrato activo y listo para el siguiente período.');
  } catch (error) { elements.payrollContractFormError.textContent = error.message; elements.payrollContractFormError.hidden = false; }
  finally { elements.savePayrollContractButton.disabled = false; }
}

async function submitPayrollPeriod(event) {
  event.preventDefault(); elements.savePayrollPeriodButton.disabled = true;
  try {
    const period = await getJson('/api/payroll/periods', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId }, body: JSON.stringify(formPayload(elements.payrollPeriodForm)) });
    elements.payrollPeriodDialog.close(); await loadPayroll(); await selectPayrollPeriod(payrollPeriods.find((item) => item.id === period.id) || period); showToast('Período creado. Registra las novedades antes de aprobarlo.');
  } catch (error) { elements.payrollPeriodFormError.textContent = error.message; elements.payrollPeriodFormError.hidden = false; }
  finally { elements.savePayrollPeriodButton.disabled = false; }
}

async function submitPayrollNovelty(event) {
  event.preventDefault(); elements.savePayrollNoveltyButton.disabled = true;
  try {
    await getJson(`/api/payroll/periods/${selectedPayrollPeriod.id}/novelties`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId }, body: JSON.stringify(formPayload(elements.payrollNoveltyForm)) });
    elements.payrollNoveltyDialog.close(); await loadPayroll(); showToast('Novedad registrada en el período.');
  } catch (error) { elements.payrollNoveltyFormError.textContent = error.message; elements.payrollNoveltyFormError.hidden = false; }
  finally { elements.savePayrollNoveltyButton.disabled = false; }
}

async function approvePayrollPeriod() {
  if (!selectedPayrollPeriod || !window.confirm('¿Aprobar este período para revisión? Después no admitirá nuevas novedades.')) return;
  elements.approvePayrollPeriodButton.disabled = true;
  try {
    await getJson(`/api/payroll/periods/${selectedPayrollPeriod.id}/approve`, { method: 'POST', headers: { 'x-tenant-id': activeTenantId } });
    await loadPayroll(); showToast('Período aprobado y bloqueado para novedades.');
  } catch (error) { showToast(error.message); }
  finally { elements.approvePayrollPeriodButton.disabled = false; }
}

const availableViews = new Set([
  'inicio',
  'empresas',
  'sucursales',
  'terceros',
  'bodegas',
  'inventario',
  'logistica',
  'productos',
  'compras',
  'cuentas-pagar',
  'gastos',
  'nomina',
  'usuarios',
  'caja',
  'cartera',
  'facturacion',
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
  terceros: 'Terceros',
  bodegas: 'Bodegas',
  inventario: 'Inventario',
  logistica: 'Logística',
  productos: 'Catálogo',
  compras: 'Compras',
  'cuentas-pagar': 'Cuentas por pagar',
  gastos: 'Gastos',
  nomina: 'Nómina',
  usuarios: 'Usuarios y accesos',
  caja: 'Caja & POS',
  cartera: 'Cuentas por cobrar',
  facturacion: 'Facturación',
  'planificacion-comercial': 'Planificación comercial',
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
  syncSidebarGroup(view);
  document.body.dataset.activeView = view;
  document.title = `Nubixor — ${viewTitles[view]}`;
  if (view === 'inventario') {
    selectInventoryPanel(requestedView === 'conteos' ? 'counts' : 'stock');
  }
  if (view === 'logistica') {
    selectInventoryPanel('flow');
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

function renderCompanyLogoPreview(source = null, company = identityCompany) {
  const fallback = company?.legal_name?.slice(0, 1).toUpperCase() || 'LOGO';
  elements.companyLogoPlaceholder.textContent = fallback;
  elements.companyLogoPreview.hidden = !source;
  elements.companyLogoPlaceholder.hidden = Boolean(source);
  if (source) {
    elements.companyLogoPreview.src = source;
    elements.companyLogoPreview.alt =
      `Logo de ${company?.trade_name || company?.legal_name || 'la empresa'}`;
  } else {
    elements.companyLogoPreview.removeAttribute('src');
  }
}

function openCompanyIdentityDialog(company) {
  identityCompany = company;
  elements.companyIdentityForm.reset();
  elements.companyIdentityError.hidden = true;
  elements.companyIdentityName.textContent =
    `${company.legal_name} · ${company.tax_id || 'Identificación pendiente'}`;
  elements.removeCompanyLogoButton.hidden = !company.logo_document_id;
  renderCompanyLogoPreview(company.logo_url, company);
  elements.companyIdentityDialog.showModal();
}

function closeCompanyIdentityDialog() {
  elements.companyIdentityDialog.close();
  identityCompany = null;
}

async function previewCompanyLogo() {
  const file = elements.companyLogoFile.files[0];
  if (!file) {
    renderCompanyLogoPreview(identityCompany?.logo_url || null);
    return;
  }
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type) || file.size > 2 * 1024 * 1024) {
    elements.companyIdentityError.textContent =
      'El logo debe ser PNG, JPG o WEBP y pesar máximo 2 MB.';
    elements.companyIdentityError.hidden = false;
    elements.companyLogoFile.value = '';
    renderCompanyLogoPreview(identityCompany?.logo_url || null);
    return;
  }
  elements.companyIdentityError.hidden = true;
  renderCompanyLogoPreview(await fileToDataUrl(file));
}

async function submitCompanyIdentity(event) {
  event.preventDefault();
  if (!identityCompany) return;
  const file = elements.companyLogoFile.files[0];
  if (!file) {
    elements.companyIdentityError.textContent =
      'Selecciona una imagen para guardar el logo del negocio.';
    elements.companyIdentityError.hidden = false;
    return;
  }
  elements.companyIdentityError.hidden = true;
  elements.saveCompanyLogoButton.disabled = true;
  elements.saveCompanyLogoButton.textContent = 'Guardando…';
  try {
    await getJson(`/api/companies/${identityCompany.id}/logo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': identityCompany.id,
      },
      body: JSON.stringify({
        fileName: file.name,
        dataUrl: await fileToDataUrl(file),
      }),
    });
    closeCompanyIdentityDialog();
    await loadCompanies();
    showToast('Logo guardado exclusivamente para esta empresa.');
  } catch (error) {
    elements.companyIdentityError.textContent = error.message;
    elements.companyIdentityError.hidden = false;
  } finally {
    elements.saveCompanyLogoButton.disabled = false;
    elements.saveCompanyLogoButton.textContent = 'Guardar identidad';
  }
}

async function removeCompanyLogo() {
  if (!identityCompany?.logo_document_id) return;
  elements.removeCompanyLogoButton.disabled = true;
  try {
    await getJson(`/api/companies/${identityCompany.id}/logo`, {
      method: 'DELETE',
      headers: { 'x-tenant-id': identityCompany.id },
    });
    closeCompanyIdentityDialog();
    await loadCompanies();
    showToast('Logo retirado; el archivo histórico permanece auditado.');
  } catch (error) {
    elements.companyIdentityError.textContent = error.message;
    elements.companyIdentityError.hidden = false;
  } finally {
    elements.removeCompanyLogoButton.disabled = false;
  }
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
    billingMode: formData.get('billingMode'),
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
    showToast('Empresa, sucursal, bodega, caja e impuestos creados correctamente.');
  } catch (error) {
    elements.companyFormError.textContent = error.message;
    elements.companyFormError.hidden = false;
  } finally {
    elements.saveCompanyButton.disabled = false;
    elements.saveCompanyButton.textContent = 'Crear empresa y continuar';
  }
}

function openTaxProfileDialog(company) {
  taxProfileCompany = company;
  elements.taxProfileForm.reset();
  elements.taxProfileError.hidden = true;
  elements.taxProfileCompanyName.textContent =
    `${company.legal_name} · ${company.tax_id || 'Identificación pendiente'}`;
  elements.taxpayerType.value = ['NATURAL_PERSON', 'LEGAL_ENTITY']
    .includes(company.taxpayer_type) ? company.taxpayer_type : 'NATURAL_PERSON';
  elements.vatResponsibility.value = ['RESPONSIBLE', 'NOT_RESPONSIBLE']
    .includes(company.vat_responsibility)
    ? company.vat_responsibility
    : 'NOT_RESPONSIBLE';
  elements.taxRegime.value = ['ORDINARY', 'SIMPLE', 'NOT_APPLICABLE']
    .includes(company.tax_regime) ? company.tax_regime : 'ORDINARY';
  elements.taxDocumentType.value = [
    'INTERNAL_RECEIPT',
    'EQUIVALENT_DOCUMENT',
    'ELECTRONIC_INVOICE',
  ].includes(company.default_document_type)
    ? company.default_document_type
    : 'INTERNAL_RECEIPT';
  elements.electronicInvoicingRequired.checked =
    Boolean(company.electronic_invoicing_required);
  elements.taxValidationStatus.value =
    company.validation_status === 'OBSERVED' ? 'OBSERVED' : 'VALIDATED';
  elements.taxValidationNotes.value = company.validation_notes || '';
  elements.taxProfileDialog.showModal();
}

function closeTaxProfileDialog() {
  elements.taxProfileDialog.close();
  taxProfileCompany = null;
}

async function submitTaxProfile(event) {
  event.preventDefault();
  if (!taxProfileCompany) return;
  elements.taxProfileError.hidden = true;
  elements.saveTaxProfileButton.disabled = true;
  try {
    let rutDocumentId = taxProfileCompany.rut_document_id || null;
    const rutFile = elements.taxRutFile.files[0];
    if (rutFile) {
      const allowed = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
      ];
      if (!allowed.includes(rutFile.type) || rutFile.size > 8 * 1024 * 1024) {
        throw new Error('El RUT debe ser PDF, JPG, PNG o WEBP y pesar máximo 8 MB.');
      }
      const uploaded = await getJson('/api/secure-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': taxProfileCompany.id,
        },
        body: JSON.stringify({
          category: 'RUT',
          fileName: rutFile.name,
          description: `RUT de ${taxProfileCompany.legal_name}`,
          dataUrl: await fileToDataUrl(rutFile),
        }),
      });
      rutDocumentId = uploaded.id;
    }
    await getJson(`/api/companies/${taxProfileCompany.id}/tax-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': taxProfileCompany.id,
      },
      body: JSON.stringify({
        taxpayerType: elements.taxpayerType.value,
        vatResponsibility: elements.vatResponsibility.value,
        taxRegime: elements.taxRegime.value,
        defaultDocumentType: elements.taxDocumentType.value,
        electronicInvoicingRequired:
          elements.electronicInvoicingRequired.checked,
        validationStatus: elements.taxValidationStatus.value,
        validationNotes: elements.taxValidationNotes.value,
        rutDocumentId,
      }),
    });
    closeTaxProfileDialog();
    await loadCompanies();
    showToast('Perfil tributario validado exclusivamente para esta empresa.');
  } catch (error) {
    elements.taxProfileError.textContent = error.message;
    elements.taxProfileError.hidden = false;
  } finally {
    elements.saveTaxProfileButton.disabled = false;
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
  elements.productExcludeFromEinvoice.checked = false;
  elements.productBillingPolicy.disabled = false;
  syncProductOptions();
  elements.productFormError.hidden = true;
  elements.productDialog.showModal();
  document.querySelector('#productName').focus();
}

function syncProductEinvoiceExclusion() {
  const excluded = elements.productExcludeFromEinvoice.checked;
  elements.productBillingPolicy.disabled = excluded;
  if (excluded) elements.productBillingPolicy.value = 'INTERNAL_RECEIPT';
}

function closeProductDialog() {
  elements.productDialog.close();
}

function resetCatalogImportPreview() {
  catalogImportCsv = null;
  catalogImportPreview = null;
  elements.catalogImportSummary.hidden = true;
  elements.catalogImportPreview.hidden = true;
  elements.catalogImportTableBody.replaceChildren();
  elements.catalogImportError.hidden = true;
  elements.commitCatalogImport.disabled = true;
  elements.commitCatalogImport.textContent = 'Importar productos';
}

function openCatalogImportDialog() {
  const company = getActiveCompany();
  if (!company) {
    showToast('Selecciona la empresa que recibirá la carga.');
    return;
  }
  resetCatalogImportPreview();
  elements.catalogImportFile.value = '';
  elements.catalogImportFileLabel.textContent = 'Seleccionar CSV';
  elements.catalogImportCompany.textContent =
    company.trade_name || company.legal_name || 'Empresa activa';
  elements.catalogImportDialog.showModal();
}

function closeCatalogImportDialog() {
  elements.catalogImportDialog.close();
  resetCatalogImportPreview();
}

async function downloadCatalogImportTemplate() {
  elements.downloadCatalogTemplate.disabled = true;
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/catalog-import/template.csv`,
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
      throw new Error(body.error || 'No fue posible generar la plantilla.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-productos-nubixor.csv';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Plantilla preparada con los códigos de la empresa activa.');
  } catch (error) {
    elements.catalogImportError.textContent = error.message;
    elements.catalogImportError.hidden = false;
  } finally {
    elements.downloadCatalogTemplate.disabled = false;
  }
}

function catalogImportFileChanged() {
  resetCatalogImportPreview();
  const file = elements.catalogImportFile.files[0];
  elements.catalogImportFileLabel.textContent = file
    ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB`
    : 'Seleccionar CSV';
  if (file && file.size > 1_500_000) {
    elements.catalogImportError.textContent =
      'El archivo supera 1,5 MB. Divídelo en varias cargas.';
    elements.catalogImportError.hidden = false;
  }
}

function renderCatalogImportPreview(preview) {
  elements.catalogImportSummary.hidden = false;
  elements.catalogImportPreview.hidden = false;
  elements.catalogImportTotal.textContent = preview.summary.total;
  elements.catalogImportCreates.textContent = preview.summary.creates;
  elements.catalogImportUpdates.textContent = preview.summary.updates;
  elements.catalogImportErrors.textContent = preview.summary.errorRows;
  elements.catalogImportSummary
    .querySelector('[data-import-errors]')
    .classList.toggle('has-errors', preview.summary.errorRows > 0);
  elements.catalogImportStatus.textContent = preview.summary.valid
    ? 'Listo para importar'
    : 'Requiere correcciones';
  elements.catalogImportStatus.className = preview.summary.valid ? 'valid' : 'invalid';
  elements.catalogImportTableBody.replaceChildren();
  const visibleRows = [...preview.rows]
    .sort((left, right) =>
      Number(Boolean(right.errors.length)) - Number(Boolean(left.errors.length)) ||
      left.rowNumber - right.rowNumber)
    .slice(0, 250);
  visibleRows.forEach((row) => {
    const tableRow = document.createElement('tr');
    if (row.errors.length) tableRow.classList.add('import-row-error');
    const number = document.createElement('td');
    number.textContent = row.rowNumber;
    const action = document.createElement('td');
    const actionBadge = document.createElement('span');
    actionBadge.className = `import-action ${row.action.toLowerCase()}`;
    actionBadge.textContent = row.action === 'CREATE' ? 'Nuevo' : 'Actualizar';
    action.append(actionBadge);
    const product = document.createElement('td');
    const productName = document.createElement('strong');
    productName.textContent = row.name || 'Sin nombre';
    const productSku = document.createElement('small');
    productSku.textContent = row.sku || 'Sin SKU';
    product.append(productName, productSku);
    const warehouse = document.createElement('td');
    warehouse.textContent = row.warehouseCode || '—';
    const stock = document.createElement('td');
    stock.textContent = row.stock === null
      ? `${Number(row.currentStock).toLocaleString('es-CO')} → sin cambios`
      : `${Number(row.currentStock).toLocaleString('es-CO')} → ${
        Number(row.stock).toLocaleString('es-CO')
      }`;
    const validation = document.createElement('td');
    const validationList = document.createElement('div');
    validationList.className = 'import-validation-list';
    if (!row.errors.length && !row.warnings.length) {
      const valid = document.createElement('span');
      valid.className = 'ok';
      valid.textContent = '✓ Validado';
      validationList.append(valid);
    }
    row.errors.forEach((message) => {
      const error = document.createElement('span');
      error.className = 'error';
      error.textContent = message;
      validationList.append(error);
    });
    row.warnings.forEach((message) => {
      const warning = document.createElement('span');
      warning.className = 'warning';
      warning.textContent = message;
      validationList.append(warning);
    });
    validation.append(validationList);
    tableRow.append(number, action, product, warehouse, stock, validation);
    elements.catalogImportTableBody.append(tableRow);
  });
  elements.commitCatalogImport.disabled = !preview.summary.valid;
  if (preview.rows.length > visibleRows.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'catalog-import-more';
    cell.textContent =
      `${preview.rows.length - visibleRows.length} filas adicionales fueron validadas.`;
    row.append(cell);
    elements.catalogImportTableBody.append(row);
  }
}

async function previewCatalogImportFile() {
  const file = elements.catalogImportFile.files[0];
  if (!file) {
    elements.catalogImportError.textContent = 'Selecciona primero el archivo CSV.';
    elements.catalogImportError.hidden = false;
    return;
  }
  elements.catalogImportError.hidden = true;
  elements.previewCatalogImport.disabled = true;
  elements.previewCatalogImport.textContent = 'Validando…';
  try {
    catalogImportCsv = await file.text();
    catalogImportPreview = await getJson('/api/catalog-import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: catalogImportCsv }),
    });
    renderCatalogImportPreview(catalogImportPreview);
    showToast(catalogImportPreview.summary.valid
      ? 'Archivo validado. Revisa y confirma la importación.'
      : 'Encontramos filas que debes corregir.');
  } catch (error) {
    resetCatalogImportPreview();
    elements.catalogImportError.textContent = error.message;
    elements.catalogImportError.hidden = false;
  } finally {
    elements.previewCatalogImport.disabled = false;
    elements.previewCatalogImport.textContent = 'Revisar archivo';
  }
}

async function commitCatalogImportFile() {
  if (!catalogImportCsv || !catalogImportPreview?.summary.valid) return;
  elements.catalogImportError.hidden = true;
  elements.commitCatalogImport.disabled = true;
  elements.commitCatalogImport.textContent = 'Importando de forma segura…';
  try {
    const result = await getJson('/api/catalog-import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv: catalogImportCsv,
        confirmation: 'IMPORTAR',
      }),
    });
    await Promise.all([loadCatalog(), loadInventory()]);
    closeCatalogImportDialog();
    showToast(
      `${result.total} productos procesados: ${result.creates} nuevos y ` +
      `${result.updates} actualizados.`,
    );
  } catch (error) {
    elements.catalogImportError.textContent = error.message;
    elements.catalogImportError.hidden = false;
    elements.commitCatalogImport.disabled = false;
    elements.commitCatalogImport.textContent = 'Importar productos';
  }
}

function selectProductStructurePanel(panelName) {
  document.querySelectorAll('[data-product-structure-tab]').forEach((button) => {
    const active = button.dataset.productStructureTab === panelName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-product-structure-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.productStructurePanel !== panelName;
  });
}

function syncProductStructureWarehouses() {
  for (const select of [
    elements.productVariantWarehouse,
    elements.productComboWarehouse,
  ]) {
    const current = select.value;
    select.replaceChildren(new Option('Selecciona una bodega', ''));
    warehouses.filter((warehouse) => warehouse.active).forEach((warehouse) => {
      select.append(new Option(
        `${warehouse.name} · ${warehouseTypeLabels[warehouse.warehouse_type] || warehouse.warehouse_type}`,
        warehouse.id,
      ));
    });
    if ([...select.options].some((option) => option.value === current)) {
      select.value = current;
    }
  }
}

function comboComponentCandidates() {
  return products.filter((product) =>
    product.id !== structuredProduct?.id &&
    product.active !== false &&
    !['COMBO', 'VARIANT_PARENT'].includes(product.product_kind));
}

function addComboComponentRow(component = {}) {
  const row = document.createElement('div');
  row.className = 'product-combo-component';
  const select = document.createElement('select');
  select.required = true;
  select.append(new Option('Selecciona un producto', ''));
  comboComponentCandidates().forEach((product) => {
    select.append(new Option(
      `${product.name} · ${product.sku}`,
      product.id,
    ));
  });
  select.value = component.component_product_id || component.productId || '';
  const quantity = document.createElement('input');
  quantity.type = 'number';
  quantity.min = '0.0001';
  quantity.step = '0.0001';
  quantity.value = String(component.quantity || 1);
  quantity.required = true;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'icon-button';
  remove.setAttribute('aria-label', 'Quitar componente');
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    row.remove();
    if (!elements.productComboComponents.children.length) addComboComponentRow();
  });
  row.append(select, quantity, remove);
  elements.productComboComponents.append(row);
}

function renderProductStructure() {
  if (!productStructure) return;
  const { product, variants, components, assemblies } = productStructure;
  structuredProduct = product;
  elements.productStructureProduct.textContent =
    `${product.name} · ${product.sku}`;
  elements.productVariantList.replaceChildren();
  if (!variants.length) {
    const empty = document.createElement('p');
    empty.className = 'product-structure-empty';
    empty.textContent =
      'Todavía no tiene opciones. Agrega el primer color, talla o presentación.';
    elements.productVariantList.append(empty);
  }
  variants.forEach((variant) => {
    const card = document.createElement('article');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = variant.name;
    const attributes = Object.entries(variant.variant_attributes || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ');
    const meta = document.createElement('small');
    const invoiceCode = variant.metadata?.invoiceCode || product.sku;
    meta.textContent = `${attributes || 'Opción'} · Inventario: ${variant.sku} · Factura: ${invoiceCode}`;
    copy.append(title, meta);
    const values = document.createElement('div');
    values.style.cssText = 'display:flex; align-items:center; gap:8px;';
    const price = document.createElement('strong');
    price.textContent = formatCurrency(variant.sale_price);
    const stock = document.createElement('small');
    stock.textContent = `${Number(variant.total_stock || 0).toLocaleString('es-CO')} unidades`;
    
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.style.cssText = 'color:#ef4444; background:none; border:none; cursor:pointer; font-size:12px; font-weight:700; padding:2px 6px;';
    delBtn.textContent = '🗑️ Eliminar';
    delBtn.addEventListener('click', async () => {
      if (confirm(`¿Eliminar la opción "${variant.name}"?`)) {
        try {
          await getJson(`/api/products/${variant.id}`, {
            method: 'DELETE',
            headers: { 'x-tenant-id': activeTenantId },
          });
          showToast(`Opción "${variant.name}" eliminada.`);
          await Promise.all([loadCatalog(), loadInventory()]);
          if (structuredProduct) await loadProductStructure(structuredProduct.id);
        } catch (err) {
          showToast(err.message);
        }
      }
    });

    const imageBtn = document.createElement('button');
    imageBtn.type = 'button';
    imageBtn.className = 'photo-action';
    imageBtn.textContent = variant.image_url ? 'Cambiar foto' : 'Foto del color';
    imageBtn.addEventListener('click', () => openProductImageDialog(variant));
    values.append(price, stock, imageBtn, delBtn);
    card.append(copy, values);
    elements.productVariantList.append(card);
  });

  elements.productComboComponents.replaceChildren();
  if (components.length) {
    components.forEach(addComboComponentRow);
  } else {
    addComboComponentRow();
    addComboComponentRow();
  }
  elements.productComboAssemblyForm.hidden = product.product_kind !== 'COMBO';
  elements.productComboAssemblyList.replaceChildren();
  if (!assemblies.length) {
    const empty = document.createElement('p');
    empty.className = 'product-structure-empty';
    empty.textContent = product.product_kind === 'COMBO'
      ? 'Todavía no se han armado unidades de este combo.'
      : 'Guarda primero la composición del combo.';
    elements.productComboAssemblyList.append(empty);
  }
  assemblies.forEach((assembly) => {
    const row = document.createElement('article');
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent =
      `${Number(assembly.quantity).toLocaleString('es-CO')} combo(s) armados`;
    const meta = document.createElement('small');
    meta.textContent = `${assembly.warehouse_name} · ${
      new Date(assembly.created_at).toLocaleString('es-CO')
    }`;
    copy.append(title, meta);
    const user = document.createElement('span');
    user.textContent = assembly.created_by_name || 'Usuario';
    row.append(copy, user);
    elements.productComboAssemblyList.append(row);
  });
  syncProductStructureWarehouses();
}

async function loadProductStructure(productId) {
  productStructure = await getJson(`/api/product-structures/${productId}`, {
    headers: { 'x-tenant-id': activeTenantId },
  });
  renderProductStructure();
  return productStructure;
}

async function openProductStructureDialog(product) {
  structuredProduct = product;
  productStructure = null;
  elements.productVariantForm.reset();
  elements.productVariantError.hidden = true;
  elements.productComboError.hidden = true;
  elements.productComboAssemblyError.hidden = true;
  
  const optionValueInput = elements.productVariantForm.querySelector('[name="optionValue"]');
  const skuInput = elements.productVariantForm.querySelector('[name="sku"]');
  if (skuInput) {
    skuInput.removeAttribute('required');
    skuInput.required = false;
    skuInput.placeholder = `${product.sku}-COLOR (Opcional)`;
    const label = skuInput.closest('label')?.querySelector('span');
    if (label) label.innerHTML = 'SKU interno único (Opcional)';
  }
  if (optionValueInput && skuInput) {
    optionValueInput.oninput = () => {
      const val = optionValueInput.value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-');
      if (val && !skuInput.value) {
        skuInput.placeholder = `${product.sku}-${val}`;
      }
    };
  }

  syncProductStructureWarehouses();
  selectProductStructurePanel(
    product.product_kind === 'COMBO' ? 'combo' : 'variants',
  );
  elements.productStructureDialog.showModal();
  try {
    await loadProductStructure(product.id);
  } catch (error) {
    closeProductStructureDialog();
    showToast(error.message);
  }
}

function closeProductStructureDialog() {
  elements.productStructureDialog.close();
  structuredProduct = null;
  productStructure = null;
}

async function submitProductVariant(event) {
  event.preventDefault();
  if (!structuredProduct) return;
  const skuInput = elements.productVariantForm.querySelector('[name="sku"]');
  if (skuInput) {
    skuInput.removeAttribute('required');
    skuInput.required = false;
  }
  const data = new FormData(elements.productVariantForm);
  let submittedSku = data.get('sku') ? String(data.get('sku')).trim() : '';
  if (!submittedSku && data.get('optionValue')) {
    const val = String(data.get('optionValue')).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-');
    submittedSku = `${structuredProduct.sku}-${val}`;
  }

  elements.productVariantError.hidden = true;
  elements.saveProductVariant.disabled = true;
  try {
    await getJson(`/api/product-structures/${structuredProduct.id}/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        optionName: data.get('optionName'),
        optionValue: data.get('optionValue'),
        sku: submittedSku,
        barcode: data.get('barcode') || null,
        cost: data.get('cost') || null,
        salePrice: data.get('salePrice') || null,
        warehouseId: data.get('warehouseId') || null,
        initialQuantity: data.get('initialQuantity') || 0,
      }),
    });
    const productId = structuredProduct.id;
    elements.productVariantForm.reset();
    await Promise.all([loadCatalog(), loadInventory()]);
    await loadProductStructure(productId);
    showToast('Opción creada: inventario independiente y código de factura compartido.');
  } catch (error) {
    elements.productVariantError.textContent = error.message;
    elements.productVariantError.hidden = false;
  } finally {
    elements.saveProductVariant.disabled = false;
  }
}

async function submitProductCombo(event) {
  event.preventDefault();
  if (!structuredProduct) return;
  const components = [...elements.productComboComponents.children].map((row) => ({
    productId: row.querySelector('select').value,
    quantity: Number(row.querySelector('input').value),
  }));
  elements.productComboError.hidden = true;
  elements.saveProductCombo.disabled = true;
  try {
    await getJson(`/api/product-structures/${structuredProduct.id}/combo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({ components }),
    });
    const productId = structuredProduct.id;
    await loadCatalog();
    await loadProductStructure(productId);
    showToast('Composición guardada. Ya puedes armar existencias del combo.');
  } catch (error) {
    elements.productComboError.textContent = error.message;
    elements.productComboError.hidden = false;
  } finally {
    elements.saveProductCombo.disabled = false;
  }
}

async function submitProductComboAssembly(event) {
  event.preventDefault();
  if (!structuredProduct) return;
  const data = new FormData(elements.productComboAssemblyForm);
  elements.productComboAssemblyError.hidden = true;
  elements.assembleProductCombo.disabled = true;
  try {
    await getJson(
      `/api/product-structures/${structuredProduct.id}/combo/assemble`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenantId,
        },
        body: JSON.stringify({
          warehouseId: data.get('warehouseId'),
          quantity: Number(data.get('quantity')),
        }),
      },
    );
    const productId = structuredProduct.id;
    await Promise.all([loadCatalog(), loadInventory(), loadPosCatalog()]);
    await loadProductStructure(productId);
    showToast('Combo armado: componentes descontados y existencia agregada.');
  } catch (error) {
    elements.productComboAssemblyError.textContent = error.message;
    elements.productComboAssemblyError.hidden = false;
  } finally {
    elements.assembleProductCombo.disabled = false;
  }
}

function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!file || !allowedTypes.includes(file.type)) {
    throw new Error('Selecciona una imagen JPG, PNG o WEBP.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('La imagen debe pesar máximo 15 MB.');
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const img = new Image();
      img.onload = () => {
        // Enforce 1:1 aspect ratio by cropping the center
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        
        const canvas = document.createElement('canvas');
        // Max size for optimization 800x800
        const finalSize = Math.min(size, 800);
        canvas.width = finalSize;
        canvas.height = finalSize;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalSize, finalSize);
        ctx.drawImage(img, x, y, size, size, 0, 0, finalSize, finalSize);
        
        // Use webp for better compression, fallback to jpeg
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = () => reject(new Error('Formato de imagen inválido o corrupto.'));
      img.src = reader.result;
    });
    reader.addEventListener('error', () => reject(new Error('No fue posible leer la imagen.')));
    reader.readAsDataURL(file);
  });
}

async function uploadProductImage(productId, file, altText, {
  entityType = 'PRODUCT',
  makePrimary = true,
} = {}) {
  validateImageFile(file);
  const dataUrl = await fileToDataUrl(file);
  const asset = await getJson('/api/media/assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': activeTenantId,
    },
    body: JSON.stringify({
      dataUrl,
      fileName: file.name || 'producto.webp',
      description: altText || null,
    }),
  });
  return getJson('/api/media/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': activeTenantId,
    },
    body: JSON.stringify({
      mediaId: asset.id,
      entityType,
      entityId: productId,
      purpose: makePrimary ? 'PRIMARY_IMAGE' : 'GALLERY',
      isPrimary: makePrimary,
      note: altText || null,
    }),
  });
}

// El servidor rechaza imágenes más anchas que MEDIA_MAX_WIDTH (2000px por
// defecto) y cualquier foto de celular la supera, así que la evidencia se
// reduce en el cliente antes de subirla.
const EVIDENCE_MAX_DIMENSION = 1600;

function evidencePhotoToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const img = new Image();
      img.onload = () => {
        // A diferencia de las fotos de catálogo, la evidencia no se recorta a
        // 1:1: cuadrar al centro una avería o un conteo puede dejar fuera
        // justo lo que documenta el soporte. Solo se reduce la escala.
        const largestSide = Math.max(img.width, img.height);
        const ratio = largestSide > EVIDENCE_MAX_DIMENSION
          ? EVIDENCE_MAX_DIMENSION / largestSide
          : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.onerror = () => reject(new Error('Formato de imagen inválido o corrupto.'));
      img.src = reader.result;
    });
    reader.addEventListener('error', () => reject(new Error('No fue posible leer la imagen.')));
    reader.readAsDataURL(file);
  });
}

async function uploadOperationalEvidence({ file, entityType, entityId, purpose, note }) {
  validateImageFile(file);
  const dataUrl = await evidencePhotoToDataUrl(file);
  const asset = await getJson('/api/media/assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': activeTenantId,
    },
    body: JSON.stringify({
      dataUrl,
      fileName: file.name || 'evidencia.webp',
      description: note || null,
    }),
  });
  return getJson('/api/media/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': activeTenantId,
    },
    body: JSON.stringify({
      mediaId: asset.id,
      entityType,
      entityId,
      purpose,
      note: note || null,
    }),
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
        billingPolicy: formData.get('billingPolicy') || 'ELECTRONIC_INVOICE',
        excludeFromEinvoice: formData.get('excludeFromEinvoice') === 'on',
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

function clearProductMediaGallery(message = 'Sin fotografías adicionales') {
  elements.productMediaGallery.replaceChildren();
  elements.productMediaGalleryState.textContent = message;
}

async function loadProductMediaGallery() {
  if (!imageProduct) return;
  clearProductMediaGallery('Cargando…');
  try {
    const links = await getJson(
      `/api/media/links?entityType=${encodeURIComponent(imageProductEntityType)}` +
      `&entityId=${encodeURIComponent(imageProduct.id)}`,
    );
    elements.productMediaGallery.replaceChildren();
    elements.productMediaGalleryState.textContent = links.length
      ? `${links.length} ${links.length === 1 ? 'foto' : 'fotos'}`
      : 'Sin fotografías';
    if (!links.length) return;
    links.forEach((link) => {
      const card = document.createElement('article');
      card.className = 'product-media-gallery__item';
      const image = document.createElement('img');
      image.src = resolvePublicAsset(link.media.url);
      image.alt = link.media.metadata?.description || imageProduct.name;
      const actions = document.createElement('div');
      const status = document.createElement('small');
      status.textContent = link.isPrimary ? 'Principal' : 'Galería';
      actions.append(status);
      if (!link.isPrimary) {
        const makePrimary = document.createElement('button');
        makePrimary.type = 'button';
        makePrimary.className = 'photo-action';
        makePrimary.textContent = 'Usar como principal';
        makePrimary.addEventListener('click', async () => {
          makePrimary.disabled = true;
          try {
            await getJson(`/api/media/links/${link.id}/primary`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'Imagen principal seleccionada desde catálogo' }),
            });
            await Promise.all([loadProductMediaGallery(), loadCatalog(), loadPosCatalog().catch(() => [])]);
            showToast('Imagen principal actualizada.');
          } catch (error) {
            showToast(error.message);
            makePrimary.disabled = false;
          }
        });
        actions.append(makePrimary);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'photo-action danger-action';
      remove.textContent = 'Quitar';
      remove.addEventListener('click', async () => {
        if (!confirm('¿Quitar esta fotografía de la galería? El archivo queda conservado para auditoría.')) return;
        remove.disabled = true;
        try {
          await getJson(`/api/media/links/${link.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Fotografía retirada desde catálogo' }),
          });
          await Promise.all([loadProductMediaGallery(), loadCatalog(), loadPosCatalog().catch(() => [])]);
          showToast('Fotografía retirada de la galería.');
        } catch (error) {
          showToast(error.message);
          remove.disabled = false;
        }
      });
      actions.append(remove);
      card.append(image, actions);
      elements.productMediaGallery.append(card);
    });
  } catch (error) {
    clearProductMediaGallery('No fue posible cargar la galería');
  }
}

function openProductImageDialog(product) {
  imageProduct = product;
  imageProductEntityType = product.product_kind === 'VARIANT' ? 'PRODUCT_VARIANT' : 'PRODUCT';
  elements.productImageForm.reset();
  elements.productImageFormError.hidden = true;
  elements.imageProductName.textContent = imageProductEntityType === 'PRODUCT_VARIANT'
    ? `${product.name} · imagen específica de la variante`
    : product.name;
  elements.productImageAlt.value = product.name;
  elements.productImageMakePrimary.checked = true;
  resetProductImagePreview();
  elements.productImageDialog.showModal();
  loadProductMediaGallery();
  elements.productImageFile.focus();
}

function closeProductImageDialog() {
  elements.productImageDialog.close();
  resetProductImagePreview();
  imageProduct = null;
  imageProductEntityType = 'PRODUCT';
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

function captureProductImage() {
  // `capture` is intentionally used as a progressive enhancement: mobile
  // browsers open the rear camera while desktops retain the normal file picker.
  elements.productImageFile.setAttribute('capture', 'environment');
  elements.productImageFile.click();
}

async function submitProductImage(event) {
  event.preventDefault();
  const file = elements.productImageFile.files[0];
  elements.productImageFormError.hidden = true;
  elements.saveProductImageButton.disabled = true;
  elements.saveProductImageButton.textContent = 'Guardando fotografía…';
  try {
    const makePrimary = elements.productImageMakePrimary.checked;
    await uploadProductImage(imageProduct.id, file, elements.productImageAlt.value, {
      entityType: imageProductEntityType,
      makePrimary,
    });
    elements.productImageFile.value = '';
    resetProductImagePreview();
    await Promise.all([loadProductMediaGallery(), loadCatalog(), loadPosCatalog().catch(() => [])]);
    showToast(makePrimary ? 'Fotografía principal actualizada.' : 'Fotografía agregada a la galería.');
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
  const cardSales = Number(posSummary.openSession?.card_sales || 0);
  const transferSales = Number(posSummary.openSession?.transfer_sales || 0);
  const salesTotal =
    Number(posSummary.openSession?.cash_sales || 0) + cardSales + transferSales;
  const counted = cashCountLines().reduce(
    (total, line) => total + line.denomination * line.quantity,
    0,
  );
  const difference = counted - expected;
  elements.cashCloseExpected.textContent = formatCurrency(expected);
  elements.cashCloseCounted.textContent = formatCurrency(counted);
  elements.cashCloseDifference.textContent = formatCurrency(difference);
  elements.cashCloseSalesTotal.textContent = formatCurrency(salesTotal);
  elements.cashCloseCardTotal.textContent = formatCurrency(cardSales);
  elements.cashCloseTransferTotal.textContent = formatCurrency(transferSales);
  elements.cashCloseDifference.style.color =
    Math.abs(difference) < 0.01 ? '#126579' : 'var(--color-purple-strong)';
}

function showCashCloseReceipt(session) {
  elements.cashCloseReceiptPeriod.textContent =
    `${new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(session.opened_at))} — ` +
    `${new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(session.closed_at))}`;
  elements.cashCloseReceiptSales.textContent = formatCurrency(session.sales_total || 0);
  elements.cashCloseReceiptCount.textContent =
    `${session.sale_count || 0} ${Number(session.sale_count) === 1 ? 'comprobante' : 'comprobantes'}`;
  elements.cashCloseReceiptExpected.textContent = formatCurrency(session.expected_cash || 0);
  elements.cashCloseReceiptCounted.textContent = formatCurrency(session.closing_amount || 0);
  elements.cashCloseReceiptDifference.textContent = formatCurrency(session.difference || 0);
  elements.cashCloseReceiptCards.textContent = formatCurrency(session.card_sales || 0);
  elements.cashCloseReceiptTransfers.textContent = formatCurrency(session.transfer_sales || 0);
  elements.cashCloseReceiptDifference.style.color =
    Math.abs(Number(session.difference || 0)) < 0.01
      ? '#126579'
      : 'var(--color-purple-strong)';
  elements.cashCloseReceiptDenominations.replaceChildren();
  const usedCounts = (session.count_lines || []).filter((line) => Number(line.quantity) > 0);
  for (const line of usedCounts) {
    const chip = document.createElement('span');
    chip.textContent = `${line.quantity} × ${formatCurrency(line.denomination)}`;
    elements.cashCloseReceiptDenominations.append(chip);
  }
  if (!usedCounts.length) {
    elements.cashCloseReceiptDenominations.textContent = 'Sin denominaciones registradas.';
  }
  elements.cashCloseReceiptNote.textContent = session.closing_notes ||
    (Math.abs(Number(session.difference || 0)) < 0.01
      ? 'Cierre sin diferencias.'
      : 'Diferencia registrada en el cierre.');
  elements.cashCloseReceiptDialog.showModal();
}

function closeCashCloseReceiptDialog() {
  elements.cashCloseReceiptDialog.close();
}

async function submitCloseCash(event) {
  event.preventDefault();
  const formData = new FormData(elements.closeCashForm);
  elements.closeCashFormError.hidden = true;
  elements.saveCloseCashButton.disabled = true;
  elements.saveCloseCashButton.textContent = 'Cerrando turno…';
  try {
    const closedSession = await getJson(`/api/pos/sessions/${posSummary.openSession.id}/close`, {
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
    showCashCloseReceipt(closedSession);
    showToast('Turno cerrado, conciliado y listo para imprimir.');
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

function electronicReceiptEnvironment() {
  return electronicBillingOverview?.account?.environment || null;
}

function electronicReceiptTitle() {
  return electronicReceiptEnvironment() === 'PRODUCTION'
    ? 'Factura electrónica de venta — DIAN'
    : 'Factura electrónica de venta — Pruebas Factus';
}

function electronicReceiptAcceptedStatus() {
  return electronicReceiptEnvironment() === 'PRODUCTION'
    ? 'Aceptada por la DIAN'
    : electronicReceiptEnvironment() === 'TEST'
      ? 'Aceptada en pruebas de Factus'
      : 'Aceptada por el proveedor electrónico';
}

function electronicReceiptAcceptedNotice() {
  return electronicReceiptEnvironment() === 'PRODUCTION'
    ? 'Código y enlace oficial recibidos del proveedor tecnológico.'
    : 'CUFE y enlace recibidos en pruebas de Factus. No representa una factura emitida en producción.';
}

async function renderReceiptQr(receipt, { electronic, billing, cufe, qrUrl }) {
  const receiptId = receipt.id;
  elements.receiptDianQrBlock.hidden = true;
  elements.receiptQrImage.hidden = true;
  elements.receiptQrImage.removeAttribute('src');
  elements.receiptQrCodeRow.hidden = true;
  elements.receiptCufeText.textContent = '';
  elements.receiptQrNotice.textContent = '';

  if (receipt.grouped) return;
  if (electronic) {
    if (!cufe && !qrUrl) return;
    elements.receiptDianQrBlock.hidden = false;
    elements.receiptQrTitle.textContent = electronicReceiptTitle();
    elements.receiptQrCodeLabel.textContent = 'CUFE';
    elements.receiptQrCodeRow.hidden = !cufe;
    elements.receiptCufeText.textContent = cufe || '';
    elements.receiptQrNotice.textContent = billing?.status === 'ACCEPTED'
      ? electronicReceiptAcceptedNotice()
      : 'Documento electrónico pendiente de validación definitiva.';
    const documentId = billing?.id || receipt.electronic_document_id ||
      receipt.billing_document_id;
    if (qrUrl && documentId) {
      try {
        const officialQr = await getJson(
          `/api/electronic-billing/documents/${documentId}/qr`,
          { headers: { 'x-tenant-id': receipt.company_id || activeTenantId } },
        );
        if (selectedReceiptForReturn?.id !== receiptId) return;
        elements.receiptQrImage.hidden = false;
        elements.receiptQrImage.alt = electronicReceiptEnvironment() === 'PRODUCTION'
          ? 'Código QR oficial de consulta DIAN'
          : 'Código QR de consulta de Factus en pruebas';
        elements.receiptQrImage.src = officialQr.dataUrl;
        elements.receiptQrNotice.textContent = officialQr.disclaimer;
      } catch {
        elements.receiptQrNotice.textContent =
          'CUFE recibido. La representación QR del proveedor está pendiente de sincronización.';
      }
    }
    return;
  }

  if (!receiptId) return;
  try {
    const internalQr = await getJson(`/api/pos/sales/${receiptId}/internal-receipt-qr`, {
      headers: { 'x-tenant-id': receipt.company_id || activeTenantId },
    });
    if (selectedReceiptForReturn?.id !== receiptId) return;
    elements.receiptDianQrBlock.hidden = false;
    elements.receiptQrTitle.textContent = 'Comprobante interno — control Nubixor';
    elements.receiptQrImage.hidden = false;
    elements.receiptQrImage.alt = 'Código QR de control interno Nubixor';
    elements.receiptQrImage.src = internalQr.dataUrl;
    elements.receiptQrCodeLabel.textContent = 'Código de control';
    elements.receiptQrCodeRow.hidden = false;
    elements.receiptCufeText.textContent = internalQr.controlCode;
    elements.receiptQrNotice.textContent = internalQr.disclaimer;
  } catch {
    // La venta sigue siendo imprimible aunque el QR interno no esté disponible.
  }
}

function showReceipt(receipt) {
  selectedReceiptForReturn = receipt;
  const groupedReceipts = Array.isArray(receipt.receipts) ? receipt.receipts : [];
  const receiptCompanyId =
    receipt.seller_company_id || receipt.company_id || receipt.tenant_id || activeTenantId;
  const receiptCompany = companies.find((company) => company.id === receiptCompanyId);
  const businessLogo = !receipt.grouped ? receiptCompany?.logo_url : null;
  elements.receiptBrandLogo.onerror = businessLogo
    ? () => {
      elements.receiptBrandLogo.onerror = null;
      elements.receiptBrandLogo.src = './assets/brand/nubixor-logo.png';
      elements.receiptBrandLogo.alt = 'Nubixor';
    }
    : null;
  elements.receiptBrandLogo.src =
    businessLogo || './assets/brand/nubixor-logo.png';
  elements.receiptBrandLogo.alt = businessLogo
    ? `Logo de ${receiptCompany.trade_name || receiptCompany.legal_name}`
    : 'Nubixor';
  elements.receiptNumber.textContent = receipt.grouped
    ? `${receipt.documentCount} ${receipt.documentCount === 1 ? 'comprobante' : 'comprobantes'}`
    : receipt.receiptNumber;
  const electronic = (receipt.sale_document_type || receipt.document_type) ===
    'ELECTRONIC_INVOICE';
  let billing = receipt.billingDocument || (
    receipt.electronic_document_id
      ? {
        status: receipt.electronic_document_status,
        failure_reason: receipt.billing_failure_reason,
        pdf_document_id: receipt.electronic_pdf_document_id,
      }
      : null
  );
  elements.receiptDocumentType.textContent = receipt.grouped
    ? 'Compra multiempresa'
    : (electronic ? 'Factura electrónica' : 'Comprobante interno');
  elements.receiptDocumentStatus.textContent = receipt.grouped
    ? groupedReceipts
      .map((item) => `${item.companyName}: ${item.receiptNumber}`)
      .join(' · ')
    : (electronic
      ? (billing?.status === 'ACCEPTED'
        ? electronicReceiptAcceptedStatus()
        : billing?.failure_reason || 'Pendiente de transmisión a la DIAN')
      : 'Registrado localmente; no se envía a la DIAN');
  elements.receiptSplitActions.replaceChildren();
  elements.receiptSplitActions.hidden = !receipt.grouped;
  if (receipt.grouped) {
    for (const groupedReceipt of groupedReceipts) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary-button';
      const isElectronic = groupedReceipt.document_type === 'ELECTRONIC_INVOICE';
      button.textContent = isElectronic
        ? `Ver factura ${groupedReceipt.receiptNumber}`
        : `Ver comprobante ${groupedReceipt.receiptNumber}`;
      button.addEventListener('click', () => {
        showReceipt({
          ...groupedReceipt,
          grouped: false,
          company_id: groupedReceipt.companyId,
          seller_company_id: groupedReceipt.companyId,
        });
      });
      elements.receiptSplitActions.append(button);
    }
  }
  elements.receiptLines.replaceChildren();
  const receiptLines = receipt.grouped
    ? groupedReceipts.flatMap((group) =>
      group.items.map((item) => ({ ...item, companyName: group.companyName })))
    : receipt.items;
  for (const item of receiptLines) {
    const line = document.createElement('div');
    const description = document.createElement('span');
    description.textContent = `${item.companyName ? `${item.companyName} · ` : ''}` +
      `${item.quantity} × ${item.name}`;
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(item.lineTotal);
    line.append(description, amount);
    elements.receiptLines.append(line);
  }
  elements.receiptSubtotal.textContent = formatCurrency(receipt.subtotal);
  elements.receiptTax.textContent = formatCurrency(receipt.tax_total);
  const receiptDiscount = Number(receipt.manualDiscountAmount || receipt.manual_discount_amount || 0);
  elements.receiptDiscountRow.hidden = receiptDiscount <= 0;
  elements.receiptDiscount.textContent = `−${formatCurrency(receiptDiscount)}`;
  elements.receiptTotal.textContent = formatCurrency(receipt.total);
  elements.receiptCustomer.textContent = receipt.customer?.name || 'Consumidor final';
  elements.receiptPaymentMethod.textContent =
    paymentMethodLabels[receipt.payment_method] || receipt.payment_method;
  const receiptPayments = Array.isArray(receipt.payments) ? receipt.payments : [];
  elements.receiptPaymentBreakdown.replaceChildren();
  elements.receiptPaymentBreakdown.hidden = receiptPayments.length <= 1;
  for (const payment of receiptPayments) {
    const row = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = paymentMethodLabels[payment.method] || payment.method;
    if (payment.method === 'TRANSFER' && payment.bankName) {
      label.textContent += ` · ${payment.bankName} ${payment.maskedAccount || ''}`;
    }
    const amount = document.createElement('strong');
    amount.textContent = formatCurrency(payment.amount);
    row.append(label, amount);
    elements.receiptPaymentBreakdown.append(row);
  }
  const transferLines = receiptPayments.filter((payment) => payment.method === 'TRANSFER');
  const transferPayment = receipt.payment_method === 'TRANSFER' || transferLines.length > 0;
  elements.receiptTransferRow.hidden = !transferPayment;
  elements.receiptTransferReference.textContent = transferPayment
    ? transferLines.length
      ? transferLines.map((payment) =>
        `${payment.bankName || payment.receivingCompanyName || 'Cuenta registrada'} ` +
        `${payment.maskedAccount || ''} · ${payment.reference || 'Sin referencia'}`,
      ).join(' / ')
      : `${receipt.receiving_company_name || 'Cuenta registrada'} · ` +
        `${receipt.payment_reference || 'Sin referencia'}`
    : '—';
  const creditSale = receipt.sale_terms === 'CREDIT';
  elements.receiptCreditRow.hidden = !creditSale;
  elements.receiptCreditReference.textContent = creditSale
    ? `${receipt.receivable?.invoice_number || 'Generada'} · vence ${formatShortDate(receipt.due_date)}`
    : '—';
  const cashLines = receiptPayments.filter((payment) => payment.method === 'CASH');
  const cashPayment = receipt.payment_method === 'CASH' || cashLines.length > 0;
  elements.receiptCashReceivedRow.hidden = !cashPayment;
  elements.receiptCashChangeRow.hidden = !cashPayment;
  elements.receiptCashReceived.textContent = formatCurrency(
    cashLines.length
      ? cashLines.reduce((sum, payment) =>
        sum + Number(payment.tenderedAmount || payment.amount), 0)
      : receipt.cash_received || 0,
  );
  elements.receiptCashChange.textContent = formatCurrency(
    cashLines.length
      ? cashLines.reduce((sum, payment) =>
        sum + Number(payment.changeAmount || 0), 0)
      : receipt.cash_change || 0,
  );
  const docId = billing?.id || receipt.electronic_document_id || receipt.billing_document_id;
  const cufe = billing?.cufe || receipt.cufe || receipt.billingDocument?.cufe;
  const qrUrl = billing?.qrUrl || billing?.qr_url || receipt.qr_url || receipt.qrUrl || receipt.billingDocument?.qr_url;
  renderReceiptQr(receipt, { electronic, billing, cufe, qrUrl });
  syncReceiptOfficialPdf({ electronic, billing, receipt });

  if (electronic && docId && (billing?.status !== 'ACCEPTED' && receipt.electronic_document_status !== 'ACCEPTED')) {
    (async () => {
      try {
        await getJson(`/api/electronic-billing/documents/${docId}/queue`, {
          method: 'POST',
          headers: { 'x-tenant-id': activeTenantId },
        });
        const account = (typeof electronicBillingOverview !== 'undefined' && electronicBillingOverview?.account) || null;
        const isSandbox = account?.provider_code === 'SANDBOX';
        if (isSandbox) {
          await getJson(`/api/electronic-billing/documents/${docId}/process-sandbox`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId },
            body: JSON.stringify({ outcome: 'ACCEPTED' }),
          });
        } else {
          await getJson(`/api/electronic-billing/documents/${docId}/process`, {
            method: 'POST',
            headers: { 'x-tenant-id': activeTenantId },
          });
        }
        const overview = await getJson('/api/electronic-billing/overview', {
          headers: { 'x-tenant-id': activeTenantId },
        }).catch(() => null);
        const updatedDoc = overview?.documents?.find((item) => item.id === docId);
        if (updatedDoc && updatedDoc.status === 'ACCEPTED') {
          billing = { ...billing, ...updatedDoc };
          elements.receiptDocumentStatus.textContent = electronicReceiptAcceptedStatus();
          const newCufe = updatedDoc.cufe;
          const newQrUrl = updatedDoc.qr_url || updatedDoc.qrUrl;
          if (newCufe || newQrUrl) {
            elements.receiptDianQrBlock.hidden = false;
            elements.receiptQrTitle.textContent = electronicReceiptTitle();
            elements.receiptQrCodeLabel.textContent = 'CUFE';
            elements.receiptQrCodeRow.hidden = !newCufe;
            elements.receiptCufeText.textContent = newCufe || 'CUFE verificado';
            renderReceiptQr(receipt, {
              electronic: true,
              billing,
              cufe: newCufe,
              qrUrl: newQrUrl,
            });
          }
          syncReceiptOfficialPdf({ electronic: true, billing, receipt });
        }
      } catch (_) {}
    })();
  }

  const hasReturnableItems = !receipt.grouped &&
    receipt.sale_terms !== 'CREDIT' &&
    receipt.return_status !== 'FULL' &&
    Array.isArray(receipt.items) &&
    receipt.items.some((item) => Number(item.returnableQuantity ?? item.quantity) > 0);
  elements.openReturnDialogButton.hidden = !hasReturnableItems;
  elements.receiptDialog.showModal();
}

function syncReceiptOfficialPdf({ electronic, billing, receipt }) {
  const pdfDocumentId = billing?.pdf_document_id || billing?.pdfDocumentId ||
    receipt?.electronic_pdf_document_id || receipt?.pdf_document_id;
  const available = Boolean(
    electronic && pdfDocumentId &&
    (billing?.status === 'ACCEPTED' || receipt?.electronic_document_status === 'ACCEPTED'),
  );
  elements.receiptOfficialPdfLink.hidden = !available;
  if (available) {
    elements.receiptOfficialPdfLink.href =
      `${API_BASE_URL}/api/assets/documents/${encodeURIComponent(pdfDocumentId)}`;
  } else {
    elements.receiptOfficialPdfLink.removeAttribute('href');
  }
}

function printReceiptTicket() {
  // Safari puede mostrar un diálogo <dialog> vacío al imprimir. Generamos una
  // copia temporal fuera del diálogo para que el controlador térmico reciba
  // siempre contenido ordinario y no dependa de la capa modal del navegador.
  document.querySelector('#nubixor-receipt-print-root')?.remove();
  document.querySelector('#nubixor-receipt-print-style')?.remove();
  const source = elements.receiptDialog.querySelector('.company-form');
  if (!source) {
    showToast('No fue posible preparar el ticket para impresión.');
    return;
  }
  const printRoot = document.createElement('section');
  printRoot.id = 'nubixor-receipt-print-root';
  printRoot.setAttribute('aria-hidden', 'true');
  printRoot.append(source.cloneNode(true));
  printRoot.querySelectorAll(
    '.dialog-actions, .icon-button, .receipt-print-hint, [id="openReturnDialogButton"]',
  ).forEach((node) => node.remove());
  document.body.append(printRoot);

  const paperSize = document.createElement('style');
  paperSize.id = 'nubixor-receipt-print-style';
  paperSize.textContent = `
    @page { size: 80mm auto; margin: 0; }
    @media print {
      body > * { display: none !important; }
      body > #nubixor-receipt-print-root {
        display: block !important;
        width: 80mm !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        color: #111827 !important;
      }
      #nubixor-receipt-print-root .company-form {
        display: block !important;
        width: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 4mm !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: #fff !important;
        box-shadow: none !important;
      }
      #nubixor-receipt-print-root .receipt-brand-logo {
        display: block !important;
        width: 43mm !important;
        max-width: none !important;
        margin: 0 auto 5mm !important;
      }
      #nubixor-receipt-print-root .receipt-check {
        width: 10mm !important;
        height: 10mm !important;
        margin: 2mm auto !important;
        font-size: 15px !important;
      }
      #nubixor-receipt-print-root .receipt-message {
        margin-bottom: 3mm !important;
        font-size: 9px !important;
      }
      #nubixor-receipt-print-root .receipt-qr-block {
        margin-top: 3mm !important;
        padding: 3mm !important;
      }
      #nubixor-receipt-print-root .receipt-qr-image img {
        width: 38mm !important;
        height: 38mm !important;
        border-radius: 0 !important;
        image-rendering: crisp-edges;
      }
    }
  `;
  document.head.append(paperSize);
  const cleanup = () => {
    printRoot.remove();
    paperSize.remove();
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  // Obliga al navegador a calcular la copia antes de abrir el diálogo nativo.
  void printRoot.offsetHeight;
  window.print();
}

function closeReceiptDialog() {
  elements.receiptDialog.close();
}

function syncReturnRefundFields() {
  const method = elements.returnRefundMethod.value;
  const transfer = method === 'TRANSFER';
  const referenced = transfer || method === 'CARD';
  elements.returnBankAccountField.hidden = !transfer;
  elements.returnReferenceField.hidden = !referenced;
  elements.returnBankAccount.required = transfer;
  elements.returnRefundReference.required = referenced;
}

function updateReturnEstimate() {
  if (!selectedReceiptForReturn) return;
  let total = 0;
  for (const input of elements.returnItems.querySelectorAll('[data-return-quantity]')) {
    const item = selectedReceiptForReturn.items.find((line) => line.id === input.dataset.saleItemId);
    if (!item) continue;
    const quantity = Math.max(0, Number(input.value) || 0);
    const sold = Number(item.quantity) || 1;
    total += Number(item.lineTotal) * (quantity / sold);
  }
  elements.returnEstimatedTotal.textContent = formatCurrency(total);
}

function closeReturnDialog() {
  elements.returnDialog.close();
}

function openReturnDialog() {
  const receipt = selectedReceiptForReturn;
  if (!receipt || receipt.grouped) return;
  if (!posSummary.openSession) {
    showToast('Abre un turno de caja antes de registrar una devolución.');
    return;
  }
  elements.returnForm.reset();
  elements.returnFormError.hidden = true;
  elements.returnItems.replaceChildren();
  elements.returnCorrectionField.hidden = !receipt.electronic_document_id;
  elements.returnCorrectionConcept.required = Boolean(receipt.electronic_document_id);
  const returnableItems = receipt.items.filter((item) =>
    Number(item.returnableQuantity ?? item.quantity) > 0);
  for (const item of returnableItems) {
    const row = document.createElement('label');
    row.className = 'return-item-row';
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = item.name;
    const available = document.createElement('small');
    available.textContent =
      `${formatQuantity(item.returnableQuantity ?? item.quantity)} disponibles para devolver`;
    copy.append(name, available);
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(item.returnableQuantity ?? item.quantity);
    input.step = '0.0001';
    input.value = '0';
    input.dataset.returnQuantity = 'true';
    input.dataset.saleItemId = item.id;
    input.addEventListener('input', updateReturnEstimate);
    row.append(copy, input);
    elements.returnItems.append(row);
  }
  const accounts = posBankAccounts.filter((account) =>
    account.company_id === (receipt.company_id || activeTenantId));
  elements.returnBankAccount.replaceChildren(
    new Option(accounts.length ? 'Selecciona una cuenta' : 'No hay cuentas configuradas', ''),
  );
  for (const account of accounts) {
    elements.returnBankAccount.append(new Option(
      `${account.bank_name} · ${account.masked_account}`,
      account.id,
    ));
  }
  syncReturnRefundFields();
  updateReturnEstimate();
  closeReceiptDialog();
  elements.returnDialog.showModal();
}

async function submitSaleReturn(event) {
  event.preventDefault();
  const receipt = selectedReceiptForReturn;
  if (!receipt || !posSummary.openSession) return;
  const items = [...elements.returnItems.querySelectorAll('[data-return-quantity]')]
    .map((input) => ({
      saleItemId: input.dataset.saleItemId,
      quantity: Number(input.value),
    }))
    .filter((item) => item.quantity > 0);
  if (!items.length) {
    elements.returnFormError.textContent = 'Selecciona al menos una unidad para devolver.';
    elements.returnFormError.hidden = false;
    return;
  }
  elements.returnFormError.hidden = true;
  elements.saveReturnButton.disabled = true;
  elements.saveReturnButton.textContent = 'Registrando…';
  try {
    const saleReturn = await getJson(`/api/pos/sales/${receipt.id}/returns`, {
      method: 'POST',
      headers: { 'x-tenant-id': receipt.company_id || activeTenantId },
      body: JSON.stringify({
        cashSessionId: posSummary.openSession.id,
        refundMethod: elements.returnRefundMethod.value,
        bankAccountId: elements.returnRefundMethod.value === 'TRANSFER'
          ? elements.returnBankAccount.value
          : null,
        refundReference: elements.returnRefundReference.value || null,
        correctionConceptCode: elements.returnCorrectionConcept.value || null,
        reason: elements.returnReason.value,
        idempotencyKey: crypto.randomUUID(),
        items,
      }),
    });
    closeReturnDialog();
    showToast(
      `${saleReturn.return_number}: devolución registrada por ` +
      `${formatCurrency(saleReturn.total)}.`,
    );
    await loadPos();
  } catch (error) {
    elements.returnFormError.textContent = error.message;
    elements.returnFormError.hidden = false;
  } finally {
    elements.saveReturnButton.disabled = false;
    elements.saveReturnButton.textContent = 'Confirmar devolución';
  }
}

function posPaymentPayload() {
  if (!posMixedPayment) return null;
  const state = mixedPaymentState();
  return [
    state.cash > 0 ? {
      method: 'CASH',
      amount: state.cash,
      tenderedAmount: Number(elements.posCashReceived.value),
    } : null,
    state.card > 0 ? {
      method: 'CARD',
      amount: state.card,
    } : null,
    state.transfer > 0 ? {
      method: 'TRANSFER',
      amount: state.transfer,
      receivingCompanyId: elements.posTransferCompany.value,
      bankAccountId: elements.posTransferBankAccount.value,
      reference: elements.posTransferReference.value.trim(),
    } : null,
  ].filter(Boolean);
}

async function completeSale() {
  if (!posSummary.openSession || !saleCart.size) return;
  elements.posSaleError.hidden = true;
  try {
    const sellerCompanies = new Set(
      [...saleCart.values()].map(({ product }) =>
        product.seller_company_id || product.tenant_id || activeTenantId),
    );
    const billingPolicies = new Set(
      [...saleCart.values()].map(({ product }) =>
        product.billing_policy || 'ELECTRONIC_INVOICE'),
    );
    const requiresPolicyAwareCheckout = [...billingPolicies]
      .some((policy) => policy !== 'ELECTRONIC_INVOICE');
    // El cobro agrupado se reserva para pagos mixtos, productos de otra empresa,
    // o productos con diferentes políticas de facturación.
    const sharedCheckout = posSaleTerms === 'IMMEDIATE' && (
      posMixedPayment ||
      sellerCompanies.size > 1 ||
      !sellerCompanies.has(activeTenantId) ||
      billingPolicies.size > 1 ||
      requiresPolicyAwareCheckout
    );
    const grossTotal = [...saleCart.values()].reduce((sum, item) =>
      sum + productCommercialPrice(item.product, item.quantity).unitPrice * item.quantity, 0);
    const discount = posManualDiscountDraft(grossTotal);
    if (discount.amount > 0 && (!discount.reason || discount.amount > grossTotal ||
      (discount.type === 'PERCENT' && discount.value > 100))) {
      throw new Error('Revisa el descuento: debe tener un motivo y no superar el total de la venta.');
    }
    if (sharedCheckout && discount.amount > 0) {
      throw new Error('El descuento manual aún no está disponible en cobros combinados. Registra la venta por empresa para aplicarlo.');
    }
    elements.completeSaleButton.disabled = true;
    elements.completeSaleButton.textContent = 'Confirmando venta…';
    const firstCartItem = saleCart.values().next().value;
    const receipt = await getJson(sharedCheckout ? '/api/pos/sales/grouped' : '/api/pos/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeTenantId,
      },
      body: JSON.stringify({
        cashSessionId: posSummary.openSession.id,
        ...(sharedCheckout
          ? { stockSource: elements.posWarehouseSelect.value }
          : { warehouseId: firstCartItem?.product?.warehouse_id }),
        paymentMethod: elements.posPaymentMethod.value,
        payments: posMixedPayment ? posPaymentPayload() : null,
        saleTerms: posSaleTerms,
        customerId: elements.posCustomerSelect.value || null,
        dueDate: posSaleTerms === 'CREDIT' ? elements.posCreditDueDate.value : null,
        cashReceived: elements.posPaymentMethod.value === 'CASH'
          && posSaleTerms === 'IMMEDIATE'
          ? Number(elements.posCashReceived.value)
          : null,
        transferReceivingCompanyId: elements.posPaymentMethod.value === 'TRANSFER'
          && !posMixedPayment
          ? elements.posTransferCompany.value
          : null,
        transferBankAccountId: (
          elements.posPaymentMethod.value === 'TRANSFER' || posMixedPayment
        )
          ? elements.posTransferBankAccount.value
          : null,
        paymentReference: elements.posPaymentMethod.value === 'TRANSFER'
          && !posMixedPayment
          ? elements.posTransferReference.value.trim()
          : null,
        manualDiscount: discount.amount > 0
          ? { type: discount.type, amount: discount.value, reason: discount.reason }
          : null,
        items: [...saleCart.values()].map((item) => ({
          productId: item.product.id,
          ...(sharedCheckout ? { warehouseId: item.product.warehouse_id } : {}),
          quantity: item.quantity,
        })),
      }),
    });
    saleCart.clear();
    elements.posCashReceived.value = '';
    elements.posTransferReference.value = '';
    elements.posMixedCashAmount.value = '0';
    elements.posMixedCardAmount.value = '0';
    elements.posMixedTransferAmount.value = '0';
    elements.posDiscountAmount.value = '';
    elements.posDiscountReason.value = '';
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
elements.forgotPasswordButton.addEventListener('click', showRecoveryGate);
elements.backToLoginButton.addEventListener('click', () =>
  showAuthGate({ setupRequired: false }));
elements.recoveryRequestForm.addEventListener('submit', submitRecoveryRequest);
elements.resetPasswordForm.addEventListener('submit', submitResetPassword);
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
elements.quickLookupButton.addEventListener('click', openQuickLookup);
elements.closeQuickLookup.addEventListener('click', closeQuickLookup);
elements.quickLookupSearch.addEventListener('input', scheduleQuickLookup);
elements.quickLookupDialog.addEventListener('click', (event) => {
  if (event.target === elements.quickLookupDialog) closeQuickLookup();
});
elements.quickLookupDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeQuickLookup();
});
elements.companySearch.addEventListener('input', renderCompanies);
elements.branchSearch.addEventListener('input', renderBranches);
elements.warehouseSearch.addEventListener('input', renderWarehouses);
elements.productSearch.addEventListener('input', renderProducts);
elements.companyContext.addEventListener('change', async () => {
  activeTenantId = elements.companyContext.value;
  if (elements.productStructureDialog.open) closeProductStructureDialog();
  saleCart.clear();
  posCatalog = [];
  selectedReceivable = null;
  selectedPhysicalCount = null;
  selectedPurchase = null;
  selectedPayable = null;
  selectedExpense = null;
  selectedThirdParty = null;
  thirdParties = [];
  selectedLogisticsBatch = null;
  logisticsLabelBatchId = null;
  logisticsOverview = { summary: {}, batches: [], labelSettings: {} };
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
elements.closeTaxProfileDialog.addEventListener('click', closeTaxProfileDialog);
elements.cancelTaxProfileButton.addEventListener('click', closeTaxProfileDialog);
elements.taxProfileForm.addEventListener('submit', submitTaxProfile);
elements.taxProfileDialog.addEventListener('click', (event) => {
  if (event.target === elements.taxProfileDialog) closeTaxProfileDialog();
});
elements.companyDialog.addEventListener('click', (event) => {
  if (event.target === elements.companyDialog) closeCompanyDialog();
});
elements.companyIdentityForm.addEventListener('submit', submitCompanyIdentity);
elements.companyLogoFile.addEventListener('change', previewCompanyLogo);
elements.closeCompanyIdentityDialog.addEventListener('click', closeCompanyIdentityDialog);
elements.cancelCompanyIdentityButton.addEventListener('click', closeCompanyIdentityDialog);
elements.removeCompanyLogoButton.addEventListener('click', removeCompanyLogo);
elements.companyIdentityDialog.addEventListener('click', (event) => {
  if (event.target === elements.companyIdentityDialog) closeCompanyIdentityDialog();
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
elements.reloadAdvancedInventoryButton.addEventListener('click', () => {
  loadAdvancedInventory()
    .then(() => showToast('Control avanzado actualizado.'))
    .catch((error) => showToast(error.message));
});
elements.reloadLogisticsButton.addEventListener('click', () => {
  Promise.all([loadLogisticsOverview(), loadInventory(), loadAdvancedInventory()])
    .then(() => showToast('Operación logística sincronizada.'))
    .catch((error) => showToast(error.message));
});
elements.logisticsModuleToggle.addEventListener('change', toggleTenantModule);
elements.payrollModuleToggle.addEventListener('change', togglePayrollModule);
elements.logisticsBatchSearch.addEventListener('input', renderLogisticsBatches);
elements.logisticsBatchStatusFilter.addEventListener('change', renderLogisticsBatches);
elements.newLogisticsBatchButton.addEventListener('click', openLogisticsBatchDialog);
elements.closeLogisticsBatchDialog.addEventListener('click', closeLogisticsBatchDialog);
elements.cancelLogisticsBatchButton.addEventListener('click', closeLogisticsBatchDialog);
elements.logisticsBatchDialog.addEventListener('click', (event) => {
  if (event.target === elements.logisticsBatchDialog) closeLogisticsBatchDialog();
});
elements.logisticsBatchBranchId.addEventListener('change', syncLogisticsBatchWarehouses);
elements.logisticsBatchForm.addEventListener('submit', submitLogisticsBatch);
elements.logisticsScanForm.addEventListener('submit', submitLogisticsScan);
elements.logisticsScanForm
  .querySelector('[name="createIfMissing"]')
  .addEventListener('change', (event) => {
    const field = elements.logisticsScanForm.querySelector('.logistics-new-product-name');
    field.hidden = !event.currentTarget.checked;
    field.querySelector('input').required = event.currentTarget.checked;
  });
elements.logisticsDetailActions.addEventListener('click', (event) => {
  const button = event.target.closest('[data-logistics-action]');
  if (button) runLogisticsAction(button.dataset.logisticsAction)
    .catch((error) => showToast(error.message));
});
elements.logisticsItemList.addEventListener('click', (event) => {
  const pricingButton = event.target.closest('[data-logistics-price-save]');
  if (pricingButton) saveLogisticsPricing(pricingButton);
  const labelButton = event.target.closest('[data-logistics-label-item]');
  if (labelButton) {
    logisticsLabelBatchId = selectedLogisticsBatch.batch.id;
    renderLogisticsLabelCenter();
    openLogisticsLabelPrint(labelButton.dataset.logisticsLabelItem);
  }
});
elements.logisticsLabelBatchList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-logistics-label-batch]');
  if (button) selectLogisticsLabelBatch(button.dataset.logisticsLabelBatch)
    .catch((error) => showToast(error.message));
});
elements.logisticsLabelProductList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-logistics-print-item]');
  if (button) openLogisticsLabelPrint(button.dataset.logisticsPrintItem);
});
elements.printLogisticsBatchLabels.addEventListener(
  'click',
  () => openLogisticsLabelPrint(),
);
[
  elements.logisticsLabelSize,
  elements.logisticsLabelShowCompany,
  elements.logisticsLabelShowProduct,
  elements.logisticsLabelShowPrice,
  elements.logisticsLabelShowSku,
  elements.logisticsLabelShowBarcode,
  elements.logisticsLabelFooter,
].forEach((control) => {
  control.addEventListener('input', updateLogisticsLabelPreview);
  control.addEventListener('change', updateLogisticsLabelPreview);
});
elements.saveLogisticsLabelSettings.addEventListener(
  'click',
  saveLogisticsLabelConfiguration,
);
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin ||
      event.data?.type !== 'nubixor:labels-printed') return;
  markLogisticsLabelsPrinted(event.data.batchId, event.data.items)
    .catch((error) => showToast(error.message));
  try {
    window.localStorage.removeItem(`nubixor.label-job.${event.data.jobId}`);
  } catch {
    // La limpieza local no afecta el registro de impresión.
  }
});
window.addEventListener('online', flushLogisticsOfflineScans);
window.addEventListener('offline', syncLogisticsConnectionState);
document.querySelectorAll('[data-advanced-inventory-action]').forEach((button) => {
  button.addEventListener('click', () =>
    openAdvancedInventoryDialog(button.dataset.advancedInventoryAction));
});
elements.closeAdvancedInventoryDialog.addEventListener(
  'click',
  closeAdvancedInventoryDialog,
);
elements.cancelAdvancedInventoryButton.addEventListener(
  'click',
  closeAdvancedInventoryDialog,
);
elements.advancedInventoryForm.addEventListener('submit', submitAdvancedInventory);
elements.advancedInventoryDialog.addEventListener('click', (event) => {
  if (event.target === elements.advancedInventoryDialog) closeAdvancedInventoryDialog();
});
elements.inventorySearch.addEventListener('input', renderInventoryBalances);
elements.inventoryWarehouseFilter.addEventListener('change', renderInventoryBalances);
elements.openKardexButton.addEventListener('click', openKardexDialog);
elements.closeKardexDialog.addEventListener('click', closeKardexDialog);
elements.kardexForm.addEventListener('submit', loadKardex);
elements.kardexDialog.addEventListener('click', (event) => {
  if (event.target === elements.kardexDialog) closeKardexDialog();
});
document.querySelectorAll('[data-inventory-tab]').forEach((button) => {
  button.addEventListener('click', () => selectInventoryPanel(button.dataset.inventoryTab));
});
document.querySelectorAll('[data-inventory-route]').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.dataset.inventoryRoute;
    const targetView = panel === 'counts' ? 'inventario' : 'logistica';
    window.location.hash = targetView;
    showView(targetView);
    selectInventoryPanel(panel);
  });
});
document.querySelectorAll('[data-view-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.viewTarget;
    window.location.hash = view;
    showView(view);
  });
});
elements.openCountsPanelButton.addEventListener('click', () => {
  selectInventoryPanel('counts');
  elements.newCountButton.focus();
});
elements.newAdjustmentButton.addEventListener('click', () => openAdjustmentDialog());
elements.newInventoryIncidentButton.addEventListener(
  'click',
  openInventoryIncidentDialog,
);
elements.closeInventoryIncidentDialog.addEventListener(
  'click',
  closeInventoryIncidentDialog,
);
elements.cancelInventoryIncidentButton.addEventListener(
  'click',
  closeInventoryIncidentDialog,
);
elements.inventoryIncidentForm.addEventListener(
  'submit',
  submitInventoryIncident,
);
elements.inventoryIncidentType.addEventListener('change', syncInventoryIncidentForm);
elements.inventoryIncidentProductId.addEventListener(
  'change',
  syncInventoryIncidentForm,
);
elements.inventoryIncidentWarehouseId.addEventListener(
  'change',
  syncInventoryIncidentForm,
);
elements.inventoryIncidentDialog.addEventListener('click', (event) => {
  if (event.target === elements.inventoryIncidentDialog) {
    closeInventoryIncidentDialog();
  }
});
elements.closeAdjustmentDialog.addEventListener('click', closeAdjustmentDialog);
elements.cancelAdjustmentButton.addEventListener('click', closeAdjustmentDialog);
elements.adjustmentForm.addEventListener('submit', submitAdjustment);
elements.adjustmentDialog.addEventListener('click', (event) => {
  if (event.target === elements.adjustmentDialog) closeAdjustmentDialog();
});
elements.newTransferButton.addEventListener('click', () => openTransferDialog());
elements.closeTransferDialog.addEventListener('click', closeTransferDialog);
elements.cancelTransferButton.addEventListener('click', closeTransferDialog);
elements.transferForm.addEventListener('submit', submitTransfer);
elements.transferProductId.addEventListener('change', syncTransferWarehouses);
elements.transferSourceWarehouseId.addEventListener('change', updateTransferAvailability);
elements.transferRequiresReception.addEventListener('change', () => {
  elements.transferDispatchReferenceField.hidden =
    !elements.transferRequiresReception.checked;
});
elements.transferDialog.addEventListener('click', (event) => {
  if (event.target === elements.transferDialog) closeTransferDialog();
});
elements.closeReplenishmentDialog.addEventListener('click', closeReplenishmentDialog);
elements.cancelReplenishmentButton.addEventListener('click', closeReplenishmentDialog);
elements.replenishmentForm.addEventListener('submit', submitReplenishmentRule);
elements.replenishmentDialog.addEventListener('click', (event) => {
  if (event.target === elements.replenishmentDialog) closeReplenishmentDialog();
});
elements.reloadThirdPartiesButton.addEventListener('click', () => {
  loadThirdParties()
    .then(() => showToast('Directorio de terceros actualizado.'))
    .catch(() => showToast('No fue posible actualizar los terceros.'));
});
elements.thirdPartySearch.addEventListener('input', () => {
  window.clearTimeout(thirdPartySearchTimer);
  thirdPartySearchTimer = window.setTimeout(() => loadThirdParties().catch(() => {}), 250);
});
elements.thirdPartyRoleFilter.addEventListener('change', () =>
  loadThirdParties().catch(() => {}));
elements.thirdPartyStatusFilter.addEventListener('change', () =>
  loadThirdParties().catch(() => {}));
elements.newThirdPartyButton.addEventListener('click', () => openThirdPartyDialog());
elements.editThirdPartyButton.addEventListener('click', () => {
  if (selectedThirdParty) openThirdPartyDialog(selectedThirdParty);
});
elements.closeThirdPartyDialog.addEventListener('click', closeThirdPartyDialog);
elements.cancelThirdPartyButton.addEventListener('click', closeThirdPartyDialog);
elements.thirdPartyForm.addEventListener('submit', submitThirdParty);
elements.thirdPartyDialog.addEventListener('click', (event) => {
  if (event.target === elements.thirdPartyDialog) closeThirdPartyDialog();
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
elements.uploadPurchaseElectronicButton.addEventListener('click', openPurchaseElectronicDialog);
elements.emitPurchaseRadianEventButton.addEventListener('click', openPurchaseRadianDialog);
elements.checkPurchaseSupportDocumentButton.addEventListener('click', () => {
  if (selectedPurchase) loadPurchaseSupportDocumentReadiness(selectedPurchase.id);
});
elements.closePurchaseElectronicDialog.addEventListener('click', closePurchaseElectronicDialog);
elements.cancelPurchaseElectronicButton.addEventListener('click', closePurchaseElectronicDialog);
elements.purchaseElectronicForm.addEventListener('submit', submitPurchaseElectronicReception);
elements.purchaseElectronicDialog.addEventListener('click', (event) => {
  if (event.target === elements.purchaseElectronicDialog) closePurchaseElectronicDialog();
});
elements.closePurchaseRadianDialog.addEventListener('click', closePurchaseRadianDialog);
elements.cancelPurchaseRadianButton.addEventListener('click', closePurchaseRadianDialog);
elements.purchaseRadianForm.addEventListener('submit', submitPurchaseRadianEvent);
elements.purchaseRadianDialog.addEventListener('click', (event) => {
  if (event.target === elements.purchaseRadianDialog) closePurchaseRadianDialog();
});
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
elements.payablePaymentMethod.addEventListener('change', syncPayablePaymentBankField);
elements.payablePaymentForm.addEventListener('submit', submitPayablePayment);
elements.payablePaymentDialog.addEventListener('click', (event) => {
  if (event.target === elements.payablePaymentDialog) closePayablePaymentDialog();
});
elements.reloadExpensesButton.addEventListener('click', () => {
  loadExpenses()
    .then(() => showToast('Gastos actualizados.'))
    .catch(() => showToast('No fue posible actualizar los gastos.'));
});
elements.expenseSearch.addEventListener('input', renderExpenseList);
elements.expenseStatusFilter.addEventListener('change', renderExpenseList);
elements.newExpenseButton.addEventListener('click', openExpenseDialog);
elements.closeExpenseDialog.addEventListener('click', closeExpenseDialog);
elements.cancelExpenseButton.addEventListener('click', closeExpenseDialog);
elements.expenseForm.addEventListener('submit', submitExpense);
elements.expenseBranchId.addEventListener('change', syncExpenseCostCenters);
elements.expenseSupplierId.addEventListener('change', syncExpenseBeneficiary);
elements.expenseRecurring.addEventListener('change', syncExpenseRecurrence);
elements.expenseSubtotal.addEventListener('input', updateExpenseDraftTotal);
elements.expenseTaxTotal.addEventListener('input', updateExpenseDraftTotal);
elements.expenseDialog.addEventListener('click', (event) => {
  if (event.target === elements.expenseDialog) closeExpenseDialog();
});
elements.approveExpenseButton.addEventListener(
  'click',
  () => openExpenseDecision('approve'),
);
elements.rejectExpenseButton.addEventListener(
  'click',
  () => openExpenseDecision('reject'),
);
elements.expenseDecisionForm.addEventListener('submit', submitExpenseDecision);
elements.closeExpenseDecisionDialog.addEventListener(
  'click',
  closeExpenseDecisionDialog,
);
elements.cancelExpenseDecision.addEventListener('click', closeExpenseDecisionDialog);
elements.expenseDecisionDialog.addEventListener('click', (event) => {
  if (event.target === elements.expenseDecisionDialog) closeExpenseDecisionDialog();
});
elements.payExpenseButton.addEventListener('click', openExpensePaymentDialog);
elements.expensePaymentMethod.addEventListener('change', syncExpensePaymentSource);
elements.expensePaymentForm.addEventListener('submit', submitExpensePayment);
elements.closeExpensePaymentDialog.addEventListener(
  'click',
  closeExpensePaymentDialog,
);
elements.cancelExpensePayment.addEventListener('click', closeExpensePaymentDialog);
elements.expensePaymentDialog.addEventListener('click', (event) => {
  if (event.target === elements.expensePaymentDialog) closeExpensePaymentDialog();
});
elements.newCostCenterButton.addEventListener('click', openCostCenterDialog);
elements.costCenterForm.addEventListener('submit', submitCostCenter);
elements.closeCostCenterDialog.addEventListener('click', closeCostCenterDialog);
elements.cancelCostCenter.addEventListener('click', closeCostCenterDialog);
elements.costCenterDialog.addEventListener('click', (event) => {
  if (event.target === elements.costCenterDialog) closeCostCenterDialog();
});
elements.newExpenseCategoryButton.addEventListener(
  'click',
  openExpenseCategoryDialog,
);
elements.expenseCategoryForm.addEventListener('submit', submitExpenseCategory);
elements.closeExpenseCategoryDialog.addEventListener(
  'click',
  closeExpenseCategoryDialog,
);
elements.cancelExpenseCategory.addEventListener('click', closeExpenseCategoryDialog);
elements.expenseCategoryDialog.addEventListener('click', (event) => {
  if (event.target === elements.expenseCategoryDialog) closeExpenseCategoryDialog();
});
elements.reloadPayrollButton.addEventListener('click', () => {
  loadPayroll().then(() => showToast('Nómina actualizada.')).catch(() => showToast('No fue posible actualizar Nómina.'));
});
elements.newPayrollEmployeeButton.addEventListener('click', openPayrollEmployeeDialog);
elements.newPayrollPeriodButton.addEventListener('click', openPayrollPeriodDialog);
elements.newPayrollNoveltyButton.addEventListener('click', openPayrollNoveltyDialog);
elements.approvePayrollPeriodButton.addEventListener('click', approvePayrollPeriod);
elements.configurePayrollFactusButton.addEventListener('click', openBillingConnectionDialog);
elements.testPayrollFactusButton.addEventListener('click', () => testBillingConnection());
elements.payrollEmployeeForm.addEventListener('submit', submitPayrollEmployee);
elements.payrollContractForm.addEventListener('submit', submitPayrollContract);
elements.payrollPeriodForm.addEventListener('submit', submitPayrollPeriod);
elements.payrollNoveltyForm.addEventListener('submit', submitPayrollNovelty);
[
  [elements.payrollEmployeeDialog, elements.closePayrollEmployeeDialog, elements.cancelPayrollEmployeeButton],
  [elements.payrollContractDialog, elements.closePayrollContractDialog, elements.cancelPayrollContractButton],
  [elements.payrollPeriodDialog, elements.closePayrollPeriodDialog, elements.cancelPayrollPeriodButton],
  [elements.payrollNoveltyDialog, elements.closePayrollNoveltyDialog, elements.cancelPayrollNoveltyButton],
].forEach(([dialog, closeButton, cancelButton]) => {
  closeButton.addEventListener('click', () => closePayrollDialog(dialog));
  cancelButton.addEventListener('click', () => closePayrollDialog(dialog));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closePayrollDialog(dialog); });
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
elements.revokeUserSessionsButton.addEventListener('click', revokeUserSessions);
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
elements.openCatalogImportButton.addEventListener('click', openCatalogImportDialog);
elements.closeCatalogImportDialog.addEventListener('click', closeCatalogImportDialog);
elements.cancelCatalogImport.addEventListener('click', closeCatalogImportDialog);
elements.catalogImportDialog.addEventListener('click', (event) => {
  if (event.target === elements.catalogImportDialog) closeCatalogImportDialog();
});
elements.downloadCatalogTemplate.addEventListener(
  'click',
  downloadCatalogImportTemplate,
);
elements.catalogImportFile.addEventListener('change', catalogImportFileChanged);
elements.previewCatalogImport.addEventListener('click', previewCatalogImportFile);
elements.commitCatalogImport.addEventListener('click', commitCatalogImportFile);
elements.newProductButton.addEventListener('click', openProductDialog);
elements.newComboProductButton.addEventListener('click', () => {
  showCatalogPanel('products');
  openProductDialog();
  showToast('Crea el producto y luego selecciona “Colores o combo”.');
});
elements.productPriceForm.addEventListener('submit', submitProductPrice);
elements.customerPriceListForm.addEventListener(
  'submit',
  submitCustomerPriceList,
);
elements.promotionForm.addEventListener('submit', submitPromotion);
elements.reloadCommercialPlanningButton.addEventListener('click', () => {
  loadCommercialPlanning()
    .then(() => showToast('Planificación comercial actualizada.'))
    .catch(() => showToast('No fue posible actualizar la planificación.'));
});
elements.newCommercialPlanButton.addEventListener('click', openCommercialPlanDialog);
elements.newCommercialInitiativeButton.addEventListener('click', openCommercialInitiativeDialog);
elements.closeCommercialPlanDialog.addEventListener('click', closeCommercialPlanDialog);
elements.cancelCommercialPlanButton.addEventListener('click', closeCommercialPlanDialog);
elements.commercialPlanForm.addEventListener('submit', submitCommercialPlan);
elements.commercialPlanDialog.addEventListener('click', (event) => {
  if (event.target === elements.commercialPlanDialog) closeCommercialPlanDialog();
});
elements.closeCommercialInitiativeDialog.addEventListener('click', closeCommercialInitiativeDialog);
elements.cancelCommercialInitiativeButton.addEventListener('click', closeCommercialInitiativeDialog);
elements.commercialInitiativeForm.addEventListener('submit', submitCommercialInitiative);
elements.commercialInitiativeDialog.addEventListener('click', (event) => {
  if (event.target === elements.commercialInitiativeDialog) closeCommercialInitiativeDialog();
});
[
  elements.commercialOpportunityRotation,
  elements.commercialOpportunityPriority,
  elements.commercialOpportunityCampaign,
].forEach((select) => {
  select.addEventListener('change', () => {
    loadCommercialPlanning().catch(() => showToast('No fue posible filtrar oportunidades.'));
  });
});
elements.pricingCustomerId.addEventListener('change', () => {
  const customer = pricingOverview.customers.find(
    (item) => item.id === elements.pricingCustomerId.value,
  );
  elements.customerPriceListId.value = customer?.sales_price_list_id || '';
});
elements.pricingProductId.addEventListener('change', () => {
  const product = pricingOverview.products.find(
    (item) => item.id === elements.pricingProductId.value,
  );
  if (product) {
    elements.productPriceForm.elements.unitPrice.value =
      String(Number(product.sale_price));
  }
});
elements.closeProductDialog.addEventListener('click', closeProductDialog);
elements.cancelProductButton.addEventListener('click', closeProductDialog);
elements.productForm.addEventListener('submit', submitProduct);
elements.productExcludeFromEinvoice.addEventListener('change', syncProductEinvoiceExclusion);
elements.productDialog.addEventListener('click', (event) => {
  if (event.target === elements.productDialog) closeProductDialog();
});
elements.closeProductStructureDialog.addEventListener(
  'click',
  closeProductStructureDialog,
);
elements.productStructureDialog.addEventListener('click', (event) => {
  if (event.target === elements.productStructureDialog) {
    closeProductStructureDialog();
  }
});
document.querySelectorAll('[data-product-structure-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    selectProductStructurePanel(button.dataset.productStructureTab);
  });
});
elements.productVariantForm.addEventListener('submit', submitProductVariant);
elements.addComboComponent.addEventListener('click', () => {
  addComboComponentRow();
});
elements.productComboForm.addEventListener('submit', submitProductCombo);
elements.productComboAssemblyForm.addEventListener(
  'submit',
  submitProductComboAssembly,
);
elements.productImageFile.addEventListener('change', previewProductImage);
elements.captureProductImageButton.addEventListener('click', captureProductImage);
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
elements.closeCashCloseReceipt.addEventListener('click', closeCashCloseReceiptDialog);
elements.finishCashCloseReceipt.addEventListener('click', closeCashCloseReceiptDialog);
elements.printCashCloseReceipt.addEventListener('click', () => window.print());
elements.cashCloseReceiptDialog.addEventListener('click', (event) => {
  if (event.target === elements.cashCloseReceiptDialog) closeCashCloseReceiptDialog();
});
elements.closeCashMovementDialog.addEventListener('click', closeCashMovementDialog);
elements.cancelCashMovementButton.addEventListener('click', closeCashMovementDialog);
elements.cashMovementForm.addEventListener('submit', submitCashMovement);
elements.cashMovementDialog.addEventListener('click', (event) => {
  if (event.target === elements.cashMovementDialog) closeCashMovementDialog();
});
elements.openSalesHistoryButton.addEventListener('click', openSalesHistoryDialog);
elements.closeSalesHistoryDialog.addEventListener('click', closeSalesHistoryDialog);
elements.finishSalesHistoryButton.addEventListener('click', closeSalesHistoryDialog);
elements.posDocumentCompanyFilter.addEventListener('change', renderPosSalesHistory);
elements.posDocumentPaymentFilter.addEventListener('change', renderPosSalesHistory);
elements.salesHistoryDialog.addEventListener('click', (event) => {
  if (event.target === elements.salesHistoryDialog) closeSalesHistoryDialog();
});
elements.posWarehouseSelect.addEventListener('change', async () => {
  saleCart.clear();
  activePosCategory = 'ALL';
  await loadPosCatalog().catch(() => {});
});
elements.posProductSearch.addEventListener('input', renderPosCatalog);
elements.openPosScannerButton.addEventListener('click', openPosScanner);
elements.closePosScannerDialog.addEventListener('click', closePosScanner);
elements.cancelPosScannerButton.addEventListener('click', closePosScanner);
elements.posScannerDialog.addEventListener('click', (event) => {
  if (event.target === elements.posScannerDialog) closePosScanner();
});
elements.posProductSearch.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const query = normalizeSearch(elements.posProductSearch.value.trim());
  if (!query) return;
  const exactProduct = posCatalog.find((product) =>
    normalizeSearch(product.sku) === query ||
    normalizeSearch(product.barcode || '') === query);
  if (exactProduct) {
    addProductToCart(exactProduct);
    elements.posProductSearch.value = '';
    renderPosCatalog();
    showToast(`${exactProduct.name} agregado a la venta.`);
    return;
  }
  const matchingFamilies = buildPosCatalogGroups(posCatalog).filter((group) =>
    normalizeSearch(group.sku) === query || normalizeSearch(group.invoice_code || '') === query);
  if (matchingFamilies.length === 1) {
    const [family] = matchingFamilies;
    if (family.isGrouped && family.variants.length > 1) {
      openPosVariantSelectorModal(family);
      return;
    }
    addProductToCart(family.variants[0]);
    elements.posProductSearch.value = '';
    renderPosCatalog();
    showToast(`${family.name} agregado a la venta.`);
    return;
  }
  showToast(matchingFamilies.length > 1
    ? 'Hay productos de más de una empresa con ese código. Selecciona la tarjeta correspondiente.'
    : 'No encontramos un SKU o código de barras exacto.');
});
elements.clearCartButton.addEventListener('click', clearCart);
elements.posCustomerSelect.addEventListener('change', async () => {
  renderPosCustomerContext();
  try {
    await loadPosCatalog();
    const customer = posCustomers.find(
      (item) => item.id === elements.posCustomerSelect.value,
    );
    showToast(
      customer?.price_list_name
        ? `Precios de ${customer.price_list_name} aplicados.`
        : 'Precio unitario y promociones vigentes aplicados.',
    );
  } catch {
    renderCart();
  }
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
for (const input of [elements.posDiscountType, elements.posDiscountAmount, elements.posDiscountReason]) {
  input.addEventListener('input', renderCart);
  input.addEventListener('change', renderCart);
}
elements.posCashReceived.addEventListener('input', () => {
  updateCashSettlement(calculateCartTotals());
});
elements.posTransferCompany.addEventListener('change', renderCart);
elements.posTransferBankAccount.addEventListener('change', renderCart);
elements.posTransferReference.addEventListener('input', renderCart);
elements.toggleMixedPaymentButton.addEventListener('click', () => {
  posMixedPayment = !posMixedPayment;
  if (posMixedPayment) {
    elements.posMixedCashAmount.value = String(calculateCartTotals().total);
    elements.posMixedCardAmount.value = '0';
    elements.posMixedTransferAmount.value = '0';
    elements.posPaymentMethod.value = 'CASH';
  }
  elements.posCashReceived.value = '';
  renderCart();
});
elements.posMixedCashAmount.addEventListener('input', renderCart);
for (const input of [elements.posMixedCardAmount, elements.posMixedTransferAmount]) {
  input.addEventListener('input', () => {
    const totals = calculateCartTotals();
    const otherAmount =
      Number(elements.posMixedCardAmount.value || 0) +
      Number(elements.posMixedTransferAmount.value || 0);
    elements.posMixedCashAmount.value = String(Math.max(0, totals.total - otherAmount));
    renderCart();
  });
}
elements.posPaymentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    posMixedPayment = false;
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
elements.openReturnDialogButton.addEventListener('click', openReturnDialog);
elements.printReceiptButton.addEventListener('click', printReceiptTicket);
elements.finishReceiptButton.addEventListener('click', closeReceiptDialog);
elements.receiptDialog.addEventListener('click', (event) => {
  if (event.target === elements.receiptDialog) closeReceiptDialog();
});
elements.returnRefundMethod.addEventListener('change', syncReturnRefundFields);
elements.returnForm.addEventListener('submit', submitSaleReturn);
elements.closeReturnDialog.addEventListener('click', closeReturnDialog);
elements.cancelReturnButton.addEventListener('click', closeReturnDialog);
elements.returnDialog.addEventListener('click', (event) => {
  if (event.target === elements.returnDialog) closeReturnDialog();
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
elements.configureBillingConnectionButton.addEventListener(
  'click',
  openBillingConnectionDialog,
);
elements.testBillingConnectionButton.addEventListener('click', testBillingConnection);
elements.refreshBillingDiagnosticsButton.addEventListener('click', async () => {
  elements.refreshBillingDiagnosticsButton.disabled = true;
  elements.refreshBillingDiagnosticsButton.textContent = 'Actualizando…';
  try {
    await loadElectronicBilling();
    showToast('Diagnóstico de Factus actualizado.');
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.refreshBillingDiagnosticsButton.disabled = false;
    elements.refreshBillingDiagnosticsButton.textContent = 'Actualizar diagnóstico';
  }
});
elements.billingContingencyButton.addEventListener('click', startBillingContingency);
elements.closeBillingContingencyButton.addEventListener(
  'click',
  closeBillingContingency,
);
elements.closeBillingConnectionDialog.addEventListener(
  'click',
  closeBillingConnectionDialog,
);
elements.cancelBillingConnectionButton.addEventListener(
  'click',
  closeBillingConnectionDialog,
);
elements.billingConnectionForm.addEventListener('submit', saveBillingConnection);
elements.billingProviderCode.addEventListener('change', syncBillingProviderFields);
elements.billingProviderEnvironmentInput.addEventListener(
  'change',
  syncBillingProviderFields,
);
elements.billingConnectionDialog.addEventListener('click', (event) => {
  if (event.target === elements.billingConnectionDialog) closeBillingConnectionDialog();
});
elements.newBillingResolutionButton.addEventListener(
  'click',
  openBillingResolutionDialog,
);
elements.closeBillingResolutionDialog.addEventListener(
  'click',
  closeBillingResolutionDialog,
);
elements.cancelBillingResolutionButton.addEventListener(
  'click',
  closeBillingResolutionDialog,
);
elements.billingResolutionForm.addEventListener('submit', saveBillingResolution);
elements.factusNumberingRangeSelect.addEventListener(
  'change',
  applySelectedFactusRange,
);
elements.billingResolutionDialog.addEventListener('click', (event) => {
  if (event.target === elements.billingResolutionDialog) closeBillingResolutionDialog();
});
elements.reloadBillingWorkflowButton.addEventListener('click', () => {
  loadBillingWorkflow()
    .then(() => showToast('Estados de facturación actualizados.'))
    .catch((error) => showToast(error.message));
});
elements.newQuoteButton.addEventListener('click', openQuoteDialog);
elements.addQuoteItemButton.addEventListener('click', () => addQuoteItemRow());
elements.closeQuoteDialog.addEventListener('click', closeQuoteDialog);
elements.cancelQuoteButton.addEventListener('click', closeQuoteDialog);
elements.quoteForm.addEventListener('submit', submitQuote);
elements.quoteDialog.addEventListener('click', (event) => {
  if (event.target === elements.quoteDialog) closeQuoteDialog();
});
elements.newBillingNoteButton.addEventListener('click', openBillingNoteDialog);
elements.closeBillingNoteDialog.addEventListener('click', closeBillingNoteDialog);
elements.cancelBillingNoteButton.addEventListener('click', closeBillingNoteDialog);
elements.billingNoteForm.addEventListener('submit', submitBillingNote);
elements.billingNoteDocumentId.addEventListener('change', () => {
  loadBillingNoteItems(elements.billingNoteDocumentId.value);
});
elements.billingNoteDialog.addEventListener('click', (event) => {
  if (event.target === elements.billingNoteDialog) closeBillingNoteDialog();
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
elements.runAuditControls.addEventListener('click', runAndSealAuditControls);
elements.exportAuditEvidence.addEventListener('click', exportAuditEvidence);
elements.openAccountantReview.addEventListener('click', openAccountantReviewDialog);
elements.closeAccountantReview.addEventListener('click', closeAccountantReviewDialog);
elements.cancelAccountantReview.addEventListener('click', closeAccountantReviewDialog);
elements.accountantReviewForm.addEventListener('submit', saveAccountantReview);
elements.accountantReviewDialog.addEventListener('click', (event) => {
  if (event.target === elements.accountantReviewDialog) closeAccountantReviewDialog();
});
elements.newAccountingAccount.addEventListener('click', openAccountingAccountDialog);
elements.closeAccountingAccount.addEventListener('click', closeAccountingAccountDialog);
elements.cancelAccountingAccount.addEventListener('click', closeAccountingAccountDialog);
elements.accountingAccountForm.addEventListener('submit', saveAccountingAccount);
elements.accountingAccountDialog.addEventListener('click', (event) => {
  if (event.target === elements.accountingAccountDialog) closeAccountingAccountDialog();
});
elements.newBankAccountButton.addEventListener('click', openBankAccountDialog);
elements.closeBankAccountDialog.addEventListener('click', closeBankAccountDialog);
elements.cancelBankAccount.addEventListener('click', closeBankAccountDialog);
elements.bankAccountForm.addEventListener('submit', submitBankAccount);
elements.bankAccountDialog.addEventListener('click', (event) => {
  if (event.target === elements.bankAccountDialog) closeBankAccountDialog();
});
elements.newBankTransactionButton.addEventListener(
  'click',
  openBankTransactionDialog,
);
elements.closeBankTransactionDialog.addEventListener(
  'click',
  closeBankTransactionDialog,
);
elements.cancelBankTransaction.addEventListener(
  'click',
  closeBankTransactionDialog,
);
elements.bankTransactionForm.addEventListener('submit', submitBankTransaction);
elements.bankTransactionDialog.addEventListener('click', (event) => {
  if (event.target === elements.bankTransactionDialog) {
    closeBankTransactionDialog();
  }
});
elements.completeBankReconciliationButton.addEventListener(
  'click',
  openBankReconciliationDialog,
);
elements.closeBankReconciliationDialog.addEventListener(
  'click',
  closeBankReconciliationDialog,
);
elements.cancelBankReconciliation.addEventListener(
  'click',
  closeBankReconciliationDialog,
);
elements.bankReconciliationForm.addEventListener(
  'submit',
  submitBankReconciliation,
);
elements.bankReconciliationDialog.addEventListener('click', (event) => {
  if (event.target === elements.bankReconciliationDialog) {
    closeBankReconciliationDialog();
  }
});
elements.downloadMonthlyPackageButton.addEventListener(
  'click',
  downloadMonthlyPackage,
);
elements.closeAccountingAction.addEventListener('click', closeAccountingAction);
elements.cancelAccountingAction.addEventListener('click', closeAccountingAction);
elements.accountingActionForm.addEventListener('submit', saveAccountingAction);
elements.accountingActionDialog.addEventListener('click', (event) => {
  if (event.target === elements.accountingActionDialog) closeAccountingAction();
});
[elements.auditPeriodFrom, elements.auditPeriodTo].forEach((input) => {
  input.addEventListener('change', () => {
    Promise.all([
      loadAuditReadiness(),
      loadAccountingLedger(),
      loadAccountingControls(),
    ])
      .catch((error) => renderAuditReadinessError(error.message));
  });
});
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
elements.receivablePaymentMethod.addEventListener('change', syncReceivablePaymentBankField);
elements.paymentForm.addEventListener('submit', submitPayment);
elements.paymentDialog.addEventListener('click', (event) => {
  if (event.target === elements.paymentDialog) closePaymentDialog();
});
document.querySelectorAll('[data-catalog-tab]').forEach((tab) => {
  tab.addEventListener('click', () => showCatalogPanel(tab.dataset.catalogTab));
});
elements.menuButton.addEventListener('click', () => toggleMenu());
elements.sidebarScrim.addEventListener('click', () => toggleMenu(false));
document.querySelectorAll('.nav-group-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    toggleSidebarGroup(button.closest('.nav-group'));
  });
  button.addEventListener('keydown', (event) => {
    const buttons = [...document.querySelectorAll('.nav-group-toggle')]
      .filter((item) => !item.closest('.nav-group')?.hidden);
    const currentIndex = buttons.indexOf(button);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(currentIndex + direction + buttons.length) % buttons.length]?.focus();
    }
  });
});
document.querySelectorAll('[data-view-link]').forEach((link) => {
  link.addEventListener('click', () => {
    showView(link.dataset.viewLink);
    if (elements.sidebar.contains(link)) toggleMenu(false);
  });
});
window.addEventListener('hashchange', () => {
  showView(window.location.hash.replace(/^#/, '') || 'inicio');
});
window.addEventListener('keydown', (event) => {
  if (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    event.key.toLowerCase() === 'k'
  ) {
    event.preventDefault();
    openQuickLookup();
    return;
  }
  if (event.key === 'F2' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    if (
      document.body.dataset.activeView === 'caja' &&
      !elements.posProductSearch.disabled
    ) {
      elements.posProductSearch.focus();
      elements.posProductSearch.select();
    } else {
      openQuickLookup();
    }
    return;
  }
  if (event.key === 'Escape' && elements.sidebar.classList.contains('open')) {
    toggleMenu(false);
    elements.menuButton.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 820 && elements.sidebar.classList.contains('open')) {
    toggleMenu(false);
  }
});

const macKeyboard = /Mac|iPhone|iPad|iPod/i.test(
  navigator.userAgentData?.platform || navigator.platform || '',
);
elements.quickLookupShortcut.textContent = macKeyboard ? '⌘ K' : 'Ctrl K';

function initNetworkStatusMonitor() {
  const statusBar = document.createElement('div');
  statusBar.className = 'network-status-bar online';
  statusBar.innerHTML = '<span class="network-status-dot"></span><span class="network-status-text">Conectado</span>';
  document.body.appendChild(statusBar);

  function updateStatus() {
    const isOnline = navigator.onLine;
    statusBar.className = `network-status-bar ${isOnline ? 'online' : 'offline'}`;
    statusBar.querySelector('.network-status-text').textContent = isOnline ? 'Conectado' : 'Sin conexión';
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
}

initNetworkStatusMonitor();

function labelResponsiveTables(root = document) {
  const tables = root.querySelectorAll?.('table') || [];
  tables.forEach((table) => {
    const headers = [...table.querySelectorAll('thead th')]
      .map((header) => header.textContent.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    if (!headers.length) return;
    table.dataset.mobileCards = 'true';
    table.querySelectorAll('tbody tr').forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (cell.tagName !== 'TD' || cell.hasAttribute('data-label')) return;
        cell.setAttribute('data-label', headers[index] || '');
      });
    });
  });
}

function initResponsiveTableLabels() {
  const scheduleLabeling = (() => {
    let pending = false;
    return () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        labelResponsiveTables(document);
      });
    };
  })();

  labelResponsiveTables(document);
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length)) scheduleLabeling();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

initResponsiveTableLabels();

let realtimeRefreshInFlight = false;

function shouldPauseRealtimeRefresh(view) {
  // Nunca reemplazamos una pantalla mientras el usuario tiene una operación abierta.
  // En caja esto evita perder un carrito que todavía no se ha cobrado.
  if (document.querySelector('dialog[open]')) return true;
  return view === 'caja' && saleCart.size > 0;
}

async function triggerRealtimeDataRefresh({ force = false } = {}) {
  if (!activeTenantId || realtimeRefreshInFlight) return;
  const currentView = document.body.dataset.activeView || 'inicio';
  if (shouldPauseRealtimeRefresh(currentView) || (!force && document.hidden)) return;

  realtimeRefreshInFlight = true;
  try {
    const refreshByView = {
      inicio: () => Promise.all([
        hasAnyPermission('dashboard.view') ? loadExecutiveSummary() : Promise.resolve(),
        hasAnyPermission('dashboard.view') ? loadOnboardingStatus() : Promise.resolve(),
      ]),
      empresas: () => loadCompanies(),
      sucursales: () => loadBranches(),
      terceros: () => loadThirdParties(),
      bodegas: () => loadWarehouses(),
      inventario: () => Promise.all([
        loadInventory(),
        isTenantModuleEnabled('LOGISTICS') ? loadAdvancedInventory() : Promise.resolve(),
        loadPhysicalCounts(),
      ]),
      logistica: () => Promise.all([
        loadLogisticsOverview(),
        loadInventory(),
        loadAdvancedInventory(),
      ]),
      productos: () => loadCatalog(),
      compras: () => loadPurchases(),
      'cuentas-pagar': () => loadPayables(),
      gastos: () => loadExpenses(),
      nomina: () => loadPayroll(),
      usuarios: () => loadUsers(),
      caja: async () => {
        await loadPos();
        await loadPosCatalog();
      },
      cartera: () => loadReceivables(),
      facturacion: () => Promise.all([loadElectronicBilling(), loadBillingWorkflow()]),
      'planificacion-comercial': () => loadCommercialPlanning(),
      reportes: () => loadReports(),
      auditoria: () => Promise.all([loadAudit(), loadAuditReadiness()]),
    };
    await refreshByView[currentView]?.();
  } catch (_) {
    // La actualización silenciosa no debe interrumpir el trabajo en curso.
  } finally {
    realtimeRefreshInFlight = false;
  }
}

function startLiveRealtimeUpdates() {
  setInterval(async () => {
    await triggerRealtimeDataRefresh();
  }, 5000);
  window.addEventListener('focus', () => triggerRealtimeDataRefresh({ force: true }));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) triggerRealtimeDataRefresh({ force: true });
  });
}

startLiveRealtimeUpdates();
startApplication();
