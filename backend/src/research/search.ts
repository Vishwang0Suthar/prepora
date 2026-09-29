export interface SearchQuery {
  query: string;
  limit?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResult[]>;
}
