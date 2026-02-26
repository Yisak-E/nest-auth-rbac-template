import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { UserRole } from './schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // Make this endpoint public
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public() // Make this endpoint public
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }

  @Get('moderator/dashboard')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  getModeratorDashboard() {
    return { message: 'Welcome to moderator dashboard' };
  }

  @Get('user/dashboard')
  @Roles(UserRole.USER)
  getUserDashboard(@CurrentUser() user: any) {
    return { 
      message: 'Welcome to user dashboard',
      user: user 
    };
  }
}