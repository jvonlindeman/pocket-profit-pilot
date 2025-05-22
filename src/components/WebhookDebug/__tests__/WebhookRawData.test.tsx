
import React from 'react';
import { render, screen } from '@testing-library/react';
import WebhookRawData from '../WebhookRawData';
import { mockRawData } from './mockData';

describe('WebhookRawData', () => {
  it('renders raw JSON data correctly', () => {
    render(<WebhookRawData rawData={mockRawData} />);
    
    // Check if the component renders with the right structure
    const preElement = screen.getByText(/\"payments\":/);
    expect(preElement).toBeInTheDocument();
    
    // Verify that the JSON is properly formatted
    expect(screen.getByText(/Client A/)).toBeInTheDocument();
    expect(screen.getByText(/Client B/)).toBeInTheDocument();
  });

  it('handles null data gracefully', () => {
    render(<WebhookRawData rawData={null} />);
    
    // Even with null data, the component should render without errors
    const preElement = screen.getByText(/null/);
    expect(preElement).toBeInTheDocument();
  });
});
