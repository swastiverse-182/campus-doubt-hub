import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';
import { Notification } from '../models/Notification';
import * as notificationService from '../services/notification.service';
import * as answerService from '../services/answer.service';
import * as questionService from '../services/question.service';
import { createReport } from '../services/report.service';
import { env } from '../config/env';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function run() {
  console.log('\n=========================================');
  console.log('   Notification System End-to-End Test');
  console.log('=========================================\n');

  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to DB');

  // 1. Setup test users
  let testUserA = await User.findOne({ email: 'test_student_a@example.com' });
  if (!testUserA) {
    testUserA = await User.create({
      name: 'Test Student A',
      email: 'test_student_a@example.com',
      passwordHash: 'dummy',
      role: 'USER',
      spPoints: 0,
    });
  }

  let testUserB = await User.findOne({ email: 'test_student_b@example.com' });
  if (!testUserB) {
    testUserB = await User.create({
      name: 'Test Student B',
      email: 'test_student_b@example.com',
      passwordHash: 'dummy',
      role: 'USER',
      spPoints: 0,
    });
  }

  // Clear past test notifications for testUserA and testUserB
  await Notification.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });

  // 2. Test createNotification
  console.log('\n--- 1. Direct Notification Creation ---');
  await notificationService.createNotification(testUserA._id, '🔔 Test notification message 1');
  await notificationService.createNotification(testUserA._id, '🔔 Test notification message 2');

  const { notifications, unreadCount } = await notificationService.getUserNotifications(testUserA._id.toString());
  assert(notifications.length === 2, 'Fetched 2 notifications for testUserA');
  assert(unreadCount === 2, 'Unread count is correctly 2');

  // 3. Test markRead
  console.log('\n--- 2. Mark Individual Notification As Read ---');
  const notifId = notifications[0]._id.toString();
  const updatedNotif = await notificationService.markRead(notifId, testUserA._id.toString());
  assert(updatedNotif.isRead === true, 'Notification isRead changed to true');

  const afterMarkRead = await notificationService.getUserNotifications(testUserA._id.toString());
  assert(afterMarkRead.unreadCount === 1, 'Unread count decremented to 1');

  // 4. Test markAllRead
  console.log('\n--- 3. Mark All Notifications As Read ---');
  await notificationService.markAllRead(testUserA._id.toString());
  const afterMarkAll = await notificationService.getUserNotifications(testUserA._id.toString());
  assert(afterMarkAll.unreadCount === 0, 'Unread count is 0 after markAllRead');
  assert(afterMarkAll.notifications.every(n => n.isRead === true), 'All notifications are marked isRead=true');

  // 5. Test Answer Approval Notification flow
  console.log('\n--- 4. Answer Approval Notification Flow ---');
  // Student A asks a question
  const question = await Question.create({
    title: '__Notification Test Question__',
    description: 'Testing question author notifications',
    tags: ['Onboarding & VINS'],
    author: testUserA._id,
  });

  // Student B answers the question
  const answer = await Answer.create({
    questionId: question._id,
    authorId: testUserB._id,
    content: 'Student B answer to test notifications',
    status: 'PENDING',
  });

  // Admin approves the answer
  await answerService.approveAnswer(answer._id.toString());

  // Check Student B (answer author) got approval notification
  const studentBNotifs = await notificationService.getUserNotifications(testUserB._id.toString());
  assert(
    studentBNotifs.notifications.some(n => n.message.includes('approved')),
    'Student B (answer author) received approval notification with SP reward'
  );

  // Check Student A (question author) got notified that an answer was approved for their question
  const studentANotifs = await notificationService.getUserNotifications(testUserA._id.toString());
  assert(
    studentANotifs.notifications.some(n => n.message.includes('A new answer has been approved')),
    'Student A (question author) received notification that a new answer was approved'
  );

  // 6. Test Accept Answer Notification flow
  console.log('\n--- 5. Accept Answer Notification Flow ---');
  await questionService.acceptAnswer(question._id.toString(), answer._id.toString(), testUserA._id.toString());

  const studentBAfterAccept = await notificationService.getUserNotifications(testUserB._id.toString());
  assert(
    studentBAfterAccept.notifications.some(n => n.message.includes('accepted')),
    'Student B received notification that their answer was accepted'
  );

  // 7. Test Best Answer Notification flow
  console.log('\n--- 6. Best Answer Notification Flow ---');
  await answerService.markBestAnswer(answer._id.toString());

  const studentBAfterBest = await notificationService.getUserNotifications(testUserB._id.toString());
  assert(
    studentBAfterBest.notifications.some(n => n.message.includes('Best Answer')),
    'Student B received notification that their answer was marked Best Answer'
  );

  // 8. Clean up test artifacts
  console.log('\n--- 7. Cleanup Test Entities ---');
  await Question.findByIdAndDelete(question._id);
  await Answer.findByIdAndDelete(answer._id);
  await Notification.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
  await User.deleteMany({ _id: { $in: [testUserA._id, testUserB._id] } });
  console.log('✅ Cleaned up all temporary test entities cleanly.');

  console.log('\n🎉 ALL NOTIFICATION LIFECYCLE TESTS PASSED 100%!\n');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Notification test failed:', err);
  process.exit(1);
});
