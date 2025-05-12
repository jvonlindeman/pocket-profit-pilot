
/**
 * Format date in YYYY-MM-DD format without timezone shifts
 */
export const formatDateForAPI = (date: Date): string => {
  return formatDateYYYYMMDD(date);
};

/**
 * Format date in YYYY-MM-DD format without timezone shifts
 */
export const formatDateYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
