import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, MessageSquare, Clock, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import AnswerCard from '../components/AnswerCard';
import TagChip from '../components/TagChip';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { questionsApi, answersApi, bookmarksApi } from '../services/api';
import type { Question, Answer, Bookmark as BookmarkType } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const isBookmarked = bookmarks.some((b) => b.questionId?._id === id || String(b.questionId) === id);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        questionsApi.getById(id),
        answersApi.getByQuestion(id),
      ]);
      setQuestion(qRes.data.data || null);
      setAnswers(aRes.data.data || []);
      if (user) {
        const bRes = await bookmarksApi.getAll();
        setBookmarks(bRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Login to submit an answer'); return; }
    setSubmitting(true);
    try {
      const res = await answersApi.create({ questionId: id!, content: answerContent });
      setAnswers((prev) => [...prev, res.data.data!]);
      setQuestion((prev) => prev ? { ...prev, answersCount: prev.answersCount + 1 } : prev);
      setAnswerContent('');
      toast.success('Answer submitted! Awaiting admin approval.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) { toast.error('Login to bookmark'); return; }
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        const bm = bookmarks.find((b) => b.questionId?._id === id || String(b.questionId) === id);
        if (bm) {
          await bookmarksApi.remove(bm._id);
          setBookmarks((prev) => prev.filter((b) => b._id !== bm._id));
          toast.success('Bookmark removed');
        }
      } else {
        const res = await bookmarksApi.add(id!);
        setBookmarks((prev) => [...prev, res.data.data!]);
        toast.success('Bookmarked!');
      }
    } catch {
      toast.error('Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirm('Delete this question?')) return;
    try {
      await questionsApi.delete(id!);
      toast.success('Question deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const ago = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!question) return <Layout><EmptyState title="Question not found" /></Layout>;

  const isOwner = user && String(user._id) === String(question.author?._id);

  return (
    <Layout>
      {/* Question */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="tag-list" style={{ marginBottom: '0.75rem' }}>
          {question.tags.map((t) => <TagChip key={t} tag={t} />)}
        </div>
        <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', flex: 1 }}>{question.title}</h1>
          <div className="flex gap-2">
            <button
              className={`btn-icon${isBookmarked ? ' active' : ''}`}
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              id="bookmark-btn"
              style={{ color: isBookmarked ? 'var(--accent-light)' : undefined }}
            >
              {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
            {(isOwner || user?.role === 'ADMIN') && (
              <button
                className="btn-icon"
                onClick={handleDeleteQuestion}
                title="Delete question"
                id="delete-question-btn"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <p className="answer-content" style={{ marginBottom: '1rem' }}>{question.description}</p>

        <div className="question-card-meta">
          <span><Eye size={13} /> {question.viewsCount} views</span>
          <span><MessageSquare size={13} /> {question.answersCount} answers</span>
          <span><Clock size={13} /> {ago(question.createdAt)}</span>
          <span style={{ marginLeft: 'auto' }}>
            Asked by{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {question.author?.name}
            </strong>
            {' '}<Badge spPoints={question.author?.spPoints || 0} />
          </span>
        </div>
      </div>

      {/* Answers */}
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <h2>{answers.length} Answer{answers.length !== 1 ? 's' : ''}</h2>
      </div>

      {answers.length === 0 ? (
        <EmptyState icon="💬" title="No answers yet" description="Be the first to help!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {answers.map((a) => (
            <AnswerCard
              key={a._id}
              answer={a}
              onDelete={(id) => {
                setAnswers((prev) => prev.filter((a) => a._id !== id));
                setQuestion((prev) => prev ? { ...prev, answersCount: prev.answersCount - 1 } : prev);
              }}
              onUpdate={(id, content) =>
                setAnswers((prev) => prev.map((a) => a._id === id ? { ...a, content } : a))
              }
            />
          ))}
        </div>
      )}

      {/* Submit Answer */}
      {user ? (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Your Answer</h3>
          <form onSubmit={handleSubmitAnswer} id="answer-form">
            <div className="form-group">
              <textarea
                id="answer-content"
                className="form-input"
                placeholder="Write your answer here… Be detailed and helpful!"
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                rows={6}
                required
                minLength={10}
              />
            </div>
            <button
              id="submit-answer-btn"
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : '📤 Submit Answer'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>Please <a href="/login" style={{ color: 'var(--accent-light)' }}>login</a> to submit an answer.</p>
        </div>
      )}
    </Layout>
  );
};

export default QuestionDetailPage;
