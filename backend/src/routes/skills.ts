import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reactivateCategory,
  hardDeleteCategory,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  importSkillGroupsController,
} from '@/controllers/skill.controller';
import { isAuthenticated, isAdmin } from '@/middleware/auth.middleware';

const router: Router = Router();

// Categories
router.get('/categories', getCategories);
router.post('/categories', isAuthenticated, isAdmin, createCategory);
router.put('/categories/:id', isAuthenticated, isAdmin, updateCategory);
router.delete('/categories/:id', isAuthenticated, isAdmin, deleteCategory);
router.put('/categories/:id/reactivate', isAuthenticated, isAdmin, reactivateCategory);
router.delete('/categories/:id/permanent', isAuthenticated, isAdmin, hardDeleteCategory);

// Skills
router.get('/skills', getSkills);
router.post('/skills', isAuthenticated, isAdmin, createSkill);
router.put('/skills/:id', isAuthenticated, isAdmin, updateSkill);
router.delete('/skills/:id', isAuthenticated, isAdmin, deleteSkill);

// Bulk import
router.post('/skills/import', isAuthenticated, isAdmin, importSkillGroupsController);

export default router;
