import { PageHeader } from '../../components/layout/PageHeader';
import { useAppNavigate } from '../../lib/navigation';
import { GrowthRightsContent } from './index';

export const GrowthRightsPage = () => {
  const { goBackOr } = useAppNavigate();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="成长权益" onBack={() => goBackOr('shield')} />
      <div className="flex-1 overflow-y-auto">
        <GrowthRightsContent />
      </div>
    </div>
  );
};

export default GrowthRightsPage;
