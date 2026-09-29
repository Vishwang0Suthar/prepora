export interface DiscussionResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface DiscussionResearch {
  results: DiscussionResult[];
  sources: string[];
  text: string;
}

export function createEmptyDiscussionResearch(): DiscussionResearch {
  return {
    results: [],
    sources: [],
    text: "",
  };
}
