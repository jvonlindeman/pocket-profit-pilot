
import { 
  formatDateYYYYMMDD_Panama,
  toPanamaTime,
  PANAMA_TIMEZONE
} from "@/utils/timezoneUtils";

// Format date in YYYY-MM-DD format in Panama timezone
export const formatDateYYYYMMDD = (date: Date): string => {
  return formatDateYYYYMMDD_Panama(date);
};

// Helper function to ensure source is either 'Zoho' or 'Stripe'
export const normalizeSource = (source: string): 'Zoho' | 'Stripe' => {
  return source === 'Stripe' ? 'Stripe' : 'Zoho';
};

// Helper function to normalize transaction type
export const normalizeType = (type: string): 'income' | 'expense' => {
  return type === 'income' ? 'income' : 'expense';
};

// Helper for preparing dates in Panama timezone for API requests
export const preparePanamaDates = (startDate: Date, endDate: Date) => {
  // Ensure dates are interpreted in Panama timezone
  const panamaStartDate = toPanamaTime(startDate);
  const panamaEndDate = toPanamaTime(endDate);
  
  // Format dates using Panama timezone formatter
  const formattedStartDate = formatDateYYYYMMDD(panamaStartDate);
  const formattedEndDate = formatDateYYYYMMDD(panamaEndDate);
  
  return {
    panamaStartDate,
    panamaEndDate,
    formattedStartDate,
    formattedEndDate
  };
};
