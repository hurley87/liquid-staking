import { AdminLayout } from '@/components/admin/admin-layout';
import { ManageStakingLimit } from '@/components/admin/manage-staking-limit';

export default function StakingLimitPage() {
  return (
    <AdminLayout defaultTab="staking-limit">
      <ManageStakingLimit />
    </AdminLayout>
  );
}
