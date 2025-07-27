import { Module } from '@nestjs/common';
import { AIChatbotController } from './aichatbot.controller';
import { AIChatbotService } from './aichatbot.service';
import { MessageRepository } from 'src/repository/message.repository';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { Message, MessageSchema } from 'src/schemas/message.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { Crawl4AIService } from './crawl4ai.service';
import { AIToolService } from './ai-tool.service';
import { DI_TOKENS } from 'src/constants';

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
