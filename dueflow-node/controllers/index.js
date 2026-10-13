const makeCrudController = require('./crudController');

module.exports = {
  organizationController: makeCrudController('Organization'),
  userController: makeCrudController('User'),
  vendorController: makeCrudController('Vendor'),
  complianceRuleController: makeCrudController('ComplianceRule'),
  ledgerImportController: makeCrudController('LedgerImport'),
  invoiceController: makeCrudController('Invoice'),
  agentRunController: makeCrudController('AgentRun'),
  agentStepController: makeCrudController('AgentStep'),
  paymentPlanController: makeCrudController('PaymentPlan'),
  planItemController: makeCrudController('PlanItem'),
  approvalController: makeCrudController('Approval'),
  paymentController: makeCrudController('Payment'),
  vendorNoticeController: makeCrudController('VendorNotice'),
  auditLogController: makeCrudController('AuditLog'),
  agentMemoryController: makeCrudController('AgentMemory'),
  notificationController: makeCrudController('Notification'),
};
