import app from './app';
import { env } from '@/config/env';
import { connectDatabase } from '@/config/database';
import { logger } from '@/config/logger';

(async () => {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
})();
