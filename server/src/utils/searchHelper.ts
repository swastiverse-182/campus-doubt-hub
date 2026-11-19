/**
 * Escapes regex special characters to prevent regex injection or syntax errors.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Extracts searchable keywords from a query string.
 * Strips leading/trailing punctuation from each word while preserving inner chars.
 */
export function extractKeywords(query: string): string[] {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const rawTokens = trimmed.split(/\s+/);
  const cleanedTokens: string[] = [];

  for (const raw of rawTokens) {
    const cleaned = raw.replace(/^[^\w]+|[^\w]+$/g, '');
    if (cleaned.length > 0) {
      cleanedTokens.push(cleaned);
    } else if (raw.length > 0) {
      // If the word was entirely punctuation (e.g. "?"), keep raw
      cleanedTokens.push(raw);
    }
  }

  return cleanedTokens.length > 0 ? cleanedTokens : [trimmed];
}

/**
 * Builds a MongoDB query filter that performs case-insensitive keyword / substring
 * matching across title, description, and tags.
 * Supports 2-letter tokens, multi-word queries, and exact phrases safely.
 */
export function buildQuestionSearchFilter(query?: string): Record<string, any> {
  if (!query || typeof query !== 'string') return {};
  const trimmed = query.trim();
  if (!trimmed) return {};

  const tokens = extractKeywords(trimmed);
  if (tokens.length === 0) return {};

  if (tokens.length === 1) {
    const regex = { $regex: escapeRegex(tokens[0]), $options: 'i' };
    return {
      $or: [
        { title: regex },
        { description: regex },
        { tags: regex },
      ],
    };
  }

  // Multi-keyword search: every token must match title, description, or tags
  return {
    $and: tokens.map((token) => {
      const regex = { $regex: escapeRegex(token), $options: 'i' };
      return {
        $or: [
          { title: regex },
          { description: regex },
          { tags: regex },
        ],
      };
    }),
  };
}

/**
 * Builds a search filter specifically for autocomplete suggestions (focuses on title and tags).
 */
export function buildSuggestionSearchFilter(query: string): Record<string, any> {
  if (!query || typeof query !== 'string') return {};
  const trimmed = query.trim();
  if (!trimmed) return {};

  const tokens = extractKeywords(trimmed);
  if (tokens.length === 0) return {};

  if (tokens.length === 1) {
    const regex = { $regex: escapeRegex(tokens[0]), $options: 'i' };
    return {
      $or: [
        { title: regex },
        { tags: regex },
      ],
    };
  }

  return {
    $and: tokens.map((token) => {
      const regex = { $regex: escapeRegex(token), $options: 'i' };
      return {
        $or: [
          { title: regex },
          { tags: regex },
        ],
      };
    }),
  };
}
