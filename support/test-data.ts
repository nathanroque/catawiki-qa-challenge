/**
 * Search keyword used by the automated scenarios.
 *
 * The default value, "Train", represents the canonical challenge flow.
 * The SEARCH_KEYWORD environment variable may override it when running
 * the suite against a different search term.
 */
export const keyword = process.env.SEARCH_KEYWORD ?? 'Train';
