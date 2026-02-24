import { describe, it, expect } from 'vitest';
import { mapContentToWorkspaceItem } from './contentMapper';

describe('contentMapper', () => {
  describe('mapContentToWorkspaceItem', () => {
    it('maps full ContentSearchItem to WorkspaceItem with all fields', () => {
      const item = {
        identifier: 'id-1',
        name: 'My Content',
        description: 'A description',
        objectType: 'Content',
        status: 'Draft',
        posterImage: 'https://poster.png',
        thumbnail: 'https://thumb.png',
        createdOn: '2024-01-01',
        lastUpdatedOn: '2024-01-15',
        creator: 'Author Name',
      };
      expect(mapContentToWorkspaceItem(item)).toEqual({
        id: 'id-1',
        title: 'My Content',
        description: 'A description',
        type: 'content',
        status: 'draft',
        thumbnail: 'https://poster.png',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
        author: 'Author Name',
        primaryCategory: '',
        contentType: '',
        mimeType: '',
      });
    });

    it('uses fallback "Untitled" when name is missing', () => {
      const item = { identifier: 'id-1' };
      expect(mapContentToWorkspaceItem(item).title).toBe('Untitled');
    });

    it('uses fallback empty string when description is missing', () => {
      const item = { identifier: 'id-1' };
      expect(mapContentToWorkspaceItem(item).description).toBe('');
    });

    it('uses fallback "Unknown" when creator and createdBy are missing', () => {
      const item = { identifier: 'id-1' };
      expect(mapContentToWorkspaceItem(item).author).toBe('Unknown');
    });

    it('uses createdBy when creator is missing', () => {
      const item = { identifier: 'id-1', createdBy: 'Other Author' };
      expect(mapContentToWorkspaceItem(item).author).toBe('Other Author');
    });

    it('maps status Draft and FlagDraft to draft', () => {
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'Draft' }).status).toBe('draft');
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'FlagDraft' }).status).toBe('draft');
    });

    it('maps status Review, Processing, FlagReview to review', () => {
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'Review' }).status).toBe('review');
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'Processing' }).status).toBe('review');
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'FlagReview' }).status).toBe('review');
    });

    it('maps status Live and Unlisted to published', () => {
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'Live' }).status).toBe('published');
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'Unlisted' }).status).toBe('published');
    });

    it('uses fallback "draft" for unknown or missing status', () => {
      expect(mapContentToWorkspaceItem({ identifier: 'a' }).status).toBe('draft');
      expect(mapContentToWorkspaceItem({ identifier: 'a', status: 'UnknownStatus' }).status).toBe('draft');
    });

    it('maps objectType Content, Course, QuestionSet, Collection to type', () => {
      expect(mapContentToWorkspaceItem({ identifier: 'a', objectType: 'Content' }).type).toBe('content');
      expect(mapContentToWorkspaceItem({ identifier: 'a', objectType: 'Course' }).type).toBe('course');
      expect(mapContentToWorkspaceItem({ identifier: 'a', objectType: 'QuestionSet' }).type).toBe('quiz');
      expect(mapContentToWorkspaceItem({ identifier: 'a', objectType: 'Collection' }).type).toBe('collection');
    });

    it('uses fallback "content" for unknown or missing objectType', () => {
      expect(mapContentToWorkspaceItem({ identifier: 'a' }).type).toBe('content');
      expect(mapContentToWorkspaceItem({ identifier: 'a', objectType: 'Other' }).type).toBe('content');
    });

    it('uses posterImage for thumbnail when present, else thumbnail', () => {
      expect(
        mapContentToWorkspaceItem({
          identifier: 'a',
          posterImage: '/poster.png',
          thumbnail: '/thumb.png',
        }).thumbnail
      ).toBe('/poster.png');
      expect(
        mapContentToWorkspaceItem({ identifier: 'a', thumbnail: '/thumb.png' }).thumbnail
      ).toBe('/thumb.png');
      expect(mapContentToWorkspaceItem({ identifier: 'a' }).thumbnail).toBeUndefined();
    });

    it('uses lastUpdatedOn for updatedAt when present, else createdOn', () => {
      expect(
        mapContentToWorkspaceItem({
          identifier: 'a',
          createdOn: '2024-01-01',
          lastUpdatedOn: '2024-02-01',
        }).updatedAt
      ).toBe('2024-02-01');
      expect(
        mapContentToWorkspaceItem({ identifier: 'a', createdOn: '2024-01-01' }).updatedAt
      ).toBe('2024-01-01');
      expect(mapContentToWorkspaceItem({ identifier: 'a' }).updatedAt).toBeNull();
    });

    it('uses null for createdAt when createdOn is missing', () => {
      expect(mapContentToWorkspaceItem({ identifier: 'a' }).createdAt).toBeNull();
    });
  });
});
