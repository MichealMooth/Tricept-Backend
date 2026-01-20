import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

/**
 * Tests for authorization middleware.
 *
 * Tests cover:
 * 1. Global Admin (isAdmin=true) bypass for all scopes
 * 2. TEAM scope role checking via TeamMembership
 * 3. USER scope ownership verification
 * 4. 403 for insufficient permissions
 * 5. Integration with isAuthenticated pattern
 * 6. Role hierarchy (OWNER > ADMIN > EDITOR > VIEWER > USER)
 */

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock };
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    params: {},
    body: {},
    query: {},
    isAuthenticated: () => true,
    ...overrides,
  } as unknown as Request;
}

describe('authorize.middleware', () => {
  afterEach(() => jest.resetModules());

  /**
   * Test 1: authorize() bypasses in test environment
   */
  it('authorize() bypasses authorization in test environment', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'test' } }));
    jest.doMock('@/services/team-membership.service', () => ({
      getUserRoleInTeam: jest.fn(),
    }));

    const { authorize } = await import('@/middleware/authorize.middleware');

    const next: NextFunction = jest.fn();
    const req = makeReq({ user: { id: 'user-1', isAdmin: false } } as any);
    const res = makeRes();

    await authorize('OWNER', 'TEAM')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  /**
   * Test 2: Global Admin (isAdmin=true) allowed for all scopes
   */
  it('authorize() allows Global Admin (isAdmin=true) for all scopes', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }));
    jest.doMock('@/services/team-membership.service', () => ({
      getUserRoleInTeam: jest.fn(),
    }));

    const { authorize } = await import('@/middleware/authorize.middleware');

    const adminUser = { id: 'admin-1', email: 'admin@test.com', isAdmin: true };

    // Test GLOBAL scope
    const next1: NextFunction = jest.fn();
    const req1 = makeReq({ user: adminUser } as any);
    const res1 = makeRes();
    await authorize('USER', 'GLOBAL')(req1, res1, next1);
    expect(next1).toHaveBeenCalled();

    // Test TEAM scope (without providing teamGroupId - admin should still pass)
    const next2: NextFunction = jest.fn();
    const req2 = makeReq({ user: adminUser, method: 'POST' } as any);
    const res2 = makeRes();
    await authorize('OWNER', 'TEAM')(req2, res2, next2);
    expect(next2).toHaveBeenCalled();

    // Test USER scope (without matching userId - admin should still pass)
    const next3: NextFunction = jest.fn();
    const req3 = makeReq({
      user: adminUser,
      params: { userId: 'other-user' },
    } as any);
    const res3 = makeRes();
    await authorize('USER', 'USER')(req3, res3, next3);
    expect(next3).toHaveBeenCalled();
  });

  /**
   * Test 3: TEAM scope checks TeamMembership role
   */
  it('authorize() checks TeamMembership role for TEAM scope', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }));

    const mockGetUserRoleInTeam = jest.fn();
    jest.doMock('@/services/team-membership.service', () => ({
      getUserRoleInTeam: mockGetUserRoleInTeam,
    }));

    const { authorize } = await import('@/middleware/authorize.middleware');

    const regularUser = {
      id: 'user-1',
      email: 'user@test.com',
      isAdmin: false,
    };

    // User with EDITOR role accessing resource requiring EDITOR
    mockGetUserRoleInTeam.mockResolvedValueOnce('EDITOR');

    const next1: NextFunction = jest.fn();
    const req1 = makeReq({
      user: regularUser,
      params: { teamGroupId: 'team-1' },
    } as any);
    const res1 = makeRes();

    await authorize('EDITOR', 'TEAM')(req1, res1, next1);
    expect(mockGetUserRoleInTeam).toHaveBeenCalledWith('user-1', 'team-1');
    expect(next1).toHaveBeenCalled();
  });

  /**
   * Test 4: USER scope verifies ownership
   */
  it('authorize() verifies ownership for USER scope', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }));
    jest.doMock('@/services/team-membership.service', () => ({
      getUserRoleInTeam: jest.fn(),
    }));

    const { authorize } = await import('@/middleware/authorize.middleware');

    const regularUser = {
      id: 'user-1',
      email: 'user@test.com',
      isAdmin: false,
    };

    // User accessing their own resource (userId matches)
    const next1: NextFunction = jest.fn();
    const req1 = makeReq({
      user: regularUser,
      params: { userId: 'user-1' },
    } as any);
    const res1 = makeRes();

    await authorize('USER', 'USER')(req1, res1, next1);
    expect(next1).toHaveBeenCalled();

    // User accessing someone else's resource (userId does not match)
    const next2: NextFunction = jest.fn();
    const req2 = makeReq({
      user: regularUser,
      params: { userId: 'other-user' },
    } as any);
    const res2 = makeRes();

    await authorize('USER', 'USER')(req2, res2, next2);
    expect(res2.status).toHaveBeenCalledWith(403);
    expect(next2).not.toHaveBeenCalled();
  });

  /**
   * Test 5: Returns 403 for insufficient permissions
   */
  it('authorize() returns 403 for insufficient permissions', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }));

    const mockGetUserRoleInTeam = jest.fn();
    jest.doMock('@/services/team-membership.service', () => ({
      getUserRoleInTeam: mockGetUserRoleInTeam,
    }));

    const { authorize } = await import('@/middleware/authorize.middleware');

    const regularUser = {
      id: 'user-1',
      email: 'user@test.com',
      isAdmin: false,
    };

    // GLOBAL scope - non-admin trying to write
    const next1: NextFunction = jest.fn();
    const req1 = makeReq({
      user: regularUser,
      method: 'POST',
    } as any);
    const res1 = makeRes();

    await authorize('USER', 'GLOBAL')(req1, res1, next1);
    expect(res1.status).toHaveBeenCalledWith(403);
    expect(next1).not.toHaveBeenCalled();

    // TEAM scope - user not a member
    mockGetUserRoleInTeam.mockResolvedValueOnce(null);

    const next2: NextFunction = jest.fn();
    const req2 = makeReq({
      user: regularUser,
      params: { teamGroupId: 'team-1' },
    } as any);
    const res2 = makeRes();

    await authorize('VIEWER', 'TEAM')(req2, res2, next2);
    expect(res2.status).toHaveBeenCalledWith(403);
    expect(next2).not.toHaveBeenCalled();

    // TEAM scope - user has insufficient role (VIEWER trying to do EDITOR action)
    mockGetUserRoleInTeam.mockResolvedValueOnce('VIEWER');

    const next3: NextFunction = jest.fn();
    const req3 = makeReq({
      user: regularUser,
      params: { teamGroupId: 'team-1' },
      method: 'POST',
    } as any);
    const res3 = makeRes();

    await authorize('EDITOR', 'TEAM')(req3, res3, next3);
    expect(res3.status).toHaveBeenCalledWith(403);
    expect(next3).not.toHaveBeenCalled();
  });

  /**
   * Test 6: Role hierarchy (OWNER > ADMIN > EDITOR > VIEWER > USER)
   */
  it('authorize() respects role hierarchy for TEAM scope', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }));

    const mockGetUserRoleInTeam = jest.fn();
    jest.doMock('@/services/team-membership.service', () => ({
      getUserRoleInTeam: mockGetUserRoleInTeam,
    }));

    const { authorize } = await import('@/middleware/authorize.middleware');

    const regularUser = {
      id: 'user-1',
      email: 'user@test.com',
      isAdmin: false,
    };

    // OWNER can access VIEWER-required resources
    mockGetUserRoleInTeam.mockResolvedValueOnce('OWNER');

    const next1: NextFunction = jest.fn();
    const req1 = makeReq({
      user: regularUser,
      params: { teamGroupId: 'team-1' },
    } as any);
    const res1 = makeRes();

    await authorize('VIEWER', 'TEAM')(req1, res1, next1);
    expect(next1).toHaveBeenCalled();

    // ADMIN can access EDITOR-required resources
    mockGetUserRoleInTeam.mockResolvedValueOnce('ADMIN');

    const next2: NextFunction = jest.fn();
    const req2 = makeReq({
      user: regularUser,
      params: { teamGroupId: 'team-1' },
    } as any);
    const res2 = makeRes();

    await authorize('EDITOR', 'TEAM')(req2, res2, next2);
    expect(next2).toHaveBeenCalled();

    // USER cannot access VIEWER-required resources (USER < VIEWER)
    mockGetUserRoleInTeam.mockResolvedValueOnce('USER');

    const next3: NextFunction = jest.fn();
    const req3 = makeReq({
      user: regularUser,
      params: { teamGroupId: 'team-1' },
    } as any);
    const res3 = makeRes();

    await authorize('VIEWER', 'TEAM')(req3, res3, next3);
    expect(res3.status).toHaveBeenCalledWith(403);
    expect(next3).not.toHaveBeenCalled();
  });

  /**
   * Test 7: GLOBAL scope allows read for all when allowReadForAll is true
   */
  it('authorize() allows read for all authenticated users when allowReadForAll is true', async () => {
    jest.doMock('@/config/env', () => ({ env: { nodeEnv: 'production' } }));
    jest.doMock('@/services/team-membership.service', () => ({
      getUserRoleInTeam: jest.fn(),
    }));

    const { authorize } = await import('@/middleware/authorize.middleware');

    const regularUser = {
      id: 'user-1',
      email: 'user@test.com',
      isAdmin: false,
    };

    // GET request with allowReadForAll should pass
    const next1: NextFunction = jest.fn();
    const req1 = makeReq({
      user: regularUser,
      method: 'GET',
    } as any);
    const res1 = makeRes();

    await authorize('USER', 'GLOBAL', { allowReadForAll: true })(req1, res1, next1);
    expect(next1).toHaveBeenCalled();

    // POST request with allowReadForAll should still require admin
    const next2: NextFunction = jest.fn();
    const req2 = makeReq({
      user: regularUser,
      method: 'POST',
    } as any);
    const res2 = makeRes();

    await authorize('USER', 'GLOBAL', { allowReadForAll: true })(req2, res2, next2);
    expect(res2.status).toHaveBeenCalledWith(403);
  });
});
