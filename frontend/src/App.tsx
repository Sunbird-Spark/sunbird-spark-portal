import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import AppCoreService from './services/AppCoreService';
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
