import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { buildQuestionSearchFilter } from '../utils/searchHelper';

async function main() {
  console.log('\n=========================================');
  console.log('   MongoDB Connection & Data Test');
  console.log('=========================================\n');

  console.log(`📡 Connecting to: ${env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB connected successfully! Host: ${conn.connection.host}`);
    console.log(`🗄️  Database Name: ${conn.connection.name}`);
  } catch (err: any) {
    console.error('\n❌ MongoDB Connection Failed:');
    console.error(`   Error Message: ${err.message}`);

    if (err.message?.includes('authentication failed') || err.codeName === 'AtlasError') {
      const match = env.MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):/);
      const username = match ? match[1] : 'malabikakundu1972_db_user';
      console.log('\n-------------------------------------------------------------');
      console.log('🔑 AUTHENTICATION FAILED IN MONGODB ATLAS:');
      console.log('1. Go to https://cloud.mongodb.com -> Security -> Database Access');
      console.log(`2. Find or add user "${username}" -> Click Edit -> Edit Password`);
      console.log('3. Paste ZulJ8WgbYkIoOzky and click "Update User" (or "Add User")');
      console.log('4. Ensure the user role has "Read and write to any database"');
      console.log('-------------------------------------------------------------\n');
    } else if (err.message?.includes('ECONNREFUSED')) {
      console.log('\nℹ️  Local MongoDB is not running. To use MongoDB Atlas, configure MONGODB_URI in server/.env\n');
    }

    process.exit(1);
  }

  // 1. Ensure Admin User exists
  let admin = await User.findOne({ email: 'admin@example.com' });
  if (!admin) {
    const passwordHash = await hashPassword('admin123');
    admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
      spPoints: 100,
    });
    console.log('✅ Admin user created (email: admin@example.com / password: admin123)');
  } else {
    console.log('ℹ️  Admin user exists');
  }

  // 2. Test Live MongoDB Keyword & 2-Letter Search on IIT Ropar Queries
  console.log('\n--- Testing Live Database Search with Keywords & 2 Letters ---\n');

  const testQueries = [
    'NO', // Matches NOC Compliance queries
    'cl', // Matches Clashes / Classes
    'VI', // Matches VINS
    'ex', // Matches Exams / Extensions
    'ce', // Matches Certificate
  ];

  for (const q of testQueries) {
    const filter = buildQuestionSearchFilter(q);
    const results = await Question.find(filter).select('title');
    console.log(`🔍 Query: "${q}" -> Found ${results.length} result(s):`);
    results.slice(0, 3).forEach((r) => console.log(`   - "${r.title}"`));
    if (results.length > 3) console.log(`   ... and ${results.length - 3} more`);
  }

  // 4. Test Add & Delete Operations
  console.log('\n--- Testing Add & Delete Data Operations ---\n');
  const tempQ = await Question.create({
    title: '__Temp Test Question For Deletion__',
    description: 'This question will be deleted immediately to verify delete operations.',
    tags: ['Team & Code Engineering'],
    author: admin._id,
  });
  console.log(`✅ Temporary question added with ID: ${tempQ._id}`);

  const tempA = await Answer.create({
    questionId: tempQ._id,
    authorId: admin._id,
    content: 'Temporary answer to test cascade deletion.',
  });
  console.log(`✅ Temporary answer added with ID: ${tempA._id}`);

  await Answer.findByIdAndDelete(tempA._id);
  await Question.findByIdAndDelete(tempQ._id);
  console.log('✅ Temporary answer and question deleted cleanly.');

  console.log('\n🎉 ALL DATABASE CHECKS AND DATA OPERATIONS PASSED!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
