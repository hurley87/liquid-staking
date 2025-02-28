import { SetStakingPageComponent } from '@/components/set-staking-page';

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
          <p className="text-gray-500">
            Configure system settings and contract parameters
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">
              Contract Configuration
            </h2>
            <SetStakingPageComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
