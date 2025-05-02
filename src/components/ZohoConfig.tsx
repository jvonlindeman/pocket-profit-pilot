
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ZohoConfigProps {
  onConfigSaved?: () => void;
}

interface ZohoConfigData {
  clientId: string;
  organizationId: string;
  updatedAt: string;
}

const ZohoConfig: React.FC<ZohoConfigProps> = ({ onConfigSaved }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [existingConfig, setExistingConfig] = useState<ZohoConfigData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Set default refresh token from the user's input
  const defaultRefreshToken = '1000.e43c417017e3052b5b62e1b9b49ade73.591f8e648553ddf2d54346d862772edd';

  // Fetch current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching Zoho config from edge function...');
        const { data, error } = await supabase.functions.invoke('zoho-config', {
          method: 'GET'
        });
        
        console.log('Zoho config response:', { data, error });
        
        if (error) {
          console.error('Error fetching Zoho config:', error);
          setError('Failed to fetch existing Zoho configuration');
          toast({
            title: 'Error',
            description: 'Failed to fetch existing Zoho configuration',
            variant: 'destructive'
          });
          return;
        }
        
        if (data.configured && data.config) {
          setConfigured(true);
          setExistingConfig(data.config);
          setClientId(data.config.clientId || '');
          setOrganizationId(data.config.organizationId || '');
          
          // Pre-fill refresh token if not configured yet or if we're updating
          if (!refreshToken) {
            setRefreshToken(defaultRefreshToken);
          }
        } else {
          // If not configured, set default refresh token
          setRefreshToken(defaultRefreshToken);
        }
      } catch (err) {
        console.error('Error in fetchConfig:', err);
        setError('Failed to connect to Zoho configuration service');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
    
    // Check if refresh token is provided in URL
    const tokenFromUrl = searchParams.get('refreshToken');
    if (tokenFromUrl) {
      setRefreshToken(tokenFromUrl);
      toast({
        title: 'Refresh Token Received',
        description: 'Refresh token has been pre-filled from OAuth flow'
      });
    }
  }, [toast, searchParams, defaultRefreshToken, refreshToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields for new configuration
      if (!configured && (!clientId || !clientSecret || !refreshToken || !organizationId)) {
        setError('All fields are required for initial configuration');
        return;
      }
      
      // Validate required fields for updating configuration
      if (configured && (!clientId || !refreshToken || !organizationId)) {
        setError('Client ID, Refresh Token, and Organization ID are required');
        return;
      }
      
      const configData = {
        clientId,
        clientSecret: clientSecret || undefined, // Only send if provided
        refreshToken,
        organizationId
      };
      
      console.log('Saving Zoho config to edge function...', configData);
      const { data, error } = await supabase.functions.invoke('zoho-config', {
        method: 'POST',
        body: configData
      });
      
      console.log('Zoho config save response:', { data, error });
      
      if (error) {
        console.error('Error saving Zoho config:', error);
        setError(error.message || 'Failed to save Zoho configuration');
        toast({
          title: 'Error',
          description: error.message || 'Failed to save Zoho configuration',
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Zoho Books integration configured successfully'
      });
      
      setConfigured(true);
      setClientSecret('');
      
      if (onConfigSaved) {
        onConfigSaved();
      }

      // Reload the config to get the latest values
      window.location.reload();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading && !error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p>Loading configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Zoho Books Configuration</CardTitle>
        <CardDescription>
          {configured 
            ? `Zoho Books is configured with client ID: ${existingConfig?.clientId}. Last updated: ${new Date(existingConfig?.updatedAt || '').toLocaleString()}`
            : 'Enter your Zoho Books API credentials below to connect.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        {error && (
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <span>{error}</span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="self-start mt-2"
                >
                  Retry Connection
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required={!configured}
              placeholder={configured ? "••••••••" : ""}
            />
            {configured && (
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to keep existing client secret
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="refreshToken">Refresh Token</Label>
            <Input
              id="refreshToken"
              type="password"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              required
              placeholder="Enter refresh token"
            />
            {refreshToken && (
              <p className="text-xs text-muted-foreground mt-1">
                Refresh token provided: {refreshToken.substring(0, 5)}...{refreshToken.substring(refreshToken.length - 5)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="organizationId">Organization ID</Label>
            <Input
              id="organizationId"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {configured ? 'Update your Zoho Books integration settings' : 'Connect to Zoho Books API'}
          </p>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : configured ? 'Update Configuration' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ZohoConfig;
