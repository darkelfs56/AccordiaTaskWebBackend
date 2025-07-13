import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private logger: Logger = new Logger(UserService.name);
  constructor(private readonly userRepository: UserRepository) {}

  async hashPassword(password: string) {
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);

    return hash;
  }

  async comparePasswordHash(data: {
    hashedPassword: string;
    givenPassword: string;
  }) {
    const { hashedPassword, givenPassword } = data;
    const isMatch = await bcrypt.compare(givenPassword, hashedPassword);

    return isMatch;
  }

  async register(data: UserDto) {
    this.logger.log(`In ${this.register.name} function`);

    const hashedPassword = await this.hashPassword(data.password);
    const createdUserData = await this.userRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    return {
      email: createdUserData,
      message: `User registered successfully`,
    };
  }

  async getUser(filter: Pick<UserDto, 'email'>) {
    return await this.userRepository.getUser(filter);
  }
}
