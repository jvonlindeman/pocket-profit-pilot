
import React from 'react';
import { render, screen } from '@testing-library/react';
import WebhookTroubleshootingGuide from '../WebhookTroubleshootingGuide';

describe('WebhookTroubleshootingGuide', () => {
  it('renders troubleshooting guide with all items', () => {
    render(<WebhookTroubleshootingGuide />);
    
    // Check for heading
    expect(screen.getByText('Solucionar problemas de webhook')).toBeInTheDocument();
    
    // Check for list items
    expect(screen.getByText(/Verifica que la variable de entorno/)).toBeInTheDocument();
    expect(screen.getByText(/Confirma que el webhook de Make.com/)).toBeInTheDocument();
    expect(screen.getByText(/Comprueba que hay datos/)).toBeInTheDocument();
    expect(screen.getByText(/Revisa la lista de exclusiones/)).toBeInTheDocument();
  });
});
