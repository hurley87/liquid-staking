import { AdminLayout } from '@/components/admin/admin-layout';
import { WhitelistCollator } from '@/components/admin/whitelist-collator';

export default function WhitelistPage() {
  return (
    <AdminLayout defaultTab="withdraw">
      <WhitelistCollator />
    </AdminLayout>
  );
}
