import { Link } from 'react-router-dom';
import { FiArrowRight, FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';

/**
 * Static entry point into the aggregate My Skills page. Deliberately fetches
 * nothing — the Profile page stays fast, and the skills page owns its own data.
 */
const ProfileSkillsLink = () => {
  const { t } = useAppI18n();

  return (
    <Link
      to="/profile/skills"
      className="learning-list-card mt-6 flex items-center justify-between gap-4 transition-colors hover:bg-sunbird-ivory"
      data-testid="profile-skills-link"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunbird-success-message-bg text-sunbird-green-dark">
          <FiAward className="h-5 w-5" />
        </span>
        <div>
          <h2 className="learning-title">{t('profileSkills.cardTitle')}</h2>
          <p className="text-sm text-sunbird-gray-75">{t('profileSkills.cardDescription')}</p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-sunbird-brick">
        {t('profileSkills.cardCta')}
        <FiArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
};

export default ProfileSkillsLink;
