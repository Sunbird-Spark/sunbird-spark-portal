import React from "react";
import { FiCheck, FiCode, FiEdit3, FiTrendingUp, FiBriefcase, FiLayout, FiMoreHorizontal, FiCpu, FiServer, FiBox, FiTerminal, FiGitBranch } from "react-icons/fi";

export interface OptionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export const languageOptions: OptionItem[] = [
  { id: "english", label: "English" },
  { id: "arabic", label: "Arabic" },
  { id: "french", label: "French" },
  { id: "hindi", label: "Hindi" },
  { id: "kannada", label: "Kannada" },
  { id: "other", label: "Other" },
];

export const roleOptions: OptionItem[] = [
  { id: "developer", label: "Developer", icon: <FiCode className="w-5 h-5" /> },
  { id: "teacher", label: "Teacher", icon: <FiEdit3 className="w-5 h-5" /> },
  { id: "marketer", label: "Marketer", icon: <FiTrendingUp className="w-5 h-5" /> },
  { id: "entrepreneur", label: "Entrepreneur", icon: <FiBriefcase className="w-5 h-5" /> },
  { id: "designer", label: "Designer", icon: <FiLayout className="w-5 h-5" /> },
  { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
];

export const skillsByRole: Record<string, OptionItem[]> = {
  developer: [
    { id: "ai-ml", label: "AI and ML", icon: <FiCpu className="w-5 h-5" /> },
    { id: "nodejs", label: "Node JS", icon: <FiServer className="w-5 h-5" /> },
    { id: "reactjs", label: "React JS", icon: <FiBox className="w-5 h-5" /> },
    { id: "javascript", label: "JavaScript", icon: <FiTerminal className="w-5 h-5" /> },
    { id: "devops", label: "DevOps", icon: <FiGitBranch className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  teacher: [
    { id: "curriculum", label: "Curriculum Design", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "assessment", label: "Assessment", icon: <FiCheck className="w-5 h-5" /> },
    { id: "elearning", label: "E-Learning", icon: <FiLayout className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  marketer: [
    { id: "digital", label: "Digital Marketing", icon: <FiTrendingUp className="w-5 h-5" /> },
    { id: "content", label: "Content Marketing", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "seo", label: "SEO", icon: <FiCode className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  entrepreneur: [
    { id: "startup", label: "Startup Management", icon: <FiBriefcase className="w-5 h-5" /> },
    { id: "finance", label: "Finance", icon: <FiTrendingUp className="w-5 h-5" /> },
    { id: "leadership", label: "Leadership", icon: <FiCheck className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  designer: [
    { id: "ui-ux", label: "UI/UX Design", icon: <FiLayout className="w-5 h-5" /> },
    { id: "graphic", label: "Graphic Design", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "motion", label: "Motion Design", icon: <FiBox className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
  other: [
    { id: "general", label: "General Skills", icon: <FiCheck className="w-5 h-5" /> },
    { id: "communication", label: "Communication", icon: <FiEdit3 className="w-5 h-5" /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal className="w-5 h-5" /> },
  ],
};
