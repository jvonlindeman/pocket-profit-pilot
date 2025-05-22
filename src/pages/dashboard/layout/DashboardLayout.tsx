
import React from 'react';
import Footer from '@/components/Dashboard/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <Footer />
    </div>
  );
};

export default DashboardLayout;
