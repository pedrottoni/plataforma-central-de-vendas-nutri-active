-- ============================================
-- MIGRATION 002: Expense tracking columns
-- ============================================
-- Adds payment_method and is_recurring to transactions
-- for tracking expense payment type and recurring status
-- ============================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN transactions.payment_method IS 'Forma de pagamento: PIX, Cartão Crédito, Cartão Débito, Dinheiro, Boleto. NULL para income transactions.';
COMMENT ON COLUMN transactions.is_recurring IS 'TRUE para despesas recorrentes (assinaturas mensais, etc). FALSE por padrão.';
