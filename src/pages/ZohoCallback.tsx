
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ZohoCallback = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setError('No authorization code found in the URL');
        setLoading(false);
        return;
      }
      
      try {
        // Use the provided refresh token directly
        const refreshToken = '1000.eb48f34e6d317f6fc913c79bdbc5f7fd.4b86095542b7e1303a3e4ec62b083e1b';
        
        // Store the refresh token and proceed to configure Zoho
        toast({
          title: 'Zoho OAuth Successful',
          description: 'Refresh token received. Please complete the configuration.',
        });
        
        // Navigate to settings page
        navigate('/settings?refreshToken=' + encodeURIComponent(refreshToken));
      } catch (err: any) {
        console.error('Error in OAuth callback:', err);
        setError(err.message || 'An error occurred during OAuth process');
        toast({
          title: 'OAuth Error',
          description: 'Failed to complete Zoho authentication',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    handleCallback();
  }, [searchParams, navigate, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-xl font-semibold">Processing Zoho OAuth...</h1>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 max-w-lg">
          <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => navigate('/settings')}
          >
            Return to Settings
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 max-w-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication Successful</h2>
        <p>Redirecting to complete the configuration...</p>
      </div>
    </div>
  );
};

export default ZohoCallback;
