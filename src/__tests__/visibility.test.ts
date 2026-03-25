import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPublicTactics } from '../app/api/tactics/public/route';
import { GET as getTeamTactics } from '../app/api/teams/[teamId]/tactics/route';
import { PUT as updateVisibility } from '../app/api/tactics/[tacticId]/visibility/route';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock next-auth
vi.mock('next-auth', async () => {
  const actual = await vi.importActual('next-auth');
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tactic: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    team: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/tactics/public', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only PUBLIC tactics', async () => {
    // Mock public tactics
    const mockTactics = [
      {
        id: '1',
        name: 'Public Tactic 1',
        description: 'Public',
        data: '{"positions":[]}',
        visibility: 'PUBLIC',
        teamId: 'team1',
        createdAt: new Date(),
        updatedAt: new Date(),
        team: { name: 'Team 1', id: 'team1' },
      },
      {
        id: '2',
        name: 'Private Tactic',
        description: 'Private',
        data: '{"positions":[]}',
        visibility: 'PRIVATE',
        teamId: 'team2',
        createdAt: new Date(),
        updatedAt: new Date(),
        team: { name: 'Team 2', id: 'team2' },
      },
      {
        id: '3',
        name: 'Team Tactic',
        description: 'Team',
        data: '{"positions":[]}',
        visibility: 'TEAM',
        teamId: 'team3',
        createdAt: new Date(),
        updatedAt: new Date(),
        team: { name: 'Team 3', id: 'team3' },
      },
    ];

    (prisma.tactic.findMany as any).mockResolvedValue([mockTactics[0]]); // only first is PUBLIC

    const request = new NextRequest('http://localhost/api/tactics/public');
    const response = await getPublicTactics(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].visibility).toBe('PUBLIC');
    expect(data[0].name).toBe('Public Tactic 1');
  });

  it('handles database errors', async () => {
    (prisma.tactic.findMany as any).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost/api/tactics/public');
    const response = await getPublicTactics(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch public tactics');
  });
});

describe('GET /api/teams/[teamId]/tactics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns tactics for team members including PRIVATE, TEAM, PUBLIC', async () => {
    const teamId = 'team1';
    const userId = 'user1';

    const mockUser = { id: userId, email: 'user@test.com' };
    const mockTeam = {
      id: teamId,
      name: 'Test Team',
      members: [{ userId }],
      tactics: [
        {
          id: 't1',
          name: 'Private Tactic',
          data: '{"positions":[]}',
          visibility: 'PRIVATE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 't2',
          name: 'Team Tactic',
          data: '{"positions":[]}',
          visibility: 'TEAM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 't3',
          name: 'Public Tactic',
          data: '{"positions":[]}',
          visibility: 'PUBLIC',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    (getServerSession as any).mockResolvedValue({ user: { email: 'user@test.com' } });
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.team.findFirst as any).mockResolvedValue(mockTeam);

    const params = { teamId };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics`);
    const response = await getTeamTactics(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    expect(data.map((t: any) => t.visibility).sort()).toEqual(['PRIVATE', 'PUBLIC', 'TEAM']);
  });

  it('denies access for non-team members', async () => {
    const teamId = 'team1';
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@test.com' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user1' });
    (prisma.team.findFirst as any).mockResolvedValue(null); // no team found

    const params = { teamId };
    const request = new NextRequest(`http://localhost/api/teams/${teamId}/tactics`);
    const response = await getTeamTactics(request, { params });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Team not found or access denied');
  });

  it('requires authentication', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const params = { teamId: 'team1' };
    const request = new NextRequest('http://localhost/api/teams/team1/tactics');
    const response = await getTeamTactics(request, { params });
    expect(response.status).toBe(401);
  });
});

describe('PUT /api/tactics/[tacticId]/visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows setting visibility to TEAM for team member', async () => {
    const tacticId = 'tactic1';
    const teamId = 'team1';
    const userId = 'user1';

    const mockTactic = {
      id: tacticId,
      name: 'Test',
      data: '{"positions":[]}',
      visibility: 'PRIVATE',
      teamId,
      createdBy: userId,
    };

    const mockTeam = {
      id: teamId,
      members: [{ userId }],
    };

    (getServerSession as any).mockResolvedValue({ user: { email: 'user@test.com' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId, email: 'user@test.com' });
    (prisma.tactic.findUnique as any).mockResolvedValue(mockTactic);
    (prisma.team.findFirst as any).mockResolvedValue(mockTeam);
    (prisma.tactic.update as any).mockResolvedValue({ ...mockTactic, visibility: 'TEAM' });

    const body = { visibility: 'TEAM' };
    const request = new NextRequest(`http://localhost/api/tactics/${tacticId}/visibility`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    // Set content-type
    request.headers.set('Content-Type', 'application/json');

    const params = { tacticId };
    const response = await updateVisibility(request, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.visibility).toBe('TEAM');
  });

  it('allows setting visibility to PUBLIC', async () => {
    const tacticId = 'tactic1';
    const teamId = 'team1';
    const userId = 'user1';

    const mockTactic = { id: tacticId, name: 'Test', data: '{}', visibility: 'PRIVATE', teamId, createdBy: userId };
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@test.com' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId });
    (prisma.tactic.findUnique as any).mockResolvedValue(mockTactic);
    (prisma.team.findFirst as any).mockResolvedValue({ id: teamId, members: [{ userId }] });
    (prisma.tactic.update as any).mockResolvedValue({ ...mockTactic, visibility: 'PUBLIC' });

    const body = { visibility: 'PUBLIC' };
    const request = new NextRequest(`http://localhost/api/tactics/${tacticId}/visibility`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await updateVisibility(request, { params: { tacticId } });
    expect(response.status).toBe(200);
  });

  it('rejects invalid visibility value', async () => {
    const tacticId = 'tactic1';
    const teamId = 'team1';
    const userId = 'user1';
    const mockTactic = { id: tacticId, name: 'Test', data: '{}', visibility: 'PRIVATE', teamId, createdBy: userId };
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@test.com' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: userId });
    (prisma.tactic.findUnique as any).mockResolvedValue(mockTactic);
    (prisma.team.findFirst as any).mockResolvedValue({ id: teamId, members: [{ userId }] });

    const body = { visibility: 'INVALID' };
    const request = new NextRequest(`http://localhost/api/tactics/${tacticId}/visibility`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await updateVisibility(request, { params: { tacticId } });
    expect(response.status).toBe(400);
  });

  it('denies non-team members from updating visibility', async () => {
    const tacticId = 'tactic1';
    const teamId = 'team1';
    const mockTactic = { id: tacticId, name: 'Test', data: '{}', visibility: 'PRIVATE', teamId, createdBy: 'otherUser' };
    (getServerSession as any).mockResolvedValue({ user: { email: 'user@test.com' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user1' });
    (prisma.tactic.findUnique as any).mockResolvedValue(mockTactic);
    (prisma.team.findFirst as any).mockResolvedValue(null); // not a member

    const body = { visibility: 'TEAM' };
    const request = new NextRequest(`http://localhost/api/tactics/${tacticId}/visibility`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    request.headers.set('Content-Type', 'application/json');

    const response = await updateVisibility(request, { params: { tacticId } });
    expect(response.status).toBe(403);
  });
});
