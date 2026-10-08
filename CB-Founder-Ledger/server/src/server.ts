import 'dotenv/config';
import { createApp } from './app';
import { getEnv } from './config/env';
import { connectDb, disconnectDb } from './db/connect';

async function main() {
  const env = getEnv(); // fails fast on bad configuration
  await connectDb(env.MONGO_URI);
  console.log('MongoDB connected');

  const server = createApp().listen(env.PORT, () => {
    console.log(`API listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => {
      void disconnectDb().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
