import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AIChatbotService } from './aichatbot.service';
import { SendMessageRequest } from './dto/send-message.dto';
import { UserFromReq } from 'src/user/dto/user.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('aichatbot')
@UsePipes(new ValidationPipe({ transform: true }))
export class AIChatbotController {
  constructor(private readonly aiChatbotService: AIChatbotService) {}

  @UseGuards(JwtAuthGuard)
  @Get('greet-message')
  async getGreetMessage() {
    return await this.aiChatbotService.sendGreetingMessage();
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-message')
  async sendMessage(@Body() body: SendMessageRequest, @Req() req: Request) {
    const userId = (req.user as UserFromReq).id;
    return await this.aiChatbotService.sendMessage({ ...body, userId: userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get('message-history')
  async getMessageHistory(@Req() req: Request) {
    const userId = (req.user as UserFromReq).id;
    return await this.aiChatbotService.getMessageHistory({ userId });
  }
}
