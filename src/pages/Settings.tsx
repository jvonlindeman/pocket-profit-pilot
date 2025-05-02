import React from 'react';
import ZohoConfig from '@/components/ZohoConfig';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
              <p className="mt-1 text-sm text-gray-500">Configura la integración con Zoho Books</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="outline" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Información sobre la integración con Zoho Books</AlertTitle>
            <AlertDescription>
              Para completar la configuración, asegúrate de proporcionar tu Client ID, Client Secret y Organization ID de Zoho Books. 
              El Refresh Token ya ha sido pre-llenado con el valor más reciente.
            </AlertDescription>
          </Alert>
          
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Actualización de API</AlertTitle>
            <AlertDescription>
              La integración ha sido actualizada para usar correctamente la API de Zoho Books para cuentas de Estados Unidos.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Solución de problemas</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Si estás experimentando el error <strong>"Failed to fetch Zoho transactions"</strong>, verifica:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Que el Refresh Token tenga el scope <code className="bg-gray-700 text-white px-1 py-0.5 rounded">ZohoBooks.fullaccess.all</code></li>
                <li>Que hayas ingresado el Client Secret correctamente</li>
                <li>Que el Organization ID sea válido - encuéntralo en Zoho Books bajo Settings → Organizations</li>
                <li>Que tu cuenta de Zoho Books esté activa y sea de Estados Unidos (región US)</li>
              </ul>
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="font-medium text-amber-800">Pasos para generar un nuevo Refresh Token:</p>
                <ol className="list-decimal ml-5 space-y-1 mt-2 text-amber-800">
                  <li>Visita <a href="https://api-console.zoho.com/" target="_blank" rel="noopener noreferrer" className="text-amber-800 font-medium underline">Zoho API Console <ExternalLink className="h-3 w-3 inline" /></a></li>
                  <li>Crea una aplicación "Self Client"</li>
                  <li>Agrega el scope: <code className="bg-gray-700 text-white px-1 py-0.5 rounded">ZohoBooks.fullaccess.all</code></li>
                  <li>Genera un refresh token con ese scope</li>
                  <li>Usa ese nuevo refresh token en la configuración a continuación</li>
                </ol>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="font-medium text-blue-800">Notas importantes para cuentas de USA:</p>
                <ul className="list-disc ml-5 space-y-1 mt-2 text-blue-800">
                  <li>La URL de autenticación debe ser <code className="bg-gray-700 text-white px-1 py-0.5 rounded">https://accounts.zoho.com</code> (sin region)</li>
                  <li>La URL de API debe ser <code className="bg-gray-700 text-white px-1 py-0.5 rounded">https://www.zohoapis.com/books/v3</code></li>
                  <li>Asegúrate de utilizar el Organization ID correcto de tu cuenta de Zoho Books US</li>
                  <li>Esta aplicación está configurada para trabajar con cuentas de Zoho Books US</li>
                </ul>
              </div>
              <p className="mt-2">Después de actualizar la configuración, vuelve al Dashboard para probar nuevamente.</p>
            </AlertDescription>
          </Alert>

          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Zoho Books</h2>
            <ZohoConfig />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-500">
            Analizador Financiero para Agencias v1.0 • Datos obtenidos de Zoho Books y Stripe
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Settings;
