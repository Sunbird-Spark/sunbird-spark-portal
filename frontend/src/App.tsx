import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import AppRoutes from './AppRoutes';
import AppCoreService from './services/AppCoreService';

function DeviceIdLogger() {
  useEffect(() => {
    // Initialize device ID on mount
    AppCoreService.getDeviceId()
      .then(deviceId => {
        console.log('🔑 Device ID:', deviceId);
      })
      .catch(error => {
        console.error('❌ Device ID Error:', error);
      });
  }, []);

  return null; // No UI, just logging
}

export default function App() {
  return (
    <BrowserRouter>
      <DeviceIdLogger />
      <AppRoutes />
    </BrowserRouter>
  );
}
