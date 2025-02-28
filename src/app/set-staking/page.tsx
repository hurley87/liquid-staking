import { SetStakingPageComponent } from '@/components/set-staking-page';

export default function SetStakingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Set Staking Contract</h1>
          <p className="text-gray-500">
            Configure the staking contract address for the stPEAQ token
          </p>
        </div>

        <SetStakingPageComponent />

        <div className="mt-8 text-center">
          <a
            href="/admin"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Return to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
