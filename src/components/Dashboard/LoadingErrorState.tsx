
import React from 'react';
import LoadingSpinner from '@/components/Dashboard/LoadingSpinner';
import ErrorDisplay from '@/components/Dashboard/ErrorDisplay';

interface LoadingErrorStateProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const LoadingErrorState: React.FC<LoadingErrorStateProps> = ({
  loading,
  error,
  onRetry
}) => {
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={onRetry} />;
  }
  
  return null;
};

export default LoadingErrorState;
