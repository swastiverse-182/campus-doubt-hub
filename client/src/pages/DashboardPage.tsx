import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import QuestionCard from '../components/QuestionCard';
import TagChip from '../components/TagChip';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { questionsApi } from '../services/api';
import type { Question } from '../types';
import { QUESTION_TAGS } from '../types';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [answered, setAnswered] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await questionsApi.getAll({
        search: debouncedSearch || undefined,
        tag: activeTag || undefined,
        answered: answered || undefined,
        page,
        limit: 10,
      });
      setQuestions(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTag, answered, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTag, answered]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Question Feed</h1>
        {user && (
          <Link to="/ask" className="btn btn-primary" id="hero-ask-btn">
            + Ask Question
          </Link>
        )}
      </div>

      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: '1.25rem' }}>
        <Search size={17} color="var(--text-muted)" />
        <input
          id="question-search"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tag filters */}
      <div className="tag-list" style={{ marginBottom: '1rem' }}>
        <TagChip
          tag="All"
          active={!activeTag}
          onClick={() => setActiveTag('')}
        />
        {QUESTION_TAGS.map((t) => (
          <TagChip
            key={t}
            tag={t}
            active={activeTag === t}
            onClick={() => setActiveTag(activeTag === t ? '' : t)}
          />
        ))}
      </div>

      {/* Answered filter */}
      <div className="admin-filter-bar" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'All', value: '' },
          { label: '✅ Answered', value: 'true' },
          { label: '❓ Unanswered', value: 'false' },
        ].map(({ label, value }) => (
          <button
            key={value}
            className={`filter-btn${answered === value ? ' active' : ''}`}
            onClick={() => setAnswered(value)}
            id={`filter-${value || 'all'}`}
          >
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Filter size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Filters
        </span>
      </div>

      {/* Question list */}
      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No questions found"
          description="Be the first to ask a question!"
          action={user ? <Link to="/ask" className="btn btn-primary">Ask Question</Link> : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions.map((q) => <QuestionCard key={q._id} question={q} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </Layout>
  );
};

export default DashboardPage;
