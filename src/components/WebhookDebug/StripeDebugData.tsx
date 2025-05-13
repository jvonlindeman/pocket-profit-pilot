
import React from 'react';

interface StripeDebugDataProps {
  rawData: any;
}

const StripeDebugData: React.FC<StripeDebugDataProps> = ({ rawData }) => {
  if (!rawData) return <div className="text-gray-500 italic p-4">No Stripe data available</div>;
  
  // Function to determine if we got an error response
  const isError = rawData && rawData.error;
  
  // Function to determine if we got a successful response with transactions
  const hasTransactions = rawData && 
                          rawData.transactions && 
                          Array.isArray(rawData.transactions) && 
                          rawData.transactions.length > 0;
  
  return (
    <div className="space-y-4">
      {isError ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{rawData.error}</p>
        </div>
      ) : rawData.status === 'override' ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-4">
          <p className="font-medium">Manual Override Mode</p>
          <p className="text-sm">Using manually entered value: {rawData.summary.gross}</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
            <h3 className="text-sm text-blue-800 font-medium">Stripe API Response Summary</h3>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div className="bg-white p-2 rounded border border-blue-100">
                <span className="font-medium">Status: </span> 
                {rawData.status || 'Unknown'}
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <span className="font-medium">Transactions: </span> 
                {hasTransactions ? rawData.transactions.length : 0}
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <span className="font-medium">Gross Amount: </span> 
                ${rawData.summary?.gross.toFixed(2) || '0.00'}
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <span className="font-medium">Fees: </span> 
                ${rawData.summary?.fees.toFixed(2) || '0.00'}
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <span className="font-medium">Net Amount (after fees): </span> 
                ${rawData.summary?.net.toFixed(2) || '0.00'}
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <span className="font-medium">Fee %: </span> 
                {rawData.summary?.feePercentage.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>

          {hasTransactions && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Transaction Details (Net Amounts After Fees)</h3>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Net Amount</th>
                      <th className="p-2 text-left">Fees</th>
                      <th className="p-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.transactions.map((tx: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{tx.id.substring(0, 12)}...</td>
                        <td className="p-2">{tx.date}</td>
                        <td className="p-2">${Number(tx.amount).toFixed(2)}</td>
                        <td className="p-2">${tx.fees ? Number(tx.fees).toFixed(2) : '0.00'}</td>
                        <td className="p-2">{tx.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StripeDebugData;
