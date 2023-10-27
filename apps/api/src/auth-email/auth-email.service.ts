import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthEmailLoginDto, AuthRegisterLoginDto } from './auth-email.dto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { DataSource } from 'typeorm';
import { UserEmailRepository } from '@tookey/database';

@Injectable()
export class AuthEmailService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly userEmailRepository: UserEmailRepository,
  ) {}

  async register(dto: AuthRegisterLoginDto) {
    if (await this.userEmailRepository.exist({ where: { email: dto.email } })) {
      throw new BadRequestException('Email already exists');
    }

    const hash = crypto.createHash('sha256').update(randomStringGenerator()).digest('hex');
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    const entityManager = queryRunner.manager;

    const user = await this.userService.createUser({}, entityManager);
    const email = await this.userEmailRepository.createOrUpdateOne({ ...dto, user, hash }, entityManager);
    // TODO: send email or fail rollback transaction
    await queryRunner.commitTransaction();

    return email.user;
  }

  async confirmEmail(hash: string) {
    if (!hash) throw new BadRequestException('Hash is required');

    const user = await this.userEmailRepository.findOne({
      where: {
        hash,
      },
      relations: ['user'],
    });

    if (!user) throw new NotFoundException("User doesn't exist");
    if (user.verified) throw new BadRequestException('User already verified');

    user.hash = null;
    user.verified = true;
    return this.userEmailRepository.save(user);
  }

  async login(loginDto: AuthEmailLoginDto) {
    const user = await this.userEmailRepository.findOne({
      where: {
        email: loginDto.email,
      },
      relations: ['user'],
    });

    if (!user) throw new NotFoundException("User doesn't exist");

    const isValidPassword = await bcrypt.compare(loginDto.password, user.password);

    if (!user.verified) throw new BadRequestException('User not verified');
    if (!isValidPassword) throw new BadRequestException('Invalid password');

    const access = this.authService.getJwtAccessToken(user.user);
    const refresh = this.authService.getJwtRefreshToken(user.user);
    await this.userService.setCurrentRefreshToken(refresh.token, user.userId);
    return { access, refresh, user: user.user };
  }

  async forgotPassword(email: string) {
    const user = await this.userEmailRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) throw new NotFoundException("User doesn't exist");

    const hash = crypto.createHash('sha256').update(randomStringGenerator()).digest('hex');

    user.hash = hash;
    return this.userEmailRepository.save(user)
  }

  async resetPassword(hash: string, password: string) {
    const user = await this.userEmailRepository.findOne({
      where: {
        hash,
      },
    });

    if (!user) {
      throw new NotFoundException("User doesn't exist");
    }

    user.password = password;
    
    const access = this.authService.getJwtAccessToken(user.user);
    const refresh = this.authService.getJwtRefreshToken(user.user);
    await this.userService.setCurrentRefreshToken(refresh.token, user.userId);

    await this.userEmailRepository.save(user)

    return { access, refresh, user };
  }
}
