import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useAuth, Role, User } from '../../auth/AuthContext';
import { getDefaultRouteForRole } from '../../rbac/roleConfig';
import { v4 as uuidv4 } from 'uuid';

const HomePage: React.FC = () => {
  const { t } = useAppI18n();
  const [selectedRole, setSelectedRole] = useState<Role>('guest');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the return path from location state, or use role's default route
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || getDefaultRouteForRole(selectedRole);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const user: User = {
      id: uuidv4(),
      name: `User (${selectedRole})`,
      role: selectedRole,
    };

    login(user);
    
    // Redirect back to the page they tried to access, or default path
    navigate(from, { replace: true });
  };

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <h2>{t('coursesAvailable')}</h2>
      <ul>
        <li>{t('homePageDemo.course1')}</li>
        <li>{t('homePageDemo.course2')}</li>
      </ul>

      <h2>{t('login')}</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="role">{t('selectRole')}</label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
          >
            <option value="admin">{t('roles.admin')}</option>
            <option value="content_creator">{t('roles.content_creator')}</option>
            <option value="content_reviewer">{t('roles.content_reviewer')}</option>
            <option value="guest">{t('roles.guest')}</option>
          </select>
        </div>

        <button type="submit">
          {t('login')}
        </button>
      </form>

      {location.state?.from && (
        <p>
          {t('redirectMessage')} <strong>{from}</strong>
        </p>
      )}
    </div>
  );
};

export default HomePage;
