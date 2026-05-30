import { Question } from '../models/Question';
import { CreateQuestionInput, UpdateQuestionInput } from '../validators/question.validator';
import mongoose from 'mongoose';

interface QuestionQuery {
  search?: string;
  tag?: string;
  answered?: string;
  page?: number;
  limit?: number;
}

export const getQuestions = async (query: QuestionQuery) => {
  const { search, tag, answered, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (search) {
    filter.$text = { $search: search };
  }
  if (tag) {
    filter.tags = tag;
  }
  if (answered === 'true') {
    filter.answersCount = { $gt: 0 };
  } else if (answered === 'false') {
    filter.answersCount = 0;
  }

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email spPoints'),
    Question.countDocuments(filter),
  ]);

  return {
    questions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getQuestionById = async (id: string) => {
  const question = await Question.findByIdAndUpdate(
    id,
    { $inc: { viewsCount: 1 } },
    { new: true }
  ).populate('author', 'name email spPoints');
  if (!question) throw new Error('Question not found');
  return question;
};

export const createQuestion = async (
  input: CreateQuestionInput,
  authorId: string
) => {
  const question = await Question.create({ ...input, author: authorId });
  return question.populate('author', 'name email spPoints');
};

export const updateQuestion = async (
  id: string,
  input: UpdateQuestionInput,
  userId: string
) => {
  const question = await Question.findById(id);
  if (!question) throw new Error('Question not found');
  if (String(question.author) !== userId) throw new Error('Not authorized');

  Object.assign(question, input);
  await question.save();
  return question.populate('author', 'name email spPoints');
};

export const deleteQuestion = async (id: string, userId: string, role: string) => {
  const question = await Question.findById(id);
  if (!question) throw new Error('Question not found');
  if (String(question.author) !== userId && role !== 'ADMIN') {
    throw new Error('Not authorized');
  }
  await Question.findByIdAndDelete(id);
};

export const getUserQuestions = async (userId: string) => {
  return Question.find({ author: userId }).sort({ createdAt: -1 });
};
