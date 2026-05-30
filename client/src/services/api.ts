import axios from 'axios';
import type {
  ApiResponse, User, Question, Answer, Bookmark,
  Notification, Analytics, UserStats
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data),

  me: () => api.get<ApiResponse<User>>('/auth/me'),
};

// ─── QUESTIONS ───────────────────────────────────────────────────────────────
export const questionsApi = {
  getAll: (params?: {
    search?: string;
    tag?: string;
    answered?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<Question[]>>('/questions', { params }),

  getById: (id: string) => api.get<ApiResponse<Question>>(`/questions/${id}`),

  create: (data: { title: string; description: string; tags: string[] }) =>
    api.post<ApiResponse<Question>>('/questions', data),

  update: (id: string, data: Partial<{ title: string; description: string; tags: string[] }>) =>
    api.put<ApiResponse<Question>>(`/questions/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/questions/${id}`),
};

// ─── ANSWERS ─────────────────────────────────────────────────────────────────
export const answersApi = {
  getByQuestion: (questionId: string) =>
    api.get<ApiResponse<Answer[]>>(`/answers/question/${questionId}`),

  create: (data: { questionId: string; content: string }) =>
    api.post<ApiResponse<Answer>>('/answers', data),

  update: (id: string, data: { content: string }) =>
    api.put<ApiResponse<Answer>>(`/answers/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/answers/${id}`),
};

// ─── BOOKMARKS ───────────────────────────────────────────────────────────────
export const bookmarksApi = {
  getAll: () => api.get<ApiResponse<Bookmark[]>>('/bookmarks'),

  add: (questionId: string) =>
    api.post<ApiResponse<Bookmark>>('/bookmarks', { questionId }),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/bookmarks/${id}`),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () =>
    api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications'),

  markRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllRead: () => api.patch<ApiResponse<null>>('/notifications/read-all'),
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () =>
    api.get<ApiResponse<{ user: User; stats: UserStats }>>('/users/profile'),

  getLeaderboard: () => api.get<ApiResponse<User[]>>('/users/leaderboard'),

  getActivity: () =>
    api.get<ApiResponse<{ questions: Question[]; answers: Answer[] }>>('/users/activity'),
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getAnswers: (status?: string) =>
    api.get<ApiResponse<Answer[]>>('/admin/answers', { params: { status } }),

  approveAnswer: (id: string) =>
    api.patch<ApiResponse<Answer>>(`/admin/answers/${id}/approve`),

  rejectAnswer: (id: string) =>
    api.patch<ApiResponse<Answer>>(`/admin/answers/${id}/reject`),

  markBestAnswer: (id: string) =>
    api.patch<ApiResponse<Answer>>(`/admin/answers/${id}/best-answer`),

  getAnalytics: () => api.get<ApiResponse<Analytics>>('/admin/analytics'),
};

export default api;
