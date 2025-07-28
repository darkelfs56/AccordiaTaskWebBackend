import { AI_MODELS } from 'src/constants';

export interface IWebCrawlScraper {
  webCrawlAndScrape(data: { urlLinks: string[] }): Promise<ICrawlResponse>;
}

export interface ICrawlResponse {
  results: {
    success: boolean;
    error_message: string;
    metadata: {
      title: string;
      description: string;
      keywords: string;
    };
    markdown: {
      raw_markdown: string;
      markdown_with_citations: string;
      references_markdown: string;
      fit_markdown: string;
      fit_html: string;
    };
  }[];
}

export interface BrowserConfig {
  type: 'BrowserConfig';
  params: {
    headless: boolean;
    text_mode?: boolean;
  };
}

export enum CRAWLER_CACHE_MODE {
  BYPASS = 'bypass',
  ENABLED = 'enabled',
}

interface BM25ContentFilter {
  type: 'BM25ContentFilter';
  params: {
    user_query: string;
  };
}

interface LLMContentFilter {
  type: 'LLMContentFilter';
  params: {
    llm_config: {
      type: 'LLMConfig';
      params: {
        provider: typeof AI_MODELS.WebCrawlScraperLLMModel;
        api_token: string;
      };
    };
    instruction: string;
    chunk_token_threshold?: number;
    verbose?: boolean;
  };
}

interface MarkdownGeneratorParams {
  options: {
    ignore_images: boolean;
    ignore_links: boolean;
  };
  content_filter?: BM25ContentFilter | LLMContentFilter;
}

interface MarkdownGenerator {
  type: 'DefaultMarkdownGenerator';
  params: MarkdownGeneratorParams;
}

export interface CrawlerConfig {
  type: 'CrawlerRunConfig';
  params: {
    stream: boolean;
    cache_mode: CRAWLER_CACHE_MODE;
    scan_full_page?: boolean;
    only_text?: boolean;
    keep_data_attributes?: boolean;
    exclude_all_images?: boolean;
    exclude_external_images?: boolean;
    exclude_external_links?: boolean;
    exclude_social_media_links?: boolean;
    markdown_generator?: MarkdownGenerator;
  };
}
