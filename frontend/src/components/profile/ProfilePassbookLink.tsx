import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';

/**
 * Entry point into the Competency Passbook. Fetches nothing, exactly like
 * `ProfileSkillsLink` — the Profile page stays fast and the passbook page owns
 * its own data.
 */
const ProfilePassbookLink = () => {
  const { t } = useAppI18n();

  return (
    <Link
      to="/profile/passbook"
      className="learning-list-card mt-6 flex items-center justify-between gap-4 transition-colors hover:bg-sunbird-ivory"
      data-testid="profile-passbook-link"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunbird-ivory text-sunbird-brick">
          <FiBookOpen className="h-5 w-5" />
        </span>
        <div>
          <h2 className="learning-title">{t('passbook.cardTitle')}</h2>
          <p className="text-sm text-sunbird-gray-75">{t('passbook.cardDescription')}</p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-sunbird-brick">
        {t('passbook.cardCta')}
        <FiArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
};

export default ProfilePassbookLink;
