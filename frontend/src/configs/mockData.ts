import {
  FiBriefcase,
  FiCode,
  FiMessageSquare,
  FiBarChart2,
  FiShield,
  FiFeather,
  FiUsers,
  FiTrendingUp
} from "react-icons/fi";
import type { Category } from "@/components/home/CategoryCard";
import type { ContentSearchItem } from "@/types/workspaceTypes";

export const categories: Category[] = [
  {
    id: "1",
    name: "Leadership",
    icon: FiBriefcase,
    courseCount: 45,
    color: "#024F9D",
  },
  {
    id: "2",
    name: "IT & Software",
    icon: FiCode,
    courseCount: 120,
    color: "#16A34A",
  },
  {
    id: "3",
    name: "Communication",
    icon: FiMessageSquare,
    courseCount: 38,
    color: "#DC2626",
  },
  {
    id: "4",
    name: "Data Analytics",
    icon: FiBarChart2,
    courseCount: 67,
    color: "#7C3AED",
  },
  {
    id: "5",
    name: "Cybersecurity",
    icon: FiShield,
    courseCount: 34,
    color: "#0891B2",
  },
  {
    id: "6",
    name: "Design",
    icon: FiFeather,
    courseCount: 52,
    color: "#EA580C",
  },
  {
    id: "7",
    name: "HR & Management",
    icon: FiUsers,
    courseCount: 41,
    color: "#BE185D",
  },
  {
    id: "8",
    name: "Sales & Marketing",
    icon: FiTrendingUp,
    courseCount: 58,
    color: "#4F46E5",
  },
];

// Collection Cards mock data for use with CollectionCard component
export const collectionCards: ContentSearchItem[] = [
  {
    identifier: "collection-1",
    name: "The AI Engineer Course 2026: Complete AI Engineer\n Bootcamp",
    appIcon: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
    primaryCategory: "Leadership",
    description: "Comprehensive leadership training for modern managers",
    objectType: "Collection",
    status: "Live",
  },
  {
    identifier: "collection-2",
    name: "Data Engineering Foundations",
    appIcon: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop",
    primaryCategory: "Course",
    description: "Master Python programming from basics to advanced concepts",
    objectType: "Collection",
    status: "Live",
  },
  {
    identifier: "collection-3",
    name: "Generative AI for Cybersecurity Professionals",
    appIcon: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop",
    primaryCategory: "Textbook",
    description: "Improve your communication and presentation abilities",
    objectType: "Collection",
    status: "Live",
  },
  {
    identifier: "collection-4",
    name: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
    appIcon: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
    primaryCategory: "Course",
    description: "Learn data analytics using popular tools and technologies",
    objectType: "Collection",
    status: "Live",
  },
  {
    identifier: "collection-5",
    name: "Data Engineering Foundations",
    appIcon: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop",
    primaryCategory: "Skills",
    description: "Prepare for PMP certification with comprehensive training",
    objectType: "Collection",
    status: "Live",
  },
  {
    identifier: "collection-6",
    name: "Generative AI for Cybersecurity Professionals",
            appIcon: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop",
            
    primaryCategory: "Course",
    description: "Master AWS cloud architecture and earn certification",
    objectType: "Collection",
    status: "Live",
  },
];