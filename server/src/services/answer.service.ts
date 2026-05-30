import { Answer } from '../models/Answer';
import { Question } from '../models/Question';
import { User } from '../models/User';
import { createNotification } from './notification.service';
import { CreateAnswerInput, UpdateAnswerInput } from '../validators/answer.validator';

export const createAnswer = async (input: CreateAnswerInput, authorId: string) => {
  const question = await Question.findById(input.questionId);
  if (!question) throw new Error('Question not found');

  const answer = await Answer.create({
    questionId: input.questionId,
    authorId,
    content: input.content,
  });

  // Update answer count on question
  await Question.findByIdAndUpdate(input.questionId, { $inc: { answersCount: 1 } });

  return answer.populate('authorId', 'name email spPoints');
};

export const updateAnswer = async (
  id: string,
  input: UpdateAnswerInput,
  userId: string
) => {
  const answer = await Answer.findById(id);
  if (!answer) throw new Error('Answer not found');
  if (String(answer.authorId) !== userId) throw new Error('Not authorized');
  if (answer.status !== 'PENDING') throw new Error('Only pending answers can be edited');

  answer.content = input.content;
  await answer.save();
  return answer.populate('authorId', 'name email spPoints');
};

export const deleteAnswer = async (id: string, userId: string) => {
  const answer = await Answer.findById(id);
  if (!answer) throw new Error('Answer not found');
  if (String(answer.authorId) !== userId) throw new Error('Not authorized');
  if (answer.status !== 'PENDING') throw new Error('Only pending answers can be deleted');

  await Answer.findByIdAndDelete(id);
  await Question.findByIdAndUpdate(answer.questionId, { $inc: { answersCount: -1 } });
};

export const getAnswersByQuestion = async (questionId: string) => {
  return Answer.find({ questionId })
    .sort({ isBestAnswer: -1, createdAt: 1 })
    .populate('authorId', 'name email spPoints');
};

export const approveAnswer = async (answerId: string) => {
  const answer = await Answer.findById(answerId);
  if (!answer) throw new Error('Answer not found');

  answer.status = 'APPROVED';

  // Award SP only once
  if (!answer.rewarded) {
    answer.rewarded = true;
    await User.findByIdAndUpdate(answer.authorId, { $inc: { spPoints: 10 } });

    // Get updated user for notification context
    const author = await User.findById(answer.authorId);
    if (author) {
      await createNotification(
        answer.authorId,
        `🎉 Your answer was approved! You earned +10 SP. Total: ${(author.spPoints || 0) + 10} SP`
      );
    }
  } else {
    const author = await User.findById(answer.authorId);
    if (author) {
      await createNotification(answer.authorId, '✅ Your answer was approved!');
    }
  }

  await answer.save();
  return answer.populate('authorId', 'name email spPoints');
};

export const rejectAnswer = async (answerId: string) => {
  const answer = await Answer.findById(answerId);
  if (!answer) throw new Error('Answer not found');

  answer.status = 'REJECTED';
  await answer.save();

  await createNotification(
    answer.authorId,
    '❌ Your answer was rejected by a moderator.'
  );

  return answer.populate('authorId', 'name email spPoints');
};

export const markBestAnswer = async (answerId: string) => {
  const answer = await Answer.findById(answerId);
  if (!answer) throw new Error('Answer not found');
  if (answer.status !== 'APPROVED') throw new Error('Only approved answers can be marked as best');

  // Unmark any existing best answer for this question
  await Answer.updateMany(
    { questionId: answer.questionId, isBestAnswer: true },
    { isBestAnswer: false }
  );

  answer.isBestAnswer = true;
  await answer.save();

  await createNotification(
    answer.authorId,
    '⭐ Your answer was selected as the Best Answer!'
  );

  return answer.populate('authorId', 'name email spPoints');
};

export const getAllAnswersForAdmin = async (status?: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    filter.status = status;
  }
  return Answer.find(filter)
    .sort({ createdAt: -1 })
    .populate('authorId', 'name email spPoints')
    .populate('questionId', 'title');
};

export const getUserAnswers = async (userId: string) => {
  return Answer.find({ authorId: userId })
    .sort({ createdAt: -1 })
    .populate('questionId', 'title');
};
