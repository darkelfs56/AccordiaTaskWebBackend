import { Inject, Injectable, Logger } from '@nestjs/common';
import { Crawl4AIService } from './crawl4ai.service';
import {
  IAIToolService,
  IWebCrawlAndScrapeResponse,
  Tool,
} from './interfaces/ai-tool-config.interface';
import { DI_TOKENS } from 'src/constants';

export type ToolsName = 'webCrawlAndScrape';

@Injectable()
export class AIToolService implements IAIToolService {
  private readonly logger = new Logger(AIToolService.name);

  constructor(
    @Inject(DI_TOKENS.IWebCrawlScraper)
    private readonly crawl4AIService: Crawl4AIService,
  ) {}

  private readonly toolHandlers = {
    webCrawlAndScrape: this.webCrawlAndScrape.bind(this),
  };

  getAllToolsAndFunctions(): {
    tools: Tool[];
    functions: Record<string, (args: any) => Promise<string>>;
  } {
    const tools = [this.getWebCrawlAndScrapeTool()];

    return { tools, functions: this.toolHandlers };
  }

  getWebCrawlAndScrapeTool(): Tool {
    const toolDescription =
      'To web crawl and scrape any links given by user that are related to job advertisements. Do not use this if current user message contains no links!';
    return {
      type: 'function',
      function: {
        name: this.webCrawlAndScrape.name,
        description: toolDescription,
        parameters: {
          type: 'object',
          properties: {
            urlLinks: {
              type: 'array',
              description:
                'The url links if given by user in the current message, e.g. "https://my.jobstreet.com/job/85911035", "https://www.bandainamcostudios.my/career/lead-animator/", etc.',
            },
          },
        },
        required: ['urlLinks'],
      },
    };
  }

  async webCrawlAndScrape(data: { urlLinks: string[] }): Promise<string> {
    this.logger.log(`data is: ${JSON.stringify(data)}`);
    if (data.urlLinks.length === 0) return 'No urlLinks given';
    const response = await this.crawl4AIService.webCrawlAndScrape(data);

    return JSON.stringify({
      results: response.results.map((val) => {
        return {
          success: val.success,
          errorMessage: val.error_message,
          metadata: {
            title: val.metadata.title,
            keywords: val.metadata.keywords,
            description: val.metadata.description,
          },
          markdown: val.markdown.fit_markdown,
        };
      }),
    } as IWebCrawlAndScrapeResponse);
  }
}
