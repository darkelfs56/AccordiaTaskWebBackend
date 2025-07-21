import { MessageAuthorRole } from 'src/constants';

export interface IMessage {
  userId: string;
  role: MessageAuthorRole;
  content: string;
  timestamp: Date;
}
