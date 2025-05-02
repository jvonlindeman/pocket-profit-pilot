
import { Transaction } from "../../types/financial";
import { ensureValidDateFormat, handleApiError } from "./utils";
import { getMockTransactions } from "./mockData";

// The make.com webhook URL
const makeWebhookUrl = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

// Function to call the make.com webhook
export const fetchTransactionsFromWebhook = async (
  startDate: Date, 
  endDate: Date, 
  forceRefresh = false
): Promise<Transaction[]> => {
  try {
    console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
    
    // Format dates for the make.com webhook (YYYY-MM-DD format)
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Call the make.com webhook directly
    console.log("ZohoService: Calling make.com webhook:", makeWebhookUrl);
    const response = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getTransactions",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        forceRefresh
      })
    });
    
    console.log(`make.com webhook response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch data from make.com webhook:", errorText);
      
      const errorMessage = handleApiError({details: errorText}, 'Failed to fetch Zoho transactions from make.com webhook');
      console.warn('Falling back to mock data due to error');
      return getMockTransactions(startDate, endDate);
    }
    
    // Parse the webhook response
    let data;
    try {
      const responseText = await response.text();
      if (!responseText || responseText === "Accepted") {
        console.log("Empty or 'Accepted' response from make.com webhook, using mock data");
        return getMockTransactions(startDate, endDate);
      }
      
      console.log(`make.com webhook response: ${responseText}`);
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse make.com webhook response:", e);
      return getMockTransactions(startDate, endDate);
    }
    
    console.log("ZohoService: Received data from make.com webhook:", data);
    
    return processTransactionData(data);
  } catch (err) {
    handleApiError(err, 'Failed to connect to make.com webhook');
    // Fall back to mock data
    console.warn('Falling back to mock data due to exception');
    return getMockTransactions(startDate, endDate);
  }
};

// Helper function to process and normalize transaction data
const processTransactionData = (data: any[]): Transaction[] => {
  // Process the data to ensure valid date formats
  return Array.isArray(data) ? data.map((item: any) => {
    // Ensure the item has all required fields
    if (!item.id) item.id = `zoho-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (!item.date) item.date = new Date().toISOString().split('T')[0];
    else item.date = ensureValidDateFormat(item.date);
    if (!item.type) item.type = 'income'; // Default type
    if (!item.category) item.category = 'Uncategorized';
    if (!item.description && item.customer_name) item.description = `Transacción de ${item.customer_name}`;
    if (!item.description) item.description = 'Sin descripción';
    if (!item.source) item.source = 'Zoho';
    
    return item as Transaction;
  }) : [];
};
