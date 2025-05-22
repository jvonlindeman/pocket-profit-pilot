
import React from 'react';
import { render, screen } from '@testing-library/react';
import WebhookDataSummary from '../WebhookDataSummary';
import { mockRawData, mockEmptyData } from './mockData';

describe('WebhookDataSummary', () => {
  it('renders summary sections for all data types', () => {
    render(<WebhookDataSummary rawData={mockRawData} />);
    
    // Check for section headings
    expect(screen.getByText('Transacciones de Ingreso')).toBeInTheDocument();
    expect(screen.getByText('Transacciones de Gasto')).toBeInTheDocument();
    expect(screen.getByText('Gastos de Colaboradores')).toBeInTheDocument();
    expect(screen.getByText('Transacciones Procesadas')).toBeInTheDocument();
    
    // Check for correct counts
    expect(screen.getByText(/Encontradas 3 transacciones de ingreso/)).toBeInTheDocument();
    expect(screen.getByText(/Encontradas 2 transacciones de gasto/)).toBeInTheDocument();
    expect(screen.getByText(/Encontrados 2 gastos de colaboradores/)).toBeInTheDocument();
    expect(screen.getByText(/Encontradas 3 transacciones procesadas/)).toBeInTheDocument();
    
    // Check for example data
    expect(screen.getByText(/Client A/)).toBeInTheDocument();
    expect(screen.getByText(/Supplier X/)).toBeInTheDocument();
    expect(screen.getByText(/Freelancer 1/)).toBeInTheDocument();
  });

  it('shows empty state messages for no data', () => {
    render(<WebhookDataSummary rawData={mockEmptyData} />);
    
    // Check for empty state messages
    expect(screen.getByText('No se encontraron transacciones de ingreso')).toBeInTheDocument();
    expect(screen.getByText('No se encontraron transacciones de gasto')).toBeInTheDocument();
    expect(screen.getByText('No se encontraron gastos de colaboradores')).toBeInTheDocument();
    expect(screen.getByText('No se encontraron transacciones procesadas')).toBeInTheDocument();
  });
});
