import { Question, IQuestion } from '../models/Question';
import { buildSuggestionSearchFilter, buildQuestionSearchFilter } from '../utils/searchHelper';

/**
 * Returns top question title matches for autocomplete suggestions.
 * Supports prefix, substring, two-letter inputs, and multiple keywords.
 */
export const searchSuggestions = async (query: string): Promise<string[]> => {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const filter = buildSuggestionSearchFilter(trimmed);
  const questions = await Question.find(filter)
    .limit(8)
    .select('title');

  // Return unique titles
  const titles = Array.from(new Set(questions.map((q) => q.title)));
  return titles;
};

/**
 * Performs search combining keyword/substring search with tag filtering.
 * Supports 2-letter tokens, partial words, multi-keyword queries, and full questions.
 */
export const hybridSearch = async (query?: string, tags?: string[]): Promise<IQuestion[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags };
  }

  if (query && query.trim()) {
    const searchFilter = buildQuestionSearchFilter(query);
    Object.assign(filter, searchFilter);
  }

  return Question.find(filter)
    .sort({ createdAt: -1 })
    .populate('author', 'name email spPoints');
};
