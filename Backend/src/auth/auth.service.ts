import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { env } from '../config/env.js';
import bcrypt from 'bcryptjs';
import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async signToken(userId: string, role: string): Promise<string> {
    return this.jwtService.sign(
      { sub: userId, role },
      {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN as JwtSignOptions['expiresIn'],
      },
    );
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password || '', env.BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        role: dto.role || 'devs',
      },
    });

    await this.prisma.activity.create({
      data: {
        actor_id: user.id,
        action: 'Registered a new account',
      },
    });

    await this.prisma.notification.create({
      data: {
        kind: 'user',
        message: `New user registered: ${user.name} (${user.role})`,
        audience: 'all',
      },
    });

    const token = await this.signToken(user.id, user.role);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password || '', user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.activity.create({
      data: {
        actor_id: user.id,
        action: 'Logged in to the support center',
      },
    });

    await this.prisma.notification.create({
      data: {
        kind: 'user',
        message: `${user.name} logged into the support center.`,
        audience: 'all',
      },
    });

    const token = await this.signToken(user.id, user.role);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  async validateUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
