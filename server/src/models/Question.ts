import mongoose, { Document, Schema } from 'mongoose';

export type QuestionTag =
  | 'Onboarding & VINS'
  | 'Timelines & Clashes'
  | 'NOC Compliance'
  | 'Dashboard & Offers'
  | 'Certification & Credits'
  | 'ViBe LMS Tech'
  | 'Yaksha AI Engine'
  | 'Communication Tech'
  | 'Rosetta Journaling'
  | 'Team & Code Engineering';

export interface IQuestion extends Document {
  title: string;
  description: string;
  tags: QuestionTag[];
  author: mongoose.Types.ObjectId;
  viewsCount: number;
  answersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    tags: {
      type: [String],
      enum: [
        'Onboarding & VINS',
        'Timelines & Clashes',
        'NOC Compliance',
        'Dashboard & Offers',
        'Certification & Credits',
        'ViBe LMS Tech',
        'Yaksha AI Engine',
        'Communication Tech',
        'Rosetta Journaling',
        'Team & Code Engineering'
      ],
      default: [],
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewsCount: { type: Number, default: 0 },
    answersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search
QuestionSchema.index({ title: 'text', description: 'text' });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ createdAt: -1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
