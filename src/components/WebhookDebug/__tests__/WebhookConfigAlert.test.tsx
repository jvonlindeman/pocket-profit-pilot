
import React from 'react';
import { render, screen } from '@testing-library/react';
import WebhookConfigAlert from '../WebhookConfigAlert';

describe('WebhookConfigAlert', () => {
  it('renders the alert with correct message', () => {
    render(<WebhookConfigAlert />);
    
    // Check for title
    expect(screen.getByText('Error de configuración del webhook')).toBeInTheDocument();
    
    // Check for description content
    expect(screen.getByText(/La URL del webhook de Make.com no está configurada/)).toBeInTheDocument();
    
    // Check for code element
    expect(screen.getByText('MAKE_WEBHOOK_URL')).toBeInTheDocument();
  });
});
