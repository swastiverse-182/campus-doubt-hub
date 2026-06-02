import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { adminApi } from '../services/api';
import type { Answer, Analytics, Question } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const AdminDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, analyticsRes] = await Promise.all([
        adminApi.getAnswers(filter === 'ALL' ? undefined : filter),
        adminApi.getAnalytics(),
      ]);
      setAnswers(aRes.data.data || []);
      setAnalytics(analyticsRes.data.data || null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await adminApi.approveAnswer(id);
      setAnswers((prev) => prev.map((a) => a._id === id ? res.data.data! : a));
      toast.success('Answer approved! +10 SP awarded');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await adminApi.rejectAnswer(id);
      setAnswers((prev) => prev.map((a) => a._id === id ? res.data.data! : a));
      toast.success('Answer rejected');
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBestAnswer = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await adminApi.markBestAnswer(id);
      setAnswers((prev) => {
        const qId = String(res.data.data?.questionId);
        return prev.map((a) => {
          if (String(a.questionId) === qId || (typeof a.questionId === 'object' && String((a.questionId as Question)._id) === qId)) {
            return { ...a, isBestAnswer: a._id === id };
          }
          return a;
        });
      });
      toast.success('Best answer marked!');
    } catch {
      toast.error('Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const ago = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const analyticsCards = analytics ? [
    { label: 'Total Users', value: analytics.totalUsers, color: 'var(--info)', icon: '👥' },
    { label: 'Total Questions', value: analytics.totalQuestions, color: 'var(--accent-light)', icon: '❓' },
    { label: 'Total Answers', value: analytics.totalAnswers, color: 'var(--text-primary)', icon: '💬' },
    { label: 'Active Users (7d)', value: analytics.activeUsers ?? 0, color: '#f59e0b', icon: '🔥' },
    { label: 'Acceptance Rate', value: `${analytics.acceptanceRate ?? 0}%`, color: '#22c55e', icon: '✅' },
    { label: 'Avg Answers / Q', value: analytics.avgAnswersPerQ ?? 0, color: '#ec4899', icon: '📊' },
    { label: 'Pending', value: analytics.pendingAnswers, color: 'var(--warning)', icon: '⏳' },
    { label: 'Approved', value: analytics.approvedAnswers, color: 'var(--success)', icon: '✅' },
    { label: 'Rejected', value: analytics.rejectedAnswers, color: 'var(--danger)', icon: '❌' },
  ] : [];

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">🛡️ Admin Dashboard</h1>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {analyticsCards.map(({ label, value, color, icon }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Extended Analytics Lists */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Top Contributors */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>🏆 Top Contributors</h3>
            {(!analytics.topContributors || analytics.topContributors.length === 0) ? (
              <p className="text-muted text-sm">No contributors found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analytics.topContributors.map((contrib, idx) => (
                  <div key={contrib._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <span>
                      <strong style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>#{idx + 1}</strong>
                      {contrib.name}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{contrib.spPoints} SP</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Questions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>🔥 Trending Questions</h3>
            {(!analytics.trendingQuestions || analytics.trendingQuestions.length === 0) ? (
              <p className="text-muted text-sm">No trending questions.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analytics.trendingQuestions.map((q) => (
                  <div key={q._id} style={{ fontSize: '0.9rem' }}>
                    <Link to={`/questions/${q._id}`} style={{ color: 'var(--accent-light)', fontWeight: 600, display: 'block', textDecoration: 'none' }}>
                      {q.title}
                    </Link>
                    <div className="text-muted text-xs" style={{ marginTop: '0.15rem' }}>
                      Score: {Math.round(q.trendingScore || 0)} | {q.answersCount} answers | {q.viewsCount} views
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="page-header">
        <h2>Answer Moderation</h2>
        <div className="admin-filter-bar">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
              id={`admin-filter-${f.toLowerCase()}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : answers.length === 0 ? (
        <EmptyState icon="📭" title="No answers found" description="Nothing to moderate right now." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {answers.map((answer) => {
            const q = answer.questionId as Question;
            const isExp = expanded === answer._id;
            const isLoading = actionLoading === answer._id;

            return (
              <div key={answer._id} className="admin-answer-card" id={`admin-answer-${answer._id}`}>
                {/* Question title */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Question: <span style={{ color: 'var(--accent-light)' }}>
                    {typeof q === 'object' ? q.title : String(q)}
                  </span>
                </div>

                {/* Author + Status */}
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  <div className="profile-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                    {answer.authorId?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <span className="font-bold text-sm">{answer.authorId?.name || 'Unknown'}</span>
                    <div><Badge spPoints={answer.authorId?.spPoints || 0} /></div>
                  </div>
                  <span className={`status-badge status-${answer.status.toLowerCase()}`} style={{ marginLeft: 'auto' }}>
                    {answer.status}
                  </span>
                  {answer.isBestAnswer && <span className="badge badge-mentor">⭐ Best</span>}
                  <span className="text-muted text-xs">{ago(answer.createdAt)}</span>
                </div>

                {/* Answer content (expandable) */}
                <div
                  className="answer-content"
                  style={{
                    maxHeight: isExp ? 'none' : '80px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {answer.content}
                  {!isExp && answer.content.length > 200 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: '2rem',
                      background: 'linear-gradient(transparent, var(--bg-card))'
                    }} />
                  )}
                </div>
                {answer.content.length > 200 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => setExpanded(isExp ? null : answer._id)}
                  >
                    {isExp ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show more</>}
                  </button>
                )}

                {/* Actions */}
                <div className="admin-answer-actions">
                  {answer.status === 'PENDING' && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(answer._id)}
                        disabled={isLoading}
                        id={`approve-btn-${answer._id}`}
                      >
                        <CheckCircle size={14} /> Approve (+10 SP)
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(answer._id)}
                        disabled={isLoading}
                        id={`reject-btn-${answer._id}`}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                  {answer.status === 'APPROVED' && !answer.isBestAnswer && (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleBestAnswer(answer._id)}
                      disabled={isLoading}
                      id={`best-btn-${answer._id}`}
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
                    >
                      <Star size={14} /> Mark Best Answer
                    </button>
                  )}
                  {answer.status !== 'PENDING' && (
                    <span className="text-muted text-xs" style={{ alignSelf: 'center' }}>
                      {answer.status === 'APPROVED' ? '✅ Approved — read-only' : '❌ Rejected — read-only'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboardPage;
