/** 404 page. Always offers a way home. */
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { PageTitle } from '@/components/ui/Misc';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl">
      <PageTitle>{t('common.pageNotFound')}</PageTitle>
      <p className="text-lg mb-6">{t('common.pageNotFoundBody')}</p>
      <p>
        <Link to="/" className="text-link text-lg font-medium">
          {t('common.goHome')}
        </Link>
      </p>
    </div>
  );
}
