
import React from 'react';
import { render, screen } from '@testing-library/react';
import WebhookFormattedData from '../WebhookFormattedData';
import { mockRawData, mockEmptyData } from './mockData';

describe('WebhookFormattedData', () => {
  it('renders formatted data with structure summary', () => {
    render(<WebhookFormattedData rawData={mockRawData} />);
    
    // Check for summary box
    expect(screen.getByText('Resumen de la Estructura')).toBeInTheDocument();
    
    // Check for table headers
    expect(screen.getByText('Clave')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    
    // Check for data rows
    expect(screen.getByText('payments')).toBeInTheDocument();
    expect(screen.getByText('expenses')).toBeInTheDocument();
    expect(screen.getByText('colaboradores')).toBeInTheDocument();
    expect(screen.getByText('cached_transactions')).toBeInTheDocument();
  });

  it('handles empty data correctly', () => {
    render(<WebhookFormattedData rawData={mockEmptyData} />);
    
    // Even with empty arrays, the structure summary should be shown
    expect(screen.getByText('Resumen de la Estructura')).toBeInTheDocument();
    expect(screen.getByText('payments')).toBeInTheDocument();
    
    // Check that arrays are properly described
    expect(screen.getAllByText('Array con 0 elementos').length).toBeGreaterThan(0);
  });

  it('handles non-object data gracefully', () => {
    render(<WebhookFormattedData rawData="Simple string data" />);
    
    // Should show the string directly
    expect(screen.getByText(/Simple string data/)).toBeInTheDocument();
  });
});
