// ============================================
// Constantes de negocio — Integra Sutec
// ============================================

const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const MOVEMENT_TYPES = {
  ENTRY: 'entry',
  EXIT: 'exit',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
};

const REFERENCE_TYPES = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
};

const QUOTE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
};

const PAYMENT_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CARD: 'card',
  CREDIT: 'credit',
};

const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SELLER: 'seller',
  VIEWER: 'viewer',
};

// Guatemala tax rate (IVA 12%)
const TAX_RATE = 0.12;

const CURRENCY = {
  CODE: 'GTQ',
  SYMBOL: 'Q',
  NAME: 'Quetzales',
};

module.exports = {
  PRODUCT_STATUS,
  MOVEMENT_TYPES,
  REFERENCE_TYPES,
  QUOTE_STATUS,
  INVOICE_STATUS,
  PAYMENT_METHODS,
  USER_ROLES,
  TAX_RATE,
  CURRENCY,
};
