import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error: any) {
    if (error.message?.includes('authentication failed') || error.codeName === 'AtlasError') {
      const match = env.MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):/);
      const username = match ? match[1] : 'malabikakundu1972_db_user';
      console.error('\n❌ MongoDB Authentication Failed: Invalid credentials in MONGODB_URI.');
      console.error('👉 To keep your password ZulJ8WgbYkIoOzky, ensure it is saved in MongoDB Atlas:');
      console.error('   1. Open https://cloud.mongodb.com -> Security -> Database Access');
      console.error(`   2. Find or add user "${username}" -> click Edit Password -> paste ZulJ8WgbYkIoOzky -> click Update User (or Add User)`);
      console.error('   3. Ensure built-in role has "Read and write to any database"\n');
    } else {
      console.error('❌ MongoDB connection error:', error.message || error);
    }
    process.exit(1);
  }
};
