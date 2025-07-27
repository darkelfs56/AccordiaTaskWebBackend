import { ICrawlResponse } from './crawl4ai.interface';

export interface IAIToolService {
  webCrawlAndScrape(data: { urlLinks: string[] }): Promise<string>;
}

export interface IWebCrawlAndScrapeResponse {
  results: {
    success: boolean;
    errorMessage: string;
    metadata: ICrawlResponse['results'][0]['metadata'];
    markdown: ICrawlResponse['results'][0]['markdown']['fit_markdown'];
  }[];
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
}

export interface ToolFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
  };
  required: string[];
}

export interface Tool {
  type: 'function';
  function: ToolFunctionDefinition;
}
