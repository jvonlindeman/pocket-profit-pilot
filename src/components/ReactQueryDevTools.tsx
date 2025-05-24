
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function QueryDevTools() {
  // Add debug logging
  console.log('QueryDevTools component rendering');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VITE_DEV_MODE:', import.meta.env.VITE_DEV_MODE);
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.DEV;
  console.log('isDevelopment:', isDevelopment);
  
  if (!isDevelopment) {
    console.log('Not in development mode, DevTools will not render');
    return null;
  }

  console.log('Rendering ReactQueryDevtools with bottom-left position');
  
  return (
    <ReactQueryDevtools 
      buttonPosition="bottom-left" 
      initialIsOpen={false}
    />
  );
}
