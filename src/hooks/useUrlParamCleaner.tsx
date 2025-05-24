
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook to handle URL parameter cleanup
 */
export const useUrlParamCleaner = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Remove refresh parameter from URL if present
  useEffect(() => {
    if (searchParams.has('refresh')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
};
