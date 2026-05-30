import { User } from '../models/User';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';

export const getAnalytics = async () => {
  const [
    totalUsers,
    totalQuestions,
    totalAnswers,
    pendingAnswers,
    approvedAnswers,
    rejectedAnswers,
  ] = await Promise.all([
    User.countDocuments({ role: 'USER' }),
    Question.countDocuments(),
    Answer.countDocuments(),
    Answer.countDocuments({ status: 'PENDING' }),
    Answer.countDocuments({ status: 'APPROVED' }),
    Answer.countDocuments({ status: 'REJECTED' }),
  ]);

  return {
    totalUsers,
    totalQuestions,
    totalAnswers,
    pendingAnswers,
    approvedAnswers,
    rejectedAnswers,
  };
};
