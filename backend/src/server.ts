import { config } from './config';
import { createApp } from './app';
import { getDb } from './db/database';
import { runMigrations } from './db/migrate';

async function start() {
  // Validate DB and run migrations before accepting traffic
  const db = getDb();
  runMigrations(db);

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[server] OYCI backend running on port ${config.port} (${config.nodeEnv})`);
  });
}

start().catch(err => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
