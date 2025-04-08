import { AdminLayout } from '@/components/admin/admin-layout';
import { ManageWithdrawalDelay } from '@/components/admin/manage-withdrawal-delay';

export default function WithdrawalDelayPage() {
  return (
    <AdminLayout defaultTab="withdraw">
      <ManageWithdrawalDelay />
    </AdminLayout>
  );
}
