import { SetStakingContract } from '@/components/admin/set-staking-contract';

export default function SetStakingPage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen text-center">
      <div className="max-w-md mx-auto">
        <SetStakingContract />
      </div>
    </div>
  );
}
