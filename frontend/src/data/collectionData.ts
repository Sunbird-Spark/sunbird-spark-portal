import resourceRobotHand from "@/assets/resource-robot-hand.svg";
import resourceVR from "@/assets/resource-vr.svg";
import resourceHacker from "@/assets/resource-hacker.svg";
import resourceBitcoin from "@/assets/resource-bitcoin.svg";

export interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: "video" | "document";
}

export interface Module {
    id: string;
    title: string;
    subtitle: string;
    lessons: Lesson[];
}

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

export interface CollectionData {
    id: string;
    title: string;
    rating: number;
    learners: string;
    lessons: number;
    image: string;
    weeks: number;
    description: string;
    skills: string[];
    bestSuitedFor: string[];
    modules: Module[];
    relatedContent: RelatedItem[];
}

export const collectionData: CollectionData = {
    id: "1",
    title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
    rating: 4.5,
    learners: "9k",
    lessons: 26,
    image: resourceRobotHand,
    weeks: 4,
    description: "Introduction to Cyber Security course for beginners is designed to give you a foundational look at today's cybersecurity landscape and provide you with the tools to evaluate and manage security protocols in information processing systems.",
    skills: [
        "Business analysis, planning, and monitoring",
        "Elicitation and collaboration",
        "Requirements life cycle management",
        "Business intelligence perspective",
        "Requirements analysis and design definition",
    ],
    bestSuitedFor: [
        "Business Analyst",
        "Data Analyst",
        "Business Analyst",
        "Analytics Managers",
    ],
    modules: [
        {
            id: "week-1",
            title: "Week 1: Foundation & Basics",
            subtitle: "Business analysis, planning, and monitoring",
            lessons: [
                { id: "1-1", title: "0.1 Overview", duration: "04:56", type: "video" },
                { id: "1-2", title: "0.2 Business Decisions and Analytics", duration: "04:56", type: "document" },
                { id: "1-3", title: "0.3 Types of Business Analytics", duration: "04:56", type: "video" },
                { id: "1-4", title: "0.4 Applications of Business Analytics", duration: "04:56", type: "video" },
                { id: "1-5", title: "0.5 Data Science Overview", duration: "04:56", type: "document" },
            ],
        },
        {
            id: "week-2",
            title: "Week 2: Core Competencies",
            subtitle: "Business analysis, planning, and monitoring",
            lessons: [
                { id: "2-1", title: "1.1 Advanced Concepts", duration: "05:30", type: "video" },
                { id: "2-2", title: "1.2 Practical Applications", duration: "06:15", type: "document" },
            ],
        },
    ],
    relatedContent: [
        {
            id: "r-1",
            title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
            type: "Course",
            image: resourceRobotHand,
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
            image: resourceVR,
            rating: 4.5,
            learners: "9k",
            lessons: 25,
        },
    ],
};
