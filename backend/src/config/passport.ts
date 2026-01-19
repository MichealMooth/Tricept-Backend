import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await prisma.employee.findUnique({ where: { email } });
        if (!user) return done(null, false, { message: 'Invalid credentials' });

        const ok = await compare(password, user.passwordHash);
        if (!ok) return done(null, false, { message: 'Invalid credentials' });

        // Strip passwordHash before putting into session
        const { passwordHash, ...safeUser } = user;
        return done(null, safeUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.employee.findUnique({ where: { id } });
    if (!user) return done(null, false);
    const { passwordHash, ...safeUser } = user;
    return done(null, safeUser);
  } catch (err) {
    return done(err);
  }
});

export default passport;
