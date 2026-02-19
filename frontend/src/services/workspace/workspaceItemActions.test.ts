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

  it('hides view for creator when status is review', () => {
    const result = getWorkspaceItemActionVisibility('review', 'creator');
    expect(result.showView).toBe(false);
    expect(result.showEdit).toBe(false);
    expect(result.showDelete).toBe(false);
  });

  it('shows view for creator when status is published', () => {
    const result = getWorkspaceItemActionVisibility('published', 'creator');
    expect(result.showView).toBe(true);
    expect(result.showEdit).toBe(false);
  });

  it('hides view and edit for reviewer when status is published', () => {
    const result = getWorkspaceItemActionVisibility('published', 'reviewer');
    expect(result.showView).toBe(false);
    expect(result.showEdit).toBe(false);
  });

  it('shows view for reviewer when status is review', () => {
    const result = getWorkspaceItemActionVisibility('review', 'reviewer');
    expect(result.showView).toBe(true);
    expect(result.showEdit).toBe(false);
  });
});
