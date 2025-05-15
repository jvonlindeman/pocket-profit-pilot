
import { Transaction } from "../../../types/financial";
import { handleApiError } from "../utils";
import { getMockTransactions } from "../mockData";
import { supabase } from "@/integrations/supabase/client";
import { PANAMA_TIMEZONE } from "@/utils/timezoneUtils";
import { processRawTransactions, filterExcludedVendors } from "./processor";
import { preparePanamaDates } from "./formatter";
import { excludedVendors } from "./config";

// This file is no longer exported directly
// The implementation has been moved to apiClient.ts
// This file is kept for backwards compatibility
// Export a deprecated version reference to the main implementation
import { fetchTransactionsFromWebhook as fetchImpl } from "../apiClient";

// Re-export using the same name to maintain backward compatibility
export const fetchTransactionsFromWebhook = fetchImpl;
