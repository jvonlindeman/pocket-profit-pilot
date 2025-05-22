
import { renderHook, act } from '@testing-library/react-hooks';
import { useWebhookDebug } from '../useWebhookDebug';
import * as ZohoService from '@/services/zohoService';

// Mock the ZohoService module
jest.mock('@/services/zohoService', () => ({
  getRawResponse: jest.fn()
}));

describe('useWebhookDebug hook', () => {
  // Setup mock date range
  const mockDateRange = {
    from: new Date('2025-01-01'),
    to: new Date('2025-01-31')
  };

  // Mock refresh function
  const mockRefreshFunction = jest.fn();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useWebhookDebug({ 
        dateRange: mockDateRange, 
        refreshDataFunction: mockRefreshFunction 
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.rawData).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.configIssue).toBe(false);
  });

  it('should initialize with provided rawResponse', () => {
    const mockRawResponse = { 
      payments: [{ id: 1 }], 
      expenses: [] 
    };

    const { result } = renderHook(() => 
      useWebhookDebug({ 
        dateRange: mockDateRange, 
        refreshDataFunction: mockRefreshFunction,
        initialRawResponse: mockRawResponse
      })
    );

    expect(result.current.rawData).toEqual(mockRawResponse);
  });

  it('should detect configuration issues in the response', () => {
    // Test with webhook configuration error
    const mockErrorResponse = {
      error: 'Webhook URL is not configured properly'
    };

    const { result } = renderHook(() => 
      useWebhookDebug({ 
        dateRange: mockDateRange,
        initialRawResponse: mockErrorResponse
      })
    );

    expect(result.current.configIssue).toBe(true);
  });

  it('should handle fetchDebugData success', async () => {
    const mockSuccessResponse = {
      payments: [{ amount: 100 }],
      expenses: [{ amount: 50 }]
    };

    // Mock the ZohoService.getRawResponse to return success
    (ZohoService.getRawResponse as jest.Mock).mockResolvedValue(mockSuccessResponse);

    const { result, waitForNextUpdate } = renderHook(() => 
      useWebhookDebug({ 
        dateRange: mockDateRange,
      })
    );

    // Call the fetch function
    act(() => {
      result.current.fetchDebugData();
    });

    // Initial state should show loading
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();

    // After update, we should have data and not loading
    expect(result.current.loading).toBe(false);
    expect(result.current.rawData).toEqual(mockSuccessResponse);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetchDebugData error', async () => {
    const errorMessage = 'API Error';
    
    // Mock the ZohoService.getRawResponse to throw an error
    (ZohoService.getRawResponse as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() => 
      useWebhookDebug({ 
        dateRange: mockDateRange,
      })
    );

    // Call the fetch function
    let caughtError;
    act(() => {
      result.current.fetchDebugData().catch(e => {
        caughtError = e;
      });
    });

    // Initial state should show loading
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();

    // After update, we should have error and not loading
    expect(result.current.loading).toBe(false);
    expect(result.current.rawData).toBeNull();
    expect(result.current.error).toBe(errorMessage);
    expect(caughtError).toBeDefined();
  });

  it('should correctly determine if data is usable', () => {
    const { result } = renderHook(() => 
      useWebhookDebug({ 
        dateRange: mockDateRange,
      })
    );

    // Test with empty data
    expect(result.current.hasUsableData(null)).toBe(false);
    expect(result.current.hasUsableData({})).toBe(false);
    
    // Test with valid data structures
    expect(result.current.hasUsableData({ payments: [{ amount: 100 }] })).toBe(true);
    expect(result.current.hasUsableData({ expenses: [{ amount: 50 }] })).toBe(true);
    expect(result.current.hasUsableData({ colaboradores: [{ name: 'Test' }] })).toBe(true);
    expect(result.current.hasUsableData({ cached_transactions: [{ id: 1 }] })).toBe(true);
    
    // Test with empty arrays
    expect(result.current.hasUsableData({ payments: [], expenses: [] })).toBe(false);
  });
});
