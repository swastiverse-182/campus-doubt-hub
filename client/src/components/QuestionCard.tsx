import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, MessageSquare, Clock } from 'lucide-react';
import type { Question } from '../types';
import TagChip from './TagChip';

interface QuestionCardProps {
  question: Question;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const ago = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Link to={`/questions/${question._id}`} className="question-card" id={`question-${question._id}`}>
      <div className="tag-list" style={{ marginBottom: '0.6rem' }}>
        {question.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
      </div>
      <h3 className="question-card-title">{question.title}</h3>
      <p className="text-secondary text-sm" style={{ marginBottom: '0.75rem', lineHeight: 1.5 }}>
        {question.description.slice(0, 150)}{question.description.length > 150 && '…'}
      </p>
      <div className="question-card-meta">
        <span><Eye size={13} /> {question.viewsCount} views</span>
        <span><MessageSquare size={13} /> {question.answersCount} answers</span>
        <span><Clock size={13} /> {ago(question.createdAt)}</span>
        <span style={{ marginLeft: 'auto' }}>
          by <strong style={{ color: 'var(--text-primary)' }}>
            {question.author?.name || 'Unknown'}
          </strong>
        </span>
      </div>
    </Link>
  );
};

export default QuestionCard;
