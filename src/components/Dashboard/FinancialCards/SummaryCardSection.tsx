
import React, { ReactNode } from 'react';

interface SummaryCardSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const SummaryCardSection: React.FC<SummaryCardSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg border border-gray-100 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
};

export default React.memo(SummaryCardSection);
