import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, Role, User } from '../auth/AuthContext';
import { getDefaultRouteForRole } from '../rbac/roleConfig';

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('guest');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the return path from location state, or use role's default route
  const from = (location.state as any)?.from?.pathname || getDefaultRouteForRole(selectedRole);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const user: User = {
      id: crypto.randomUUID(),
      name: `User (${selectedRole})`,
      role: selectedRole,
    };

    login(user);
    
    // Redirect back to the page they tried to access, or default path
    navigate(from, { replace: true });
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="role">Select Role:</label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
          >
            <option value="admin">Admin</option>
            <option value="content_creator">Content Creator</option>
            <option value="content_reviewer">Content Reviewer</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        <button type="submit">
          Login
        </button>
      </form>

      {location.state?.from && (
        <p>
          You will be redirected to: <strong>{from}</strong>
        </p>
      )}
    </div>
  );
};

export default LoginPage;
