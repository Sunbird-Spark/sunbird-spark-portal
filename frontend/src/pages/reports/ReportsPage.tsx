import React from 'react';

const ReportsPage: React.FC = () => {
  return (
    <div>
      <div>
        <h1>Reports</h1>
      </div>

      <div>
        <h2>Content Reports</h2>
        <p>This page is only accessible to users with the <strong>content_reviewer</strong> role.</p>
        <ul>
          <li>View content analytics</li>
          <li>Review submission statistics</li>
          <li>Quality assurance metrics</li>
          <li>Performance dashboards</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportsPage;
