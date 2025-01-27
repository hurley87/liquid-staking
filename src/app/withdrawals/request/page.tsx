import { WithdrawalsLayout } from '@/components/withdrawals/withdrawals-layout';
import { WithdrawalsRequest } from '@/components/withdrawals/withdrawals-request';

export default function RequestWithdrawalPage() {
  return (
    <WithdrawalsLayout defaultTab="request">
      <WithdrawalsRequest />
    </WithdrawalsLayout>
  );
}
