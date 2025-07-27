export const DI_TOKENS = {
  IWebCrawlScraper: 'IWebCrawlScraper',
  IAIToolService: 'IAIToolService',
};

export const AI_MODELS = {
  WebCrawlScraperLLMModel: 'gemini/gemini-2.5-flash-lite',
  AIChatbotLLMModel: {
    CompoundBeta: 'compound-beta',
    Llama: 'llama3-70b-8192',
  },
} as const;

export enum MessageAuthorRole {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
}
