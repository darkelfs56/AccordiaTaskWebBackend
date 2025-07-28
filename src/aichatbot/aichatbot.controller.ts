import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AIChatbotService } from './aichatbot.service';
import { SendMessageRequest } from './dto/send-message.dto';
import { UserFromReq } from 'src/user/dto/user.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageAuthorRole } from 'src/constants';
import { PdfService } from 'src/shared/services/pdf-parser.service';

@Controller('aichatbot')
@UsePipes(new ValidationPipe({ transform: true }))
export class AIChatbotController {
  constructor(
    private readonly aiChatbotService: AIChatbotService,
    private readonly pdfService: PdfService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('greet-message')
  async getGreetMessage() {
    return await this.aiChatbotService.sendGreetingMessage();
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'application/pdf' })],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userId = (req.user as UserFromReq).id;
    const pdfText = await this.pdfService.extractText(file.buffer);

    await this.aiChatbotService.sendMessage({
      role: MessageAuthorRole.USER,
      content:
        `User id ${userId} resume in pdf form and its content here:\n` +
        pdfText,
      timestamp: new Date(),
      userId,
    });

    return { message: 'PDF uploaded and processed' };
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
