import { CollectionService } from './CollectionService';

export { CollectionService };
export const collectionService = new CollectionService();

export { mapToCollectionData } from './collectionMapper';
export { mapSearchContentToRelatedContentItems } from './relatedContentMapper';
