import 'dotenv/config';
import mongoose from 'mongoose';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';
import { Bookmark } from '../models/Bookmark';
import { Vote } from '../models/Vote';
import { Activity } from '../models/Activity';
import { env } from '../config/env';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB');

  // Find questions with title containing 'mongo' or '__Temp'
  const targetQuestions = await Question.find({
    $or: [
      { title: { $regex: 'mongo', $options: 'i' } },
      { title: { $regex: '__Temp', $options: 'i' } },
    ]
  });

  console.log(`Found ${targetQuestions.length} non-internship/test question(s) to remove:`);
  targetQuestions.forEach(q => console.log(` - "${q.title}"`));

  const targetIds = targetQuestions.map(q => q._id);

  if (targetIds.length > 0) {
    await Question.deleteMany({ _id: { $in: targetIds } });
    await Answer.deleteMany({ questionId: { $in: targetIds } });
    await Bookmark.deleteMany({ questionId: { $in: targetIds } });
    await Vote.deleteMany({ targetId: { $in: targetIds } });
    await Activity.deleteMany({ targetId: { $in: targetIds } });
    console.log(`✅ Removed ${targetIds.length} question(s) and their associated answers/data.`);
  }

  const total = await Question.countDocuments();
  console.log(`🎉 Total IIT Ropar internship questions remaining in DB: ${total}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
