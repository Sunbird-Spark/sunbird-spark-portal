import React from 'react';

const WorkspacePage: React.FC = () => {
  return (
    <div>
      <div>
        <h1>Workspace</h1>
      </div>

      <div>
        <h2>Your Workspace</h2>
        <p>
          This page is accessible to users with <strong>content_creator</strong> and{' '}
          <strong>content_reviewer</strong> roles.
        </p>
        <ul>
          <li>Create and edit content</li>
          <li>Collaborate with team members</li>
          <li>Manage drafts</li>
          <li>Submit for review</li>
        </ul>
      </div>
    </div>
  );
};

export default WorkspacePage;
