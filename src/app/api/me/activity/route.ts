import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { incrementUserActivity } from '@/lib/achievements';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await incrementUserActivity(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing activity:', error);
    return NextResponse.json(
      { error: 'Failed to increment activity' },
      { status: 500 }
    );
  }
}
