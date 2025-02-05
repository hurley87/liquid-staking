import { AdminLayout } from '@/components/admin/admin-layout';
import { AdminWithdraw } from '@/components/admin/admin-withdraw';

export default function WithdrawPage() {
  return (
    <AdminLayout defaultTab="withdraw">
      <AdminWithdraw />
    </AdminLayout>
  );
}
