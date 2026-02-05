import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import AppCoreService from './services/AppCoreService';
export default function App() {
  useEffect(() => {
    // Initialize AppCoreService (device ID and auth status) when app loads
    console.log('🚀 App mounted - Starting initialization...');
    AppCoreService.initialize()
      .then(() => {
        console.log('   Device ID:', AppCoreService.hasDeviceId() ? '✓ Available' : '✗ Not available');
      })
      .catch((error) => {
        console.error('❌ Failed to initialize AppCoreService:', error);
      });
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
