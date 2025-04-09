import { AdminLayout } from '@/components/admin/admin-layout';
import { WithdrawalTrackingTable } from '@/components/admin/withdrawal-tracking/withdrawal-tracking-table';

export default function WithdrawalTrackingPage() {
  return (
    <AdminLayout defaultTab="withdraw">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Withdrawal Tracking</h1>
        <WithdrawalTrackingTable />
      </div>
    </AdminLayout>
  );
}
