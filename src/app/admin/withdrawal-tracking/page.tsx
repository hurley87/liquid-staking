import { WithdrawalTrackingTable } from '@/components/admin/withdrawal-tracking/withdrawal-tracking-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WithdrawalTrackingPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <WithdrawalTrackingTable />
        </CardContent>
      </Card>
    </div>
  );
}
