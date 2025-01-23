import { DistributeRewards } from '@/components/distribute-rewards';

export default function DistributeRewardsPage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen text-center">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Distribute Rewards</h1>
        <p className="text-lg text-gray-500">
          Distribute rewards to all stakers through rebasing
        </p>
      </div>
      <DistributeRewards />
    </div>
  );
}
