
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
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

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
        
        console.log('Zoho config response received');
        
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
  }, [toast, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage("Validando credenciales...");
    
    try {
      // Validate required fields for new configuration
      if (!configured && (!clientId || !clientSecret || !refreshToken || !organizationId)) {
        setError('All fields are required for initial configuration');
        setLoading(false);
        return;
      }
      
      // Validate required fields for updating configuration
      if (configured && (!clientId || !refreshToken || !organizationId)) {
        setError('Client ID, Refresh Token, and Organization ID are required');
        setLoading(false);
        return;
      }
      
      const configData = {
        clientId,
        clientSecret: clientSecret || undefined, // Only send if provided
        refreshToken,
        organizationId
      };

      setStatusMessage("Enviando credenciales y validando la conexión...");
      
      console.log('Saving Zoho config via edge function...');
      const { data, error } = await supabase.functions.invoke('zoho-config', {
        method: 'POST',
        body: configData
      });
      
      console.log('Zoho config save response received');
      
      if (error) {
        console.error('Error saving Zoho config:', error);
        
        // Check for specific errors
        if (typeof error === 'object' && error.details) {
          if (error.details.includes('invalid_client')) {
            setError('Client ID or Client Secret is invalid. Please verify your credentials.');
          } else if (error.details.includes('invalid_grant')) {
            setError('Refresh Token is invalid or has incorrect permissions. Ensure it has the ZohoBooks.fullaccess.all scope.');
          } else if (error.details.includes('invalid_organization')) {
            setError('Organization ID is invalid. Please verify it in your Zoho Books account.');
          } else {
            setError(error.message || 'Failed to save Zoho configuration');
          }
        } else {
          setError(error.message || 'Failed to save Zoho configuration');
        }
        
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
      setStatusMessage(null);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading && !error && !statusMessage) {
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

        {statusMessage && !error && (
          <CardContent>
            <Alert className="mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        <CardContent className="space-y-4">
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Secure Configuration</AlertTitle>
            <AlertDescription>
              Your Zoho credentials will be securely stored and processed
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in your <a href="https://api-console.zoho.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Zoho API Console <ExternalLink className="h-3 w-3 inline" /></a>
            </p>
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
            {configured ? (
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to keep existing client secret
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Find this in your <a href="https://api-console.zoho.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Zoho API Console <ExternalLink className="h-3 w-3 inline" /></a>
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
                <br />
                <span className="text-amber-600">Important:</span> Ensure this token has the <code className="bg-gray-100 px-1 py-0.5 rounded">ZohoBooks.fullaccess.all</code> scope
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
            <p className="text-xs text-muted-foreground mt-1">
              Find this in Zoho Books under Settings → Organizations
            </p>
          </div>

          <Alert className="mt-4 bg-blue-50 border-blue-100">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              <p className="font-medium">How to generate a correct Zoho refresh token:</p>
              <ol className="list-decimal ml-5 space-y-1 mt-2">
                <li>Go to <a href="https://api-console.zoho.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Zoho API Console <ExternalLink className="h-3 w-3 inline" /></a></li>
                <li>Create a "Self Client" application</li>
                <li>Add scope: <code className="bg-gray-100 px-1 py-0.5 rounded">ZohoBooks.fullaccess.all</code></li>
                <li>Generate refresh token with that scope</li>
              </ol>
            </AlertDescription>
          </Alert>
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
