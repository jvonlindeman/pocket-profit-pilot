
import { Transaction } from "../../types/financial";

// The direct make.com webhook URL
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

export const fetchTransactionsFromWebhook = async (
  startDate: Date,
  endDate: Date,
  forceRefresh = false,
  returnRawResponse = false
) => {
  // Format dates carefully for consistency first, before using them
  const startDateFormatted = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const endDateFormatted = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`Fetching transactions from webhook for date range: ${startDateFormatted} to ${endDateFormatted}`);
  console.log(`Force refresh: ${forceRefresh}, Return raw response: ${returnRawResponse}`);
  
  try {
    // Now call the make.com webhook directly without using Supabase functions
    console.log(`Calling make.com webhook directly at: ${MAKE_WEBHOOK_URL}`);
    
    // Call the webhook with appropriate parameters
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        forceRefresh
      })
    });

    console.log(`Webhook response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from webhook:', errorText);
      throw new Error(`Error from webhook: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Raw response data structure:', JSON.stringify(responseData, null, 2).substring(0, 500) + '...');
    
    if (returnRawResponse) {
      console.log('Returning raw response from webhook');
      return responseData;
    }
    
    // Check each possible data structure in order
    if (responseData.cached_transactions && Array.isArray(responseData.cached_transactions)) {
      console.log(`Got ${responseData.cached_transactions.length} cached transactions from webhook`);
      console.log('Sample transaction:', responseData.cached_transactions[0]);
      return responseData.cached_transactions;
    }
    
    if (responseData.data && Array.isArray(responseData.data)) {
      console.log(`Got ${responseData.data.length} transactions from data property`);
      console.log('Sample transaction:', responseData.data[0]);
      return responseData.data;
    }
    
    if (Array.isArray(responseData)) {
      console.log(`Got ${responseData.length} transactions from direct array response`);
      console.log('Sample transaction:', responseData[0]);
      return responseData;
    }
    
    console.warn('Could not parse transactions from response:', responseData);
    return [];
  } catch (error) {
    console.error('Error fetching from webhook:', error);
    throw error;
  }
};
