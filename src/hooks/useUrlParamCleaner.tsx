
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook to handle URL parameter cleanup and detect refresh intentions
 */
export const useUrlParamCleaner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLegitimateRefresh, setIsLegitimateRefresh] = useState(false);

  // Check if this is a legitimate user-initiated refresh or just a page reload
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    
    if (refreshParam) {
      // Check if the refresh parameter is recent (within last 5 seconds)
      // This helps distinguish between user clicks and page reloads
      const refreshTimestamp = parseInt(refreshParam);
      const now = Date.now();
      const timeDiff = now - refreshTimestamp;
      
      // If refresh is very recent (< 2 seconds), it's likely a legitimate user action
      const isRecent = timeDiff < 2000;
      setIsLegitimateRefresh(isRecent);
      
      console.log('🔍 URL Param Cleaner: Refresh detected', {
        refreshTimestamp,
        now,
        timeDiff,
        isRecent,
        isLegitimateRefresh: isRecent
      });
      
      // Clean up the URL parameter regardless
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return {
    isLegitimateRefresh
  };
};
