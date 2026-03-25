import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { incrementUserActivity } from '@/lib/achievements';
import { POST as createTactic } from '../../app/api/teams/[teamId]/tactics/route';
import { POST as createSession } from '../../app/api/teams/[teamId]/sessions/route';
import { POST as exportTactic } from '../../app/api/teams/[teamId]/tactics/[tacticId]/export/route';

// Mock next-auth
vi.mock('next-auth', async () => {
  const actual = await vi.importActual('next-auth');
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

// Mock prisma with vi.fn methods
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userActivity: {
      upsert: vi.fn(),
    },
    tactic: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    team: {
      findFirst: vi.fn(),
    },
    export: {
      create: vi.fn(),
    },
    practiceSession: {
      create: vi.fn(),
    },
    userTeam: {
      findFirst: vi.fn(),
    },
  },
}));

// We'll use the imported prisma (which is the mock) to set up and clear mocks.
// Helper to reset all mocks
function resetMocks() {
  vi.clearAllMocks();
}

// Helper to get today's date at midnight
function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ==========================================
// Tests for incrementUserActivity
// ==========================================
describe('incrementUserActivity - streak logic', () => {
  const userId = 'user123';

  beforeEach(() => {
    vi.useFakeTimers();
    // Set current time to 2025-03-25T12:00:00Z
    vi.setSystemTime(new Date('2025-03-25T12:00:00Z'));
    resetMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets streak to 1 for first activity (no lastActivityDate)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      currentStreak: 0,
      lastActivityDate: null,
    });

    await incrementUserActivity(userId);

    expect(prisma.userActivity.upsert).toHaveBeenCalledWith({
      where: { userId_date: { userId, date: expect.any(Date) } },
      update: { actionCount: { increment: 1 } },
      create: { userId, date: expect.any(Date), actionCount: 1 },
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        currentStreak: 1,
        lastActivityDate: expect.any(Date),
      },
    });
  });

  it('increments streak when last activity was yesterday', async () => {
    const yesterday = new Date('2025-03-24T00:00:00Z');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      currentStreak: 3,
      lastActivityDate: yesterday,
    });

    await incrementUserActivity(userId);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        currentStreak: 4,
        lastActivityDate: expect.any(Date),
      },
    });
  });

  it('does not change streak when last activity was today', async () => {
    const today = new Date('2025-03-25T00:00:00Z');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      currentStreak: 5,
      lastActivityDate: today,
    });

    await incrementUserActivity(userId);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        currentStreak: 5,
        lastActivityDate: expect.any(Date),
      },
    });
  });

  it('resets streak to 1 when last activity was before yesterday', async () => {
    const oldDate = new Date('2025-03-20T00:00:00Z');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      currentStreak: 10,
      lastActivityDate: oldDate,
    });

    await incrementUserActivity(userId);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        currentStreak: 1,
        lastActivityDate: expect.any(Date),
      },
    });
  });
});

// ==========================================
// Tests for POST /api/teams/[teamId]/tactics
// ==========================================
describe('POST /api/teams/[teamId]/tactics', () => {
  const teamId = 'team1';
  const userId = 'user1';
  const userEmail = 'user@test.com';
  const tacticId = 'tactic1';
  const today = getTodayMidnight();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-25T12:00:00Z'));
    resetMocks();
    // Mock auth session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: userEmail },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('successfully creates tactic, awards points, and records activity', async () => {
    // Mock user lookup
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    // Mock team membership
    (prisma.team.findFirst as any).mockResolvedValue({
      id: teamId,
      members: [{ userId }],
    });
    // Mock tactic creation
    (prisma.tactic.create as any).mockResolvedValue({
      id: tacticId,
      name: 'Test Tactic',
      description: 'Test',
      data: JSON.stringify({ positions: [] }),
      teamId,
      createdBy: userId,
      visibility: 'PRIVATE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // For incrementUserActivity: mock findUnique inside it
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      currentStreak: 2,
      lastActivityDate: new Date('2025-03-24T00:00:00Z'),
    });

    const payload = { name: 'Test Tactic', data: { positions: [] }, visibility: 'PRIVATE' };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await createTactic(request, { params: { teamId } });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe('Test Tactic');
    expect(data.data).toEqual({ positions: [] });

    // Verify points award
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { points: { increment: 10 } },
    });

    // Verify activity upsert and streak update
    expect(prisma.userActivity.upsert).toHaveBeenCalled();
    // The second user.update call (for streak) should have been called with incremented streak
    const updateCalls = (prisma.user.update as any).mock.calls;
    // We expect two calls: one for points, one for streak
    expect(updateCalls.length).toBe(2);
    const streakUpdateCall = updateCalls[1];
    expect(streakUpdateCall[0].data.currentStreak).toBe(3); // incremented from 2
  });

  it('returns 500 if points award fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.team.findFirst as any).mockResolvedValue({ id: teamId, members: [{ userId }] });
    (prisma.tactic.create as any).mockResolvedValue({
      id: tacticId,
      name: 'Test',
      data: '{}',
      teamId,
      createdBy: userId,
      visibility: 'PRIVATE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // Simulate points update failure
    (prisma.user.update as any).mockRejectedValueOnce(new Error('DB error'));

    const payload = { name: 'Test', data: {}, visibility: 'PRIVATE' };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await createTactic(request, { params: { teamId } });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to complete tactic creation due to server error');
  });

  it('returns 500 if incrementUserActivity fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.team.findFirst as any).mockResolvedValue({ id: teamId, members: [{ userId }] });
    (prisma.tactic.create as any).mockResolvedValue({
      id: tacticId,
      name: 'Test',
      data: '{}',
      teamId,
      createdBy: userId,
      visibility: 'PRIVATE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // Points update will succeed
    (prisma.user.update as any).mockResolvedValueOnce(undefined);
    // Simulate failure in userActivity.upsert (first operation in incrementUserActivity)
    (prisma.userActivity.upsert as any).mockRejectedValueOnce(new Error('DB error'));

    const payload = { name: 'Test', data: {}, visibility: 'PRIVATE' };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await createTactic(request, { params: { teamId } });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to complete tactic creation due to server error');
  });
});

// ==========================================
// Tests for POST /api/teams/[teamId]/sessions
// ==========================================
describe('POST /api/teams/[teamId]/sessions', () => {
  const teamId = 'team1';
  const userId = 'user1';
  const userEmail = 'user@test.com';
  const sessionId = 'session1';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-25T12:00:00Z'));
    resetMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: userEmail },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('successfully creates session, awards points, and records activity', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.team.findFirst as any).mockResolvedValue({ id: teamId, members: [{ userId }] });
    (prisma.practiceSession.create as any).mockResolvedValue({
      id: sessionId,
      date: new Date('2025-03-25T10:00:00Z'),
      notes: null,
      teamId,
      coachId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      coach: { name: 'Coach', email: userEmail },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      currentStreak: 1,
      lastActivityDate: new Date('2025-03-24T00:00:00Z'),
    });

    const payload = { date: '2025-03-25T10:00:00.000Z' };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await createSession(request, { params: { teamId } });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe(sessionId);

    // Points award
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { points: { increment: 20 } },
    });

    // Activity
    expect(prisma.userActivity.upsert).toHaveBeenCalled();
    const updateCalls = (prisma.user.update as any).mock.calls;
    expect(updateCalls.length).toBe(2);
    expect(updateCalls[1][0].data.currentStreak).toBe(2);
  });

  it('returns 500 if points award fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.team.findFirst as any).mockResolvedValue({ id: teamId, members: [{ userId }] });
    (prisma.practiceSession.create as any).mockResolvedValue({
      id: sessionId,
      date: new Date(),
      notes: null,
      teamId,
      coachId: userId,
      coach: { name: 'Coach', email: userEmail },
    });
    (prisma.user.update as any).mockRejectedValueOnce(new Error('DB error'));

    const payload = { date: new Date().toISOString() };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await createSession(request, { params: { teamId } });

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe('Failed to complete session creation due to server error');
  });

  it('returns 500 if incrementUserActivity fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.team.findFirst as any).mockResolvedValue({ id: teamId, members: [{ userId }] });
    (prisma.practiceSession.create as any).mockResolvedValue({
      id: sessionId,
      date: new Date(),
      notes: null,
      teamId,
      coachId: userId,
      coach: { name: 'Coach', email: userEmail },
    });
    (prisma.user.update as any).mockResolvedValueOnce(undefined); // points succeed
    (prisma.userActivity.upsert as any).mockRejectedValueOnce(new Error('DB error'));

    const payload = { date: new Date().toISOString() };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await createSession(request, { params: { teamId } });

    expect(response.status).toBe(500);
  });
});

// ==========================================
// Tests for POST /api/teams/[teamId]/tactics/[tacticId]/export
// ==========================================
describe('POST /api/teams/[teamId]/tactics/[tacticId]/export', () => {
  const teamId = 'team1';
  const tacticId = 'tactic1';
  const userId = 'user1';
  const userEmail = 'user@test.com';

  beforeEach(() => {
    resetMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: userEmail },
    });
  });

  it('successfully records export, awards points, and records activity', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.tactic.findFirst as any).mockResolvedValue({
      id: tacticId,
      teamId,
      createdBy: userId,
    });
    (prisma.userTeam.findFirst as any).mockResolvedValue({ userId, teamId });
    (prisma.export.create as any).mockResolvedValue({ id: 'exp1', userId, tacticId });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      currentStreak: 1,
      lastActivityDate: new Date('2025-03-24T00:00:00Z'),
    });

    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics/${tacticId}/export`, {
      method: 'POST',
    });

    const response = await exportTactic(request, { params: { teamId, tacticId } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    expect(prisma.export.create).toHaveBeenCalledWith({
      data: { userId, tacticId },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { points: { increment: 5 } },
    });
    expect(prisma.userActivity.upsert).toHaveBeenCalled();
  });

  it('returns 500 if points award fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.tactic.findFirst as any).mockResolvedValue({
      id: tacticId,
      teamId,
      createdBy: userId,
    });
    (prisma.userTeam.findFirst as any).mockResolvedValue({ userId, teamId });
    (prisma.export.create as any).mockResolvedValue({});
    (prisma.user.update as any).mockRejectedValueOnce(new Error('DB error'));

    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics/${tacticId}/export`, {
      method: 'POST',
    });

    const response = await exportTactic(request, { params: { teamId, tacticId } });

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe('Failed to record export');
  });

  it('returns 500 if incrementUserActivity fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: userEmail });
    (prisma.tactic.findFirst as any).mockResolvedValue({
      id: tacticId,
      teamId,
      createdBy: userId,
    });
    (prisma.userTeam.findFirst as any).mockResolvedValue({ userId, teamId });
    (prisma.export.create as any).mockResolvedValue({});
    (prisma.user.update as any).mockResolvedValueOnce(undefined); // points succeed
    (prisma.userActivity.upsert as any).mockRejectedValueOnce(new Error('DB error'));

    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics/${tacticId}/export`, {
      method: 'POST',
    });

    const response = await exportTactic(request, { params: { teamId, tacticId } });

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe('Failed to record export');
  });
});
