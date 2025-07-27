import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMessage } from 'src/aichatbot/interfaces/message.interface';
import { Message as MessageModel } from 'src/schemas/message.schema';
// import { User } from 'src/schemas/user.schema';
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class MessageRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(
    @InjectModel(MessageModel.name)
    private readonly messageModel: Model<MessageModel>,
  ) {}

  async saveMessageHistory(data: IMessage) {
    try {
      //!TODO How to make this type safe?
      const savedMessage = new this.messageModel(data);
      return await savedMessage.save();
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`'${field}' value already exists`);
      }

      this.logger.error(
        `Unexpected error during saving message data: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not save message data');
    }
  }

  async getMessageHistory(data: { userId: string; limit?: number }) {
    try {
      const messageHistory = this.messageModel
        .find({
          userId: data.userId,
        })
        .limit(data?.limit ?? 5)
        .sort({ timestamp: 'descending' })
        .exec();

      return messageHistory;
    } catch (error: any) {
      this.logger.error(
        `Unexpected error during getting message history data: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not save message data');
    }
  }
}
