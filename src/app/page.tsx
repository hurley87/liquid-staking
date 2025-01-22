import { Stake } from '@/components/stake';

export default function Home() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen text-center">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Stake PEAQ</h1>
        <p className="text-lg text-gray-500">
          Stake PEAQ and receive stPEAQ while staking
        </p>
      </div>
      <Stake />
    </div>
  );
}
