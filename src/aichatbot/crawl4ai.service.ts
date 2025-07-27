import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, lastValueFrom } from 'rxjs';
import {
  BrowserConfig,
  CRAWLER_CACHE_MODE,
  CrawlerConfig,
  ICrawlResponse,
  IWebCrawlScraper,
} from './interfaces/crawl4ai.interface';
import { AI_MODELS } from 'src/constants';

@Injectable()
export class Crawl4AIService implements IWebCrawlScraper {
  private readonly logger = new Logger(Crawl4AIService.name);
  private browser_config: BrowserConfig;
  private crawler_config: CrawlerConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.browser_config = this.initializeBrowserConfig();
    this.crawler_config = this.initializeCrawlerConfig();
  }

  private initializeBrowserConfig(): BrowserConfig {
    return {
      type: 'BrowserConfig',
      params: {
        headless: true,
        text_mode: true,
      },
    };
  }

  private initializeCrawlerConfig(): CrawlerConfig {
    const LLM_API_KEY = this.configService.get('CRAWL4AI_GEMINI_KEY');

    if (!LLM_API_KEY) {
      this.logger.error(
        'Missing LLM API key for WebCrawlScraper. Check environment config.',
      );
      throw new Error(
        `Cannot initialize ${Crawl4AIService.name}, missing API key.`,
      );
    }

    return {
      type: 'CrawlerRunConfig',
      params: {
        stream: false,
        cache_mode: CRAWLER_CACHE_MODE.ENABLED,
        scan_full_page: true,
        only_text: true,
        exclude_all_images: true,
        exclude_external_links: true,
        exclude_social_media_links: true,
        markdown_generator: {
          type: 'DefaultMarkdownGenerator',
          params: {
            options: {
              ignore_images: true,
              ignore_links: true,
            },
            content_filter: {
              type: 'LLMContentFilter',
              params: {
                llm_config: {
                  type: 'LLMConfig',
                  params: {
                    provider: AI_MODELS.WebCrawlScraperLLMModel,
                    api_token: LLM_API_KEY,
                  },
                },
                instruction:
                  'Extract and summarize only job-relevant sections such as: job title, company, location, job description, job salary, benefits, responsibilities, and qualifications. Return in clean markdown with headers and bullet lists.',
              },
            },
          },
        },
      },
    };
  }

  async webCrawlAndScrape(data: {
    urlLinks: string[];
  }): Promise<ICrawlResponse> {
    const crawlRequestUrl =
      this.configService.get('CRAWL4AI_BASE_URL') + '/crawl';
    const crawlRequestBody = {
      urls: data.urlLinks,
      browser_config: this.browser_config,
      crawler_config: this.crawler_config,
    };

    const { data: responseData } = await lastValueFrom(
      this.httpService
        .post<
          ICrawlResponse,
          typeof crawlRequestBody
        >(crawlRequestUrl, crawlRequestBody)
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response?.data, error?.stack);
            throw new InternalServerErrorException(
              `Error from web crawl request, with error: ${JSON.stringify(error.response)}`,
            );
          }),
        ),
    );

    return responseData;
  }
}
