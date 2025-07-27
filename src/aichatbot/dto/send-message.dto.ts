import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MessageAuthorRole } from 'src/constants';

export class SendMessageRequest {
  @IsEnum(MessageAuthorRole)
  @IsNotEmpty()
  role: MessageAuthorRole;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;
}

export class ICrawlRequestBody {
  @IsString({ each: true })
  @IsNotEmpty()
  urlLinks: string[];
}
