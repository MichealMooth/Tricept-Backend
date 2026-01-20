/**
 * Strategic Goals Routes
 *
 * API routes for StrategicGoal and StrategicGoalRating endpoints.
 * Supports GLOBAL and TEAM scope with proper authorization.
 *
 * Task Group 5.5: Update routes with authorize middleware
 *
 * Authorization patterns:
 * - GET /api/strategic-goals - isAuthenticated, isAdmin (admin view of all goals)
 * - POST /api/strategic-goals - isAuthenticated, isAdmin (scope checked in controller for TEAM)
 * - PUT/DELETE /api/strategic-goals/:id - isAuthenticated, isAdmin (global admin or scope-based in controller)
 *
 * User-facing routes (scope filtering applied in service):
 * - GET /api/strategic-goals/with-my-ratings - isAuthenticated (scope filtering in service)
 * - POST /api/strategic-goals/rate - isAuthenticated (scope checked in controller)
 * - GET /api/strategic-goals/averages - isAuthenticated (scope filtering in service)
 */

import { Router } from 'express';
import { isAuthenticated, isAdmin } from '@/middleware/auth.middleware';
import * as ctrl from '@/controllers/strategic-goals.controller';

const router: Router = Router();

// ============================================
// Admin management routes
// ============================================

// List all goals (admin view - returns all regardless of scope)
router.get('/strategic-goals', isAuthenticated, isAdmin, ctrl.listGoals);

// Import goals from JSON (admin only)
router.post('/strategic-goals/import', isAuthenticated, isAdmin, ctrl.importGoals);

// Create a new goal (admin only)
// For TEAM-scoped goals, teamGroupId validation is done in controller
router.post('/strategic-goals', isAuthenticated, isAdmin, ctrl.createGoal);

// Update a goal (admin only)
// Scope changes validated in controller
router.put('/strategic-goals/:id', isAuthenticated, isAdmin, ctrl.updateGoal);

// Delete a goal (admin only)
router.delete('/strategic-goals/:id', isAuthenticated, isAdmin, ctrl.deleteGoal);

// ============================================
// User-facing routes (scope-filtered)
// ============================================

// List goals with user's ratings (scope filtering applied in service)
// Returns GLOBAL + user's TEAM goals based on team memberships
router.get('/strategic-goals/with-my-ratings', isAuthenticated, ctrl.listGoalsWithMyRatings);

// Rate a goal (user-scoped - owner only)
// Scope validation ensures user can only rate goals they have access to
router.post('/strategic-goals/rate', isAuthenticated, ctrl.upsertMyRating);

// List average ratings (scope filtering applied in service)
// Returns averages for GLOBAL + user's TEAM goals
router.get('/strategic-goals/averages', isAuthenticated, ctrl.listAverages);

// Get a single goal by ID (scope-checked in controller)
router.get('/strategic-goals/:id', isAuthenticated, ctrl.getGoalById);

export default router;
