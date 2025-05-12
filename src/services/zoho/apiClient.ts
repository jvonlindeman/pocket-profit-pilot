
import { Transaction } from "../../types/financial";
import { supabase } from "../../integrations/supabase/client";

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
    // Use the Supabase URL directly from the supabase client instead of environment variables
    const supabaseUrl = "https://rstexocnpvtxfhqbnetn.supabase.co";
    if (!supabaseUrl) {
      throw new Error('Missing Supabase URL in configuration');
    }
    
    // Create the function URL
    const functionUrl = `${supabaseUrl}/functions/v1/zoho-transactions`;
    console.log(`Calling edge function at: ${functionUrl}`);
    
    // Call the edge function
    const response = await fetch(functionUrl, {
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

    console.log(`Edge function response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from edge function:', errorText);
      throw new Error(`Error from edge function: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Raw response data structure:', JSON.stringify(responseData, null, 2).substring(0, 500) + '...');
    
    if (returnRawResponse) {
      console.log('Returning raw response from edge function');
      return responseData;
    }
    
    // Check each possible data structure in order
    if (responseData.cached_transactions && Array.isArray(responseData.cached_transactions)) {
      console.log(`Got ${responseData.cached_transactions.length} cached transactions from edge function`);
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
