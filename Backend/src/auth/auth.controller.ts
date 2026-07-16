import { Controller, Post, Body, Get, UseGuards, Inject } from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { GetUser, UserSession } from './get-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { data };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { data };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@GetUser() user: UserSession) {
    const data = await this.authService.validateUser(user.id);
    return { data: { user: data } };
  }
}
