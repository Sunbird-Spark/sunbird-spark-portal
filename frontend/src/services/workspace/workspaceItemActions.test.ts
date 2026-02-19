import { describe, it, expect } from 'vitest';
import { getWorkspaceItemActionVisibility } from './workspaceItemActions';

describe('workspaceItemActions', () => {
  it('returns correct action visibility for draft status', () => {
    expect(getWorkspaceItemActionVisibility('draft')).toEqual({
      isDraft: true,
      isPublished: false,
      isReview: false,
      showView: false,
      showEdit: true,
      showDelete: true,
    });
  });

  it('returns correct action visibility for review status', () => {
    expect(getWorkspaceItemActionVisibility('review')).toEqual({
      isDraft: false,
      isPublished: false,
      isReview: true,
      showView: true,
      showEdit: false,
      showDelete: false,
    });
  });

  it('returns correct action visibility for published status', () => {
    expect(getWorkspaceItemActionVisibility('published')).toEqual({
      isDraft: false,
      isPublished: true,
      isReview: false,
      showView: true,
      showEdit: false,
      showDelete: false,
    });
  });
});