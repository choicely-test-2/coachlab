import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { incrementUserActivity } from '@/lib/achievements';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', rateLimit: { remaining: 0, resetAfter: rateLimit.resetAfter } },
      { status: 429 }
    );
  }

  try {
    await incrementUserActivity(userId);
    return NextResponse.json({ success: true, rateLimit: { remaining: rateLimit.remaining, resetAfter: rateLimit.resetAfter } });
  } catch (error) {
    console.error('Error incrementing activity:', error);
    return NextResponse.json(
      { error: 'Failed to increment activity' },
      { status: 500 }
    );
  }
}
