import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDto } from './dto/user.dto';
import { User as UserModel } from 'src/shared/schemas/user.schema';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(
    @InjectModel(UserModel.name) private readonly userModel: Model<UserModel>,
  ) {}

  async createUser(createUserDto: UserDto) {
    try {
      const createdUser = new this.userModel(createUserDto);
      return await createdUser.save();
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`'${field}' value already exists`);
      }

      this.logger.error(
        `Unexpected error during user creation: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not create user');
    }
  }

  async getUser(getUserDto: Pick<UserDto, 'email'>) {
    return this.userModel
      .findOne({
        email: getUserDto.email,
      })
      .exec();
  }

  async updateUser(data: any) {
    return data;
  }

  async deleteUser(data: Pick<UserDto, 'email'>) {
    return this.userModel
      .deleteOne({
        email: data.email,
      })
      .exec();
  }
}
