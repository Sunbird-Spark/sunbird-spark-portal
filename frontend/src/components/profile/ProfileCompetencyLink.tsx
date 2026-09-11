import { Link } from 'react-router-dom';
import { FiArrowRight, FiTarget } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';

/**
 * Entry point into the competency skill profile. Fetches nothing, like
 * `ProfileSkillsLink` — the Profile page stays fast and the profile page owns its data.
 *
 * Distinct from "My Skills", which shows taxonomy facets (`se_skills`) gained through
 * Learning Path levels. This one shows competency-framework leaf skills and role readiness.
 */
const ProfileCompetencyLink = () => {
  const { t } = useAppI18n();

  return (
    <Link
      to="/profile/competencies"
      className="learning-list-card mt-6 flex items-center justify-between gap-4 transition-colors hover:bg-sunbird-ivory"
      data-testid="profile-competency-link"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunbird-ivory text-sunbird-brick">
          <FiTarget className="h-5 w-5" />
        </span>
        <div>
          <h2 className="learning-title">{t('skillProfile.cardTitle')}</h2>
          <p className="text-sm text-sunbird-gray-75">{t('skillProfile.cardDescription')}</p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-sunbird-brick">
        {t('skillProfile.cardCta')}
        <FiArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
};

export default ProfileCompetencyLink;
