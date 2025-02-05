import { AdminLayout } from '@/components/admin/admin-layout';
import { DistributeRewards } from '@/components/admin/distribute-rewards';

export default function DistributeRewardsPage() {
  return (
    <AdminLayout defaultTab="distribute">
      <DistributeRewards />
    </AdminLayout>
  );
}
