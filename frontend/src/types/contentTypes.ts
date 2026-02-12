export interface RelatedItem {
  id: string;
  title: string;
  type: string;
  image: string;
  isResource?: boolean;
  rating?: number;
  learners?: string;
  lessons?: number;
}

export interface ContentData {
  id: string;
  title: string;
  rating: number;
  learners: string;
  lessons: number;
  image: string;
  currentWeek: string;
  relatedContent: RelatedItem[];
}