import express, { Application } from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { securityHeaders, corsMiddleware, rateLimiter } from '@/middleware/security';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler';
import healthRouter from '@/routes/health';
import session from 'express-session';
import csurf from 'csurf';
import passport from '@/config/passport';
import { env } from '@/config/env';
import authRouter from '@/routes/auth';
import skillsRouter from '@/routes/skills';
import assessmentsRouter from '@/routes/assessments';
import matrixRouter from '@/routes/matrix';
import employeesRouter from '@/routes/employees';
import capacitiesRouter from '@/routes/capacities';
import strategicGoalsRouter from '@/routes/strategic-goals';
import dbAdminRouter from '@/routes/db-admin';
import userProfileRouter from '@/routes/user-profile';
import referenceProjectsRouter from '@/routes/reference-projects';
import teamGroupsRouter from '@/routes/team-groups';
import adminModuleConfigRouter from '@/routes/admin-module-config';
import effectiveModulesRouter from '@/routes/effective-modules';
// Frontend-only Excel export is enabled; disable backend export route to avoid xlsx runtime dependency
// import exportRouter from '@/routes/export';

const app: Application = express();

// Core middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(rateLimiter);
app.use(morgan('dev'));

// Session (secure cookies, httpOnly, sameSite strict)
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 8, // 8h
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection (after session). Use cookie-based tokens for SPA.
if (env.nodeEnv !== 'test') {
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
        secure: env.nodeEnv === 'production',
      },
    })
  );
}

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', skillsRouter);
app.use('/api', assessmentsRouter);
app.use('/api', matrixRouter);
app.use('/api', employeesRouter);
app.use('/api', capacitiesRouter);
app.use('/api', strategicGoalsRouter);
app.use('/api', referenceProjectsRouter);
app.use('/api', teamGroupsRouter);
app.use('/api', adminModuleConfigRouter);
app.use('/api', effectiveModulesRouter);
app.use('/api', dbAdminRouter);
app.use('/api', userProfileRouter);
// app.use('/api', exportRouter);

// 404
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
