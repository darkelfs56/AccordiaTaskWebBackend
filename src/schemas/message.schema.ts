import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { MessageAuthorRole } from 'src/constants';
import { User } from './user.schema';

export type MessageDocument = mongoose.HydratedDocument<Message>;

@Schema()
export class Message {
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ required: true })
  role: MessageAuthorRole;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  timestamp: mongoose.Schema.Types.Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
