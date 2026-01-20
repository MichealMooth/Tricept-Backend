/**
 * Team Service Tests
 *
 * Tests for team service API functions.
 * Task Group 2.1: Write 3-4 focused tests for team service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listTeams, getTeam, getTeamMembers, createTeam } from '../team.service';

// Mock the api module
vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked api
import { api } from '../api';

describe('team.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTeams', () => {
    it('returns paginated team response', async () => {
      const mockResponse = {
        items: [
          {
            id: 'team-1',
            name: 'Engineering',
            description: 'Engineering team',
            isActive: true,
            memberCount: 5,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            createdBy: null,
            updatedBy: null,
          },
          {
            id: 'team-2',
            name: 'Design',
            description: 'Design team',
            isActive: true,
            memberCount: 3,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            createdBy: null,
            updatedBy: null,
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const result = await listTeams({ search: 'Eng', page: 1, pageSize: 20 });

      expect(api.get).toHaveBeenCalledWith('/teams', {
        params: { search: 'Eng', page: 1, pageSize: 20 },
      });
      expect(result).toEqual(mockResponse);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getTeam', () => {
    it('returns team with details', async () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Engineering',
        description: 'Engineering team',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: null,
        updatedBy: null,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockTeam });

      const result = await getTeam('team-1');

      expect(api.get).toHaveBeenCalledWith('/teams/team-1');
      expect(result).toEqual(mockTeam);
      expect(result.id).toBe('team-1');
      expect(result.name).toBe('Engineering');
    });
  });

  describe('getTeamMembers', () => {
    it('returns paginated member list with employee details', async () => {
      const mockResponse = {
        items: [
          {
            id: 'membership-1',
            employeeId: 'emp-1',
            role: 'OWNER',
            createdAt: '2024-01-01T00:00:00.000Z',
            employee: {
              id: 'emp-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
          },
          {
            id: 'membership-2',
            employeeId: 'emp-2',
            role: 'EDITOR',
            createdAt: '2024-01-02T00:00:00.000Z',
            employee: {
              id: 'emp-2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
            },
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const result = await getTeamMembers('team-1', { search: 'John', page: 1 });

      expect(api.get).toHaveBeenCalledWith('/teams/team-1/members', {
        params: { search: 'John', page: 1 },
      });
      expect(result).toEqual(mockResponse);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].employee.firstName).toBe('John');
    });
  });

  describe('createTeam', () => {
    it('sends correct POST request with CSRF token', async () => {
      const mockCsrfResponse = { csrfToken: 'test-csrf-token' };
      const mockCreatedTeam = {
        id: 'new-team-1',
        name: 'New Team',
        description: 'A new team',
        isActive: true,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        createdBy: 'admin-1',
        updatedBy: 'admin-1',
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockCsrfResponse });
      vi.mocked(api.post).mockResolvedValue({ data: mockCreatedTeam });

      const input = { name: 'New Team', description: 'A new team' };
      const result = await createTeam(input);

      // Verify CSRF token was fetched
      expect(api.get).toHaveBeenCalledWith('/auth/csrf');

      // Verify POST was called with correct data and headers
      expect(api.post).toHaveBeenCalledWith('/teams', input, {
        headers: { 'x-csrf-token': 'test-csrf-token' },
      });

      expect(result).toEqual(mockCreatedTeam);
      expect(result.name).toBe('New Team');
    });
  });
});
