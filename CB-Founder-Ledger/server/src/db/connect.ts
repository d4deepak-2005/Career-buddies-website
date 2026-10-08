import mongoose from 'mongoose';

// Reject query-operator injection in filters built from user input.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export async function connectDb(uri: string, serverSelectionTimeoutMS = 8000): Promise<typeof mongoose> {
  return mongoose.connect(uri, { serverSelectionTimeoutMS });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export type DbState = 'connected' | 'connecting' | 'disconnecting' | 'disconnected';

export function getDbState(): DbState {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}
