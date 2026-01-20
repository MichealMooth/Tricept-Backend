/**
 * Employee API Routes
 *
 * Provides CRUD operations for Employee management.
 * Task Group 4: Added endpoint for employee teams.
 */

import { Router } from 'express';
import { isAuthenticated, isAdmin } from '@/middleware/auth.middleware';
import {
  deleteEmployee,
  getEmployees,
  getEmployeeTeamsHandler,
  postEmployee,
  putEmployee,
} from '@/controllers/employee.controller';

const router: Router = Router();

/**
 * GET /api/employees
 * List all employees.
 * Query params: search, includeTeams (boolean)
 * Access: Admin only
 */
router.get('/employees', isAuthenticated, isAdmin, getEmployees);

/**
 * POST /api/employees
 * Create a new employee.
 * Access: Admin only
 */
router.post('/employees', isAuthenticated, isAdmin, postEmployee);

/**
 * GET /api/employees/:id/teams
 * Get teams for a specific employee.
 * Task Group 4: Returns team memberships for an employee.
 * Access: Admin only
 */
router.get('/employees/:id/teams', isAuthenticated, isAdmin, getEmployeeTeamsHandler);

/**
 * PUT /api/employees/:id
 * Update an employee.
 * Access: Admin only
 */
router.put('/employees/:id', isAuthenticated, isAdmin, putEmployee);

/**
 * DELETE /api/employees/:id
 * Archive (soft-delete) an employee.
 * Access: Admin only
 */
router.delete('/employees/:id', isAuthenticated, isAdmin, deleteEmployee);

export default router;
