import { Module } from '@nestjs/common';
import { AIChatbotController } from './aichatbot.controller';
import { AIChatbotService } from './aichatbot.service';
import { MessageRepository } from 'src/shared/repository/message.repository';
import { PassportModule } from '@nestjs/passport';
import { Message, MessageSchema } from 'src/shared/schemas/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Crawl4AIService } from './crawl4ai.service';
import { AIToolService } from './ai-tool.service';
import { DI_TOKENS } from 'src/constants';
import { JwtStrategy } from 'src/shared/strategies/jwt.strategy';
import { PdfService } from 'src/shared/services/pdf-parser.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    PassportModule,
    HttpModule.register({
      timeout: 1000 * 30,
      maxRedirects: 5,
    }),
  ],
  controllers: [AIChatbotController],
  providers: [
    AIChatbotService,
    MessageRepository,
    JwtStrategy,
    PdfService,
    {
      provide: DI_TOKENS.IWebCrawlScraper,
      useClass: Crawl4AIService,
    },
    {
      provide: DI_TOKENS.IAIToolService,
      useClass: AIToolService,
    },
  ],
})
export class AichatbotModule {}
