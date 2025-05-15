
import React from 'react';

const FinanceLoading: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-finance-profit"></div>
    </div>
  );
};

export default FinanceLoading;
