import { Module } from '@nestjs/common';
import { AIChatbotController } from './aichatbot.controller';
import { AIChatbotService } from './aichatbot.service';
import { MessageRepository } from 'src/repository/message.repository';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { Message, MessageSchema } from 'src/schemas/message.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    PassportModule,
  ],
  controllers: [AIChatbotController],
  providers: [AIChatbotService, MessageRepository, JwtStrategy],
})
export class AichatbotModule {}
