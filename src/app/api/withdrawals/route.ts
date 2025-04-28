import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { publicClient } from '@/lib/publicClient';
import { liquidStakingAbi, liquidStakingAddress } from '@/lib/LiquidStaking';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

type WithdrawalRequest = {
  amount: bigint;
  unlockTime: bigint;
};

export async function GET() {
  try {
    // Get all users from Privy
    const privyUsers = await privy.getUsers();

    // Get withdrawal requests for each user
    const allWithdrawals = await Promise.all(
      privyUsers.map(async (user) => {
        const address = user.wallet?.address as `0x${string}`;
        if (!address) return null;

        try {
          // Get withdrawal requests for this user
          const requests = (await publicClient.readContract({
            address: liquidStakingAddress,
            abi: liquidStakingAbi,
            functionName: 'getWithdrawalRequests',
            args: [address],
          })) as WithdrawalRequest[];

          // Format the requests
          return {
            address,
            requests: requests.map((request) => ({
              amount: request.amount.toString(),
              unlockTime: new Date(
                Number(request.unlockTime) * 1000
              ).toISOString(),
              isClaimable:
                Number(request.unlockTime) <= Math.floor(Date.now() / 1000),
            })),
          };
        } catch (error) {
          console.error(`Error fetching withdrawals for ${address}:`, error);
          return {
            address,
            requests: [],
            error: 'Failed to fetch withdrawals',
          };
        }
      })
    );

    // Filter out null entries and return the data
    const validWithdrawals = allWithdrawals.filter(Boolean);

    return NextResponse.json({
      success: true,
      data: validWithdrawals,
    });
  } catch (error) {
    console.error('Error in withdrawals route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}
