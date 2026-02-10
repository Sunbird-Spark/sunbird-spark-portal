import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div>
      <div>
        <h1>Admin Dashboard</h1>
      </div>

      <div>
        <h2>Admin Controls</h2>
        <p>This page is only accessible to users with the <strong>admin</strong> role.</p>
        <ul>
          <li>Manage users</li>
          <li>System configuration</li>
          <li>View all reports</li>
          <li>Access control settings</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;
