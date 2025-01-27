import { WithdrawalsLayout } from '@/components/withdrawals/withdrawals-layout';
import { WithdrawalsClaim } from '@/components/withdrawals/withdrawals-claim';

export default function ClaimWithdrawalPage() {
  return (
    <WithdrawalsLayout defaultTab="claim">
      <WithdrawalsClaim />
    </WithdrawalsLayout>
  );
}
