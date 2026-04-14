import { CollectionService } from './CollectionService';
import { BatchService } from './BatchService';

export { CollectionService };
export { BatchService };
export const collectionService = new CollectionService();
export const batchService = new BatchService();

export { mapToCollectionData } from './collectionMapper';
export { mapSearchContentToRelatedContentItems } from './relatedContentMapper';
