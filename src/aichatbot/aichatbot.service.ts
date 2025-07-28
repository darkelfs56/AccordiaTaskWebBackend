import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { IMessage } from './interfaces/message.interface';
import { SendMessageRequest } from './dto/send-message.dto';
import { MessageRepository } from 'src/shared/repository/message.repository';
import { AI_MODELS, DI_TOKENS, MessageAuthorRole } from 'src/constants';
import { AIToolService } from './ai-tool.service';

const DEFAULT_CONTEXT = `
You are an AI Resume Chatbot. When a user provides their resume, analyze its strengths and weaknesses.
If the user provides a job link, use the webCrawlAndScrape function to extract key job details like the title, company, location, description, salary, benefits, responsibilities, and qualifications. Then compare these requirements to the user's resume and give a score out of 100 based on relevant skills, projects, and qualifications. Answer any follow-up questions they ask. Return the result in clean markdown format with clear headers and bullet points.
Assume every job link is new in the most recent user message and you need to make use of the webCrawlAndScrape function.
You would also be given past messages history to understand incoming user message and context, if exists.
Do not use the webCrawlAndScrape function for the past messages!
Be honest, helpful, and practical.
Always prioritize and reply to the most recent user message and do not elaborate on anything unless the user mentions it.
`;

const GREET_MESSAGE = `
Give this greeting: "Hello! I'm your AI Resume Chatbot. I'm here to help you analyze your resume, prepare for job interviews, and provide guidance on how to improve your resume and increase your chances of getting hired. I can also get important job information if you give me any job links. Finally, please do provide your resume (if you want) in PDF format with the plus (+) icon down below!"
`;

@Injectable()
export class AIChatbotService {
  private readonly logger = new Logger(AIChatbotService.name);
  private aiChatbotClient: Groq;
  private aiChatbotModel = AI_MODELS.AIChatbotLLMModel.Llama;
  private tools: Groq.Chat.Completions.ChatCompletionTool[] = [];
  private availableToolFunctions: Record<string, any> = {};

  constructor(
    private readonly configService: ConfigService,
    private readonly messageRepository: MessageRepository,
    @Inject(DI_TOKENS.IAIToolService)
    private readonly aiToolService: AIToolService,
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

    const { tools, functions } = this.aiToolService.getAllToolsAndFunctions();
    this.tools = tools;
    this.availableToolFunctions = functions;
  }

  async sendGreetingMessage() {
    try {
      const response = await this.aiChatbotClient.chat.completions.create({
        messages: [
          {
            role: MessageAuthorRole.SYSTEM,
            content: DEFAULT_CONTEXT + '\n' + GREET_MESSAGE,
          },
        ],
        model: this.aiChatbotModel,
      });

      return {
        message: response.choices[0].message.content,
      };
    } catch (err: any) {
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

  async sendMessage(data: SendMessageRequest & { userId: string }) {
    const { content } = data;
    if (!content.trim()) return;
    const pastMessageHistory =
      (await this.messageRepository.getMessageHistory({
        userId: data.userId,
        limit: 2,
      })) ?? [];

    const userMsg: IMessage = data;
    await this.messageRepository.saveMessageHistory(userMsg);

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: MessageAuthorRole.SYSTEM,
        content: DEFAULT_CONTEXT,
      },
      ...pastMessageHistory.map((message) => {
        return {
          role: message.role,
          content: message.content,
        };
      }),
      {
        role: userMsg.role,
        content: userMsg.content,
      },
    ];

    try {
      const hasLink = /(https?:\/\/[^\s]+)/.test(userMsg.content);
      const toolsToUse = hasLink ? this.tools : null;

      const response = await this.aiChatbotClient.chat.completions.create({
        model: this.aiChatbotModel,
        messages: messages,
        stream: false,
        tools: toolsToUse,
      });

      const responseMessage = response.choices[0].message;
      const toolCalls = responseMessage?.tool_calls;

      if (toolsToUse && toolCalls && toolCalls.length !== 0) {
        const processedText = await this.handleToolCalls({
          responseMessage,
          toolCalls,
          messages,
          userId: data.userId,
        });

        return {
          message: processedText,
        };
      }

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

  private async handleToolCalls(data: {
    responseMessage: Groq.Chat.Completions.ChatCompletionMessage;
    toolCalls: Groq.Chat.Completions.ChatCompletionMessageToolCall[];
    messages: Groq.Chat.Completions.ChatCompletionMessageParam[];
    userId: string;
  }) {
    try {
      const { toolCalls, messages, userId, responseMessage } = data;
      messages.push(responseMessage);

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = this.availableToolFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const functionResponse = await functionToCall(functionArgs);

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: functionResponse,
        });
      }

      const finalResponse = await this.aiChatbotClient.chat.completions.create({
        model: this.aiChatbotModel,
        messages: messages,
      });

      const text = finalResponse.choices[0].message.content ?? '';
      const botMsg: IMessage = {
        userId: userId,
        role: MessageAuthorRole.ASSISTANT,
        content: text,
        timestamp: new Date(),
      };
      await this.messageRepository.saveMessageHistory(botMsg);
      return text;
    } catch (error: any) {
      this.logger.error(
        `Error occured in ${this.handleToolCalls.name} function: ${error}`,
      );
      throw error;
    }
  }
}
