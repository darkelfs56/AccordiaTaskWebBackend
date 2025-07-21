import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { IMessage } from './interfaces/message.interface';
import { SendMessageRequest } from './dto/send-message.dto';
import { MessageRepository } from 'src/repository/message.repository';
import { MessageAuthorRole } from 'src/constants';

const DEFAULT_CONTEXT = `You are an AI Resume Chatbot. When a user provides their resume, analyze its strengths and weaknesses. If the user provides a job link, extract the job requirements from the page and evaluate how well the resume matches the job. Be honest, helpful, and practical. If user gives a greeting, please mention that you are an AI Resume Chatbot and is always ready to help them to evaluate their resume and assist them in their job hunting!`;

@Injectable()
export class AIChatbotService {
  private readonly logger = new Logger(AIChatbotService.name);
  private aiChatbotClient: Groq;
  private aiChatbotModel = 'compound-beta';

  constructor(
    private readonly configService: ConfigService,
    private readonly messageRepository: MessageRepository,
  ) {
    const groqApiKey = this.configService.get('GROQ_API_KEY') as string;
    if (!groqApiKey) {
      this.logger.error('Missing Groq API Key. Check environment config.');
      throw new Error(
        `Cannot initialize ${AIChatbotService.name}, missing API key.`,
      );
    }

    this.aiChatbotClient = new Groq({
      apiKey: groqApiKey,
    });
  }

  async sendGreetingMessage() {
    try {
      const response = await this.aiChatbotClient.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: DEFAULT_CONTEXT,
          },
        ],
        model: this.aiChatbotModel,
      });

      return response.choices[0].message;
    } catch (err: any) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Something went wrong with Groq API';
      this.logger.error(errMsg);
      throw new BadRequestException(errMsg);
    }
  }

  async sendMessage(data: SendMessageRequest & { userId: string }) {
    const { content } = data;
    if (!content.trim()) return;

    const userMsg: IMessage = data;
    await this.messageRepository.saveMessageHistory(userMsg);

    try {
      const response = await this.aiChatbotClient.chat.completions.create({
        messages: [
          {
            role: MessageAuthorRole.ASSISTANT,
            content: DEFAULT_CONTEXT,
          },
          {
            role: userMsg.role,
            content: userMsg.content,
          },
        ],
        model: this.aiChatbotModel,
      });

      const text = response.choices[0].message.content ?? '';
      const botMsg: IMessage = {
        userId: data.userId,
        role: MessageAuthorRole.ASSISTANT,
        content: text,
        timestamp: new Date(),
      };
      await this.messageRepository.saveMessageHistory(botMsg);

      return {
        message: response.choices[0].message.content,
      };
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Something went wrong with Groq API';
      this.logger.error(errMsg);
      throw new BadRequestException(errMsg);
    }
  }

  async getMessageHistory(data: { userId: string }) {
    const messageHistory = await this.messageRepository.getMessageHistory(data);
    return messageHistory;
  }
}
