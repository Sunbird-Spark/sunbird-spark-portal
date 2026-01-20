import React from 'react';

const CreateContentPage: React.FC = () => {
  return (
    <div>
      <div>
        <h1>Create Content</h1>
      </div>

      <div>
        <h2>Content Creation Tools</h2>
        <p>This page is only accessible to users with the <strong>content_creator</strong> role.</p>
        <ul>
          <li>Create new articles</li>
          <li>Upload media</li>
          <li>Draft content</li>
          <li>Submit for review</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateContentPage;
