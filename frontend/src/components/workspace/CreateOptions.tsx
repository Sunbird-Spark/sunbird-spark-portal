import { FiBook, FiFileText, FiUpload, FiVideo, FiYoutube, FiActivity, FiLayers, FiHelpCircle, FiGrid } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { IconType } from "react-icons";

interface EditorOption {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  iconBg: string;
  iconColor: string;
}

interface EditorCategory {
  id: string;
  title: string;
  subtitle: string;
  options: EditorOption[];
  accentColor: string;
  borderColor: string;
}

interface CreateOptionsProps {
  onOptionSelect: (optionId: string) => void;
}

const CreateOptions = ({ onOptionSelect }: CreateOptionsProps) => {
  const { t } = useAppI18n();

  const editorCategories: EditorCategory[] = [
    {
      id: 'collection-editor',
      title: 'Collection Editor',
      subtitle: 'Create structured learning content',
      accentColor: 'bg-sunbird-wave',
      borderColor: 'border-sunbird-wave/30',
      options: [
        {
          id: 'course',
          title: 'Course',
          description: 'Design courses with modules, lessons, and assessments for structured learning paths.',
          icon: FiBook,
          iconBg: 'bg-sunbird-wave/15',
          iconColor: 'text-sunbird-ink',
        },
        {
          id: 'textbook',
          title: 'Textbook',
          description: 'Create digital textbooks with chapters, sections, and rich multimedia content.',
          icon: FiLayers,
          iconBg: 'bg-sunbird-wave/15',
          iconColor: 'text-sunbird-ink',
        },
        {
          id: 'collection',
          title: 'Collection',
          description: 'Organize and curate resources into thematic collections for easy discovery.',
          icon: FiGrid,
          iconBg: 'bg-sunbird-wave/15',
          iconColor: 'text-sunbird-ink',
        },
      ],
    },
    {
      id: 'upload-editor',
      title: 'Upload Editor',
      subtitle: 'Upload and publish existing content',
      accentColor: 'bg-sunbird-ginger',
      borderColor: 'border-sunbird-ginger/30',
      options: [
        {
          id: 'upload-pdf',
          title: 'PDF Document',
          description: 'Upload PDF files, presentations, and documents for learner access.',
          icon: FiFileText,
          iconBg: 'bg-sunbird-ginger/15',
          iconColor: 'text-sunbird-brick',
        },
        {
          id: 'upload-video',
          title: 'Video Content',
          description: 'Upload video files with automatic transcoding and streaming optimization.',
          icon: FiVideo,
          iconBg: 'bg-sunbird-ginger/15',
          iconColor: 'text-sunbird-brick',
        },
        {
          id: 'upload-youtube',
          title: 'YouTube Video',
          description: 'Link YouTube videos with embedded player and tracking capabilities.',
          icon: FiYoutube,
          iconBg: 'bg-sunbird-ginger/15',
          iconColor: 'text-sunbird-brick',
        },
      ],
    },
    {
      id: 'resource-editor',
      title: 'Resource Editor',
      subtitle: 'Create interactive learning resources',
      accentColor: 'bg-sunbird-moss',
      borderColor: 'border-sunbird-moss/30',
      options: [
        {
          id: 'interactive',
          title: 'Interactive Activity',
          description: 'Build engaging activities with drag-drop, matching, and simulation elements.',
          icon: FiActivity,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
        {
          id: 'quiz',
          title: 'Quiz & Assessment',
          description: 'Create quizzes with MCQs, fill-in-the-blanks, and auto-grading capabilities.',
          icon: FiHelpCircle,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
        {
          id: 'story',
          title: 'Story & Game',
          description: 'Design interactive stories and gamified learning experiences.',
          icon: FiUpload,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-sunbird-ginger/10 via-sunbird-wave/10 to-sunbird-moss/10 rounded-[20px] p-6 md:p-8 border border-sunbird-ginger/20">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground font-['Rubik'] mb-2">
          What would you like to create?
        </h2>
        <p className="text-muted-foreground text-sm md:text-base font-['Rubik']">
          Choose an editor type below to start creating content for your learners.
        </p>
      </div>

      {/* Editor Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {editorCategories.map((category) => (
          <div
            key={category.id}
            className={`bg-white rounded-[20px] border-2 ${category.borderColor} shadow-md overflow-hidden`}
          >
            {/* Category Header */}
            <div className={`${category.accentColor} px-5 py-4`}>
              <h3 className="text-lg font-semibold text-white font-['Rubik']">
                {category.title}
              </h3>
              <p className="text-white/80 text-sm font-['Rubik']">
                {category.subtitle}
              </p>
            </div>

            {/* Options List */}
            <div className="p-4 space-y-3">
              {category.options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => onOptionSelect(option.id)}
                    className="w-full text-left p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${option.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${option.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm font-['Rubik'] mb-0.5 group-hover:text-sunbird-brick transition-colors">
                          {option.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-['Rubik'] line-clamp-2">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateOptions;