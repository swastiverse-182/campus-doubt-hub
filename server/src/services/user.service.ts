import { User } from '../models/User';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) throw new Error('User not found');

  const [questionsAsked, answersSubmitted, approvedAnswers, bestAnswers] = await Promise.all([
    Question.countDocuments({ author: userId }),
    Answer.countDocuments({ authorId: userId }),
    Answer.countDocuments({ authorId: userId, status: 'APPROVED' }),
    Answer.countDocuments({ authorId: userId, isBestAnswer: true }),
  ]);

  return {
    user,
    stats: { questionsAsked, answersSubmitted, approvedAnswers, bestAnswers },
  };
};

export const getLeaderboard = async () => {
  return User.find({ role: 'USER' })
    .sort({ spPoints: -1 })
    .limit(50)
    .select('name email spPoints createdAt');
};
