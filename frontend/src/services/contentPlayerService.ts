import resourceRobotHand from "@/assets/resource-robot-hand.svg";
import resourceHacker from "@/assets/resource-hacker.svg";
import resourceRobot from "@/assets/resource-robot.svg";
import resourceTextBook from "@/assets/resource-text-book.svg";
import { RelatedItem, ContentData } from "@/types/contentTypes";

// Mock content data
export const getContentData = (): ContentData => ({
  id: "1",
  title: "The AI Engineer Introduction",
  rating: 4.5,
  learners: "9k",
  lessons: 25,
  image: resourceRobotHand,
  currentWeek: "Week 1: Foundation & Basics",
  relatedContent: [
    {
      id: "r-1",
      title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
      type: "Course",
      image: resourceRobot,
      rating: 4.5,
      learners: "9k",
      lessons: 25,
    },
    {
      id: "r-2",
      title: "Generative AI for Cybersecurity Professionals",
      type: "PDF",
      image: resourceHacker,
      isResource: true,
    },
    {
      id: "r-3",
      title: "Data Engineering Foundations",
      type: "Textbook",
      image: resourceTextBook,
      rating: 4.5,
      learners: "9k",
      lessons: 25,
    },
  ],
});

// Simulate API call
export const fetchContentById = async (contentId: string): Promise<ContentData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  return getContentData();
};