export interface GenerateJsonOptions {
  system: string;
  user: string;
  schema: Record<string, unknown>;
}

export interface LLMProvider {
  generateJSON<T>(options: GenerateJsonOptions): Promise<T>;
}
