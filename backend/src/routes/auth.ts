import { Router } from 'express';
import { register, login, logout, me, csrfToken } from '@/controllers/auth.controller';
import { isAuthenticated, loginRateLimiter } from '@/middleware/auth.middleware';

const router: Router = Router();

// CSRF token endpoint for SPA to fetch and then include in subsequent requests
router.get('/csrf', csrfToken);

// Auth
// Registration open (no email verification). Use server-side validation and rate limiting elsewhere if needed.
router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.get('/me', isAuthenticated, me);

export default router;
