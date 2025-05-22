
/**
 * Mock data for WebhookDebug component tests
 */

export const mockRawData = {
  payments: [
    { customer_name: "Client A", amount: 1000, date: "2025-05-01" },
    { customer_name: "Client B", amount: 2500, date: "2025-05-05" },
    { customer_name: "Client C", amount: 3200, date: "2025-05-10" }
  ],
  expenses: [
    { vendor_name: "Supplier X", total: 500, date: "2025-05-03", category: "software" },
    { vendor_name: "Supplier Y", total: 750, date: "2025-05-07", category: "marketing" }
  ],
  colaboradores: [
    { vendor_name: "Freelancer 1", total: 1200, date: "2025-05-02", status: "paid" },
    { vendor_name: "Freelancer 2", total: 900, date: "2025-05-08", status: "pending" }
  ],
  cached_transactions: [
    { type: "income", amount: 1000, date: "2025-05-01" },
    { type: "expense", amount: 500, date: "2025-05-03" },
    { type: "expense", amount: 750, date: "2025-05-07" }
  ]
};

export const mockEmptyData = {
  payments: [],
  expenses: [],
  colaboradores: [],
  cached_transactions: []
};

export const mockErrorData = {
  error: "Make webhook URL is not configured"
};
